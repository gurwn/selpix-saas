"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@myapp/ui/components/card";
import { Badge } from "@myapp/ui/components/badge";
import { CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@myapp/ui/lib/utils";

export function SourcingStatus({ className, size = "medium" }: { className?: string, size?: "small" | "medium" | "large" }) {
    if (size === "small") {
        return (
            <Card className={cn("h-full w-full flex flex-col justify-center items-center overflow-hidden p-2", className)}>
                <RefreshCw className="h-6 w-6 text-muted-foreground animate-spin-slow mb-1" />
                <p className="text-xl font-bold">3<span className="text-xs font-normal text-muted-foreground ml-1">채널</span></p>
            </Card>
        );
    }

    return (
        <Card className={cn("h-full w-full flex flex-col overflow-hidden", className)}>
            <CardHeader className="pb-2 shrink-0">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                    수집 채널
                    <RefreshCw className="h-3 w-3 text-muted-foreground animate-spin-slow" />
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 flex-1 overflow-y-auto pr-1 min-h-0">
                {/* Domaggu */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full dark:bg-blue-900/40 shrink-0">
                            <span className="text-blue-600 dark:text-blue-400 font-bold text-xs">도</span>
                        </div>
                        <div className="space-y-0.5 min-w-0">
                            <p className="text-sm font-medium leading-none truncate">도매꾹</p>
                            <p className="text-xs text-muted-foreground truncate">연결됨 • 자동수집 ON</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="border-green-500 text-green-500 gap-1 shrink-0">
                        <CheckCircle className="h-3 w-3" /> OK
                    </Badge>
                </div>

                {/* Demo Market */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-full dark:bg-purple-900/40 shrink-0">
                            <span className="text-purple-600 dark:text-purple-400 font-bold text-xs">데</span>
                        </div>
                        <div className="space-y-0.5 min-w-0">
                            <p className="text-sm font-medium leading-none truncate">데모마켓</p>
                            <p className="text-xs text-muted-foreground truncate">데이터 연동됨</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="border-green-500 text-green-500 gap-1 shrink-0">
                        <CheckCircle className="h-3 w-3" /> OK
                    </Badge>
                </div>

                {/* Taobao */}
                <div className="flex items-center justify-between opacity-70">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-full dark:bg-orange-900/40 shrink-0">
                            <span className="text-orange-600 dark:text-orange-400 font-bold text-xs">16</span>
                        </div>
                        <div className="space-y-0.5 min-w-0">
                            <p className="text-sm font-medium leading-none truncate">1688 / 타오바오</p>
                            <p className="text-xs text-muted-foreground truncate">로그인 필요</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="border-yellow-500 text-yellow-500 gap-1 hover:bg-yellow-50 cursor-pointer shrink-0">
                        <AlertTriangle className="h-3 w-3" /> 연결
                    </Badge>
                </div>

                {size === "large" && (
                    <div className="pt-2 text-xs text-muted-foreground border-t mt-auto">
                        최근 수집: 5분 전 (248건)
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
