"use client";

import { Activity, AlertOctagon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@myapp/ui/components/card";
import { Badge } from "@myapp/ui/components/badge";
import { cn } from "@myapp/ui/lib/utils";
import { useEffect, useState } from "react";
import { MockCoupangService } from "../../publish/lib/coupang-service";

import { t } from "@/lib/i18n";

export function AutomationStatusSummary({ className, size = "medium" }: { className?: string, size?: "small" | "medium" | "large" }) {
    const [stats, setStats] = useState({ totalRegistered: 0, todayCount: 0, totalFailed: 0, dailyLimit: 500 });

    useEffect(() => {
        MockCoupangService.getStats().then(setStats);
    }, []);

    const collectedCount = 248; // Mock value for now
    const analyzedCount = 186; // Mock value for now

    if (size === "small") {
        return (
            <Card className={cn("bg-gradient-to-br from-background to-muted/20 h-full w-full flex flex-col justify-center items-center overflow-hidden", className)}>
                <div className="text-center">
                    <Activity className="h-6 w-6 text-green-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold">248</p>
                    <p className="text-[10px] text-muted-foreground">{t("widget_automation_collected")}</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className={cn("bg-gradient-to-br from-background to-muted/20 h-full w-full flex flex-col overflow-hidden", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 shrink-0">
                <CardTitle className="text-sm font-medium">{t("widget_automation_title")}</CardTitle>
                <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                    <Activity className="mr-1 h-3 w-3" />
                    정상
                </Badge>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between min-h-0">
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-1">
                        <p className="text-2xl font-bold flex items-center justify-center gap-2">
                            <span className="text-blue-500">248</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{t("widget_automation_collected")}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-2xl font-bold flex items-center justify-center gap-2">
                            <span className="text-purple-500">186</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{t("widget_automation_analyzed")}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-2xl font-bold flex items-center justify-center gap-2">
                            <span className="text-green-500">{stats.totalRegistered}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{t("widget_automation_registered")}</p>
                    </div>
                </div>
                {size !== "large" && (
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
                        <div className="flex items-center text-red-500 font-medium">
                            <AlertOctagon className="mr-1 h-3 w-3" />
                            {t("widget_automation_failed", { count: stats.totalFailed })}
                        </div>
                        <div>최근 업데이트: 방금 전</div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
