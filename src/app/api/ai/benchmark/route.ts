import { NextResponse } from 'next/server'
import { benchmarkCompetitors } from '@/lib/openai'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { myProductName, myProductInfo, competitorUrls } = body

    if (!myProductName || !competitorUrls || !Array.isArray(competitorUrls)) {
      return NextResponse.json(
        { ok: false, error: '상품명과 경쟁사 URL이 필요합니다.' },
        { status: 400 }
      )
    }

    if (competitorUrls.length > 5) {
      return NextResponse.json(
        { ok: false, error: '경쟁사 URL은 최대 5개까지 가능합니다.' },
        { status: 400 }
      )
    }

    const result = await benchmarkCompetitors(
      myProductName,
      myProductInfo || '',
      competitorUrls
    )

    if (!result) {
      return NextResponse.json(
        { ok: false, error: 'AI 분석에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, data: result })
  } catch (err: any) {
    console.error('Benchmark API Error:', err)
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    )
  }
}
