import { NextResponse } from 'next/server'
import crypto from 'crypto'

export const runtime = 'nodejs'

const BASE_URL = 'https://api-gateway.coupang.com'
// 반품지 조회: 쿠팡 공식 전체 경로 (seller_api)
const PATH = '/v2/providers/seller_api/apis/api/v1/marketplace/return-center'
// 반품지 생성: openapi 경로 (vendorId 필요)
const PATH_CREATE_PREFIX = '/v2/providers/openapi/apis/api/v5/vendors'

const accessKey = (process.env.COUPANG_ACCESS_KEY || '').trim()
const secretKey = (process.env.COUPANG_SECRET_KEY || '').trim()

function sign(method: string, path: string) {
  if (!accessKey || !secretKey) throw new Error('COUPANG_ACCESS_KEY/COUPANG_SECRET_KEY missing')
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  const datetime =
    d.getUTCFullYear().toString().slice(-2) +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  // datetime + method + path (query 없음) + accessKey 제외
  const message = `${datetime}${method}${path}`
  const signature = crypto.createHmac('sha256', secretKey).update(message, 'utf-8').digest('hex')
  const authorization = `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}`
  return { datetime, authorization }
}

export async function GET() {
  try {
    const { datetime, authorization } = sign('GET', PATH)
    const res = await fetch(`${BASE_URL}${PATH}`, {
      method: 'GET',
      headers: {
        Authorization: authorization,
        'X-Coupang-Date': datetime,
      },
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      console.error('[coupang-return-centers-error]', res.status, json)
      return NextResponse.json({ ok: false, status: res.status, coupang: json }, { status: res.status })
    }
    return NextResponse.json({ ok: true, coupang: json })
  } catch (err: any) {
    console.error('[coupang-return-centers-exception]', err)
    return NextResponse.json({ ok: false, error: err?.message || 'failed' }, { status: 500 })
  }
}

// 반품지 생성
export async function POST(req: Request) {
  try {
    const vendorId = (process.env.COUPANG_VENDOR_ID || '').trim()
    if (!vendorId) return NextResponse.json({ ok: false, error: 'COUPANG_VENDOR_ID missing' }, { status: 500 })

    const body = await req.json()
    console.info('[coupang-return-center-create-request]', body)

    const pathCreate = `${PATH_CREATE_PREFIX}/${vendorId}/returnShippingCenters`
    const { datetime, authorization } = sign('POST', pathCreate)

    const payload = {
      vendorId,
      userId: body.userId || process.env.COUPANG_VENDOR_USER_ID || '',
      shippingPlaceName: body.shippingPlaceName || '반품지',
      goodsflowInfoOpenApiDto: body.goodsflowInfoOpenApiDto || {},
      placeAddresses: body.placeAddresses || [],
    }

    const res = await fetch(`${BASE_URL}${pathCreate}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
        'X-Coupang-Date': datetime,
      },
      body: JSON.stringify(payload),
    })

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      console.error('[coupang-return-center-create-error]', res.status, json)
      return NextResponse.json({ ok: false, status: res.status, coupang: json }, { status: res.status })
    }

    return NextResponse.json({ ok: true, coupang: json })
  } catch (err: any) {
    console.error('[coupang-return-center-create-exception]', err)
    return NextResponse.json({ ok: false, error: err?.message || 'failed' }, { status: 500 })
  }
}
