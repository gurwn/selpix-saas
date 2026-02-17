import { NextRequest, NextResponse } from 'next/server';

const PROXY_URL = process.env.COUPANG_PROXY_URL;
const PROXY_KEY = process.env.COUPANG_PROXY_KEY || '';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { productLink, baseData } = body;

        if (!productLink) {
            return NextResponse.json({ success: false, message: 'Product Link is required' }, { status: 400 });
        }

        if (PROXY_URL) {
            const res = await fetch(`${PROXY_URL}/api/crawler/preview`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-proxy-key': PROXY_KEY,
                },
                body: JSON.stringify({ productLink, baseData }),
            });
            const json = await res.json();
            return NextResponse.json(json, { status: res.status });
        }

        // Direct mode (local dev)
        const { crawlerService } = await import('@/lib/services/crawler');
        console.log(`[Preview] Crawling Domeggook: ${productLink}`);
        const baseProduct = {
            name: 'Unknown',
            price: 0,
            imageUrl: null,
            site: 'domeggook',
            ...baseData,
            sourceUrl: productLink,
        };
        // @ts-ignore
        const enriched = await crawlerService.enrichDomeggookProduct(baseProduct);
        return NextResponse.json({ success: true, data: enriched });

    } catch (error: any) {
        console.error('Preview failed:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to preview product'
        }, { status: 500 });
    }
}
