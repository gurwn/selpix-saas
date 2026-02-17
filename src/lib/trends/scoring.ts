import type { Grade, TrendDirection, DataLabPoint } from './types'

export function calculateTotalScore(
  demandScore: number,
  competitionScore: number,
  profitabilityScore: number
): number {
  return Math.round(demandScore * 0.4 + competitionScore * 0.3 + profitabilityScore * 0.3)
}

export function getGrade(totalScore: number): Grade {
  if (totalScore >= 90) return 'S'
  if (totalScore >= 75) return 'A'
  if (totalScore >= 60) return 'B'
  if (totalScore >= 40) return 'C'
  return 'D'
}

export function getTrendDirection(trendData: DataLabPoint[]): TrendDirection {
  if (trendData.length < 4) return 'stable'

  // Compare the last quarter average vs the previous quarter
  const recentSlice = trendData.slice(-4)
  const previousSlice = trendData.slice(-8, -4)

  if (previousSlice.length === 0) return 'stable'

  const recentAvg = recentSlice.reduce((s, d) => s + d.ratio, 0) / recentSlice.length
  const previousAvg = previousSlice.reduce((s, d) => s + d.ratio, 0) / previousSlice.length

  if (previousAvg === 0) return 'stable'

  const changeRate = (recentAvg - previousAvg) / previousAvg

  if (changeRate > 0.1) return 'rising'
  if (changeRate < -0.1) return 'declining'
  return 'stable'
}

export function calculateDemandScore(trendData: DataLabPoint[]): number {
  if (trendData.length === 0) return 0

  // Use recent average ratio as demand indicator (DataLab ratio is 0-100)
  const recentData = trendData.slice(-3)
  const avgRatio = recentData.reduce((s, d) => s + d.ratio, 0) / recentData.length

  // Ratio is already 0-100 scale from DataLab, use directly
  return Math.round(Math.max(0, Math.min(100, avgRatio)))
}
