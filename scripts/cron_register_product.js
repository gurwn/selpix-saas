#!/usr/bin/env node
// 크론용: 대기열에서 1개씩 등록하고 상태 기록
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '/home/dev/openclaw/.env' });

const { cfJson, buildNotices, ensureRequiredAttributes, getConfig, predictCategory: predictCategoryShared, deleteProduct, extractRangeValue } = require('./lib/coupang_api');
const { INVALID_IMAGE_PATTERNS, isValidImageUrl, getSafeVendorPath, checkImageReachable, roundPrice10 } = require('./lib/image_utils');
const { classifyDenial } = require('./lib/denial_analyzer');

const { AK, SK, VID, VUID } = getConfig();

const QUEUE_FILE = path.resolve(__dirname, '../data/register_queue.json');
const LOG_FILE = path.resolve(__dirname, '../data/register_log.json');

// ── 옵션 → 속성 변환 헬퍼 (호이스팅 안전) ──────────────────
const COLOR_KEYWORDS = [
  '다크그레이','라이트그레이','혼합색상',
  '블랙','화이트','레드','블루','그린','옐로우','핑크','퍼플',
  '그레이','실버','골드','브라운','베이지','네이비','아이보리',
  '투명','클리어','혼합','랜덤','오렌지','민트','카키','와인',
  '크림','차콜','스카이블루','라벤더','코랄','로즈골드','매트블랙'
];

function extractColorFromOption(optName) {
  const paren = optName.match(/\(([^)]+)\)/);
  if (paren) {
    for (const c of COLOR_KEYWORDS) {
      if (paren[1].includes(c)) return c;
    }
  }
  for (const c of COLOR_KEYWORDS) {
    if (optName.includes(c)) return c;
  }
  return null;
}

function extractSizeFromOption(optName) {
  const m = optName.match(/(\d+(?:\.\d+)?)\s*(?:cm|mm|m|인치)/i);
  return m ? m[1] : null;
}

function extractQuantityFromOption(optName) {
  const m = String(optName || '').match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  return String(Math.max(1, Math.round(n)));
}

function sanitizeAttributeByMeta(attr, metaAttr, displayName) {
  if (!metaAttr) return { ok: true, attr };

  const typeName = attr.attributeTypeName || '';
  const isQuantityType = /수량|개당|총\s*수량|입수/.test(typeName);
  const dataType = metaAttr.dataType || '';
  const basicUnit = metaAttr.basicUnit || '';

  let value = String(attr.attributeValueName || '').trim();
  if (!value) {
    return { ok: false, reason: `${typeName}: 빈 값` };
  }

  if (dataType === 'NUMBER' || dataType === 'RANGE') {
    let extracted = null;

    if (isQuantityType) {
      extracted = extractQuantityFromOption(value);
    } else {
      extracted = extractRangeValue(value, typeName, basicUnit) || extractRangeValue(displayName || '', typeName, basicUnit);
      if (!extracted) {
        const m = value.match(/(\d+(?:\.\d+)?)/);
        extracted = m ? m[1] : null;
      }
    }

    if (!extracted) {
      return { ok: false, reason: `${typeName}: 숫자 추출 실패 (${value})` };
    }

    if (dataType === 'NUMBER') {
      if (isQuantityType) {
        value = extracted;
      } else if (basicUnit) {
        value = `${extracted}${basicUnit}`;
      } else {
        value = extracted;
      }
    } else {
      value = extracted;
    }
  }

  const allowedValues = (metaAttr.attributeValues || []).map(v => v.attributeValueName).filter(Boolean);
  if (allowedValues.length && !allowedValues.includes(value)) {
    return { ok: false, reason: `${typeName}: 허용값 불일치 (${value})` };
  }

  return { ok: true, attr: { ...attr, attributeValueName: value } };
}

function sanitizeAttributesWithMeta(attrs, metaAttrs, displayName) {
  const metaMap = new Map((metaAttrs || []).map(m => [m.attributeTypeName, m]));
  const out = [];

  for (const attr of (attrs || [])) {
    const metaAttr = metaMap.get(attr.attributeTypeName);
    const sanitized = sanitizeAttributeByMeta(attr, metaAttr, displayName);
    if (!sanitized.ok) {
      return { ok: false, reason: sanitized.reason };
    }
    out.push(sanitized.attr);
  }

  // 수량/개당 수량 충돌 보정: "N개세트" 패턴이면 수량=N, 개당 수량=1 우선
  const titleQtyMatch = String(displayName || '').match(/(\d+)\s*개\s*세트/);
  const titleQty = titleQtyMatch ? Number(titleQtyMatch[1]) : null;
  const qtyAttr = out.find(a => /^수량$/.test(a.attributeTypeName));
  const perQtyAttr = out.find(a => /개당\s*수량/.test(a.attributeTypeName));

  if (titleQty && qtyAttr && perQtyAttr) {
    const qtyNum = Number(String(qtyAttr.attributeValueName).match(/\d+(?:\.\d+)?/)?.[0] || '0');
    const perQtyNum = Number(String(perQtyAttr.attributeValueName).match(/\d+(?:\.\d+)?/)?.[0] || '0');

    if (qtyNum <= 1 && perQtyNum >= titleQty) {
      qtyAttr.attributeValueName = String(titleQty);
      perQtyAttr.attributeValueName = '1';
      console.log(`  수량 보정: 수량=${qtyAttr.attributeValueName}, 개당 수량=${perQtyAttr.attributeValueName}`);
    }
  }

  return { ok: true, attrs: out };
}

function isNonAttributeGroup(groupName) {
  return /발송|배송|수령|택배/.test(groupName);
}

function cleanOptionForAttribute(optName, attrTypeName) {
  if (/색상|색/.test(attrTypeName)) {
    return extractColorFromOption(optName) || optName;
  }
  if (/사이즈|크기/i.test(attrTypeName)) {
    return extractSizeFromOption(optName) || optName;
  }
  if (/수량|개당|총\s*수량|입수/.test(attrTypeName)) {
    return extractQuantityFromOption(optName) || optName;
  }
  return optName;
}
// ─────────────────────────────────────────────────────────────

async function predictCategory(name){
  const j = await cfJson('POST', '/v2/providers/openapi/apis/api/v1/categorization/predict', { productName: name.slice(0,200) });
  return { id: j?.data?.predictedCategoryId, name: j?.data?.predictedCategoryName };
}

/**
 * 상세페이지 HTML 생성 — 도매꾹 raw HTML 대신 깨끗한 이미지 기반 상세페이지
 */
function generateDetailHtml(prod) {
  const imgs = (prod.detailImages || [])
    .filter(u => u && u.startsWith('http') && u.length <= 200);
  const name = prod.displayName || prod.sellerName || '상품';
  let html = '<div style="max-width:860px;margin:0 auto;font-family:sans-serif;">';
  html += `<h2 style="text-align:center;margin:20px 0;">${name}</h2>`;
  if (prod.imageUrl) {
    html += `<p style="text-align:center;"><img src="${prod.imageUrl}" style="max-width:100%;height:auto;" /></p>`;
  }
  for (const src of imgs) {
    html += `<p style="text-align:center;"><img src="${src}" style="max-width:100%;height:auto;" /></p>`;
  }
  html += '</div>';
  return html.slice(0, 20000);
}

/**
 * 상품의 이미지 배열 구성 (대표 이미지 1개만)
 * 상세 이미지는 contents HTML에서만 표시
 */
function buildImages(prod) {
  const images = [];
  if (prod.imageUrl && prod.imageUrl.length <= 200) {
    images.push({ imageOrder: 0, imageType: 'REPRESENTATION', vendorPath: prod.imageUrl });
  }
  return images;
}

/**
 * API payload 사전 검증 -- 불필요한 API 호출 방지
 * @returns {{ valid: boolean, reason?: string }}
 */
// 쿠팡 금지 키워드 (노출 제한/등록 거부 사유)
const FORBIDDEN_WORDS = new Set([
  '최저가', '특가', '한정', '할인', '이벤트', '초특가', '사은품', '증정',
  '당일출고', '무료배송', '빠른배송', '즉시발송', '당일발송', '오늘출발',
  '신상', '신상품', '베스트', '1위', '인기', 'BEST', 'HOT',
  '추천', '정품', '공식몰', '리뷰이벤트',
]);
const FORBIDDEN_CHARS_RE = /[!$?*@#~<>\[\]|]/;

function validatePayload(payload) {
  if (!payload.displayProductName || payload.displayProductName.length > 100) {
    return { valid: false, reason: `displayProductName 누락 또는 100자 초과 (${(payload.displayProductName || '').length}자)` };
  }
  // 금지 특수문자 검사
  if (FORBIDDEN_CHARS_RE.test(payload.displayProductName)) {
    return { valid: false, reason: `displayProductName에 금지 특수문자 포함: ${payload.displayProductName}` };
  }
  // 금지 키워드 검사
  const nameWords = payload.displayProductName.split(/\s+/);
  for (const w of nameWords) {
    if (FORBIDDEN_WORDS.has(w)) {
      return { valid: false, reason: `displayProductName에 금지 키워드 "${w}" 포함` };
    }
  }
  if (!payload.displayCategoryCode) {
    return { valid: false, reason: 'displayCategoryCode 누락' };
  }
  if (!payload.returnCenterCode) {
    return { valid: false, reason: 'returnCenterCode 누락' };
  }
  if (!payload.returnChargeName) {
    return { valid: false, reason: 'returnChargeName 누락' };
  }

  const item = payload.items?.[0];
  if (!item) {
    return { valid: false, reason: 'items 배열 비어있음' };
  }
  if (!item.salePrice || item.salePrice <= 0 || !Number.isInteger(item.salePrice)) {
    return { valid: false, reason: `salePrice 유효하지 않음: ${item.salePrice}` };
  }
  if (!item.images || item.images.length < 1) {
    return { valid: false, reason: '이미지 배열 비어있음 (최소 1개 필요)' };
  }
  for (const img of item.images) {
    if (!img.vendorPath || !img.vendorPath.startsWith('http')) {
      return { valid: false, reason: `이미지 URL 유효하지 않음: ${img.vendorPath}` };
    }
  }
  if (!item.attributes || !Array.isArray(item.attributes)) {
    return { valid: false, reason: 'attributes 배열 누락' };
  }

  return { valid: true };
}

/**
 * 쿠팡 등록 페이로드 요약(보관용) — 핵심 필드만 저장
 */
function summarizePayload(payload) {
  if (!payload) return null;
  const item = payload.items?.[0] || {};
  return {
    displayProductName: payload.displayProductName,
    displayCategoryCode: payload.displayCategoryCode,
    saleStartedAt: payload.saleStartedAt,
    saleEndedAt: payload.saleEndedAt,
    itemName: item.itemName,
    salePrice: item.salePrice,
    searchTags: item.searchTags || [],
    images: (item.images || []).map(i => i.vendorPath).filter(Boolean),
    attributes: (item.attributes || []).map(a => ({
      attributeTypeName: a.attributeTypeName,
      attributeValueName: a.attributeValueName,
      exposed: a.exposed
    }))
  };
}

async function registerProduct(prod){
  const cat = await predictCategory(prod.displayName);
  const meta = await cfJson('GET', `/v2/providers/seller_api/apis/api/v1/marketplace/meta/category-related-metas/display-category-codes/${cat.id}`);
  const notices = buildNotices(meta?.data);
  const metaAttrs = meta?.data?.attributes || [];

  // 필수 속성 보완
  const { attrs: attributes, skipReason } = ensureRequiredAttributes(prod, meta);
  if(skipReason){
    return { _skip: true, reason: skipReason };
  }

  // '기본' 값 잔존 체크 (안전장치)
  const hasBadDefault = attributes.some(a => a.attributeValueName === '기본');
  if(hasBadDefault){
    return { _skip: true, reason: '속성에 "기본" 값 잔존' };
  }

  const sanitizedBaseAttrs = sanitizeAttributesWithMeta(attributes, metaAttrs, prod.displayName);
  if(!sanitizedBaseAttrs.ok){
    return { _skip: true, reason: `속성 정규화 실패: ${sanitizedBaseAttrs.reason}` };
  }

  const payload = {
    displayCategoryCode: cat.id,
    sellerProductName: prod.sellerName,
    vendorId: VID,
    saleStartedAt: new Date().toISOString().slice(0,19),
    saleEndedAt: '2099-01-01T23:59:59',
    displayProductName: prod.displayName,
    brand: '',
    generalProductName: prod.displayName,
    productGroup: '',
    manufacture: '',
    deliveryMethod: 'SEQUENCIAL',
    deliveryCompanyCode: 'KDEXP',
    deliveryChargeType: 'FREE',
    deliveryCharge: 0,
    freeShipOverAmount: 0,
    deliveryChargeOnReturn: 5000,
    returnCharge: 5000,
    remoteAreaDeliverable: 'N',
    unionDeliveryType: 'UNION_DELIVERY',
    returnCenterCode: '1002248796',
    returnChargeName: '케이스페이스',
    companyContactNumber: '+821024843810',
    returnZipCode: '15470',
    returnAddress: '경기도 안산시 단원구 광덕3로 178',
    returnAddressDetail: '610호 케이스페이스 내(202호)',
    outboundShippingPlaceCode: 23987766,
    vendorUserId: VUID,
    requested: true,
    items: buildItems(prod, notices, sanitizedBaseAttrs.attrs)
  };

  /**
   * 도매꾹 옵션 → 쿠팡 items 배열 생성
   */
  function buildItems(p, nots, attrs) {
    const baseItem = {
      originalPrice: p.salePrice,
      salePrice: p.salePrice,
      maximumBuyCount: 99999,
      maximumBuyForPerson: 99999,
      maximumBuyForPersonPeriod: 1,
      outboundShippingTimeDay: 2,
      unitCount: 1,
      minimumQuantity: p.minOrderQuantity || 1,
      adultOnly: 'EVERYONE',
      taxType: 'TAX',
      parallelImported: 'NOT_PARALLEL_IMPORTED',
      overseasPurchased: 'NOT_OVERSEAS_PURCHASED',
      pccNeeded: false,
      barcode: '',
      emptyBarcode: true,
      emptyBarcodeReason: '바코드 없음',
      certifications: [{ certificationType: 'NOT_REQUIRED', certificationCode: '' }],
      searchTags: p.searchTags,
      images: buildImages(p),
      notices: nots,
      contents: [{
        contentsType: 'TEXT',
        contentDetails: [{
          content: generateDetailHtml(p),
          detailType: 'TEXT'
        }]
      }],
      offerCondition: 'NEW',
      offerDescription: ''
    };

    const opts = p.domeggookOptions;
    if (!opts || !Array.isArray(opts) || opts.length === 0) {
      // 옵션 없음 → 단일 아이템
      return [{ ...baseItem, itemName: p.displayName, attributes: attrs }];
    }

    // 비속성 그룹 필터링 (발송일, 배송 등)
    const attrOpts = opts.filter(o => !isNonAttributeGroup(o.groupName));
    if (attrOpts.length === 0) {
      // 옵션이 모두 비속성 → 단일 아이템 (첫번째 옵션값 기준)
      return [{ ...baseItem, itemName: p.displayName, attributes: attrs }];
    }

    // 옵션 있음 → 크로스 조인으로 모든 조합 생성
    function crossJoin(groups) {
      if (groups.length === 0) return [[]];
      const [first, ...rest] = groups;
      const restCombinations = crossJoin(rest);
      const result = [];
      for (const val of first.values) {
        for (const combo of restCombinations) {
          result.push([{ groupName: first.groupName, ...val }, ...combo]);
        }
      }
      // 조합 폭발 방지: 최대 30개
      return result.slice(0, 30);
    }

    const combinations = crossJoin(attrOpts);
    const items = [];
    const seenNames = new Set(); // itemName 중복 방지
    const seenOptionSignatures = new Set(); // 옵션 속성 조합 중복 방지

    for (const combo of combinations) {
      const totalPriceAdd = combo.reduce((sum, c) => sum + (c.priceAdd || 0), 0);
      const itemPrice = p.salePrice + totalPriceAdd;
      const correctedPrice = itemPrice % 10 !== 0 ? Math.ceil(itemPrice / 10) * 10 : itemPrice;

      // itemName: 옵션값 조합 (30자 제한 + 중복 방지)
      let optLabel = combo.map(c => c.name).join(' ');
      if (optLabel.length > 30) optLabel = optLabel.slice(0, 30).trim();
      if (seenNames.has(optLabel)) continue;
      seenNames.add(optLabel);

      // 속성: 기존 속성 복사 + 옵션 그룹에 매칭되는 속성값 치환 (정제된 값)
      const optAttrsRaw = attrs.map(a => {
        for (const c of combo) {
          const gn = c.groupName || '';
          const isMatch =
            a.attributeTypeName === gn ||
            ((/선택|옵션|option/i.test(gn)) && /색상|색/.test(a.attributeTypeName) && extractColorFromOption(c.name)) ||
            (/색상|색/.test(gn) && /색상|색/.test(a.attributeTypeName)) ||
            (/사이즈|크기|size/i.test(gn) && /사이즈|크기/i.test(a.attributeTypeName));

          if (isMatch) {
            const cleaned = cleanOptionForAttribute(c.name, a.attributeTypeName);
            return { ...a, attributeValueName: cleaned };
          }
        }
        return { ...a };
      });

      // 동일 attributeTypeName 중복 제거 (쿠팡 옵션 중복 오류 예방)
      const attrByType = new Map();
      for (const a of optAttrsRaw) {
        attrByType.set(a.attributeTypeName, a);
      }
      const optAttrs = Array.from(attrByType.values());
      const sanitizedOptAttrs = sanitizeAttributesWithMeta(optAttrs, metaAttrs, p.displayName);
      if (!sanitizedOptAttrs.ok) {
        console.log(`  옵션 조합 SKIP(속성 정규화 실패): ${sanitizedOptAttrs.reason}`);
        continue;
      }

      // 옵션 속성 조합 시그니처 중복 제거 (같은 옵션값 조합 재전송 방지)
      const optionSig = sanitizedOptAttrs.attrs
        .map(a => `${a.attributeTypeName}:${a.attributeValueName}`)
        .sort()
        .join('|');
      if (seenOptionSignatures.has(optionSig)) {
        continue;
      }
      seenOptionSignatures.add(optionSig);

      items.push({
        ...baseItem,
        itemName: optLabel,
        originalPrice: correctedPrice,
        salePrice: correctedPrice,
        attributes: sanitizedOptAttrs.attrs,
      });
    }

    return items.length > 0 ? items : [{ ...baseItem, itemName: p.displayName, attributes: attrs }];
  }

  // payload 사전 검증
  const validation = validatePayload(payload);
  if (!validation.valid) {
    return { _skip: true, reason: `payload 검증 실패: ${validation.reason}`, _payload: payload };
  }

  // 대표 이미지 접근 가능 여부 확인
  const repImg = payload.items[0].images[0]?.vendorPath;
  if (repImg) {
    const reachable = await checkImageReachable(repImg);
    if (!reachable) {
      return { _skip: true, reason: `대표 이미지 접근 불가 (404/timeout): ${repImg.slice(0, 80)}`, _payload: payload };
    }
  }

  const apiResult = await cfJson('POST', '/v2/providers/seller_api/apis/api/v1/marketplace/seller-products', payload);
  return { _payload: payload, ...apiResult };
}

async function checkStatus(productId){
  const j = await cfJson('GET', `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products/${productId}`);
  return j?.data?.statusName || 'UNKNOWN';
}

/**
 * 등록 전 유효성 검사 — 실패 시 사유 문자열 반환, 통과 시 null
 */
function validateItem(item){
  // 이미지 체크
  if(!item.imageUrl || INVALID_IMAGE_PATTERNS.some(p => item.imageUrl.toLowerCase().includes(p.toLowerCase()))){
    return '이미지 없음 또는 플레이스홀더';
  }
  // vendorPath 200자 제한 체크
  if(item.imageUrl.length > 200){
    return 'imageUrl 200자 초과';
  }
  // 가격 10원 단위 체크 (자동 수정)
  if(item.salePrice % 10 !== 0){
    item.salePrice = Math.ceil(item.salePrice / 10) * 10;
    console.log(`  가격 10원 단위 보정: ${item.salePrice}`);
  }
  // 가격 범위 체크
  if(!item.salePrice || item.salePrice < 100){
    return '판매가 누락 또는 100원 미만';
  }
  return null;
}

function loadQueue(){
  if(!fs.existsSync(QUEUE_FILE)) return [];
  return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
}

function saveQueue(queue){
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
}

function loadLog(){
  if(!fs.existsSync(LOG_FILE)) return [];
  return JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
}

function saveLog(log){
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
}

/**
 * denied 상품 자동 분석 + 수정 후 재큐잉
 * 1회 실행당 최대 DENIED_BATCH개 처리
 */
const DENIED_BATCH = 2;
const MAX_RETRY = 3;

async function processDenied(queue) {
  const denied = queue.filter(q => q.status === 'denied' && (q.retryCount || 0) < MAX_RETRY);
  if (!denied.length) return 0;

  let processed = 0;
  for (const item of denied.slice(0, DENIED_BATCH)) {
    console.log(`\n[denied 분석] ${item.sellerName} (retry ${item.retryCount || 0})`);

    // 쿠팡 API로 상품 상세 조회 → 반려 사유 확인
    let denyReasons = [];
    try {
      const detail = await cfJson('GET', `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products/${item.productId}`);
      const statusName = detail?.data?.statusName || '';
      // 반려 사유는 items[].statusHistory 또는 상위 필드에서 추출
      const items = detail?.data?.items || [];
      for (const it of items) {
        if (it.statusName === '승인반려' && it.rejectReason) {
          denyReasons.push(it.rejectReason);
        }
      }
      // 상위 레벨 반려 사유
      if (detail?.data?.rejectReason) {
        denyReasons.push(detail.data.rejectReason);
      }
      if (detail?.data?.comment) {
        denyReasons.push(detail.data.comment);
      }
    } catch (e) {
      console.log(`  상세 조회 실패: ${e.message}`);
    }

    const reasonText = denyReasons.join(' ').toLowerCase();
    console.log(`  반려 사유: ${denyReasons.join(' | ') || '(조회 불가)'}`);

    // 반려 근본원인 분류
    const denial = classifyDenial(denyReasons.join(' '));
    item.denialType = denial.type;
    console.log(`  분류: ${denial.type} (confidence: ${denial.confidence})`);

    let fixed = false;

    // (a) 이미지 관련 반려
    if (reasonText.includes('이미지') || reasonText.includes('image') || reasonText.includes('사진')) {
      console.log('  → 이미지 관련 반려: 이미지 재검증');
      const safeUrl = getSafeVendorPath(item.imageUrl);
      if (!safeUrl || !isValidImageUrl(item.imageUrl)) {
        // 대체 이미지: detailImages에서 유효한 첫번째 이미지 사용
        const alt = (item.detailImages || []).find(u => u && isValidImageUrl(u) && getSafeVendorPath(u));
        if (alt) {
          item.imageUrl = getSafeVendorPath(alt);
          console.log(`  대체 이미지 적용: ${item.imageUrl}`);
          fixed = true;
        } else {
          console.log('  대체 이미지 없음 → denied_permanent');
        }
      } else {
        // 이미지 자체는 유효 → 다른 이미지 관련 이슈일 수 있으므로 재시도
        fixed = true;
      }
    }
    // (b) 카테고리 관련 반려
    else if (reasonText.includes('카테고리') || reasonText.includes('category') || reasonText.includes('분류')) {
      console.log('  → 카테고리 관련 반려: 카테고리 재예측');
      try {
        const newCat = await predictCategory(item.displayName);
        if (newCat?.id) {
          console.log(`  카테고리 재예측: ${newCat.id} (${newCat.name})`);
          // 속성도 새 카테고리에 맞게 초기화
          item.attributes = [];
          fixed = true;
        }
      } catch (e) {
        console.log(`  카테고리 재예측 실패: ${e.message}`);
      }
    }
    // (c) 속성 관련 반려
    else if (reasonText.includes('속성') || reasonText.includes('attribute') || reasonText.includes('필수') || reasonText.includes('required')) {
      console.log('  → 속성 관련 반려: 속성 초기화 후 재등록');
      // 기존 속성 제거하여 registerProduct에서 다시 자동 매핑
      item.attributes = [];
      fixed = true;
    }
    // (c2) 가격 관련 반려
    else if (reasonText.includes('판매가') || reasonText.includes('가격') || reasonText.includes('10원') || reasonText.includes('price')) {
      console.log('  → 가격 관련 반려: 10원 단위 라운딩 재적용');
      item.salePrice = roundPrice10(item.salePrice);
      fixed = true;
    }
    // (d) 사유 조회 불가 또는 기타 → 속성 초기화 후 한번 더 시도
    else {
      if ((item.retryCount || 0) === 0) {
        console.log('  → 사유 불명: 속성 초기화 후 1회 재시도');
        item.attributes = [];
        fixed = true;
      } else {
        console.log('  → 사유 불명 + 재시도 이력 있음 → denied_permanent');
      }
    }

    if (fixed) {
      item.status = 'pending';
      item.retryCount = (item.retryCount || 0) + 1;
      item.optimized = false; // SEO 재최적화 필요
      item.deniedReason = denyReasons.join(' | ') || '(조회 불가)';
      delete item.productId;
      delete item.registeredAt;
      delete item.coupangStatus;
      console.log(`  → pending 재큐잉 (retry ${item.retryCount})`);
    } else {
      item.status = 'denied_permanent';
      item.deniedReason = denyReasons.join(' | ') || '(조회 불가)';
      console.log(`  → denied_permanent`);
    }

    processed++;
  }

  return processed;
}

/**
 * 임시저장 상품 자동 삭제 + 재큐잉
 * coupangStatus가 '임시저장'인 상품을 삭제 후 pending으로 재등록
 */
const TEMP_BATCH = 2;
const MAX_TEMP_RETRY = 2;

async function processTemporarySaved(queue) {
  const H24 = 24 * 60 * 60 * 1000;
  const tempSaved = queue.filter(q =>
    q.status === 'registered' && q.coupangStatus === '임시저장' &&
    (q.tempSavedRetry || 0) < MAX_TEMP_RETRY &&
    q.registeredAt && (Date.now() - new Date(q.registeredAt).getTime()) > H24
  );
  if (!tempSaved.length) return 0;

  let processed = 0;
  for (const item of tempSaved.slice(0, TEMP_BATCH)) {
    console.log(`\n[임시저장 처리] ${item.sellerName} (pid: ${item.productId})`);
    try {
      const { success, message } = await deleteProduct(item.productId);
      if (success) {
        console.log(`  삭제 완료: ${message}`);
        item.status = 'pending';
        item.optimized = false;
        item.tempSavedRetry = (item.tempSavedRetry || 0) + 1;
        delete item.productId;
        delete item.registeredAt;
        delete item.coupangStatus;
        delete item.coupangPayload;
        console.log(`  → pending 재큐잉 (tempRetry ${item.tempSavedRetry})`);
      } else {
        console.log(`  삭제 실패: ${message}`);
      }
    } catch (e) {
      console.log(`  처리 실패: ${e.message}`);
    }
    processed++;
  }
  return processed;
}

// 한 번 실행에 최대 등록할 상품 수 (기본 10개, 환경변수로 오버라이드 가능)
const BATCH_SIZE = parseInt(process.env.REGISTER_BATCH_SIZE || '10', 10);

async function main(){
  // Pre-flight: 필수 환경변수 검증
  const requiredEnv = { COUPANG_ACCESS_KEY: AK, COUPANG_SECRET_KEY: SK, COUPANG_VENDOR_ID: VID };
  const missing = Object.entries(requiredEnv).filter(([,v]) => !v).map(([k]) => k);
  if(missing.length){
    console.error(`FATAL: 필수 환경변수 누락: ${missing.join(', ')}`);
    console.error('  → /home/dev/openclaw/.env 파일을 확인하세요.');
    process.exit(1);
  }

  const now = new Date().toISOString();
  console.log(`[${now}] 크론 실행 (배치 최대 ${BATCH_SIZE}개)`);

  const queue = loadQueue();
  const log = loadLog();

  // 오래된 skip_invalid/error 상품 큐 정리 (7일 이상)
  const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;
  const beforeLen = queue.length;
  const staleStatuses = new Set(['skip_invalid', 'error']);
  for (let i = queue.length - 1; i >= 0; i--) {
    const q = queue[i];
    if (!staleStatuses.has(q.status)) continue;
    const addedAt = q.addedAt ? new Date(q.addedAt).getTime() : 0;
    if (addedAt > 0 && (Date.now() - addedAt) > STALE_THRESHOLD_MS) {
      queue.splice(i, 1);
    }
  }
  const cleaned = beforeLen - queue.length;
  if (cleaned > 0) {
    console.log(`큐 정리: skip_invalid/error ${cleaned}건 제거 (7일 초과)`);
  }

  const SEO_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24시간

  // 배치 수집: SEO 완료 항목 우선
  let pendingItems = queue
    .filter(q => q.status === 'pending' && q.optimized === true)
    .slice(0, BATCH_SIZE);

  // 배치 미달 시 SEO 타임아웃 폴백으로 보충
  if(pendingItems.length < BATCH_SIZE){
    const remaining = BATCH_SIZE - pendingItems.length;
    const timedOut = queue.filter(q => {
      if(q.status !== 'pending' || q.optimized) return false;
      const addedAt = q.addedAt ? new Date(q.addedAt).getTime() : 0;
      return addedAt > 0 && (Date.now() - addedAt) > SEO_TIMEOUT_MS;
    }).slice(0, remaining);
    timedOut.forEach(t => {
      t.seoTimedOut = true;
      console.log(`SEO 타임아웃 폴백: ${t.sellerName} (${Math.round((Date.now() - new Date(t.addedAt).getTime()) / 3600000)}h 대기)`);
    });
    pendingItems = [...pendingItems, ...timedOut];
  }

  if(pendingItems.length === 0){
    const unoptimized = queue.filter(q => q.status === 'pending' && !q.optimized).length;
    if(unoptimized > 0){
      console.log(`SEO 최적화 대기 중: ${unoptimized}개`);
    } else {
      console.log('대기 상품 없음. 종료.');
    }

    // 등록 완료된 상품 상태 체크
    const registered = queue.filter(q => q.status === 'registered' && q.productId);
    for(const item of registered){
      const status = await checkStatus(item.productId);
      console.log(`  체크: ${item.sellerName} | ${item.productId} | ${status}`);
      item.coupangStatus = status;
      if(status === '승인완료') item.status = 'approved';
      else if(status === '승인반려') item.status = 'denied';
    }

    const deniedCount = await processDenied(queue);
    if(deniedCount) console.log(`denied 처리: ${deniedCount}건`);

    const tempCount = await processTemporarySaved(queue);
    if(tempCount) console.log(`임시저장 처리: ${tempCount}건`);

    saveQueue(queue);
    return;
  }

  console.log(`배치 등록 시작: ${pendingItems.length}개`);
  let successCount = 0;
  let failCount = 0;

  for(const pending of pendingItems){
    const itemNow = new Date().toISOString();
    console.log(`\n[${successCount + failCount + 1}/${pendingItems.length}] ${pending.sellerName}`);

    // 유효성 검사
    const invalidity = validateItem(pending);
    if(invalidity){
      pending.status = 'skip_invalid';
      pending.error = invalidity;
      console.log(`  SKIP (${invalidity})`);
      failCount++;
      continue;
    }

    try {
      const result = await registerProduct(pending);

      if(result?._skip){
        pending.status = 'skip_invalid';
        pending.error = result.reason;
        console.log(`  SKIP (${result.reason})`);
        failCount++;
        continue;
      }

      if(result?._payload){
        pending.coupangPayload = summarizePayload(result._payload);
        pending.coupangPayloadAt = itemNow;
      }

      const ok = result?.code === 'SUCCESS';
      const pid = result?.data;

      if(ok){
        pending.status = 'registered';
        pending.productId = pid;
        pending.registeredAt = itemNow;
        console.log(`  SUCCESS | productId: ${pid}`);
        successCount++;
        log.push({
          action: 'register',
          name: pending.sellerName,
          productId: pid,
          time: itemNow,
          result: 'SUCCESS',
          domeggookProductNo: pending.domeggookProductNo || null,
          domeggookProductName: pending.domeggookProductName || pending.displayName || null,
          domeggookOptionNos: pending.domeggookOptionNos || [],
          seoOptimizedName: pending.optimized ? pending.displayName : null,
          seoOriginalName: pending.originalName || null,
          coupangPayload: pending.coupangPayload || null
        });
      } else {
        const { _payload, ...rest } = result || {};
        const errText = rest?.message || rest?.code || JSON.stringify(rest).slice(0,300);
        const isInvalidOptionUnit = /유효하지 않은 구매 옵션 값 혹은 단위/.test(errText || '');

        if (isInvalidOptionUnit) {
          pending.status = 'skip_invalid';
          const attrDump = (pending.coupangPayload?.attributes || []).map(a => `${a.attributeTypeName}=${a.attributeValueName}`).join(', ');
          pending.error = `구매옵션/단위 메타 검증 실패: ${attrDump || '속성정보 없음'}`;
          pending.errorDetail = rest?.errorItems || rest?.details || null;
          console.log(`  SKIP (${pending.error})`);
        } else {
          pending.status = 'error';
          pending.error = errText;
          pending.errorDetail = rest?.errorItems || rest?.details || null;
          console.log(`  FAIL | ${pending.error}`);
        }

        failCount++;
        log.push({
          action: 'register',
          name: pending.sellerName,
          time: itemNow,
          result: isInvalidOptionUnit ? 'SKIP' : 'FAIL',
          error: pending.error,
          errorDetail: pending.errorDetail || null,
          domeggookProductNo: pending.domeggookProductNo || null,
          domeggookProductName: pending.domeggookProductName || pending.displayName || null,
          domeggookOptionNos: pending.domeggookOptionNos || [],
          seoOptimizedName: pending.optimized ? pending.displayName : null,
          seoOriginalName: pending.originalName || null,
          coupangPayload: pending.coupangPayload || null
        });
      }
    } catch(e){
      pending.status = 'error';
      pending.error = e.message;
      console.log(`  ERROR | ${e.message}`);
      failCount++;
      log.push({
        action: 'register',
        name: pending.sellerName,
        time: itemNow,
        result: 'ERROR',
        error: e.message,
        domeggookProductNo: pending.domeggookProductNo || null,
        domeggookProductName: pending.domeggookProductName || pending.displayName || null,
        domeggookOptionNos: pending.domeggookOptionNos || [],
        seoOptimizedName: pending.optimized ? pending.displayName : null,
        seoOriginalName: pending.originalName || null
      });
    }
  }

  console.log(`\n배치 완료: 성공 ${successCount}건 / 실패·스킵 ${failCount}건`);

  // denied 상품 자동 분석 + 재등록
  const deniedCount = await processDenied(queue);
  if(deniedCount) console.log(`denied 처리: ${deniedCount}건`);

  // 임시저장 상품 재등록
  const tempCount = await processTemporarySaved(queue);
  if(tempCount) console.log(`임시저장 처리: ${tempCount}건`);

  // register_log.json 트리밍: 500건 초과 시 최신 500건만 유지
  if(log.length > 500){
    const trimmed = log.length - 500;
    log.splice(0, trimmed);
    console.log(`  로그 트리밍: ${trimmed}건 제거 (${log.length}건 유지)`);
  }

  saveQueue(queue);
  saveLog(log);
  console.log('완료.');
}

main().catch(e=>{ console.error(e); process.exit(1); });
