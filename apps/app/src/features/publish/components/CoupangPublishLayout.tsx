"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@myapp/ui/components/card";
import { Button } from "@myapp/ui/components/button";
import { Badge } from "@myapp/ui/components/badge";
import { Loader2, CheckCircle2, ShoppingBag, ArrowRight, AlertCircle, ExternalLink } from "lucide-react";
import { MockCoupangService, CoupangRegistrationPayload, CoupangRegistrationResult } from "../lib/coupang-service";
import Link from "next/link";
import Image from "next/image";

export function CoupangPublishLayout() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const analysisId = searchParams.get("analysisId") || "unknown";
    const title = searchParams.get("title") || "상품명 없음";
    const price = Number(searchParams.get("price") || 0);
    const cost = Number(searchParams.get("cost") || 0);
    const margin = Number(searchParams.get("margin") || 0);
    const imageUrl = searchParams.get("image") || "/placeholder.jpg";

    const [status, setStatus] = useState<"idle" | "checking" | "registering" | "success" | "error">("checking");
    const [result, setResult] = useState<CoupangRegistrationResult | null>(null);

    // Check if already registered
    useEffect(() => {
        const check = async () => {
            if (analysisId === "unknown") {
                setStatus("idle");
                return;
            }
            const existing = await MockCoupangService.checkPublishedStatus(analysisId);
            if (existing && existing.success) {
                setResult(existing);
                setStatus("success");
            } else {
                setStatus("idle");
            }
        };
        check();
    }, [analysisId]);

    const handleRegister = async () => {
        setStatus("registering");

        const payload: CoupangRegistrationPayload = {
            analysisId,
            title,
            price,
            originalPrice: cost * 1.5, // Mock consumer price
            marginRate: margin,
            images: [imageUrl],
        };

        try {
            const res = await MockCoupangService.registerProduct(payload);
            setResult(res);
            if (res.success) {
                setStatus("success");
            } else {
                setStatus("error");
            }
        } catch (e) {
            console.error(e);
            setStatus("error");
        }
    };

    if (status === "checking") {
        return (
            <div className="h-[50vh] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="container py-10 max-w-3xl">
            <div className="mb-8 text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">쿠팡 상품 등록</h1>
                <p className="text-muted-foreground">분석된 데이터를 바탕으로 쿠팡에 상품을 즉시 등록합니다.</p>
            </div>

            <Card className="overflow-hidden border-2 border-primary/10">
                {/* Product Preview */}
                <div className="bg-muted/30 p-6 flex flex-col md:flex-row gap-6 items-center md:items-start border-b">
                    <div className="relative h-40 w-40 rounded-lg overflow-hidden border bg-white shadow-sm shrink-0">
                        <Image
                            src={imageUrl}
                            alt={title}
                            fill
                            className="object-cover"
                            unoptimized
                        />
                    </div>
                    <div className="space-y-3 text-center md:text-left flex-1">
                        <Badge variant="outline" className="mb-1">등록 대기중</Badge>
                        <h2 className="text-xl font-bold leading-tight">{title}</h2>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="bg-background p-3 rounded border">
                                <p className="text-xs text-muted-foreground">판매가</p>
                                <p className="text-lg font-bold text-primary">{price.toLocaleString()}원</p>
                            </div>
                            <div className="bg-background p-3 rounded border">
                                <p className="text-xs text-muted-foreground">예상 마진</p>
                                <p className="text-lg font-bold text-green-600">{margin}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                <CardContent className="p-8">
                    {status === "idle" && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-4 rounded-lg flex gap-3 text-sm">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <div>
                                    <p className="font-semibold">등록 전 확인해주세요</p>
                                    <p className="opacity-90">상품명과 이미지가 쿠팡 가이드라인을 준수하는지 자동으로 확인했습니다. '1-Click 등록' 버튼을 누르면 즉시 판매가 시작됩니다.</p>
                                </div>
                            </div>

                            <Button size="lg" className="w-full text-lg h-14 gap-2 shadow-lg shadow-primary/20" onClick={handleRegister}>
                                <ShoppingBag className="h-5 w-5" />
                                1-Click 상품 등록하기
                            </Button>
                        </div>
                    )}

                    {status === "registering" && (
                        <div className="py-10 flex flex-col items-center justify-center gap-4 animate-in fade-in zoom-in duration-300">
                            <div className="relative">
                                <div className="h-16 w-16 rounded-full border-4 border-muted" />
                                <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-lg font-bold">쿠팡에 등록 중입니다...</p>
                                <p className="text-sm text-muted-foreground">이미지 업로드 및 옵션 생성 중</p>
                            </div>
                        </div>
                    )}

                    {status === "success" && result && (
                        <div className="py-6 flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in duration-500">
                            <div className="h-20 w-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="h-10 w-10" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-2xl font-bold">등록이 완료되었습니다!</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto">
                                    상품 ID: <span className="font-mono text-foreground">{result.productId}</span><br />
                                    이제 쿠팡 판매자 센터에서 상품을 관리할 수 있습니다.
                                </p>
                            </div>

                            <div className="flex gap-3 w-full max-w-md">
                                <Button variant="outline" className="flex-1" asChild>
                                    <Link href="/dashboard">{t("action_go_dashboard")}</Link>
                                </Button>
                                <Button className="flex-1 gap-2" asChild>
                                    <a href={result.productLink} target="_blank" rel="noreferrer">
                                        상품 보러가기 <ExternalLink className="h-4 w-4" />
                                    </a>
                                </Button>
                            </div>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="py-8 text-center space-y-4">
                            <div className="text-red-500 font-bold text-lg">등록에 실패했습니다.</div>
                            <p className="text-muted-foreground">{result?.message || "알 수 없는 오류가 발생했습니다."}</p>
                            <Button onClick={() => setStatus("idle")}>다시 시도하기</Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
