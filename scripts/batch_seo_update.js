/**
 * batch_seo_update.js — 쿠팡 상품 검색태그 20개 확장 + 상품명 SEO 최적화
 *
 * 실행: node scripts/batch_seo_update.js [--dry-run] [--pid=<특정상품ID>]
 *
 * 동작:
 *   1) active_products_dump.json 기반 활성 상품 목록 로드
 *   2) 각 상품에 대해 쿠팡 API로 전체 데이터 GET
 *   3) 검색태그를 20개로 확장 (기존 태그 + 상품명 파싱 + 동의어/관련어)
 *   4) 전체 payload를 PUT으로 재전송
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '/home/dev/openclaw/.env' });

const { cf, getConfig } = require('./lib/coupang_api');
const { VID: VENDOR_ID, VUID: VENDOR_USER_ID } = getConfig();

const DRY_RUN = process.argv.includes('--dry-run');
const TARGET_PID = process.argv.find(a => a.startsWith('--pid='))?.split('=')[1];

const DUMP_PATH = path.join(__dirname, '..', 'data', 'active_products_dump.json');
const LOG_PATH = path.join(__dirname, '..', 'data', 'seo_update_log.json');

// ──────────────────── 태그 생성 엔진 ────────────────────

/**
 * 한국어 쇼핑 동의어/관련어 사전
 * key: 기존 태그 → values: 추가할 관련 태그들
 */
const SYNONYM_MAP = {
  // 전자기기
  '보조배터리': ['충전기', '휴대용충전기', '미니배터리', '급속충전', '대용량배터리'],
  '이어폰': ['이어폰잭', '오디오', '음악', '유선이어폰', '이어버드'],
  'C타입': ['USB-C', 'Type-C', '타입C', 'C타입충전'],
  'USB': ['USB충전', '유에스비'],
  '충전': ['충전식', '무선충전', '급속충전'],
  '강화유리': ['보호필름', '스크린보호', '액정필름', '강화필름', '유리필름'],
  '풀커버': ['풀커버필름', '전면보호'],
  '필름': ['보호필름', '액정필름', '스킨'],
  '카메라': ['카메라보호', '카메라필름', '렌즈보호'],
  '선풍기': ['미니선풍기', '휴대선풍기', '탁상선풍기', '팬'],
  '클립형': ['집게형', '클립온', '거치형'],
  'VR': ['VR안경', '가상현실', '3D안경', 'VR기기'],
  '모터': ['모터제어', '속도제어', '전동모터'],
  'PWM': ['속도컨트롤러', '전압제어'],
  'DC': ['직류', 'DC모터'],
  'LCD': ['디스플레이', '화면', '전자표시'],
  '계수기': ['카운터', '측정기', '수량계'],

  // 뷰티/화장품
  '메이크업': ['화장', '뷰티', '코스메틱', '기초화장'],
  '파운데이션': ['베이스메이크업', '파데', '파운데이션퍼프'],
  '퍼프': ['화장퍼프', '메이크업도구', '뷰티툴', '스펀지'],
  '선크림': ['자외선차단', '썬크림', 'SPF', 'UV차단'],
  '물광': ['광채', '윤기', '글로우'],
  '블랙헤드': ['모공관리', '피지', '클렌저', '각질'],
  '세안': ['세안용품', '클렌징', '폼클렌징', '세수'],
  '거품기': ['거품망', '폼클렌저', '버블', '거품네트'],
  '핸드크림': ['수분크림', '핸드케어', '보습크림', '핸드로션'],

  // 패션/액세서리
  '키링': ['열쇠고리', '키홀더', '가방고리', '장식'],
  '파우치': ['미니파우치', '수납파우치', '화장품파우치', '가방'],
  '양말': ['발목양말', '기능성양말', '패션양말'],
  '보트양말': ['덧신', '페이크삭스', '실리콘양말', '슬립온양말'],
  '페이크삭스': ['덧신', '보트양말', '안보이는양말'],
  '모자': ['캡', '비니', '햇', '방한모자'],
  '겨울모자': ['비니', '니트모자', '방한모자', '털모자'],
  '비녀': ['머리핀', '한복장신구', '헤어핀', '뒤꽂이', '머리장식'],
  '뒤꽂이': ['비녀', '한복머리장식', '헤어스틱'],
  '운동화': ['스니커즈', '신발', '캐주얼화'],
  '방한': ['보온', '겨울', '따뜻한', '방한용품'],

  // 생활용품
  '텀블러': ['보온병', '물병', '보냉컵', '텀블러컵', '스텐텀블러'],
  '대용량': ['빅사이즈', '점보', '가성비'],
  '빨대': ['빨대컵', '스테인리스빨대', '실리콘빨대'],
  '바구니': ['수납함', '정리함', '수납바구니', '정리바구니'],
  '욕실': ['욕실용품', '화장실', '목욕용품', '욕실수납'],
  '가위': ['문구가위', '공작가위', '사무용가위', '다용도가위'],

  // 완구/취미
  '블록': ['조립블록', '레고호환', '장난감', '피규어'],
  '로봇': ['합체로봇', '변신로봇', '로봇장난감'],
  '합체': ['합체변신', '변신합체', '6종합체'],
  '굿즈': ['캐릭터상품', '피규어', '팬시', 'MD상품'],
  '배지': ['브로치', '핀배지', '뱃지', '핀'],

  // 자전거
  '자전거': ['사이클', '라이딩', '바이크'],
  '가민': ['Garmin', '속도계', '자전거컴퓨터'],
  '거치대': ['마운트', '홀더', '브라켓'],

  // 기타
  '손목시계': ['시계', '워치', '패션시계', '아날로그시계'],
  '커플': ['커플아이템', '커플시계', '남녀공용'],
  '임밍아웃': ['임신축하', '태교', '임신소식', '임신알림'],
  '연필': ['필기구', '색연필', '문구'],
  '채점': ['첨삭', '교육용', '학교용품', '선생님'],
  '완장': ['암밴드', '캡틴완장', '주장밴드', '스포츠밴드'],
};

/**
 * 상품명에서 의미 있는 키워드 추출 (1자 이상, 불용어 제외)
 */
function extractKeywords(text) {
  if (!text) return [];
  // 불용어
  const stopwords = new Set([
    '및', '등', '외', '용', '형', '개', '개입', '1개', '세트',
    'the', 'a', 'an', 'of', 'for', 'and', 'or', 'with', 'from',
    '제공', '포함', '호환', '가능',
  ]);

  // 한글/영문/숫자 토큰 추출
  const tokens = text
    .replace(/\[.*?\]/g, ' ')  // 브랜드 태그 제거
    .replace(/[^\w가-힣a-zA-Z0-9]/g, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length >= 2 && !stopwords.has(t.toLowerCase()));

  return [...new Set(tokens)];
}

/**
 * 2개 키워드 조합으로 복합 태그 생성
 */
function generateCompoundTags(keywords, maxCount = 5) {
  const compounds = [];
  for (let i = 0; i < keywords.length && compounds.length < maxCount; i++) {
    for (let j = i + 1; j < keywords.length && compounds.length < maxCount; j++) {
      const k1 = keywords[i], k2 = keywords[j];
      // 합성어가 자연스러운 조합만
      if (k1.length >= 2 && k2.length >= 2 && (k1.length + k2.length) <= 10) {
        compounds.push(k1 + k2);
      }
    }
  }
  return compounds;
}

/**
 * 태그를 최대 20개까지 확장
 */
function expandTags(existingTags, displayName, sellerName) {
  const tagSet = new Set(existingTags.map(t => t.trim()).filter(Boolean));

  // 1. displayName + sellerName에서 키워드 추출
  const nameKeywords = extractKeywords(`${displayName} ${sellerName}`);
  nameKeywords.forEach(k => tagSet.add(k));

  // 2. 기존 태그 + 추출 키워드 기반 동의어 추가
  const allCurrent = [...tagSet];
  for (const tag of allCurrent) {
    const synonyms = SYNONYM_MAP[tag];
    if (synonyms) {
      synonyms.forEach(s => tagSet.add(s));
    }
    // 소문자 매칭도 시도
    const lower = tag.toLowerCase();
    for (const [key, vals] of Object.entries(SYNONYM_MAP)) {
      if (key.toLowerCase() === lower) {
        vals.forEach(s => tagSet.add(s));
      }
    }
  }

  // 3. 복합 키워드 생성 (부족하면)
  if (tagSet.size < 20) {
    const compounds = generateCompoundTags(nameKeywords, 20 - tagSet.size);
    compounds.forEach(c => tagSet.add(c));
  }

  // 4. 품질 필터: 순수 숫자, 1자, 의미없는 조각 제거
  const junkWords = new Set([
    '주변', '작은', '비행사와', '봉투제', '저소', '간결한',
    '대비색', '보이지', '나른한', '수치',
  ]);

  const result = [...tagSet]
    .map(t => t.slice(0, 20))
    .filter(t => {
      if (t.length < 2) return false;
      if (/^\d{1,2}$/.test(t)) return false;  // 1-2자리 순수 숫자 제거
      if (junkWords.has(t)) return false;
      return true;
    })
    .slice(0, 20);

  return result;
}

// ──────────────────── 쿠팡 API 통신 ────────────────────

async function getProduct(sellerProductId) {
  const pathUrl = `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products/${sellerProductId}`;
  const { json } = await cf('GET', pathUrl);
  if (json?.code !== 'SUCCESS') throw new Error(`상품 조회 실패 (${sellerProductId}): ${JSON.stringify(json)}`);
  return json.data;
}

async function updateProduct(product) {
  const pathUrl = `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products`;
  const { res, json } = await cf('PUT', pathUrl, product);
  return { status: res.status, code: json?.code, message: json?.message, json };
}

// ──────────────────── 메인 ────────────────────

async function main() {
  // 활성 상품 목록 로드
  const dump = JSON.parse(fs.readFileSync(DUMP_PATH, 'utf-8'));
  let products = dump.filter(p => p.status === '승인완료');

  if (TARGET_PID) {
    products = products.filter(p => String(p.pid) === TARGET_PID);
    if (products.length === 0) {
      console.error(`❌ PID ${TARGET_PID} 를 찾을 수 없거나 승인완료 상태가 아닙니다.`);
      process.exit(1);
    }
  }

  console.log(`\n🔍 SEO 업데이트 대상: ${products.length}건 ${DRY_RUN ? '(DRY RUN)' : ''}\n`);

  const results = [];

  for (const prod of products) {
    const { pid, displayName, sellerName, tags: existingTags } = prod;
    console.log(`━━━ [${pid}] ${displayName} ━━━`);
    console.log(`  기존 태그 (${existingTags.length}개): ${existingTags.join(', ')}`);

    // 새 태그 생성
    const newTags = expandTags(existingTags, displayName, sellerName);
    console.log(`  확장 태그 (${newTags.length}개): ${newTags.join(', ')}`);

    if (DRY_RUN) {
      results.push({ pid, displayName, oldTagCount: existingTags.length, newTagCount: newTags.length, newTags, status: 'dry-run' });
      console.log(`  ⏭️  DRY RUN — 스킵\n`);
      continue;
    }

    try {
      // 쿠팡에서 전체 상품 데이터 조회
      const fullProduct = await getProduct(pid);

      // searchTags 교체
      fullProduct.searchTags = newTags;

      // vendorUserId 보장
      fullProduct.vendorUserId = fullProduct.vendorUserId || VENDOR_USER_ID;

      // PUT 전송
      const result = await updateProduct(fullProduct);
      console.log(`  📤 결과: ${result.code} (HTTP ${result.status}) ${result.message || ''}`);

      results.push({
        pid,
        displayName,
        oldTagCount: existingTags.length,
        newTagCount: newTags.length,
        newTags,
        status: result.code === 'SUCCESS' ? 'success' : 'fail',
        apiResponse: result.code !== 'SUCCESS' ? result.message : undefined,
      });

      if (result.code !== 'SUCCESS') {
        console.log(`  ⚠️  실패 상세: ${JSON.stringify(result.json).slice(0, 300)}`);
      }

      // API rate limit 방지
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`  ❌ 오류: ${err.message}`);
      results.push({ pid, displayName, status: 'error', error: err.message });
    }
    console.log('');
  }

  // 결과 요약
  const success = results.filter(r => r.status === 'success').length;
  const fail = results.filter(r => r.status === 'fail').length;
  const errors = results.filter(r => r.status === 'error').length;

  console.log(`\n═══ 완료 ═══`);
  console.log(`✅ 성공: ${success} | ❌ 실패: ${fail} | 🔥 오류: ${errors} | 전체: ${results.length}`);

  // 로그 저장
  fs.writeFileSync(LOG_PATH, JSON.stringify(results, null, 2));
  console.log(`📝 로그 저장: ${LOG_PATH}`);
}

main().catch(e => { console.error(e); process.exit(1); });
