
import { NextResponse } from 'next/server'
import { generateProductMetadata } from '@/lib/openai'

export const runtime = 'nodejs'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { productName, productDescription, brand, attributes, minOrderQty } = body

        // 2. 검색 프롬프트 구성
        const context = `
    [상품정보]
    - 상품명: ${productName}
    - 브랜드: ${brand || '없음'}
    - 최소주문수량: ${minOrderQty || 1}
    - 특징/옵션: ${JSON.stringify(attributes)}
    - 상세설명 요약: ${productDescription.slice(0, 500)}...
    `.trim()

        const result = await generateProductMetadata(context, minOrderQty || 1)

        if (!result) {
            return NextResponse.json({ ok: false, error: 'AI 생성 실패' }, { status: 500 })
        }

        return NextResponse.json({ ok: true, data: result })
    } catch (err: any) {
        console.error('AI recommend API Error:', err)
        return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
    }
}
