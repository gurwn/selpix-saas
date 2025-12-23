
/**
 * Real Service for Coupang Integration
 * Connects to /api/coupang/register
 */

export interface CoupangRegistrationPayload {
    analysisId: string;
    title: string;
    price: number;
    originalPrice: number;
    marginRate: number;
    images: string[];
    options?: any[];
    // Add other fields as necessary from the legacy implementation if needed by the UI
    [key: string]: any;
}

export interface CoupangRegistrationResult {
    success: boolean;
    productId?: string;
    productLink?: string;
    message?: string;
    timestamp: string;
    error?: any;
}

const STORAGE_KEY_PREFIX = "selpix:coupang:published:";

export const MockCoupangService = {
    /**
     * Checks if a product (by analysisId) has already been published locally.
     * Kept for local state tracking even with real API.
     */
    async checkPublishedStatus(analysisId: string): Promise<CoupangRegistrationResult | null> {
        if (typeof window === "undefined") return null;

        const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${analysisId}`);
        if (stored) {
            return JSON.parse(stored) as CoupangRegistrationResult;
        }
        return null;
    },

    /**
     * Registers product to Coupang via Next.js API Route.
     */
    async registerProduct(payload: CoupangRegistrationPayload): Promise<CoupangRegistrationResult> {
        console.log("Registering to Coupang via API:", payload);

        try {
            const response = await fetch('/api/coupang/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Registration failed');
            }

            const result: CoupangRegistrationResult = {
                success: true,
                productId: data.data?.data?.sellerProductId || `unknown-${Date.now()}`, // Adjust based on actual Coupang response structure
                productLink: `https://www.coupang.com/vp/products/${data.data?.data?.sellerProductId || ''}`,
                message: "상품이 성공적으로 등록되었습니다.",
                timestamp: new Date().toISOString(),
            };

            // Save result for idempotency
            if (typeof window !== "undefined") {
                localStorage.setItem(`${STORAGE_KEY_PREFIX}${payload.analysisId}`, JSON.stringify(result));
            }
            return result;

        } catch (error: any) {
            console.error("Coupang Registration Failed:", error);
            return {
                success: false,
                message: error.message || "API 호출 실패",
                timestamp: new Date().toISOString(),
                error: error
            };
        }
    },

    /**
     * Retrieves all registered products from local storage.
     */
    async getRegisteredProducts(): Promise<CoupangRegistrationResult[]> {
        if (typeof window === "undefined") return [];

        const products: CoupangRegistrationResult[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
                const item = localStorage.getItem(key);
                if (item) {
                    try {
                        products.push(JSON.parse(item));
                    } catch (e) {
                        console.error("Failed to parse stored product", e);
                    }
                }
            }
        }
        return products.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },

    /**
     * Retrieves statistics.
     */
    async getStats() {
        const products = await this.getRegisteredProducts();
        const successCount = products.filter(p => p.success).length;
        const failCount = products.filter(p => !p.success).length;

        // In a real app, we might fetch these stats from the server too.
        return {
            totalRegistered: successCount,
            totalFailed: failCount,
            todayCount: successCount,
            dailyLimit: 500
        };
    }
};
