import { NextResponse } from 'next/server';
import { crawlerService } from '@/lib/services/crawler';
import { prisma } from '@myapp/prisma';
import { auth } from '@clerk/nextjs/server';

export const maxDuration = 60; // Set max duration for crawling (Vercel limit/Timeouts)

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { keyword, minPrice, maxPrice } = body;

        if (!keyword) {
            return NextResponse.json(
                { error: 'Keyword is required' },
                { status: 400 }
            );
        }

        // 1. Crawl data
        const products = await crawlerService.crawlAllSites(keyword);

        // 2. Save to Database (Transaction)
        const { userId } = await auth(); // Get logged-in user ID

        // Check if group exists or create new
        const savedGroup = await prisma.$transaction(async (tx) => {
            const group = await tx.wholesaleGroup.create({
                data: {
                    keyword,
                    userId, // Save User ID
                },
            });

            if (products.length > 0) {
                await tx.wholesaleProduct.createMany({
                    data: products.map((p) => ({
                        wholesaleGroupId: group.id,
                        name: p.name,
                        price: p.price,
                        source: p.site,
                        rating: 0, // Default as crawler doesn't extract rating yet
                        minOrder: p.minOrderQuantity || 1,
                        url: p.sourceUrl || '',
                    })),
                });
            }

            return group;
        });

        return NextResponse.json({
            success: true,
            groupId: savedGroup.id,
            count: products.length,
            products: products,
        });

    } catch (error: any) {
        console.error('Search API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}
