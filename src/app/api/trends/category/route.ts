import { NextResponse } from 'next/server'
import { getCategoryTrend } from '@/lib/naver/datalab'
import type { TrendDirection } from '@/lib/trends/types'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const categoryCode = searchParams.get('categoryCode')
    const timeUnit = (searchParams.get('period') as 'date' | 'week' | 'month') || 'month'

    if (!categoryCode) {
      return NextResponse.json(
        { error: 'categoryCode is required' },
        { status: 400 }
      )
    }

    const trend = await getCategoryTrend(categoryCode, { timeUnit })

    if (trend.length === 0) {
      return NextResponse.json({ trend: [], summary: null })
    }

    const ratios = trend.map((d) => d.ratio)
    const avgRatio = ratios.reduce((s, v) => s + v, 0) / ratios.length
    const maxRatio = Math.max(...ratios)
    const minRatio = Math.min(...ratios)

    // Determine direction from recent vs previous data
    let direction: TrendDirection = 'stable'
    if (trend.length >= 4) {
      const recent = trend.slice(-3)
      const previous = trend.slice(-6, -3)
      if (previous.length > 0) {
        const recentAvg = recent.reduce((s, d) => s + d.ratio, 0) / recent.length
        const prevAvg = previous.reduce((s, d) => s + d.ratio, 0) / previous.length
        if (prevAvg > 0) {
          const change = (recentAvg - prevAvg) / prevAvg
          if (change > 0.1) direction = 'rising'
          else if (change < -0.1) direction = 'declining'
        }
      }
    }

    return NextResponse.json({
      trend,
      summary: {
        avgRatio: Math.round(avgRatio * 10) / 10,
        maxRatio,
        minRatio,
        direction,
      },
    })
  } catch (error: any) {
    console.error('Category trend error:', error)
    return NextResponse.json(
      { error: error?.message || 'Category trend failed' },
      { status: 500 }
    )
  }
}
