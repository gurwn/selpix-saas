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

const { INVALID_IMAGE_PATTERNS, isValidImageUrl, getSafeVendorPath, roundPrice10 } = require('./lib/image_utils');

const DOMEGGOOK_API_KEY = process.env.DOMEGGOOK_API_KEY;

const CANDIDATE_FILE = '/home/dev/openclaw/config/workspace/candidate_keywords.json';
const QUEUE_FILE = path.resolve(__dirname, '../data/register_queue.json');
const LOG_FILE = path.resolve(__dirname, '../data/pipeline.log');
const KEYWORD_HISTORY_FILE = path.resolve(__dirname, '../data/keyword_history.json');
const TWITTER_INTEL_DIR = '/home/dev/openclaw/config/workspace/data/twitter-intel/raw';
const KEYWORD_HISTORY_DAYS = 7;

const MIN_PRICE = 1000;
const MAX_PRICE = 50000;
const PRODUCTS_PER_KEYWORD = 3;
const COUPANG_FEE_RATE = 0.108; // 10.8%
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
 * 트위터 인텔에서 상품 키워드 추출
 * - 최근 1일 JSON 파일에서 category가 "model" 또는 "agent"인 항목의 summary_kr 활용
 * - summary_kr에서 2글자 이상 한국어 명사구 추출
 */
function loadTwitterKeywords() {
  if (!fs.existsSync(TWITTER_INTEL_DIR)) {
    log('트위터 인텔 디렉토리 없음, 스킵');
    return [];
  }

  const files = fs.readdirSync(TWITTER_INTEL_DIR)
    .filter(f => /^\d{8}\.json$/.test(f))
    .sort()
    .reverse();

  if (files.length === 0) {
    log('트위터 인텔 raw 파일 없음, 스킵');
    return [];
  }

  // 최근 1일 파일만 로드
  const latestFile = path.join(TWITTER_INTEL_DIR, files[0]);
  const data = loadJson(latestFile);
  if (!Array.isArray(data)) {
    log(`트위터 인텔 파일 형식 불일치: ${files[0]}`);
    return [];
  }

  const keywords = new Set();
  const targetCategories = ['model', 'agent'];

  for (const item of data) {
    if (!targetCategories.includes(item.category)) continue;
    const summary = item.summary_kr;
    if (!summary || typeof summary !== 'string') continue;

    // 한국어 명사구 추출 (2~6글자 한국어 단어)
    const matches = summary.match(/[가-힣]{2,6}/g) || [];
    for (const m of matches) {
      // 조사/어미/일반 단어 제외
      const stopWords = ['에서', '으로', '하는', '있는', '없는', '위한', '대한', '통해',
        '모델', '공개', '출시', '발표', '업그레이드', '프리뷰', '연구', '보고서',
        '수준', '기업', '달러', '가치', '투자', '유치'];
      if (!stopWords.includes(m) && !isBlockedProduct(m).blocked) {
        keywords.add(m);
      }
    }
  }

  const result = [...keywords];
  log(`트위터 인텔 키워드 ${result.length}개 추출 (${files[0]}): ${result.join(', ')}`);
  return result;
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
 * Step 1: candidate_keywords.json에서 키워드 추출
 * - ranked_keywords + keyword_scores: score >= 80 우선, >= 50 일반, < 50 스킵
 * - 없으면 기존 naver_shopping direction/change_pct 기반 (하위 호환)
 */
function extractKeywords(candidates) {
  // 점수 기반 정렬 (ranked_keywords가 있을 때)
  if (candidates?.ranked_keywords?.length && candidates?.keyword_scores) {
    const scores = candidates.keyword_scores;
    const priority = []; // score >= 80
    const normal = [];   // score >= 50
    for (const kw of candidates.ranked_keywords) {
      const s = scores[kw];
      if (!s || s.direction === 'falling') continue;
      if (isBlockedProduct(kw).blocked) continue;
      if (s.composite >= 80) {
        priority.push(kw);
      } else if (s.composite >= 50) {
        normal.push(kw);
      }
      // composite < 50: 스킵
    }
    const keywords = [...priority, ...normal];
    log(`점수 기반 키워드 ${keywords.length}개 (우선 ${priority.length}개, 일반 ${normal.length}개): ${keywords.map(k => `${k}(${scores[k].composite})`).join(', ')}`);
    return keywords;
  }

  // fallback: 기존 로직 (하위 호환)
  const naverShopping = candidates?.naver_shopping || [];
  const filtered = naverShopping.filter(k => k.direction !== 'falling');
  filtered.sort((a, b) => {
    if (a.direction === 'rising' && b.direction !== 'rising') return -1;
    if (a.direction !== 'rising' && b.direction === 'rising') return 1;
    return (b.change_pct || 0) - (a.change_pct || 0);
  });

  const keywords = filtered.map(k => k.keyword).filter(kw => !isBlockedProduct(kw).blocked);
  log(`추출 키워드 ${keywords.length}개: ${keywords.join(', ')}`);
  return keywords;
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
  return itemList.map(item => ({
    name: item.title || '',
    price: parseInt(item.price || item.domePrice || 0, 10),
    imageUrl: item.thumb || null,
    sourceUrl: item.url || (item.no ? `http://domeggook.com/${item.no}` : null),
    productNo: String(item.no || ''),
    site: 'domeggook',
    category: keyword,
    minOrderQuantity: parseInt(item.unitQty || 1, 10),
    shippingCost: parseInt(item.deli?.fee || 0, 10)
  })).filter(p => p.name && p.price > 0);
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
function calculateMargin(product, keyword) {
  const price = product.price;
  const minOrder = product.minOrderQuantity || 1;
  const shipping = product.shippingCost || 0;

  const multiplier = getMultiplier(keyword, product.name);
  // BUG FIX 2026-02-16: 개당 원가로 계산 (묶음 전체가 아닌 1개 기준)
  const perUnitCost = price + Math.round(shipping / minOrder);
  const suggestedRetail = Math.round(perUnitCost * multiplier);
  const coupangFee = Math.round(suggestedRetail * COUPANG_FEE_RATE);
  const margin = suggestedRetail - perUnitCost - coupangFee;
  const marginRate = margin / suggestedRetail;

  return {
    unitCost: perUnitCost,
    suggestedRetail,
    coupangFee,
    margin,
    marginRate
  };
}

/**
 * 검색 태그 생성 — 키워드 + 상품명 단어 + 제조사 + 복합태그
 * 최대 10개, 2글자 이상
 */
function generateSearchTags(product, keyword) {
  const tags = new Set();

  // 1. 원본 키워드
  if (keyword && keyword.length >= 2) tags.add(keyword);

  // 2. 상품명에서 단어 추출
  const words = (product.name || '').replace(/[^\w가-힣\s]/g, '').split(/\s+/).filter(w => w.length >= 2);
  for (const w of words) tags.add(w);

  // 3. 제조사
  if (product.manufacturer && product.manufacturer.length >= 2) {
    tags.add(product.manufacturer);
  }

  // 4. 키워드 + 주요 단어 복합태그 (예: "텀블러 스텐", "충전기 고속")
  if (keyword) {
    for (const w of words.slice(0, 3)) {
      if (w !== keyword && (keyword + ' ' + w).length <= 20) {
        tags.add(keyword + ' ' + w);
      }
    }
  }

  // 5. 카테고리 연관태그
  const categoryTags = {
    '텀블러': ['보온보냉', '스텐텀블러'],
    '충전기': ['고속충전', 'USB충전'],
    '수납': ['정리함', '수납정리'],
    '이어폰': ['블루투스이어폰', '무선이어폰'],
    '캠핑': ['캠핑용품', '아웃도어'],
  };
  if (keyword) {
    for (const [key, relatedTags] of Object.entries(categoryTags)) {
      if (keyword.includes(key)) {
        for (const rt of relatedTags) tags.add(rt);
      }
    }
  }

  return [...tags].slice(0, 10);
}

/**
 * 도매꾹 상품 → register_queue 형식으로 변환
 * enriched product를 받아 고해상도 이미지 및 상세 HTML을 포함
 */
function toQueueItem(product, marginInfo, keyword) {
  const searchTags = generateSearchTags(product, keyword);

  // 상세 이미지들 (최대 10개, vendorPath 규격에 맞는 것만)
  const safeDetailImages = (product.detailImages || [])
    .map(url => getSafeVendorPath(url))
    .filter(Boolean)
    .slice(0, 10);

  // 고해상도 메인 이미지: enrichment imageUrl이 플레이스홀더면 detailImages[0] 사용
  const safeMainImage = getSafeVendorPath(product.imageUrl) || safeDetailImages[0] || null;

  return {
    sellerName: product.name.slice(0, 30),
    displayName: product.name,
    // 도매꾹 원본 식별자/상품명 보존 (재주문/출고용)
    domeggookProductNo: product.productNo || null,
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
    addedAt: new Date().toISOString(),
    addedBy: 'pipeline',
    // 도매꾹 옵션 (색상/사이즈 등)
    domeggookOptions: product.options || null,
    domeggookOptionNos: product.domeggookOptionNos || [],
    minOrderQuantity: product.minOrderQuantity || 1
  };
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

  // Step 1: 키워드 추출
  const candidates = loadJson(CANDIDATE_FILE);
  if (!candidates) {
    log('ERROR: candidate_keywords.json 없음. 트렌드 수집이 먼저 실행되어야 합니다.');
    process.exit(1);
  }

  const candidateKeywords = extractKeywords(candidates);

  // 트위터 인텔 키워드 병합 (중복 제거)
  const twitterKeywords = loadTwitterKeywords();
  const candidateSet = new Set(candidateKeywords);
  const mergedTwitter = twitterKeywords.filter(kw => !candidateSet.has(kw));
  // 트위터 키워드는 뒤에 배치 (candidate 우선)
  const allKeywords = [...candidateKeywords, ...mergedTwitter];

  if (allKeywords.length === 0) {
    log('키워드 없음 (candidate + twitter). 종료.');
    return;
  }
  if (mergedTwitter.length > 0) {
    log(`트위터 인텔에서 ${mergedTwitter.length}개 키워드 병합: ${mergedTwitter.join(', ')}`);
  }

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
        const marginInfo = calculateMargin(product, keyword);

        if (marginInfo.marginRate < MIN_MARGIN_RATE) {
          log(`  SKIP (마진 ${Math.round(marginInfo.marginRate * 100)}%): ${product.name.slice(0, 40)}`);
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
        const hasValidImage = getSafeVendorPath(enriched.imageUrl) ||
          (enriched.detailImages || []).some(url => getSafeVendorPath(url));
        if (!hasValidImage) {
          log(`  SKIP (유효한 이미지 없음): ${product.name.slice(0, 40)}`);
          continue;
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
