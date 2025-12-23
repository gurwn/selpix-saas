import { NextRequest, NextResponse } from 'next/server';
import { crawlerService } from '@/lib/services/crawler';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { productLink, baseData } = body;

        if (!productLink) {
            return NextResponse.json({ success: false, message: 'Product Link is required' }, { status: 400 });
        }

        console.log(`[Preview] Crawling Domeggook: ${productLink}`);

        // Base object for enrichment - mix defaults with provided baseData
        const baseProduct = {
            name: 'Unknown',
            price: 0,
            imageUrl: null,
            site: 'domeggook',
            ...baseData, // Use provided data (e.g. shippingCost, price from search result)
            sourceUrl: productLink,
        };

        // Enrich product details
        // @ts-ignore
        const enriched = await crawlerService.enrichDomeggookProduct(baseProduct);

        return NextResponse.json({
            success: true,
            data: enriched
        });

    } catch (error: any) {
        console.error('Preview failed:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to preview product'
        }, { status: 500 });
    }
}
