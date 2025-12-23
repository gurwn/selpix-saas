import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@myapp/prisma'
import { auth } from '@clerk/nextjs/server'

export const runtime = 'nodejs'

const BASE_URL = 'https://api-gateway.coupang.com'
// 쿠팡 공식 엔드포인트 (Marketplace OpenAPI V2 - List)
const PATH = '/v2/providers/marketplace_openapi/apis/api/v2/vendor/shipping-place/outbound'
// 출고지 생성 경로 prefix
const PATH_CREATE_PREFIX = '/v2/providers/openapi/apis/api/v5/vendors'

// const accessKey = ... (Removed global constants)
// const secretKey = ...

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
    const message = `${datetime}${method}${path}${query}` // Query MUST be included in signature
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

        const query = 'pageNum=1&pageSize=50'
        const { datetime, authorization } = sign('GET', PATH, keys, query)
        const res = await fetch(`${BASE_URL}${PATH}?${query}`, {
            method: 'GET',
            headers: {
                Authorization: authorization,
                'X-Coupang-Date': datetime,
                'X-Requested-By': keys.vendorId
            },
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
            console.error('[coupang-shipping-places-error]', res.status, json)
            return NextResponse.json({ ok: false, status: res.status, coupang: json }, { status: res.status })
        }
        return NextResponse.json({ ok: true, coupang: json })
    } catch (err: any) {
        console.error('[coupang-shipping-places-exception]', err)
        return NextResponse.json({ ok: false, error: err?.message || 'failed' }, { status: 500 })
    }
}

// 출고지 생성
// 출고지 생성
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
        console.info('[coupang-shipping-place-create-request]', body)

        const pathCreate = `${PATH_CREATE_PREFIX}/${keys.vendorId}/outboundShippingCenters`
        const { datetime, authorization } = sign('POST', pathCreate, keys)

        // 크롤링된 공급사 정보로 자동 매핑 (placeAddresses가 없을 때만)
        let placeAddresses = body.placeAddresses || []
        if ((!placeAddresses || placeAddresses.length === 0) && body.supplierAddress) {
            placeAddresses = [
                {
                    addressType: body.addressType || 'ROADNAME',
                    countryCode: 'KR',
                    companyContactNumber: body.companyContactNumber || body.supplierContact || '',
                    phoneNumber2: body.phoneNumber2 || '',
                    returnZipCode: body.returnZipCode || body.supplierZipCode || '',
                    returnAddress: body.returnAddress || body.supplierAddress || '',
                    returnAddressDetail: body.returnAddressDetail || body.supplierAddressDetail || '',
                },
            ]
        }

        const payload = {
            vendorId: keys.vendorId,
            userId: keys.vendorUserId || body.userId || '',
            shippingPlaceName: body.shippingPlaceName || '출고지',
            usable: body.usable !== undefined ? body.usable : true,
            global: body.global !== undefined ? body.global : false,
            placeAddresses,
            remoteInfos: body.remoteInfos || [],
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
            console.error('[coupang-shipping-place-create-error]', res.status, json)
            return NextResponse.json({ ok: false, status: res.status, coupang: json }, { status: res.status })
        }

        return NextResponse.json({ ok: true, coupang: json })
    } catch (err: any) {
        console.error('[coupang-shipping-place-create-exception]', err)
        return NextResponse.json({ ok: false, error: err?.message || 'failed' }, { status: 500 })
    }
}
