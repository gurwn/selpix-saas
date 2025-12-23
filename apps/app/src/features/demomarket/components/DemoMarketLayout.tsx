"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { StubDemoMarketProvider } from "../lib/stub-provider";
import { ProductList } from "./ProductList";
import { ConnectionModal } from "./ConnectionModal";
import { Product } from "../lib/types";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { t } from "@/lib/i18n";

export function DemoMarketLayout() {
    const { userId, isLoaded } = useAuth();
    const router = useRouter();

    const [isConnected, setIsConnected] = useState<boolean | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    // Initial check
    useEffect(() => {
        if (!isLoaded || !userId) return;

        const checkConnection = async () => {
            const connected = await StubDemoMarketProvider.isConnected(userId);
            setIsConnected(connected);

            if (connected) {
                fetchProducts();
            }
        };

        checkConnection();
    }, [isLoaded, userId]);

    const fetchProducts = async () => {
        if (!userId) return;
        setIsLoadingProducts(true);
        try {
            const list = await StubDemoMarketProvider.listProducts(userId);
            setProducts(list);
        } finally {
            setIsLoadingProducts(false);
        }
    };

    const handleConnect = async () => {
        if (!userId) return;
        await StubDemoMarketProvider.connect(userId);
        setIsConnected(true);
        fetchProducts(); // Auto fetch after connect
    };

    const handleSelectProduct = (product: Product) => {
        // Navigate to analysis page with query params
        // Format: /analysis?jobId=stub-job-{id}&channel=demomarket
        const stubJobId = `job-${Date.now()}-${product.id}`;
        router.push(`/analysis?jobId=${stubJobId}&channel=demomarket&productId=${product.id}`);
    };

    // Loading State
    if (!isLoaded || isConnected === null) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Not Connected -> Show Modal (Page content behind can be blurred or empty)
    if (!isConnected) {
        return (
            <div className="container py-8 relative min-h-[50vh]">
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10" />
                <ConnectionModal open={true} onConnect={handleConnect} />
                {/* Fake background content for visual context */}
                <div className="opacity-20 pointer-events-none">
                    <ProductList products={[]} isLoading={true} onSelect={() => { }} />
                </div>
            </div>
        );
    }

    // Connected -> Show Product List
    return (
        <div className="container py-8 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{t("demomarket_title")}</h1>
                <p className="text-muted-foreground">
                    {t("demomarket_desc")}
                </p>
            </div>

            <ProductList
                products={products}
                isLoading={isLoadingProducts}
                onSelect={handleSelectProduct}
            />
        </div>
    );
}
