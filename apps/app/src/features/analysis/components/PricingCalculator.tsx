"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@myapp/ui/components/card";
import { Input } from "@myapp/ui/components/input";
import { Label } from "@myapp/ui/components/label";
import { Slider } from "@myapp/ui/components/slider";
import { Button } from "@myapp/ui/components/button";
import { Badge } from "@myapp/ui/components/badge";
import { Calculator, ArrowRight, RefreshCw, Save } from "lucide-react";
import { calculateProfit, calculateTargetPrice, PricingInput, PricingResult, generatePricingScenarios } from "../lib/pricing-calculator";
import { cn } from "@myapp/ui/lib/utils";
import { t } from "@/lib/i18n";

interface PricingCalculatorProps {
    initialCost: number;
    productInfo?: { title: string; image: string };
    onSave?: (result: any) => void;
}

export function PricingCalculator({ initialCost, onSave, productInfo }: PricingCalculatorProps) {
    const [input, setInput] = useState<PricingInput>({
        baseCost: initialCost,
        targetMarginRate: 25, // Default 25%
        platformFeeRate: 11, // Standard market fee
        shippingCost: 3000,
        extraCost: 500,
    });

    const [result, setResult] = useState<PricingResult | null>(null);
    const [customPrice, setCustomPrice] = useState<number>(0);
    const [realtimeStats, setRealtimeStats] = useState<any>(null);

    useEffect(() => {
        // Calculate Scenarios
        const scenarios = generatePricingScenarios(input);
        setResult(scenarios);

        // Initial custom price set to recommended
        if (customPrice === 0) {
            setCustomPrice(scenarios.recPrice);
        }
    }, [input]);

    useEffect(() => {
        // Calculate stats for the current Custom Selling Price
        if (customPrice > 0) {
            const stats = calculateProfit(customPrice, input);
            setRealtimeStats(stats);
        }
    }, [customPrice, input]);

    const handleInputChange = (field: keyof PricingInput, value: string) => {
        // Handle empty input as 0, but keep it editable
        const numVal = value === "" ? 0 : Number(value);
        setInput(prev => ({ ...prev, [field]: numVal }));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Input Form */}
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-primary" />
                        {t("analysis_section_input")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>{t("analysis_label_cost")}</Label>
                        <Input
                            type="number"
                            value={input.baseCost || ""}
                            onChange={(e) => handleInputChange("baseCost", e.target.value)}
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <Label>목표 마진율 (%)</Label>
                            <div className="relative w-20">
                                <Input
                                    type="number"
                                    className="h-8 text-right pr-6"
                                    value={input.targetMarginRate}
                                    onChange={(e) => handleInputChange("targetMarginRate", e.target.value)}
                                />
                                <span className="absolute right-2 top-2 text-xs text-muted-foreground">%</span>
                            </div>
                        </div>
                        <Slider
                            value={[input.targetMarginRate]}
                            max={60}
                            step={1}
                            onValueChange={(vals) => handleInputChange("targetMarginRate", String(vals[0]))}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>마켓 수수료 (%)</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={input.platformFeeRate}
                                    onChange={(e) => handleInputChange("platformFeeRate", e.target.value)}
                                />
                                <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">%</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>배송비 (원)</Label>
                            <Input
                                type="number"
                                value={input.shippingCost}
                                onChange={(e) => handleInputChange("shippingCost", e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>기타 비용 (포장 등)</Label>
                        <Input
                            type="number"
                            value={input.extraCost}
                            onChange={(e) => handleInputChange("extraCost", e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Right: Results & Simulation */}
            <div className="lg:col-span-2 space-y-6">
                {/* 1. Recommended Scenarios */}
                <Card className="bg-muted/30 border-dashed">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">AI 가격 제안</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-4 text-center">
                        <div className="space-y-1 opacity-70">
                            <p className="text-xs text-muted-foreground">최소 판매가</p>
                            <p className="text-lg font-bold">{result?.minPrice.toLocaleString()}원</p>
                            <Badge variant="outline" className="text-[10px]">마진 {Math.max(5, input.targetMarginRate - 10)}%</Badge>
                        </div>
                        <div className="space-y-1 scale-110 origin-top">
                            <p className="text-xs font-bold text-primary">권장 판매가</p>
                            <p className="text-xl font-bold text-primary">{result?.recPrice.toLocaleString()}원</p>
                            <Badge className="bg-primary text-[10px]">마진 {input.targetMarginRate}%</Badge>
                        </div>
                        <div className="space-y-1 opacity-70">
                            <p className="text-xs text-muted-foreground">최대 판매가</p>
                            <p className="text-lg font-bold">{result?.maxPrice.toLocaleString()}원</p>
                            <Badge variant="outline" className="text-[10px]">마진 {input.targetMarginRate + 15}%</Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Final Decision & Simulation */}
                <Card className="border-primary shadow-md">
                    <CardHeader>
                        <CardTitle>최종 판매가 결정</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Label className="text-lg whitespace-nowrap">판매가 입력:</Label>
                                <div className="relative flex-1 max-w-xs">
                                    <Input
                                        type="number"
                                        className="text-xl font-bold h-12 pr-8"
                                        value={customPrice}
                                        onChange={(e) => setCustomPrice(Number(e.target.value))}
                                    />
                                    <span className="absolute right-3 top-3.5 text-muted-foreground font-medium">원</span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setCustomPrice(result!.recPrice)}
                                    title="권장가로 리셋"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Realtime Analysis */}
                            {realtimeStats && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                                    <div className="text-center p-2 border-r last:border-0 border-dashed border-slate-200 dark:border-slate-800">
                                        <p className="text-xs text-muted-foreground mb-1">예상 순수익</p>
                                        <p className={cn("text-lg font-bold", realtimeStats.netProfit > 0 ? "text-green-600" : "text-red-600")}>
                                            {realtimeStats.netProfit.toLocaleString()}원
                                        </p>
                                    </div>
                                    <div className="text-center p-2 border-r last:border-0 border-dashed border-slate-200 dark:border-slate-800">
                                        <p className="text-xs text-muted-foreground mb-1">실제 마진율</p>
                                        <p className={cn("text-lg font-bold", realtimeStats.marginRate >= input.targetMarginRate ? "text-green-600" : "text-orange-500")}>
                                            {realtimeStats.marginRate}%
                                        </p>
                                    </div>
                                    <div className="text-center p-2 border-r last:border-0 border-dashed border-slate-200 dark:border-slate-800">
                                        <p className="text-xs text-muted-foreground mb-1">마켓 수수료</p>
                                        <p className="text-base font-medium text-slate-600 dark:text-slate-400">
                                            -{realtimeStats.feeAmount.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-center p-2">
                                        <p className="text-xs text-muted-foreground mb-1">손익분기</p>
                                        <p className="text-sm font-medium text-slate-500">
                                            {result?.breakEvenPrice.toLocaleString()}원 이상
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/20 flex justify-end gap-2">
                        <Button variant="ghost">초기화</Button>
                        <Button
                            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md border-0"
                            onClick={() => {
                                // Save locally/DB first (omitted for now)
                                if (onSave) onSave({ price: customPrice, stats: realtimeStats, input });

                                // Navigate to Publish Page
                                const params = new URLSearchParams({
                                    analysisId: "job-" + Date.now(), // Mock ID
                                    title: productInfo?.title || "데모 상품 (분석됨)",
                                    image: productInfo?.image || "/placeholder.jpg",
                                    price: customPrice.toString(),
                                    cost: input.baseCost.toString(),
                                    margin: (realtimeStats?.marginRate || 0).toString(),
                                });
                                window.location.href = `/publish/coupang?${params.toString()}`;
                            }}
                        >
                            <ArrowRight className="h-4 w-4" />
                            {t("analysis_action_save")}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
