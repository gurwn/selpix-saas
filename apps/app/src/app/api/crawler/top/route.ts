
import { NextResponse } from 'next/server';
import { crawlerService } from '@/lib/services/crawler';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get('keyword');

    if (!keyword) {
        return NextResponse.json({ success: false, message: 'Keyword is required' }, { status: 400 });
    }

    try {
        const products = await crawlerService.crawlDomeggook(keyword);
        return NextResponse.json({ success: true, data: products });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
