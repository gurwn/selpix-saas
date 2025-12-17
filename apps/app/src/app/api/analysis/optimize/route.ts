import { NextResponse } from 'next/server';
import { aiService } from '@/lib/services/ai';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { productContext } = body;

        if (!productContext) {
            return NextResponse.json(
                { error: 'Product context is required' },
                { status: 400 }
            );
        }

        const result = await aiService.generateProductMetadata(productContext);

        if (!result) {
            return NextResponse.json(
                { error: 'Failed to generate metadata' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result,
        });

    } catch (error: any) {
        console.error('Optimize API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}
