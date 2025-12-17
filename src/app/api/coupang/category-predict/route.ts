import { NextResponse } from 'next/server'
import crypto from 'crypto'

export const runtime = 'nodejs'

// 쿠팡 인증 정보 (배포 전 .env 로 옮기세요)
const ACCESS_KEY = '6d969926-bc32-4836-a46c-0c60e8be94a9'
const SECRET_KEY = 'a2f475aceea02e656aa252a4556295c2e5ec7baa'
const VENDOR_ID = 'A01410454'
const BASE_URL = 'https://api-gateway.coupang.com'

function signRequest(method: string, path: string, query = '') {
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

  const message = `${datetime}${method}${path}${query}`
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(message, 'utf-8').digest('hex')
  const authorization = `CEA algorithm=HmacSHA256, access-key=${ACCESS_KEY}, signed-date=${datetime}, signature=${signature}`

  return { datetime, authorization }
}

async function coupangFetch(method: 'GET' | 'POST', path: string, body?: any, query = '') {
  const { datetime, authorization } = signRequest(method, path, query)
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: authorization,
      'X-Coupang-Date': datetime,
      'X-Requested-By': VENDOR_ID
    }
  }
  if (body && method !== 'GET') {
    init.body = JSON.stringify(body)
  }
  const res = await fetch(`${BASE_URL}${path}${query ? `?${query}` : ''}`, init)
  const json = await res.json().catch(() => ({}))
  return { res, json }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    if (!payload?.productName) {
      return NextResponse.json({ ok: false, error: 'productName is required' }, { status: 400 })
    }

    const body = {
      productName: payload.productName,
      productDescription: payload.productDescription || payload.description || '',
      brand: payload.brand || '',
      attributes: payload.attributes || {},
      sellerSkuCode: payload.sellerSkuCode || ''
    }

    const path = '/v2/providers/openapi/apis/api/v1/categorization/predict'
    const { res, json } = await coupangFetch('POST', path, body)

    console.info('[coupang-category-predict]', { status: res.status, body: json })

    if (!res.ok || json?.code === 'ERROR') {
      return NextResponse.json(
        { ok: false, status: res.status, body: json },
        { status: res.status || 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      status: res.status,
      data: json?.data,
      raw: json
    })
  } catch (err: any) {
    console.error('[coupang-category-predict-error]', err)
    return NextResponse.json({ ok: false, error: err?.message || 'internal error' }, { status: 500 })
  }
}
