/**
 * Coupang Open API 공유 모듈
 * sign, cf/cfJson, predictCategory, getCategoryMeta, buildNotices, ensureRequiredAttributes
 *
 * 사용처:
 *   - cron_register_product.js (cfJson — json만 반환)
 *   - register_coupang.js (cf — {res, json} 반환)
 *   - update_coupang_products.js (cf — {res, json} 반환)
 */
const crypto = require('crypto');

const BASE_URL = 'https://api-gateway.coupang.com';

// 환경변수 — require 시점에서 읽기 (dotenv는 소비자 파일에서 먼저 로드)
function getConfig() {
  return {
    AK: process.env.COUPANG_ACCESS_KEY,
    SK: process.env.COUPANG_SECRET_KEY,
    VID: process.env.COUPANG_VENDOR_ID,
    VUID: process.env.COUPANG_VENDOR_USER_ID || process.env.COUPANG_VENDOR_ID,
  };
}

/**
 * CEA HMAC-SHA256 서명 생성
 */
function sign(method, pathUrl, query = '') {
  const { AK, SK } = getConfig();
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  const datetime = `${String(d.getUTCFullYear()).slice(-2)}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  const msg = `${datetime}${method}${pathUrl}${query}`;
  const sig = crypto.createHmac('sha256', SK).update(msg, 'utf-8').digest('hex');
  return {
    datetime,
    authorization: `CEA algorithm=HmacSHA256, access-key=${AK}, signed-date=${datetime}, signature=${sig}`,
  };
}

/**
 * Coupang API 호출 — {res, json} 반환 (register_coupang, update 호환)
 */
async function cf(method, pathUrl, body = null, query = '') {
  const { VID } = getConfig();
  const { datetime, authorization } = sign(method, pathUrl, query);
  const url = `${BASE_URL}${pathUrl}${query ? '?' + query : ''}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authorization,
      'X-Coupang-Date': datetime,
      'X-Requested-By': VID,
    },
    body: body && method !== 'GET' ? JSON.stringify(body) : undefined,
  });
  let json = {};
  try { json = await res.json(); } catch (e) { }
  return { res, json };
}

/**
 * Coupang API 호출 — json만 반환 (cron_register 호환)
 */
async function cfJson(method, pathUrl, body = null) {
  const { res, json } = await cf(method, pathUrl, body);
  return json;
}

/**
 * 상품명으로 카테고리 예측
 */
async function predictCategory(name) {
  const { json } = await cf('POST', '/v2/providers/openapi/apis/api/v1/categorization/predict', { productName: name.slice(0, 200) });
  const id = json?.data?.predictedCategoryId;
  const catName = json?.data?.predictedCategoryName;
  if (!id) throw new Error('카테고리 예측 실패: ' + JSON.stringify(json));
  return { id, name: catName };
}

/**
 * 카테고리 메타 조회
 */
async function getCategoryMeta(displayCategoryCode) {
  const pathUrl = `/v2/providers/seller_api/apis/api/v1/marketplace/meta/category-related-metas/display-category-codes/${displayCategoryCode}`;
  const { json } = await cf('GET', pathUrl);
  if (json?.code !== 'SUCCESS') throw new Error('메타 조회 실패: ' + JSON.stringify(json));
  return json.data;
}

/**
 * 상품고시 (notices) 생성 — 기타 재화 우선
 */
function buildNotices(meta) {
  const notices = [];
  const preferred = meta?.noticeCategories?.find(c => c.noticeCategoryName.includes('기타')) || meta?.noticeCategories?.[0];
  if (preferred) {
    const catName = preferred.noticeCategoryName;
    (preferred.noticeCategoryDetailNames || []).forEach(d => {
      if (d.required === 'MANDATORY') {
        notices.push({ noticeCategoryName: catName, noticeCategoryDetailName: d.noticeCategoryDetailName, content: '상세페이지 참조' });
      }
    });
  }
  if (!notices.length) {
    notices.push({ noticeCategoryName: '기타 재화', noticeCategoryDetailName: '품명 및 모델명', content: '상세페이지 참조' });
  }
  return notices;
}

/**
 * 상품명에서 수치+단위를 추출 (RANGE 타입 속성용)
 */
function extractRangeValue(displayName, typeName, basicUnit) {
  const unitHintMatch = typeName.match(/\((\w+)\)/);
  const unitHint = unitHintMatch ? unitHintMatch[1].toLowerCase() : '';

  const unitPatterns = [
    { unit: 'ml', regex: /(\d+(?:\.\d+)?)\s*(?:ml|ML|mL)/i },
    { unit: 'l', regex: /(\d+(?:\.\d+)?)\s*(?:l|L|리터)/i },
    { unit: 'g', regex: /(\d+(?:\.\d+)?)\s*(?:g|G|그램)/i },
    { unit: 'kg', regex: /(\d+(?:\.\d+)?)\s*(?:kg|KG)/i },
    { unit: 'mm', regex: /(\d+(?:\.\d+)?)\s*(?:mm|MM)/i },
    { unit: 'cm', regex: /(\d+(?:\.\d+)?)\s*(?:cm|CM)/i },
    { unit: 'm', regex: /(\d+(?:\.\d+)?)\s*(?:m|M|미터)(?!\w)/i },
    { unit: '개', regex: /(\d+)\s*(?:개|매|장|입|팩|세트)/i },
    { unit: 'w', regex: /(\d+(?:\.\d+)?)\s*(?:w|W|와트)/i },
    { unit: 'mah', regex: /(\d+)\s*(?:mah|mAh|MAH)/i },
  ];

  const target = (basicUnit || unitHint || '').toLowerCase();
  const conversions = {
    ml: { ml: 1, l: 1000 },
    l: { l: 1, ml: 0.001 },
    g: { g: 1, kg: 1000 },
    kg: { kg: 1, g: 0.001 },
    mm: { mm: 1, cm: 10, m: 1000 },
    cm: { cm: 1, mm: 0.1, m: 100 },
    m: { m: 1, cm: 0.01, mm: 0.001 },
    개: { 개: 1 },
    w: { w: 1 },
    mah: { mah: 1 },
  };

  function convert(value, from, to) {
    const map = conversions[to];
    if (!map) return value;
    if (map[from] == null) return value;
    const result = Number(value) * map[from];
    // 정수로 반올림 (쿠팡 API는 소수점 거부하는 경우 있음)
    return Number.isInteger(result) ? result : Math.round(result);
  }

  for (const { unit, regex } of unitPatterns) {
    const match = displayName.match(regex);
    if (!match) continue;
    const val = match[1];
    if (target) {
      const converted = convert(val, unit, target);
      if (converted != null && !Number.isNaN(converted)) return String(converted);
      continue;
    }
    return val;
  }

  return null;
}

/**
 * 필수 속성 보완 — '기본' 값 사용 금지
 * groupNumber가 같은 속성은 하나만 선택, NUMBER 속성은 단위 접미사 포함
 * @returns {{ attrs: Array, skipReason: string|null }}
 */
function ensureRequiredAttributes(prod, meta) {
  let attrs = [...(prod.attributes || [])];
  let existingTypes = new Set(attrs.map(a => a.attributeTypeName));
  const name = prod.displayName || prod.name || '';

  // 색상/향/모델명 등 보완용 추출기
  const colorKeywords = [
    '블랙','화이트','레드','블루','그린','옐로우','핑크','퍼플','그레이','실버','골드','브라운','베이지','네이비','아이보리','투명','클리어','혼합','랜덤'
  ];
  const scentKeywords = ['무향','레몬','라벤더','로즈','머스크','자몽','바닐라','피치','베이비파우더'];

  function extractKeyword(arr) {
    for (const k of arr) {
      if (name.includes(k)) return k;
    }
    return null;
  }

  function extractModelName() {
    const patterns = [
      /(아이폰\s?\d+(?:\s?프로|\s?플러스|\s?프로맥스)?)/i,
      /(갤럭시\s?[A-Z]?\d+)/i,
      /(S\d{1,2})/i,
      /(A\d{1,2})/i
    ];
    for (const p of patterns) {
      const m = name.match(p);
      if (m) return m[1];
    }
    return null;
  }

  // groupNumber 중복 시 우선순위 결정
  function preferGroupAttr(newAttrName, prevAttrName) {
    const lowerName = (name || '').toLowerCase();
    const prefersVolume = /(ml|리터|\bl\b)/i.test(lowerName);
    const prefersWeight = /(kg|g|그램|킬로)/i.test(lowerName);

    function score(attrName) {
      let s = 0;
      if (/용량/.test(attrName)) s += prefersVolume ? 3 : 1;
      if (/중량|무게/.test(attrName)) s += prefersWeight ? 3 : 1;
      return s;
    }

    return score(newAttrName) > score(prevAttrName);
  }

  function inferFallbackValue(attrName, dataType, basicUnit) {
    if (/색상|색/.test(attrName)) return extractKeyword(colorKeywords) || '혼합색상';
    if (/향/.test(attrName)) return extractKeyword(scentKeywords) || '무향';
    if (/모델|품번|품명/.test(attrName)) return extractModelName() || '상세페이지 참조';
    if (/적용모델|호환/.test(attrName)) return extractModelName() || '범용';
    if (/사이즈|크기/.test(attrName)) return extractRangeValue(name, attrName, basicUnit) || 'FREE';
    if (/길이|두께|높이|폭|너비/.test(attrName)) {
      const v = extractRangeValue(name, attrName, basicUnit);
      return (v && Number(v) > 0) ? v : '1';
    }
    if (/^수량$/.test(attrName)) return '1';
    if (/용량|중량|무게|개당|총\s*수량/.test(attrName)) return extractRangeValue(name, attrName, basicUnit) || '1';
    if (dataType === 'NUMBER') return extractRangeValue(name, attrName, basicUnit) || '1';
    return '상세페이지 참조';
  }

  function pickAllowedValue(reqAttr) {
    const values = (reqAttr.attributeValues || []).map(v => v.attributeValueName).filter(Boolean);
    if (!values.length) return null;

    // '기본' 제외
    const nonBasic = values.filter(v => v !== '기본');

    // 색상/향/모델명은 키워드 매칭 우선
    const inferred = inferFallbackValue(reqAttr.attributeTypeName, reqAttr.dataType, reqAttr.basicUnit);
    if (inferred && nonBasic.includes(inferred)) return inferred;

    if (nonBasic.length) return nonBasic[0];
    return null;
  }

  const allAttrs = (meta?.data?.attributes || meta?.attributes || []);
  const requiredAttrs = allAttrs.filter(a => a.required === 'MANDATORY');

  // 기존 속성 정리: '기본' 값 치환 + 단위 보정
  for (const a of attrs) {
    const metaAttr = allAttrs.find(m => m.attributeTypeName === a.attributeTypeName);

    if (a.attributeValueName === '기본') {
      let newVal = null;
      if (metaAttr) {
        newVal = pickAllowedValue(metaAttr) || inferFallbackValue(metaAttr.attributeTypeName, metaAttr.dataType, metaAttr.basicUnit);
      } else {
        newVal = inferFallbackValue(a.attributeTypeName, '', null);
      }
      if (newVal && newVal !== '기본') {
        a.attributeValueName = String(newVal);
        console.log(`  '기본' 값 치환: ${a.attributeTypeName} = ${a.attributeValueName}`);
      }
      continue;
    }

    // 숫자형 속성: 단위 접미사 보장 + 숫자 정규화
    if (metaAttr?.dataType === 'NUMBER') {
      const raw = String(a.attributeValueName || '');
      const numericMatch = raw.match(/\d+(?:\.\d+)?/);

      // 값에서 숫자만 추출
      if (metaAttr?.basicUnit && /용량|중량|무게|길이|두께|높이|폭|너비|사이즈|크기/.test(a.attributeTypeName)) {
        const inferred = extractRangeValue(name, a.attributeTypeName, metaAttr.basicUnit);
        if (inferred && inferred !== raw.replace(/[^\d.]/g, '')) {
          a.attributeValueName = String(inferred) + metaAttr.basicUnit;
          console.log(`  단위 보정: ${a.attributeTypeName} = ${a.attributeValueName}`);
          continue;
        }
      }

      // NUMBER 속성에 단위 접미사 추가 (쿠팡 API 필수)
      const unit = metaAttr?.basicUnit || '';
      const numOnly = numericMatch ? numericMatch[0] : raw;
      if (unit && !raw.endsWith(unit)) {
        a.attributeValueName = numOnly + unit;
        console.log(`  단위 접미사 추가: ${a.attributeTypeName} = ${a.attributeValueName}`);
      } else if (!unit && numericMatch && !/^\d+(?:\.\d+)?$/.test(raw)) {
        a.attributeValueName = numericMatch[0];
        console.log(`  숫자 정규화: ${a.attributeTypeName} = ${a.attributeValueName}`);
      }
    }
  }

  // ── groupNumber 중복 제거: 기존 attrs 정리 ──
  const groupMap = new Map();
  const deduped = [];
  for (const a of attrs) {
    const metaAttr = allAttrs.find(m => m.attributeTypeName === a.attributeTypeName);
    const group = metaAttr?.groupNumber;
    if (group && group !== 'NONE') {
      if (!groupMap.has(group)) {
        groupMap.set(group, a);
        deduped.push(a);
      } else {
        const prev = groupMap.get(group);
        if (preferGroupAttr(a.attributeTypeName, prev.attributeTypeName)) {
          const idx = deduped.indexOf(prev);
          if (idx >= 0) deduped[idx] = a;
          groupMap.set(group, a);
          console.log(`  그룹 중복 교체: ${prev.attributeTypeName} -> ${a.attributeTypeName} (group ${group})`);
        } else {
          console.log(`  그룹 중복 제거: ${a.attributeTypeName} (group ${group})`);
        }
      }
    } else {
      deduped.push(a);
    }
  }
  attrs = deduped;
  existingTypes = new Set(attrs.map(a => a.attributeTypeName));

  // ── groupNumber 중복 제거: 같은 그룹의 필수 속성 중 하나만 선택 ──
  const groupsSeen = new Set();
  for (const a of attrs) {
    const metaAttr = allAttrs.find(m => m.attributeTypeName === a.attributeTypeName);
    if (metaAttr?.groupNumber && metaAttr.groupNumber !== 'NONE') {
      groupsSeen.add(metaAttr.groupNumber);
    }
  }

  for (const reqAttr of requiredAttrs) {
    if (existingTypes.has(reqAttr.attributeTypeName)) continue;

    // 같은 groupNumber의 속성이 이미 추가되었으면 SKIP
    if (reqAttr.groupNumber && reqAttr.groupNumber !== 'NONE') {
      if (groupsSeen.has(reqAttr.groupNumber)) {
        console.log(`  그룹 중복 SKIP: ${reqAttr.attributeTypeName} (group ${reqAttr.groupNumber})`);
        continue;
      }
    }

    let value = null;
    if (reqAttr.dataType === 'RANGE') {
      const extracted = extractRangeValue(name, reqAttr.attributeTypeName, reqAttr.basicUnit);
      value = extracted || '1';
    } else {
      const picked = pickAllowedValue(reqAttr);
      if (picked) {
        value = picked;
      } else {
        value = inferFallbackValue(reqAttr.attributeTypeName, reqAttr.dataType, reqAttr.basicUnit);
      }
    }

    if (value === '기본') {
      console.log(`  필수 속성 값 '기본' 감지 (SKIP): ${reqAttr.attributeTypeName}`);
      return { attrs, skipReason: `필수속성 "${reqAttr.attributeTypeName}" 값 '기본' 금지` };
    }

    // NUMBER 속성: 단위 접미사 추가
    const unit = reqAttr.basicUnit || '';
    let finalValue = String(value);
    if (reqAttr.dataType === 'NUMBER' && unit && !finalValue.endsWith(unit)) {
      finalValue = finalValue.replace(/[^\d.]/g, '') + unit;
      if (finalValue === unit) finalValue = '1' + unit; // fallback
    }

    attrs.push({
      attributeTypeName: reqAttr.attributeTypeName,
      attributeValueName: finalValue,
      exposed: 'EXPOSED',
    });
    console.log(`  필수 속성 추가: ${reqAttr.attributeTypeName} = ${finalValue}`);

    // groupNumber 등록
    if (reqAttr.groupNumber && reqAttr.groupNumber !== 'NONE') {
      groupsSeen.add(reqAttr.groupNumber);
    }
  }

  return { attrs, skipReason: null };
}

/**
 * 상품 삭제 (판매중지 → DELETE)
 * 승인 상태 상품은 바로 DELETE 불가 → 먼저 vendor-items 판매중지 후 삭제
 * @param {number|string} sellerProductId
 * @returns {{ success: boolean, message: string }}
 */
async function deleteProduct(sellerProductId) {
  // 1) 상품 조회 → vendorItemId 추출
  const { json: detail } = await cf('GET', `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products/${sellerProductId}`);
  if (detail?.code !== 'SUCCESS' || !detail?.data) {
    return { success: false, message: `상품 조회 실패: ${detail?.message || 'unknown'}` };
  }

  const status = detail.data.statusName;
  const items = detail.data.items || [];

  // 2) 판매중지 (승인완료/승인대기 등 활성 상태일 때)
  if (status !== '저장중' && status !== '임시저장') {
    for (const item of items) {
      const vid = item.vendorItemId;
      if (!vid) continue;
      const { json: stopResult } = await cf('PUT', `/v2/providers/seller_api/apis/api/v1/marketplace/vendor-items/${vid}/sales/stop`);
      if (stopResult?.code !== 'SUCCESS') {
        console.log(`  판매중지 경고 [${vid}]: ${stopResult?.code} ${stopResult?.message || ''}`);
      }
    }
  }

  // 3) 판매중지 반영 대기 후 DELETE
  await new Promise(r => setTimeout(r, 5000));
  const { json: delResult } = await cf('DELETE', `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products/${sellerProductId}`);
  if (delResult?.code === 'SUCCESS') {
    return { success: true, message: `${sellerProductId} 삭제 완료` };
  }
  return { success: false, message: `삭제 실패: ${delResult?.message || JSON.stringify(delResult)}` };
}

module.exports = {
  sign,
  cf,
  cfJson,
  predictCategory,
  getCategoryMeta,
  buildNotices,
  ensureRequiredAttributes,
  extractRangeValue,
  deleteProduct,
  getConfig,
  BASE_URL,
};
