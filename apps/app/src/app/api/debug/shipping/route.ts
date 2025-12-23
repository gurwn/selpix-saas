import { NextResponse } from 'next/server';
import { CoupangService } from '@/lib/services/coupang';

export async function GET() {
    try {
        const coupangService = new CoupangService();

        // Fetch raw data
        // We access the private config/makeRequest via the public methods for now, 
        // but since we need raw data, we might need to instantialte the service and rely on its logging or modify it temporarily.
        // Actually, let's just use the existing methods and inspect what they return, 
        // OR better yet, let's create a specialized 'debug' method in this route by copying the fetch logic 
        // to ensure we see exactly what's happening without modifying the service yet.

        const vendorId = process.env.COUPANG_VENDOR_ID;
        const accessKey = process.env.COUPANG_ACCESS_KEY;
        const secretKey = process.env.COUPANG_SECRET_KEY;

        if (!vendorId || !accessKey || !secretKey) {
            return NextResponse.json({ error: 'Missing Credentials' }, { status: 500 });
        }

        // Re-instantiate locally to access 'makeRequest' like logic effectively (or just use the service but catch the null)
        // Let's modify the service to be more verbose OR just implement a raw fetch here.
        // Implementing raw fetch here is safest to avoid breaking the service for the user during debug.

        const service = new CoupangService();
        const outbound = await service.getOutboundShippingCenter();
        const inbound = await service.getReturnShippingCenter();

        return NextResponse.json({
            outboundResult: outbound,
            inboundResult: inbound,
            // If these are null, it means the service caught an error or found empty list.
            // Let's rely on the logs I added to the service previously, or checking if it returns null.
        });

    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
