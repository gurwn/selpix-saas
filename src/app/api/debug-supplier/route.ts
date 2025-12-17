import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.info('[supplier-debug]', body)
    if (body?.detailPageData?.supplier) {
      console.info('[supplier-debug-nested]', JSON.stringify(body.detailPageData.supplier, null, 2))
    }
    if (body?.supplier) {
      console.info('[supplier-debug-root]', JSON.stringify(body.supplier, null, 2))
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[supplier-debug-error]', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
