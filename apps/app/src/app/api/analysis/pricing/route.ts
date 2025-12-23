import { NextResponse } from 'next/server';
import { aiService } from '@/lib/services/ai';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        // Validate required fields
        if (!body.totalCost) {
            return NextResponse.json(
                { error: 'totalCost is required' },
                { status: 400 }
            );
        }

        const result = await aiService.generatePriceRecommendation({
            totalCost: body.totalCost,
            feeRate: body.feeRate || 10.8, // Default Coupang fee
            shippingCost: body.shippingCost || 3000,
            adOnOff: body.adOnOff || false,
            marketPrices: body.marketPrices || [],
            candidatePrices: body.candidatePrices || [],
            unitCount: body.unitCount || 1 // Pass Unit Count
        });

        if (!result) {
            return NextResponse.json(
                { error: 'Failed to generate price recommendation' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result,
        });

    } catch (error: any) {
        console.error('Pricing API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}
