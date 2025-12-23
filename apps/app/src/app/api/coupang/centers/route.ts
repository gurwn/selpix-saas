import { NextResponse } from 'next/server';
import { CoupangService } from '@/lib/services/coupang';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@myapp/prisma';

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

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

        // Fetch centers in parallel
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
