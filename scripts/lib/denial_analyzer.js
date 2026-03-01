/**
 * 반려 상품 근본원인 분석기
 * 반려 사유를 패턴별 분류하고 통계를 제공
 */

const DENIAL_PATTERNS = {
  IMAGE: {
    patterns: [/이미지/, /사진/, /vendorPath/, /image/i],
    autoFix: 'replaceImage'
  },
  ATTRIBUTE: {
    patterns: [/필수.*옵션/, /구매.*옵션/, /속성/, /attribute/i],
    autoFix: 'reMapAttributes'
  },
  CATEGORY: {
    patterns: [/카테고리/, /분류/, /category/i],
    autoFix: 'rePredict'
  },
  PRICE: {
    patterns: [/판매가/, /가격/, /10원/, /price/i],
    autoFix: 'roundPrice'
  },
  CONTENT: {
    patterns: [/상세.*설명/, /상세페이지/, /content/i],
    autoFix: 'refreshContent'
  }
};

/**
 * 반려 사유 텍스트를 패턴별로 분류
 * @param {string} reason - 반려 사유 텍스트
 * @returns {{ type: string, confidence: number, autoFix: string|null }}
 */
function classifyDenial(reason) {
  if (!reason) return { type: 'UNKNOWN', confidence: 0, autoFix: null };
  for (const [type, config] of Object.entries(DENIAL_PATTERNS)) {
    if (config.patterns.some(p => p.test(reason))) {
      return { type, confidence: 0.9, autoFix: config.autoFix };
    }
  }
  return { type: 'UNKNOWN', confidence: 0, autoFix: null };
}

/**
 * 큐에서 반려 상품 통계 산출
 * @param {Array} queue - register_queue 배열
 * @returns {{ total: number, byType: Object<string, number> }}
 */
function getDenialStats(queue) {
  const denied = queue.filter(q =>
    q.status === 'denied' || q.status === 'denied_permanent'
  );
  const stats = { total: denied.length, byType: {} };
  for (const item of denied) {
    const { type } = classifyDenial(item.deniedReason);
    stats.byType[type] = (stats.byType[type] || 0) + 1;
  }
  return stats;
}

module.exports = { classifyDenial, getDenialStats, DENIAL_PATTERNS };
