"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@myapp/ui/components/card";
import { Progress } from "@myapp/ui/components/progress";
import { Store, AlertCircle, ChevronsRight } from "lucide-react";
import { cn } from "@myapp/ui/lib/utils";
import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import { MockCoupangService } from "../../publish/lib/coupang-service";

export function RegistrationPipeline({ className, size = "medium" }: { className?: string, size?: "small" | "medium" | "large" }) {
    const [stats, setStats] = useState({ totalRegistered: 0, todayCount: 0, totalFailed: 0, dailyLimit: 500 });

    useEffect(() => {
        MockCoupangService.getStats().then(setStats);
    }, []);

    const limitPercent = Math.min(100, (stats.todayCount / stats.dailyLimit) * 100).toFixed(1);

    if (size === "small") {
        // Small: Just the progress percentage/count
        return (
            <Card className={cn("h-full w-full flex flex-col justify-center items-center overflow-hidden p-2", className)}>
                <Store className="h-6 w-6 text-orange-500 mb-2" />
                <div className="text-center">
                    <p className="text-2xl font-bold">{limitPercent}%</p>
                    <p className="text-[10px] text-muted-foreground">{t("widget_pipeline_limit_usage")}</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className={cn("h-full w-full flex flex-col overflow-hidden", className)}>
            <CardHeader className="pb-2 shrink-0">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Store className="h-4 w-4 text-orange-500" />
                    {t("widget_pipeline_title")}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col min-h-0">

                {/* Progress Bar - Always Visible in Medium/Large */}
                <div className="space-y-1.5 shrink-0">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{t("widget_pipeline_limit_usage")}</span>
                        <span className="text-foreground font-medium">{stats.todayCount} / {stats.dailyLimit}</span>
                    </div>
                    <Progress value={Number(limitPercent)} className="h-2" />
                </div>

                {/* Status List - Condensed in Medium, Full in Large */}
                <div className="space-y-2 flex-1 min-h-0 overflow-hidden">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
                            <span>{t("widget_pipeline_registering")}</span>
                        </div>
                        <span className="font-mono">0건</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            <span>{t("widget_pipeline_registered")}</span>
                        </div>
                        <span className="font-mono">{stats.totalRegistered}건</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-red-500">
                            <div className="h-2 w-2 rounded-full bg-red-500" />
                            <span>{t("widget_pipeline_failed")}</span>
                        </div>
                        <span className="font-mono text-red-500 font-bold">{stats.totalFailed}건</span>
                    </div>
                </div>

                {/* Failure Insights - Only visible in Large */}
                {size === "large" && (
                    <div className="rounded-md border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900/30 p-3 mt-auto shrink-0">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                            <div className="space-y-1 flex-1">
                                <p className="text-xs font-semibold text-red-700 dark:text-red-400">조치 필요</p>
                                <p className="text-xs text-red-600/80 dark:text-red-400/80">
                                    2건: 카테고리 필수 속성 누락<br />
                                    1건: 이미지 해상도 미달
                                </p>
                                <button className="text-xs font-medium text-red-700 hover:underline flex items-center gap-1 mt-1">
                                    {t("action_retry")} <ChevronsRight className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
