import { NextResponse } from 'next/server'
import { optimizeForCoupang } from '@/lib/openai'

export const runtime = 'nodejs'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { originalName, wholesalePrice, category, sourcingKeyword, currentSalePrice, currentTags } = body

        if (!originalName || !wholesalePrice) {
            return NextResponse.json(
                { ok: false, error: 'originalName과 wholesalePrice는 필수입니다.' },
                { status: 400 }
            )
        }

        const result = await optimizeForCoupang({
            originalName,
            wholesalePrice: Number(wholesalePrice),
            category,
            sourcingKeyword,
            currentSalePrice: currentSalePrice ? Number(currentSalePrice) : undefined,
            currentTags: Array.isArray(currentTags) ? currentTags : undefined,
        })

        return NextResponse.json({ ok: true, data: result })
    } catch (err: any) {
        console.error('Optimize-listing API Error:', err)
        return NextResponse.json(
            { ok: false, error: err.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
