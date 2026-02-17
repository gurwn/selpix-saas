import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export const runtime = 'nodejs'

const PROXY_URL = process.env.COUPANG_PROXY_URL
const PROXY_KEY = process.env.COUPANG_PROXY_KEY || ''

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (PROXY_URL) {
            const res = await fetch(`${PROXY_URL}/api/coupang/shipping-places`, {
                method: 'GET',
                headers: { 'x-proxy-key': PROXY_KEY, 'x-user-id': userId },
            });
            const json = await res.json();
            return NextResponse.json(json, { status: res.status });
        }

        // Direct mode (local dev)
        const crypto = await import('crypto');
        const { prisma } = await import('@myapp/prisma');

        const creds = await prisma.coupangCredential.findFirst({ where: { userId, isActive: true } });
        if (!creds) return NextResponse.json({ error: 'NO_CREDENTIALS' }, { status: 400 });

        const keys = {
            accessKey: creds.accessKey,
            secretKey: creds.secretKey,
            vendorId: creds.vendorId,
            vendorUserId: creds.vendorUserId || creds.userId
        };

        const BASE_URL = 'https://api-gateway.coupang.com'
        const PATH = '/v2/providers/marketplace_openapi/apis/api/v2/vendor/shipping-place/outbound'
        const query = 'pageNum=1&pageSize=50'

        const d = new Date()
        const pad = (n: number) => n.toString().padStart(2, '0')
        const datetime = d.getUTCFullYear().toString().slice(-2) + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z'
        const message = `${datetime}GET${PATH}${query}`
        const signature = crypto.createHmac('sha256', keys.secretKey).update(message, 'utf-8').digest('hex')
        const authorization = `CEA algorithm=HmacSHA256, access-key=${keys.accessKey}, signed-date=${datetime}, signature=${signature}`

        const res = await fetch(`${BASE_URL}${PATH}?${query}`, {
            method: 'GET',
            headers: { Authorization: authorization, 'X-Coupang-Date': datetime, 'X-Requested-By': keys.vendorId },
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
            return NextResponse.json({ ok: false, status: res.status, coupang: json }, { status: res.status })
        }
        return NextResponse.json({ ok: true, coupang: json })
    } catch (err: any) {
        console.error('[coupang-shipping-places-exception]', err)
        return NextResponse.json({ ok: false, error: err?.message || 'failed' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (PROXY_URL) {
            const body = await req.json();
            const res = await fetch(`${PROXY_URL}/api/coupang/shipping-places`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-proxy-key': PROXY_KEY,
                    'x-user-id': userId,
                },
                body: JSON.stringify(body),
            });
            const json = await res.json();
            return NextResponse.json(json, { status: res.status });
        }

        // Direct mode (local dev)
        const crypto = await import('crypto');
        const { prisma } = await import('@myapp/prisma');

        const creds = await prisma.coupangCredential.findFirst({ where: { userId, isActive: true } });
        if (!creds) return NextResponse.json({ error: 'NO_CREDENTIALS' }, { status: 400 });

        const keys = {
            accessKey: creds.accessKey,
            secretKey: creds.secretKey,
            vendorId: creds.vendorId,
            vendorUserId: creds.vendorUserId || creds.userId
        };

        const body = await req.json()
        const BASE_URL = 'https://api-gateway.coupang.com'
        const PATH_CREATE_PREFIX = '/v2/providers/openapi/apis/api/v5/vendors'
        const pathCreate = `${PATH_CREATE_PREFIX}/${keys.vendorId}/outboundShippingCenters`

        const d = new Date()
        const pad = (n: number) => n.toString().padStart(2, '0')
        const datetime = d.getUTCFullYear().toString().slice(-2) + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z'
        const message = `${datetime}POST${pathCreate}`
        const signature = crypto.createHmac('sha256', keys.secretKey).update(message, 'utf-8').digest('hex')
        const authorization = `CEA algorithm=HmacSHA256, access-key=${keys.accessKey}, signed-date=${datetime}, signature=${signature}`

        let placeAddresses = body.placeAddresses || []
        if ((!placeAddresses || placeAddresses.length === 0) && body.supplierAddress) {
            placeAddresses = [{
                addressType: body.addressType || 'ROADNAME',
                countryCode: 'KR',
                companyContactNumber: body.companyContactNumber || body.supplierContact || '',
                phoneNumber2: body.phoneNumber2 || '',
                returnZipCode: body.returnZipCode || body.supplierZipCode || '',
                returnAddress: body.returnAddress || body.supplierAddress || '',
                returnAddressDetail: body.returnAddressDetail || body.supplierAddressDetail || '',
            }]
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
            return NextResponse.json({ ok: false, status: res.status, coupang: json }, { status: res.status })
        }
        return NextResponse.json({ ok: true, coupang: json })
    } catch (err: any) {
        console.error('[coupang-shipping-places-exception]', err)
        return NextResponse.json({ ok: false, error: err?.message || 'failed' }, { status: 500 })
    }
}
