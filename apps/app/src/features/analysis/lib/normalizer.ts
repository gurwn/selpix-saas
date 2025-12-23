import { Product } from "@/features/demomarket/lib/types";

export interface AnalysisContext {
    sourceId: string;
    channel: string;
    title: string;
    imageUrl: string;
    baseCost: number;
    category: string;
    marketCode: string;
    originalData: any;
}

/**
 * Normalizes generic product data from different sources into a standard AnalysisContext
 */
export function normalizeProduct(data: any, channel: string): AnalysisContext {
    // Demo Market Stub Data
    if (channel === "demomarket") {
        const product = data as Product;
        // Estimate base cost from price and random margin if not provided
        // In this mock, we assume 'price' is the wholesale price (baseCost) for the seller?
        // OR 'price' is the selling price? 
        // Let's assume 'price' in Product list is the COST (supply price) for sourcing context.
        return {
            sourceId: product.id,
            channel: "demomarket",
            title: product.title,
            imageUrl: product.image,
            baseCost: product.price, // Treating stub price as supply cost
            category: product.category,
            marketCode: product.market_code,
            originalData: product,
        };
    }

    // Default Fallback
    return {
        sourceId: data?.id || "unknown",
        channel: channel || "manual",
        title: data?.title || "Unknown Product",
        imageUrl: data?.image || "/placeholder.jpg",
        baseCost: data?.price || 0,
        category: "Uncategorized",
        marketCode: "ETC",
        originalData: data,
    };
}
