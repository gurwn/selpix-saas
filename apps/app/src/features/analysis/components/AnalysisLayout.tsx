"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@myapp/ui/components/button";
import { PricingCalculator } from "./PricingCalculator";
import { normalizeProduct, AnalysisContext } from "../lib/normalizer";
import { StubDemoMarketProvider } from "@/features/demomarket/lib/stub-provider";
import { Badge } from "@myapp/ui/components/badge";
import Link from "next/link";
import Image from "next/image";

export function AnalysisLayout() {
    const searchParams = useSearchParams();
    const jobId = searchParams.get("jobId");
    const channel = searchParams.get("channel") || "unknown";
    const productId = searchParams.get("productId");

    const [context, setContext] = useState<AnalysisContext | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Determine source provider based on channel
                if (channel === "demomarket" && productId) {
                    const products = await StubDemoMarketProvider.listProducts("dummy-user");
                    const raw = products.find(p => p.id === productId);
                    if (raw) {
                        setContext(normalizeProduct(raw, channel));
                    }
                }
                // Add more channels here
            } catch (e) {
                console.error("Failed to load analysis data", e);
            } finally {
                setLoading(false);
            }
        };

        if (jobId) {
            loadData();
        }
    }, [jobId, channel, productId]);

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">상품 데이터를 분석하고 있습니다...</p>
            </div>
        );
    }

    if (!context) {
        return (
            <div className="container py-10 text-center">
                <h2 className="text-lg font-bold mb-2">데이터를 찾을 수 없습니다</h2>
                <Button variant="outline" asChild>
                    <Link href="/dashboard">대시보드로 돌아가기</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="container py-8 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/${channel === 'demomarket' ? 'demomarket' : 'dashboard'}`}>
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{context.marketCode} 마켓</Badge>
                        <span className="text-xs text-muted-foreground font-mono">{jobId}</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">AI 소싱 분석 및 가격 설정</h1>
                </div>
            </div>

            {/* Product Summary */}
            <div className="bg-card border rounded-lg p-6 flex items-start gap-6 shadow-sm">
                <div className="relative h-24 w-24 rounded-md overflow-hidden bg-muted border shrink-0">
                    <Image
                        src={context.imageUrl}
                        alt={context.title}
                        fill
                        className="object-cover"
                        unoptimized
                    />
                </div>
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold">{context.title}</h2>
                    <p className="text-sm text-muted-foreground">카테고리: {context.category}</p>
                    <p className="text-sm">
                        공급 원가: <span className="font-bold">{context.baseCost.toLocaleString()}원</span>
                    </p>
                </div>
            </div>

            {/* Calculator */}
            <PricingCalculator
                initialCost={context.baseCost}
                productInfo={{ title: context.title, image: context.imageUrl }}
                onSave={(data) => {
                    console.log("Saving Analysis Result:", data);
                }}
            />
        </div>
    );
}
