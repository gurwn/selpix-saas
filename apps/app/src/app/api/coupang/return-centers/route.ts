import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@myapp/prisma'
import { auth } from '@clerk/nextjs/server'

export const runtime = 'nodejs'

const BASE_URL = 'https://api-gateway.coupang.com'
// 반품지 조회: V5 OpenAPI (Vendor ID Required)
// Path: /v2/providers/openapi/apis/api/v5/vendors/{vendorId}/returnShippingCenters
const PATH_PREFIX = '/v2/providers/openapi/apis/api/v5/vendors'

// 반품지 생성: openapi 경로 (vendorId 필요) - 위와 동일
const PATH_CREATE_PREFIX = '/v2/providers/openapi/apis/api/v5/vendors'

// const accessKey = ... (Removed global constants)
// const secretKey = ...
// const vendorId = ...

interface CoupangKeys {
    accessKey: string;
    secretKey: string;
    vendorId: string;
    vendorUserId?: string;
}

function sign(method: string, path: string, keys: CoupangKeys, query: string = '') {
    const { accessKey, secretKey } = keys;
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
    // datetime + method + path + query
    const message = `${datetime}${method}${path}${query}`
    const signature = crypto.createHmac('sha256', secretKey).update(message, 'utf-8').digest('hex')
    const authorization = `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}`
    return { datetime, authorization }
}

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const creds = await prisma.coupangCredential.findFirst({ where: { userId, isActive: true } });
        if (!creds) return NextResponse.json({ error: 'NO_CREDENTIALS' }, { status: 400 });

        const keys: CoupangKeys = {
            accessKey: creds.accessKey,
            secretKey: creds.secretKey,
            vendorId: creds.vendorId,
            vendorUserId: creds.vendorUserId || creds.userId
        };

        const path = `${PATH_PREFIX}/${keys.vendorId}/returnShippingCenters`
        const query = 'pageNum=1&pageSize=50'

        const { datetime, authorization } = sign('GET', path, keys, query)
        const res = await fetch(`${BASE_URL}${path}?${query}`, {
            method: 'GET',
            headers: {
                Authorization: authorization,
                'X-Coupang-Date': datetime,
                'X-Requested-By': keys.vendorId
            },
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
            console.error('[coupang-return-centers-error]', res.status, json)
            // Check for common IP issue to guide user
            if (res.status === 400 || res.status === 401 || res.status === 403) {
                console.warn("Potential IP Whitelist issue or Key mismatch.");
            }
            return NextResponse.json({ ok: false, status: res.status, coupang: json }, { status: res.status })
        }
        return NextResponse.json({ ok: true, coupang: json })
    } catch (err: any) {
        console.error('[coupang-return-centers-exception]', err)
        return NextResponse.json({ ok: false, error: err?.message || 'failed' }, { status: 500 })
    }
}

// 반품지 생성
// 반품지 생성
export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const creds = await prisma.coupangCredential.findFirst({ where: { userId, isActive: true } });
        if (!creds) return NextResponse.json({ error: 'NO_CREDENTIALS' }, { status: 400 });

        const keys: CoupangKeys = {
            accessKey: creds.accessKey,
            secretKey: creds.secretKey,
            vendorId: creds.vendorId,
            vendorUserId: creds.vendorUserId || creds.userId
        };

        const body = await req.json()
        console.info('[coupang-return-center-create-request]', body)

        const pathCreate = `${PATH_CREATE_PREFIX}/${keys.vendorId}/returnShippingCenters`
        const { datetime, authorization } = sign('POST', pathCreate, keys)

        const payload = {
            vendorId: keys.vendorId,
            userId: keys.vendorUserId || body.userId || '',
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
                'X-Requested-By': keys.vendorId
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
