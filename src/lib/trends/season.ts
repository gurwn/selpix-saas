import type { DataLabPoint, SeasonalityData } from './types'

export function analyzeSeasonality(
  keyword: string,
  trendData: DataLabPoint[]
): SeasonalityData {
  if (trendData.length < 3) {
    return {
      keyword,
      cv: 0,
      score: 50,
      peakMonths: [],
      label: '연중 안정',
    }
  }

  const ratios = trendData.map((d) => d.ratio)
  const mean = ratios.reduce((s, v) => s + v, 0) / ratios.length
  const variance = ratios.reduce((s, v) => s + (v - mean) ** 2, 0) / ratios.length
  const stdev = Math.sqrt(variance)
  const cv = mean > 0 ? stdev / mean : 0

  // Peak months: months where ratio > mean + 1*stdev
  const threshold = mean + stdev
  const peakMonths = trendData
    .filter((d) => d.ratio >= threshold)
    .map((d) => {
      const month = parseInt(d.period.slice(5, 7), 10)
      return month
    })
    .filter((m, i, arr) => arr.indexOf(m) === i)

  let score: number
  let label: SeasonalityData['label']

  if (cv < 0.15) {
    score = 100
    label = '연중 안정'
  } else if (cv < 0.3) {
    score = 70
    label = '약한 시즌성'
  } else if (cv < 0.5) {
    score = 40
    label = '시즌성 있음'
  } else {
    score = 20
    label = '강한 시즌성'
  }

  return {
    keyword,
    cv: Math.round(cv * 1000) / 1000,
    score,
    peakMonths,
    label,
  }
}
