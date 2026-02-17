import type { CompetitionData } from './types'

export function analyzeCompetition(
  keyword: string,
  supplyCount: number,
  monthlySearchVolume?: number
): CompetitionData {
  // If we have search volume data, use item-scout style competition ratio
  if (monthlySearchVolume && monthlySearchVolume > 0) {
    return analyzeBySearchRatio(keyword, supplyCount, monthlySearchVolume)
  }

  // Fallback: supply count only (original logic)
  return analyzeBySupplyCount(keyword, supplyCount)
}

/** 아이템스카우트 방식: 상품수/검색수 비율 기반 경쟁강도 */
function analyzeBySearchRatio(
  keyword: string,
  supplyCount: number,
  monthlySearchVolume: number
): CompetitionData {
  const ratio = supplyCount / monthlySearchVolume
  let score: number
  let level: CompetitionData['level']

  if (ratio < 0.5) {
    score = 100
    level = '블루오션'
  } else if (ratio < 1) {
    score = 70 + (1 - ratio) * 60 // 70-100
    level = '틈새시장'
  } else if (ratio < 3) {
    score = 50 + (3 - ratio) * 10 // 50-70
    level = '보통'
  } else if (ratio < 10) {
    score = 10 + (10 - ratio) * (40 / 7) // ~10-50
    level = '경쟁심화'
  } else {
    score = 10
    level = '레드오션'
  }

  return {
    keyword,
    supplyCount,
    score: Math.round(Math.max(0, Math.min(100, score))),
    level,
  }
}

/** 기존 로직: 공급자 수만으로 판단 */
function analyzeBySupplyCount(
  keyword: string,
  supplyCount: number
): CompetitionData {
  let score: number
  let level: CompetitionData['level']

  if (supplyCount <= 5) {
    score = 100 - supplyCount * 2 // 90-100
    level = '블루오션'
  } else if (supplyCount <= 20) {
    score = 90 - (supplyCount - 5) * (20 / 15) // 70-90
    level = '틈새시장'
  } else if (supplyCount <= 50) {
    score = 70 - (supplyCount - 20) * (30 / 30) // 40-70
    level = '보통'
  } else if (supplyCount <= 100) {
    score = 40 - (supplyCount - 50) * (20 / 50) // 20-40
    level = '경쟁심화'
  } else {
    score = Math.max(10, 20 - (supplyCount - 100) * 0.05)
    level = '레드오션'
  }

  return {
    keyword,
    supplyCount,
    score: Math.round(Math.max(0, Math.min(100, score))),
    level,
  }
}
