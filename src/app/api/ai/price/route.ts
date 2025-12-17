
import { NextResponse } from 'next/server';
import { generatePriceRecommendation } from '@/lib/openai';
import crawler from '../../../../../v6 3/crawler'; // Adjust path to v6 3/crawler.js

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { keyword, cost, shippingFee, feeRate = 10.8, adOnOff = false } = body;

        // 1. Crawl Competitor Prices (Coupang)
        // using crawler.crawlCoupang(keyword)
        // Note: This might take a few seconds.
        let marketPrices: number[] = [];
        try {
            console.log(`[AI Price] Crawling competitors for: ${keyword}`);
            const products = await crawler.crawlCoupang(keyword);
            // Extract prices and sort
            marketPrices = products
                .map((p: any) => p.price)
                .filter((p: number) => typeof p === 'number' && !isNaN(p))
                .sort((a: number, b: number) => a - b)
                .slice(0, 10); // Top 10 cheapest/relevant

            console.log(`[AI Price] Market prices:`, marketPrices);
        } catch (e) {
            console.warn('Competitor crawling failed, using empty list:', e);
        }

        // 2. Generate Candidate Prices (Simple Multipliers)
        // 1.2x to 2.5x of Cost
        const baseCost = Number(cost) + Number(shippingFee);
        const candidatePrices = [];
        for (let m = 1.2; m <= 2.5; m += 0.1) {
            // Round to nearest 100 won
            const price = Math.round((baseCost * m) / 100) * 100;
            candidatePrices.push(price);
        }

        // 3. Call AI
        const result = await generatePriceRecommendation({
            totalCost: Number(cost),
            feeRate: Number(feeRate),
            shippingCost: Number(shippingFee),
            adOnOff: Boolean(adOnOff),
            marketPrices,
            candidatePrices: Array.from(new Set(candidatePrices)) // unique
        });

        if (!result) {
            return NextResponse.json({ ok: false, error: 'AI Analysis Failed' }, { status: 500 });
        }

        return NextResponse.json({
            ok: true,
            data: {
                ...result,
                marketPrices // Return these so user can see them
            }
        });

    } catch (error: any) {
        console.error('AI Price API Error:', error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}
