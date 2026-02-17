import { NextResponse } from 'next/server'
import { getShoppingTrend } from '@/lib/naver/datalab'
import type { SurgeResult, TrendDirection } from '@/lib/trends/types'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const keywordsParam = searchParams.get('keywords') || ''
    const keywords = keywordsParam
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, 10)

    if (keywords.length === 0) {
      return NextResponse.json(
        { error: 'keywords parameter is required (comma-separated, max 10)' },
        { status: 400 }
      )
    }

    // Fetch weekly trend data for last 2 months for each keyword
    const end = new Date()
    const start = new Date()
    start.setMonth(start.getMonth() - 2)

    const results: SurgeResult[] = []

    // Process in batches of 3 to avoid rate limiting
    for (let i = 0; i < keywords.length; i += 3) {
      const batch = keywords.slice(i, i + 3)
      const batchResults = await Promise.all(
        batch.map(async (keyword): Promise<SurgeResult> => {
          try {
            const data = await getShoppingTrend(keyword, {
              startDate: start.toISOString().slice(0, 10),
              endDate: end.toISOString().slice(0, 10),
              timeUnit: 'week',
            })

            if (data.length < 4) {
              return {
                keyword,
                recentAvg: 0,
                previousAvg: 0,
                changeRate: 0,
                direction: 'stable' as TrendDirection,
              }
            }

            // Last 4 weeks vs previous 4 weeks
            const recent = data.slice(-4)
            const previous = data.slice(-8, -4)

            const recentAvg =
              recent.reduce((s, d) => s + d.ratio, 0) / recent.length
            const previousAvg =
              previous.length > 0
                ? previous.reduce((s, d) => s + d.ratio, 0) / previous.length
                : 0

            const changeRate =
              previousAvg > 0
                ? Math.round(((recentAvg - previousAvg) / previousAvg) * 1000) / 10
                : 0

            let direction: TrendDirection = 'stable'
            if (changeRate > 15) direction = 'rising'
            else if (changeRate < -15) direction = 'declining'

            return {
              keyword,
              recentAvg: Math.round(recentAvg * 10) / 10,
              previousAvg: Math.round(previousAvg * 10) / 10,
              changeRate,
              direction,
            }
          } catch {
            return {
              keyword,
              recentAvg: 0,
              previousAvg: 0,
              changeRate: 0,
              direction: 'stable' as TrendDirection,
            }
          }
        })
      )
      results.push(...batchResults)
    }

    // Sort by changeRate descending
    results.sort((a, b) => b.changeRate - a.changeRate)

    return NextResponse.json({ surges: results })
  } catch (error: any) {
    console.error('Surge detection error:', error)
    return NextResponse.json(
      { error: error?.message || 'Surge detection failed' },
      { status: 500 }
    )
  }
}
