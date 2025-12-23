
import { NextResponse } from 'next/server';
import { crawlerService } from '@/lib/services/crawler';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get('keyword') || '양말';
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 1;

    try {
        console.log(`[Debug] Crawling keyword: ${keyword}`);
        const results = await crawlerService.crawlDomeggook(keyword);

        const enrichedResults = [];
        for (const product of results.slice(0, limit)) {
            if (product.sourceUrl) {
                console.log(`[Debug] Enriching: ${product.sourceUrl}`);
                const enriched = await crawlerService.enrichDomeggookProduct(product);
                enrichedResults.push(enriched);
            }
        }

        return NextResponse.json({
            success: true,
            originalCount: results.length,
            rawFirst: results.length > 0 ? results[0] : null,
            enriched: enrichedResults
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
