import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const PROXY_URL = process.env.COUPANG_PROXY_URL;
const PROXY_KEY = process.env.COUPANG_PROXY_KEY || '';

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        if (PROXY_URL) {
            // Forward to proxy server
            const res = await fetch(`${PROXY_URL}/api/coupang/centers`, {
                method: 'GET',
                headers: {
                    'x-proxy-key': PROXY_KEY,
                    'x-user-id': userId,
                },
            });
            const json = await res.json();
            return NextResponse.json(json, { status: res.status });
        }

        // Direct mode (local dev) - original logic
        const { CoupangService } = await import('@/lib/services/coupang');
        const { prisma } = await import('@myapp/prisma');
        const creds = await prisma.coupangCredential.findFirst({
            where: { userId, isActive: true }
        });
        if (!creds) {
            return NextResponse.json({ success: false, error: 'No Coupang credentials found' }, { status: 400 });
        }
        const coupangService = new CoupangService({
            accessKey: creds.accessKey,
            secretKey: creds.secretKey,
            vendorId: creds.vendorId,
            userId: creds.vendorUserId || creds.userId
        });
        const [outbound, returnCenters] = await Promise.all([
            coupangService.getOutboundShippingCenters(),
            coupangService.getReturnShippingCenters()
        ]);
        return NextResponse.json({
            success: true,
            data: {
                outbound: outbound.content || [],
                return: returnCenters.content || []
            }
        });
    } catch (error: any) {
        console.error('Failed to fetch shipping centers:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch shipping centers', details: error.message },
            { status: 500 }
        );
    }
}
