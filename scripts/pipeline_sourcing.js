#!/usr/bin/env node
/**
 * 파이프라인 소싱 자동화
 *
 * 흐름:
 * 1. candidate_keywords.json에서 score 기반 키워드 추출 (>=80 우선, >=50 일반, <50 스킵)
 * 2. 트위터 인텔에서 model/agent 카테고리 키워드 병합
 * 3. keyword_history.json으로 최근 7일 내 중복 키워드 스킵
 * 4. 각 키워드로 도매꾹 API 검색 (상위 3개, 1,000~50,000원)
 * 5. 마진 계산 → 마진율 30% 이상만 통과
 * 6. register_queue.json에 pending으로 추가 (중복 방지)
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '/home/dev/openclaw/.env' });

const { INVALID_IMAGE_PATTERNS, isValidImageUrl, getSafeVendorPath, roundPrice10, checkImageReachable } = require('./lib/image_utils');

const DOMEGGOOK_API_KEY = process.env.DOMEGGOOK_API_KEY;

const DIRECTIVE_FILE = path.resolve(__dirname, '../data/sourcing_directive.json');
const QUEUE_FILE = path.resolve(__dirname, '../data/register_queue.json');
const LOG_FILE = path.resolve(__dirname, '../data/pipeline.log');
const KEYWORD_HISTORY_FILE = path.resolve(__dirname, '../data/keyword_history.json');
const KEYWORD_HISTORY_DAYS = 7;

const MIN_PRICE = 1000;
const MAX_PRICE = 50000;
const PRODUCTS_PER_KEYWORD = 5;
const FEE_TABLE = require('./lib/coupang_fee_table.json');

function getCoupangFeeRate(categoryName) {
  if (!categoryName) return FEE_TABLE.default;
  for (const [cat, rate] of Object.entries(FEE_TABLE)) {
    if (cat === 'default') continue;
    if (categoryName.includes(cat) || cat.includes(categoryName)) return rate;
  }
  return FEE_TABLE.default;
}
const DEFAULT_MULTIPLIER = 2.5;
const MIN_MARGIN_RATE = 0.30; // 30%

// 카테고리별 가격 배수
const CATEGORY_MULTIPLIERS = {
  '전자': 2.0, '디지털': 2.0, '가전': 2.0, '충전기': 2.0, '이어폰': 2.0,
  '문구': 3.0, '사무용품': 3.0, '학용품': 3.0,
  '주방': 2.5, '수납': 2.5, '생활용품': 2.5, '리빙': 2.5,
  '캠핑': 2.3, '등산': 2.3, '스포츠': 2.3,
  '완구': 3.0, '장난감': 3.0,
  '반려동물': 2.8, '펫': 2.8,
};

function getMultiplier(keyword, name) {
  const text = ((keyword || '') + ' ' + (name || '')).toLowerCase();
  for (const [cat, mult] of Object.entries(CATEGORY_MULTIPLIERS)) {
    if (text.includes(cat)) return mult;
  }
  return DEFAULT_MULTIPLIER;
}

function extractProductNo(sourceUrl) {
  const m = (sourceUrl || '').match(/domeggook\.com\/(\d+)/);
  return m ? m[1] : null;
}

// 블랙리스트: 인증/반품 리스크 높은 상품 키워드
const BLOCKED_KEYWORDS = [
  // 보조배터리 (발화, KC인증)
  '보조배터리', '배터리팩', '리튬배터리',
  // 화장품 (식약처) — 복합어 포함
  '크림', '화장', '스킨케어', '로션', '세럼', '마스크팩', '클렌징', '파운데이션', '립스틱',
  '선크림', '핸드크림', '수분크림', 'SPF', '자외선차단', '화장품', '코스메틱',
  // 의류 (사이즈 반품)
  '티셔츠', '바지', '원피스', '자켓', '코트', '니트', '청바지', '치마', '블라우스',
  // 식품 (유통기한)
  '식품', '과자', '음료', '건강식품', '영양제', '비타민', '프로틴',
];

// 한국어 복합어 접미사 패턴 (예: "알프레도휘마스선크림" → 크림 접미사)
const BLOCKED_SUFFIX_PATTERNS = [
  /[가-힣]크림/i,
  /[가-힣]로션/i,
  /[가-힣]세럼/i,
];

function isBlockedProduct(name) {
  if (!name) return { blocked: false, matchedKeyword: null };
  const lower = name.toLowerCase();
  for (const kw of BLOCKED_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      return { blocked: true, matchedKeyword: kw };
    }
  }
  // 복합어 접미사 체크
  for (const pattern of BLOCKED_SUFFIX_PATTERNS) {
    if (pattern.test(name)) {
      return { blocked: true, matchedKeyword: `패턴:${pattern.source}` };
    }
  }
  return { blocked: false, matchedKeyword: null };
}

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
}

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function saveJson(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * keyword_history.json 로드 — { "키워드": "YYYY-MM-DD", ... }
 */
function loadKeywordHistory() {
  return loadJson(KEYWORD_HISTORY_FILE) || {};
}

/**
 * keyword_history.json 저장
 */
function saveKeywordHistory(history) {
  saveJson(KEYWORD_HISTORY_FILE, history);
}

/**
 * 최근 N일 이내에 소싱한 키워드인지 확인
 */
function isRecentlySourced(keyword, history) {
  const lastDate = history[keyword];
  if (!lastDate) return false;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - KEYWORD_HISTORY_DAYS);
  return new Date(lastDate) >= cutoff;
}

/**
 * 도매꾹 API: 키워드로 상품 목록 검색
 */
async function searchViaApi(keyword) {
  const url = `https://domeggook.com/ssl/api/?ver=4.0&mode=getItemList&aid=${DOMEGGOOK_API_KEY}&market=dome&om=json&kw=${encodeURIComponent(keyword)}&mnp=${MIN_PRICE}&mxp=${MAX_PRICE}&sz=20&so=se`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`도매꾹 API 검색 실패: ${res.status}`);
  const data = await res.json();
  const items = data?.domeggook?.list?.item || [];
  // 단일 상품이면 배열이 아니라 객체로 올 수 있음
  const itemList = Array.isArray(items) ? items : [items];
  return itemList.map(item => {
    const sourceUrl = item.url || (item.no ? `http://domeggook.com/${item.no}` : null);
    return {
      name: item.title || '',
      price: parseInt(item.price || item.domePrice || 0, 10),
      imageUrl: item.thumb || null,
      sourceUrl,
      productNo: extractProductNo(sourceUrl) || (item.no ? String(item.no) : null),
      site: 'domeggook',
      category: keyword,
      minOrderQuantity: parseInt(item.unitQty || 1, 10),
      shippingCost: parseInt(item.deli?.fee || 0, 10)
    };
  }).filter(p => p.name && p.price > 0);
}

/**
 * 도매꾹 API: 상품 상세 조회 (enrichment)
 */
async function enrichViaApi(product) {
  if (!product.productNo) return { ...product, detailImages: [], imageUsageStatus: 'unknown' };

  const url = `https://domeggook.com/ssl/api/?ver=4.1&mode=getItemView&aid=${DOMEGGOOK_API_KEY}&no=${product.productNo}&om=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`도매꾹 API 상세 조회 실패: ${res.status}`);
  const raw = await res.json();
  const data = raw?.domeggook || raw;

  // 가격 파싱 (수량별 차등 가격에서 첫 번째 가격 추출: "1+9850|11+9800")
  let price = product.price;
  const domePrice = data?.price?.dome;
  if (domePrice) {
    const priceStr = String(domePrice);
    const priceMatch = priceStr.match(/(\d+)\+(\d+)/);
    if (priceMatch) price = parseInt(priceMatch[2], 10);
    else if (/^\d+$/.test(priceStr)) price = parseInt(priceStr, 10);
  }

  // 이미지
  const imageUrl = data?.thumb?.original || product.imageUrl;

  // 상세 이미지: desc.contents는 객체 {item, deli, event, otherItem} — 각각 HTML 문자열
  const detailImages = [];
  const contents = data?.desc?.contents;
  let contentsHtml = '';
  if (typeof contents === 'string') {
    contentsHtml = contents;
  } else if (contents && typeof contents === 'object') {
    // item 필드가 메인 상품 상세 HTML
    contentsHtml = [contents.item, contents.deli, contents.event, contents.otherItem]
      .filter(Boolean).join('');
  }
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(contentsHtml)) !== null) {
    const src = imgMatch[1];
    if (src && src.startsWith('http') && src.length <= 200) {
      detailImages.push(src);
    }
  }

  // 이미지 사용 허가
  const licenseUsable = data?.desc?.license?.usable;
  let imageUsageStatus = 'unknown';
  if (licenseUsable === true || licenseUsable === 'true' || licenseUsable === 'Y') {
    imageUsageStatus = 'available';
  } else if (licenseUsable === false || licenseUsable === 'false' || licenseUsable === 'N') {
    imageUsageStatus = 'unavailable';
  }

  // 옵션 파싱 (selectOpt → 구조화, 옵션번호 포함)
  let parsedOptions = [];
  let parsedOptionNos = [];
  try {
    const selectOptRaw = data?.selectOpt;
    if (selectOptRaw) {
      const selectOpt = typeof selectOptRaw === 'string' ? JSON.parse(selectOptRaw) : selectOptRaw;
      if (selectOpt?.set && Array.isArray(selectOpt.set)) {
        const extractOptionNos = (group, rawOpts) => {
          const candidates = [
            group?.optNo, group?.optNos, group?.optionNo, group?.optionNos,
            group?.optcode, group?.optCode, group?.optCodes,
            group?.opt_no, group?.opt_nos
          ];
          const cand = candidates.find(v => v);
          const len = Array.isArray(rawOpts) ? rawOpts.length : 0;
          if (!cand) return Array(len).fill(null);
          if (Array.isArray(cand)) return cand.map(v => v == null ? null : String(v));
          if (typeof cand === 'string') {
            const parts = cand.split(/[|,]/).map(s => s.trim()).filter(Boolean);
            if (parts.length >= len) return parts.slice(0, len);
            const nums = cand.match(/\d+/g) || [];
            if (nums.length >= len) return nums.slice(0, len);
            return parts.length ? parts : Array(len).fill(null);
          }
          if (typeof cand === 'object' && len > 0) {
            return rawOpts.map(opt => {
              const name = typeof opt === 'string' ? opt : (opt?.name || opt?.value || opt?.opt);
              return name && cand[name] ? String(cand[name]) : null;
            });
          }
          return Array(len).fill(null);
        };

        for (const group of selectOpt.set) {
          const optName = group.name || '선택';
          const rawOpts = Array.isArray(group.opts) ? group.opts : [];
          const optNos = extractOptionNos(group, rawOpts);
          const opts = rawOpts.map((opt, i) => {
            if (typeof opt === 'string') {
              return {
                name: opt,
                priceAdd: parseInt(group.domPrice?.[i] || '0', 10),
                optionNo: optNos?.[i] || null
              };
            }
            if (opt && typeof opt === 'object') {
              const name = opt.name || opt.value || opt.opt || '';
              const optionNo = opt.optionNo || opt.optNo || opt.optcode || opt.optCode || opt.code || optNos?.[i] || null;
              const priceAdd = parseInt(opt.priceAdd || opt.addPrice || opt.price || group.domPrice?.[i] || '0', 10);
              return { name, priceAdd, optionNo };
            }
            return null;
          }).filter(v => v && v.name);

          for (const v of opts) {
            if (v.optionNo != null) parsedOptionNos.push(String(v.optionNo));
          }
          parsedOptions.push({ groupName: optName, values: opts });
        }
      }
    }
  } catch (e) {
    console.log(`  옵션 파싱 실패: ${e.message}`);
  }

  const uniqueOptionNos = [...new Set(parsedOptionNos.filter(Boolean))];

  return {
    ...product,
    name: data?.basis?.title || product.name,
    price,
    imageUrl,
    detailImages: detailImages.slice(0, 30),
    detailHtml: contentsHtml.slice(0, 20000) || null,
    imageUsageStatus,
    manufacturer: data?.detail?.manufacturer || null,
    country: data?.detail?.country || null,
    minOrderQuantity: parseInt(data?.qty?.domeMoq || product.minOrderQuantity || 1, 10),
    shippingCost: parseInt(data?.deli?.dome?.fee || product.shippingCost || 0, 10),
    resaleMinimum: data?.price?.resale?.minimum || data?.price?.resale?.minumum || null,
    inventory: data?.qty?.inventory || null,
    options: parsedOptions.length > 0 ? parsedOptions : null,
    domeggookOptionNos: uniqueOptionNos
  };
}

/**
 * Step 3: 마진 계산
 */
function calculateMargin(product, keyword, categoryName) {
  const price = product.price;
  const minOrder = product.minOrderQuantity || 1;
  const shipping = product.shippingCost || 0;
  const feeRate = getCoupangFeeRate(categoryName || '');

  const multiplier = getMultiplier(keyword, product.name);
  // MOQ 반영: 고객에게 minOrder개 묶음으로 판매하므로 총 원가 기준 가격 산정
  const perUnitCost = price + Math.round(shipping / minOrder);
  const totalCost = perUnitCost * minOrder;
  const suggestedRetail = Math.round(totalCost * multiplier);
  const coupangFee = Math.round(suggestedRetail * feeRate);
  const margin = suggestedRetail - totalCost - coupangFee;
  const marginRate = margin / suggestedRetail;

  return {
    unitCost: totalCost,   // 판매 1건당 실제 원가 (MOQ개 합산)
    suggestedRetail,
    coupangFee,
    feeRate,
    margin,
    marginRate
  };
}

// 동의어 매핑 테이블 (SEO 태그 확장용)
const SYNONYMS = {
  '텀블러': ['보온병', '보냉컵', '스텐텀블러', '보온텀블러'],
  '충전기': ['고속충전기', 'USB충전기', 'C타입충전기'],
  '거치대': ['스탠드', '홀더', '마운트'],
  '가위': ['다용도가위', '작업가위', '사무용가위'],
  '수납': ['정리함', '수납함', '수납정리'],
  '이어폰': ['블루투스이어폰', '무선이어폰', '이어버드'],
  '캠핑': ['캠핑용품', '아웃도어', '야외용품'],
  '텐트': ['캠핑텐트', '원터치텐트', '팝업텐트'],
  '케이스': ['폰케이스', '휴대폰케이스', '보호케이스'],
  '조명': ['LED조명', '무드등', '랜턴'],
};

const TITLE_STOPWORDS = new Set([
  '최저가', '특가', '한정', '할인', '이벤트', '당일출고', '무료배송', '정품', '공식몰', '공식',
  '초특가', '사은품', '증정', '판촉물', '홍보스티커무료', '추천', '베스트'
]);

function normalizeText(input) {
  return String(input || '')
    .replace(/[\[\]{}()]/g, ' ')
    .replace(/[|\\/]+/g, ' ')
    .replace(/[_~`"'“”‘’]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeTag(tag) {
  const clean = normalizeText(tag)
    .replace(/[^0-9a-zA-Z가-힣\s+]/g, '')
    .trim();
  if (clean.length < 2 || clean.length > 20) return null;
  if (/^(keyword\d*|sesa|test|sample)$/i.test(clean)) return null;
  return clean;
}

function optimizeProductTitle(rawName, keyword, moq = 1) {
  const base = normalizeText(rawName)
    .replace(/^\[[^\]]+\]\s*/g, '')
    .replace(/^(1\+1|\d+개세트)\s*/g, '')
    .trim();

  const tokens = base.split(/\s+/)
    .map(t => t.replace(/[^0-9a-zA-Z가-힣]/g, '').trim())
    .filter(t => t.length >= 2 && t.length <= 12)
    .filter(t => !TITLE_STOPWORDS.has(t.toLowerCase()));

  const unique = [];
  const seen = new Set();
  for (const t of tokens) {
    const low = t.toLowerCase();
    if (seen.has(low)) continue;
    seen.add(low);
    unique.push(t);
  }

  const kw = sanitizeTag(keyword || '');
  let titleParts = [];
  if (kw) titleParts.push(kw);
  for (const t of unique) {
    if (kw && t === kw) continue;
    titleParts.push(t);
    if (titleParts.join(' ').length >= 55) break;
  }

  let optimized = titleParts.join(' ').trim();
  if (!optimized) optimized = base.slice(0, 60);
  if (moq > 1) {
    const prefix = moq === 2 ? '1+1' : `${moq}개세트`;
    optimized = `${prefix} ${optimized}`;
  }

  return normalizeText(optimized).slice(0, 100);
}

/**
 * 검색 태그 생성 — 키워드 + 상품명 단어 + 동의어 + 롱테일 + 제조사
 * 최대 20개, 2~20자
 */
function generateSearchTags(productName, keyword, manufacturer = '') {
  const tags = new Set();
  const safeKeyword = sanitizeTag(keyword || '');
  const words = normalizeText(productName)
    .split(/\s+/)
    .map(w => sanitizeTag(w))
    .filter(Boolean);

  if (safeKeyword) tags.add(safeKeyword);
  for (const w of words) tags.add(w);

  for (const [term, syns] of Object.entries(SYNONYMS)) {
    if ((productName || '').includes(term) || (safeKeyword && safeKeyword.includes(term))) {
      for (const s of syns) {
        const ss = sanitizeTag(s);
        if (ss) tags.add(ss);
      }
    }
  }

  if (safeKeyword) {
    for (const w of words.slice(0, 6)) {
      if (w === safeKeyword) continue;
      const comboA = sanitizeTag(`${safeKeyword} ${w}`);
      const comboB = sanitizeTag(`${safeKeyword}${w}`);
      if (comboA) tags.add(comboA);
      if (comboB) tags.add(comboB);
    }
  }

  const maker = sanitizeTag(manufacturer || '');
  if (maker) tags.add(maker);

  const arr = [...tags].filter(Boolean).slice(0, 20);
  if (arr.length >= 20) return arr;

  // 20개 미만일 때 보강 (의미 없는 placeholder 금지)
  const boosters = ['추천', '인기', '가성비', '생활용품', '실사용'];
  for (const b of boosters) {
    const t = safeKeyword ? sanitizeTag(`${safeKeyword} ${b}`) : null;
    if (t && !arr.includes(t)) arr.push(t);
    if (arr.length >= 20) break;
  }
  return arr.slice(0, 20);
}

/**
 * 도매꾹 상품 → register_queue 형식으로 변환
 * enriched product를 받아 고해상도 이미지 및 상세 HTML을 포함
 */
function toQueueItem(product, marginInfo, keyword) {
  // 상세 이미지들 (최대 10개, vendorPath 규격에 맞는 것만)
  const safeDetailImages = (product.detailImages || [])
    .map(url => getSafeVendorPath(url))
    .filter(Boolean)
    .slice(0, 10);

  // 고해상도 메인 이미지: enrichment imageUrl이 플레이스홀더면 detailImages[0] 사용
  const safeMainImage = getSafeVendorPath(product.imageUrl) || safeDetailImages[0] || null;

  const moq = product.minOrderQuantity || 1;
  const optimizedDisplayName = optimizeProductTitle(product.name, keyword, moq);
  const searchTags = generateSearchTags(optimizedDisplayName, keyword, product.manufacturer);
  const productNo = product.productNo || extractProductNo(product.sourceUrl);

  return {
    sellerName: optimizedDisplayName.slice(0, 30),
    displayName: optimizedDisplayName,
    // 도매꾹 원본 식별자/상품명 보존 (재주문/출고용)
    domeggookProductNo: productNo || null,
    productNo: productNo || null,
    domeggookProductName: product.name,
    salePrice: roundPrice10(marginInfo.suggestedRetail),
    imageUrl: safeMainImage,
    detailImages: safeDetailImages,
    detailHtml: (product.detailHtml || '').slice(0, 20000) || null,
    attributes: [
      { attributeTypeName: '수량', attributeValueName: '1개', exposed: 'EXPOSED' }
    ],
    searchTags,
    status: 'pending',
    sourceUrl: product.sourceUrl || null,
    sourceSite: 'domeggook',
    sourcePrice: product.price,
    unitCost: marginInfo.unitCost,
    margin: marginInfo.margin,
    marginRate: Math.round(marginInfo.marginRate * 100),
    originalName: product.name,
    addedAt: new Date().toISOString(),
    addedBy: 'pipeline',
    optimized: true,    // 소싱 시점에 searchTags 이미 생성됨 → 즉시 등록 가능
    // 도매꾹 옵션 (색상/사이즈 등)
    domeggookOptions: product.options || null,
    domeggookOptionNos: product.domeggookOptionNos || [],
    minOrderQuantity: product.minOrderQuantity || 1
  };
}

/**
 * MOQ별 세트 상품명 생성
 * MOQ=2 → "1+1 상품명", MOQ=3~9 → "N개세트 상품명"
 */
function buildSetName(name, moq) {
  if (moq <= 1) return name;
  const base = name.replace(/^(1\+1|[0-9]+개세트)\s+/, '').trim();
  if (moq === 2) return `1+1 ${base}`;
  return `${moq}개세트 ${base}`;
}

/**
 * Step 2-4: API 검색 → 마진 계산 → 큐에 추가
 */
async function runPipeline() {
  log('=== 파이프라인 소싱 시작 ===');

  if (!DOMEGGOOK_API_KEY) {
    log('ERROR: DOMEGGOOK_API_KEY가 .env에 설정되지 않았습니다.');
    process.exit(1);
  }

  // Step 1: 지시서(Directive) 로드
  const directive = loadJson(DIRECTIVE_FILE);
  if (!directive || !directive.keywords || directive.keywords.length === 0) {
    log('ERROR: sourcing_directive.json에 유효한 지시서 없음. 오늘 소싱 스킵.');
    return; // 그냥 정상 스킵
  }

  // 지시서에서 타겟 추출
  const allKeywords = directive.keywords.map(k => typeof k === 'string' ? k : k.term).filter(Boolean);

  if (allKeywords.length === 0) {
    log('키워드 없음 (directive). 종료.');
    return;
  }
  log(`트렌드 지시서에서 ${allKeywords.length}개 키워드 타겟팅: ${allKeywords.join(', ')}`);

  // 키워드 이력 로드 — 최근 7일 내 소싱한 키워드 스킵
  const keywordHistory = loadKeywordHistory();
  const today = new Date().toISOString().slice(0, 10);
  let totalHistorySkipped = 0;

  const keywords = allKeywords.filter(kw => {
    if (isRecentlySourced(kw, keywordHistory)) {
      log(`SKIP (최근 ${KEYWORD_HISTORY_DAYS}일 내 소싱 이력): "${kw}" (${keywordHistory[kw]})`);
      totalHistorySkipped++;
      return false;
    }
    return true;
  });

  if (keywords.length === 0) {
    log(`모든 키워드가 최근 ${KEYWORD_HISTORY_DAYS}일 내 소싱 이력 있음. 종료.`);
    return;
  }
  log(`키워드 이력 필터 후 ${keywords.length}개 (스킵 ${totalHistorySkipped}개)`);

  // 기존 대기열 로드
  const queue = loadJson(QUEUE_FILE) || [];
  let backfilledProductNo = 0;
  for (const item of queue) {
    if (!item.productNo && item.sourceUrl) {
      const productNo = extractProductNo(item.sourceUrl);
      if (productNo) {
        item.productNo = productNo;
        backfilledProductNo++;
      }
    }
  }
  if (backfilledProductNo > 0) {
    log(`기존 대기열 productNo 백필: ${backfilledProductNo}개`);
  }

  const existingNames = new Set(queue.map(q => q.displayName));
  log(`기존 대기열: ${queue.length}개 (${queue.filter(q => q.status === 'pending').length}개 pending)`);

  let totalSearched = 0;
  let totalPassed = 0;
  let totalDuplicate = 0;
  let totalBlocked = 0;

  // Step 2: 키워드별 도매꾹 API 검색
  for (const keyword of keywords) {
    log(`--- 키워드: "${keyword}" API 검색 중 ---`);

    try {
      const products = await searchViaApi(keyword);
      // 가격 필터링
      const filtered = products.filter(p => p.price >= MIN_PRICE && p.price <= MAX_PRICE);
      const topProducts = filtered.slice(0, PRODUCTS_PER_KEYWORD);
      totalSearched += topProducts.length;
      log(`  검색 결과: ${products.length}개 → 가격 필터: ${filtered.length}개 → 상위 ${topProducts.length}개 선택`);

      // Step 3: 마진 계산 + 필터링
      for (const product of topProducts) {
        const marginInfo = calculateMargin(product, keyword, keyword);

        if (marginInfo.marginRate < MIN_MARGIN_RATE) {
          log(`  SKIP (마진 ${Math.round(marginInfo.marginRate * 100)}%): ${product.name.slice(0, 40)}`);
          continue;
        }

        // MOQ >= 10 필터: 위탁판매 불가
        const enrichedMoq = product.minOrderQuantity || 1;
        if (enrichedMoq >= 10) {
          log(`  SKIP (MOQ ${enrichedMoq} >= 10): ${product.name.slice(0, 40)}`);
          continue;
        }

        // 블랙리스트 체크
        const { blocked, matchedKeyword } = isBlockedProduct(product.name);
        if (blocked) {
          log(`  SKIP (블랙리스트 "${matchedKeyword}"): ${product.name.slice(0, 40)}`);
          totalBlocked++;
          continue;
        }

        // Step 4: 중복 체크
        if (existingNames.has(product.name)) {
          log(`  SKIP (중복): ${product.name.slice(0, 40)}`);
          totalDuplicate++;
          continue;
        }

        // Step 5: API enrichment (상세 조회) — 최대 2회 재시도 + exponential backoff
        log(`  enriching via API: ${product.name.slice(0, 40)}...`);
        let enriched;
        let enrichSuccess = false;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            enriched = await enrichViaApi(product);
            enrichSuccess = true;
            break;
          } catch (enrichErr) {
            if (attempt < 2) {
              const delay = 2000 * Math.pow(2, attempt); // 2s, 4s
              log(`  enrichment 재시도 ${attempt + 1}/2 (${delay}ms 후): ${enrichErr.message}`);
              await new Promise(r => setTimeout(r, delay));
            } else {
              log(`  SKIP (enrichment 실패 3회): ${enrichErr.message}`);
            }
          }
        }
        if (!enrichSuccess) continue;

        // 이미지 사용 불가 상품 제외
        if (enriched.imageUsageStatus === 'unavailable') {
          log(`  SKIP (이미지 사용 불가): ${product.name.slice(0, 40)}`);
          continue;
        }

        // enrichment 후에도 유효한 이미지가 없으면 제외
        const mainImage = getSafeVendorPath(enriched.imageUrl);
        const hasValidImage = mainImage ||
          (enriched.detailImages || []).some(url => getSafeVendorPath(url));
        if (!hasValidImage) {
          log(`  SKIP (유효한 이미지 없음): ${product.name.slice(0, 40)}`);
          continue;
        }

        // T-3: 대표 이미지 접근성 사전 검증 (HEAD 요청)
        const imgToCheck = mainImage || getSafeVendorPath((enriched.detailImages || [])[0]);
        if (imgToCheck) {
          const reachable = await checkImageReachable(imgToCheck);
          if (!reachable) {
            log(`  SKIP (이미지 접근 불가): ${product.name.slice(0, 40)} | ${imgToCheck.slice(0, 60)}`);
            continue;
          }
        }

        const queueItem = toQueueItem(enriched, marginInfo, keyword);
        queue.push(queueItem);
        existingNames.add(product.name);
        totalPassed++;
        log(`  PASS (마진 ${Math.round(marginInfo.marginRate * 100)}%, ₩${marginInfo.margin}): ${product.name.slice(0, 40)} → 판매가 ₩${marginInfo.suggestedRetail}`);

        // API 호출 간 딜레이
        await new Promise(r => setTimeout(r, 500));
      }
    } catch (err) {
      log(`  ERROR API 검색 실패: ${err.message}`);
    }

    // 키워드 간 딜레이
    await new Promise(r => setTimeout(r, 1000));
  }

  // 대기열 저장
  saveJson(QUEUE_FILE, queue);

  // 소싱한 키워드 이력 저장
  for (const kw of keywords) {
    keywordHistory[kw] = today;
  }
  // 오래된 이력 정리 (KEYWORD_HISTORY_DAYS * 2 이상 된 항목 삭제)
  const cleanupCutoff = new Date();
  cleanupCutoff.setDate(cleanupCutoff.getDate() - KEYWORD_HISTORY_DAYS * 2);
  for (const [kw, dateStr] of Object.entries(keywordHistory)) {
    if (new Date(dateStr) < cleanupCutoff) {
      delete keywordHistory[kw];
    }
  }
  saveKeywordHistory(keywordHistory);

  log(`=== 파이프라인 완료 ===`);
  log(`  검색: ${totalSearched}개 | 통과: ${totalPassed}개 | 중복: ${totalDuplicate}개 | 차단: ${totalBlocked}개 | 이력스킵: ${totalHistorySkipped}개`);
  log(`  대기열 총: ${queue.length}개 (pending: ${queue.filter(q => q.status === 'pending').length}개)`);
}

runPipeline().catch(err => {
  log(`FATAL: ${err.message}`);
  console.error(err);
  process.exit(1);
});
