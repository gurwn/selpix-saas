/**
 * 이미지 유효성 검사 & 변환 유틸
 * 사용처: pipeline_sourcing.js, cron_register_product.js
 */

const INVALID_IMAGE_PATTERNS = ['img_notExist', 'noimage', 'no_image', 'default_img'];

/**
 * 이미지 URL 유효성 검사
 */
function isValidImageUrl(url) {
  if (!url) return false;
  return !INVALID_IMAGE_PATTERNS.some(p => url.toLowerCase().includes(p.toLowerCase()));
}

/**
 * 이미지 URL을 쿠팡 vendorPath 규격에 맞게 안전하게 변환
 * - http(s)로 시작해야 함
 * - 플레이스홀더 이미지 제외
 * - 200자 초과 시 쿼리 파라미터 제거 후 재시도
 */
function getSafeVendorPath(url) {
  if (!url) return null;
  if (!url.startsWith('http')) return null;
  if (INVALID_IMAGE_PATTERNS.some(p => url.toLowerCase().includes(p.toLowerCase()))) return null;
  if (url.length <= 200) return url;
  const noQuery = url.split('?')[0];
  return noQuery.length <= 200 ? noQuery : null;
}

/**
 * 판매가를 10원 단위로 올림
 */
function roundPrice10(price) {
  return Math.ceil(price / 10) * 10;
}

/**
 * 이미지 URL HEAD 요청으로 접근 가능 여부 확인 (timeout 3초)
 * @returns {Promise<boolean>} 접근 가능하면 true
 */
async function checkImageReachable(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return false;
    // Content-Length < 1KB → 플레이스홀더 가능성
    const cl = res.headers.get('content-length');
    if (cl && parseInt(cl, 10) < 1024) return false;
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  INVALID_IMAGE_PATTERNS,
  isValidImageUrl,
  getSafeVendorPath,
  roundPrice10,
  checkImageReachable,
};
