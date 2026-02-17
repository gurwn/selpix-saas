import { NextResponse } from 'next/server';

const PROXY_URL = process.env.COUPANG_PROXY_URL;
const PROXY_KEY = process.env.COUPANG_PROXY_KEY || '';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get('keyword');

    if (!keyword) {
        return NextResponse.json({ success: false, message: 'Keyword is required' }, { status: 400 });
    }

    try {
        if (PROXY_URL) {
            const res = await fetch(`${PROXY_URL}/api/crawler/top?keyword=${encodeURIComponent(keyword)}`, {
                method: 'GET',
                headers: { 'x-proxy-key': PROXY_KEY },
            });
            const json = await res.json();
            return NextResponse.json(json, { status: res.status });
        }

        // Direct mode (local dev)
        const { crawlerService } = await import('@/lib/services/crawler');
        const products = await crawlerService.crawlDomeggook(keyword);
        return NextResponse.json({ success: true, data: products });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
