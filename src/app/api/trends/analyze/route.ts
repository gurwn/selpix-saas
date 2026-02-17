import { NextResponse } from 'next/server'
import type { TrendAnalysis, AnalyzeRequest } from '@/lib/trends/types'
import { getShoppingTrend, getRelatedKeywords } from '@/lib/naver/datalab'
import { getExactKeywordStats } from '@/lib/naver/searchad'
import { analyzeCompetition } from '@/lib/trends/competition'
import { analyzeProfitability } from '@/lib/trends/profitability'
import { analyzeSeasonality } from '@/lib/trends/season'
import {
  calculateTotalScore,
  getGrade,
  getTrendDirection,
  calculateDemandScore,
} from '@/lib/trends/scoring'
import { fetchWholesaleLive } from '@/lib/api'
import type { KeywordStats } from '@/lib/naver/searchad'

export const runtime = 'nodejs'

async function analyzeKeyword(
  keyword: string,
  searchAdMap: Map<string, KeywordStats>
): Promise<TrendAnalysis> {
  // Run all data fetches in parallel
  const [trendData, wholesaleProducts, relatedKeywords] = await Promise.all([
    getShoppingTrend(keyword).catch(() => []),
    fetchWholesaleLive(keyword).catch(() => []),
    getRelatedKeywords(keyword).catch(() => []),
  ])

  const adStats = searchAdMap.get(keyword.toLowerCase())
  const monthlySearchVolume = adStats?.totalSearch

  const demandScore = calculateDemandScore(trendData)
  const competition = analyzeCompetition(
    keyword,
    wholesaleProducts.length,
    monthlySearchVolume
  )
  const profitability = analyzeProfitability(
    keyword,
    wholesaleProducts.map((p) => ({ price: p.price, name: p.name }))
  )
  const seasonality = analyzeSeasonality(keyword, trendData)
  const trendDirection = getTrendDirection(trendData)
  const totalScore = calculateTotalScore(
    demandScore,
    competition.score,
    profitability.score
  )
  const grade = getGrade(totalScore)

  const result: TrendAnalysis = {
    keyword,
    demandScore,
    competitionScore: competition.score,
    profitabilityScore: profitability.score,
    seasonalityScore: seasonality.score,
    totalScore,
    grade,
    trendDirection,
    peakMonths: seasonality.peakMonths,
    avgMarginRate: profitability.avgMarginRate,
    supplyCount: competition.supplyCount,
    relatedKeywords,
  }

  // Enrich with search ad data if available
  if (adStats) {
    result.searchVolume = {
      pc: adStats.monthlyPcSearch,
      mobile: adStats.monthlyMobileSearch,
      total: adStats.totalSearch,
    }
    result.naverCompIdx = adStats.compIdx
    if (adStats.totalSearch > 0) {
      result.competitionRatio = parseFloat(
        (competition.supplyCount / adStats.totalSearch).toFixed(2)
      )
    }
  }

  return result
}

export async function POST(req: Request) {
  try {
    const body: AnalyzeRequest = await req.json()
    const keywords = (body.keywords || []).slice(0, 5)

    if (keywords.length === 0) {
      return NextResponse.json(
        { error: 'keywords array is required (max 5)' },
        { status: 400 }
      )
    }

    // Fetch search ad data for all keywords in parallel with analysis
    const searchAdMap = await getExactKeywordStats(keywords).catch(
      () => new Map()
    )

    const analyses = await Promise.all(
      keywords.map((kw) => analyzeKeyword(kw, searchAdMap))
    )

    return NextResponse.json({ analyses })
  } catch (error: any) {
    console.error('Trend analyze error:', error)
    return NextResponse.json(
      { error: error?.message || 'Analysis failed' },
      { status: 500 }
    )
  }
}
