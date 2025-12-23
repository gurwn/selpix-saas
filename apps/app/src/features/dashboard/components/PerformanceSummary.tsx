"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@myapp/ui/components/card";
import { Zap, Clock, TrendingUp } from "lucide-react";
import { cn } from "@myapp/ui/lib/utils";
import { useEffect, useState } from "react";
import { MockCoupangService } from "../../publish/lib/coupang-service";

export function PerformanceSummary({ className }: { className?: string }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        MockCoupangService.getStats().then(stats => setCount(stats.totalRegistered));
    }, []);

    const timeSavedHours = (count * 15 / 60).toFixed(1); // 15 mins per product
    const efficiency = 12 + (count * 0.5); // Mock efficiency gain

    return (
        <Card className={cn("bg-primary/5 border-primary/20 h-full w-full flex flex-col overflow-hidden", className)}>
            <CardHeader className="pb-2 shrink-0">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    가치 실현
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col justify-center min-h-0">

                <div className="flex items-center gap-4">
                    <div className="p-2 bg-background rounded-full border shadow-sm">
                        <Clock className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{timeSavedHours}시간</p>
                        <p className="text-xs text-muted-foreground">절약 시간 (건당 15분)</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="p-2 bg-background rounded-full border shadow-sm">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">+{efficiency.toFixed(0)}%</p>
                        <p className="text-xs text-muted-foreground">업로드 효율</p>
                    </div>
                </div>

                <p className="text-xs text-muted-foreground text-center pt-2 border-t border-primary/10 mt-auto">
                    수동 운영 대비 (건당 평균 5분 기준)
                </p>

            </CardContent>
        </Card>
    );
}
