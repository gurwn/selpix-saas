import { DemoMarketProvider, Product } from "./types";

// Stub Data: 20 static products
const STUB_PRODUCTS: Product[] = Array.from({ length: 20 }).map((_, i) => ({
    id: `dm-prod-${i + 1}`,
    title: `[데모] 고수익 보장 상품 예시 ${i + 1}호`,
    price: 10000 + i * 500,
    image: "https://placehold.co/400x400/png?text=Product", // Placeholder
    margin: 25 + (i % 10),
    market_code: "DEMO",
    category: "생활/건강",
}));

const STORAGE_KEY_PREFIX = "selpix:demomarket:connected:";

export const StubDemoMarketProvider: DemoMarketProvider = {
    async isConnected(userId: string): Promise<boolean> {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Check localStorage (client-side persistence for stub)
        // In real implementation, this would query Supabase 'profile_integrations'
        if (typeof window !== "undefined") {
            return localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`) === "true";
        }
        return false;
    },

    async connect(userId: string): Promise<void> {
        await new Promise((resolve) => setTimeout(resolve, 800));
        if (typeof window !== "undefined") {
            localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, "true");
        }
    },

    async listProducts(userId: string): Promise<Product[]> {
        await new Promise((resolve) => setTimeout(resolve, 600));
        return STUB_PRODUCTS;
    },
};
