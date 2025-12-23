"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@myapp/ui/components/card";
import { Brain, Filter, ArrowRight } from "lucide-react";
import { cn } from "@myapp/ui/lib/utils";

export function AIAnalysisStatus({ className, size = "medium" }: { className?: string, size?: "small" | "medium" | "large" }) {
    if (size === "small") {
        return (
            <Card className={cn("h-full w-full flex flex-col justify-center items-center overflow-hidden p-2", className)}>
                <Brain className="h-6 w-6 text-purple-500 mb-2" />
                <div className="text-center">
                    <p className="text-2xl font-bold">124</p>
                    <p className="text-[10px] text-muted-foreground">대기 중</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className={cn("h-full w-full flex flex-col overflow-hidden", className)}>
            <CardHeader className="pb-2 shrink-0">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-500" />
                    AI 분석
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">대기 중</span>
                    <span className="font-mono font-medium">124</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">처리 중</span>
                    <span className="font-mono font-medium text-purple-600 animate-pulse">분석 중...</span>
                </div>

                {size === "large" && (
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2 mt-2 border border-purple-100 dark:border-purple-900/20 flex-1">
                        <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400">
                            <Filter className="h-3 w-3" />
                            주요 반려 사유
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                                <span>마진 부족 (&lt;15%)</span>
                                <span className="text-muted-foreground">84건</span>
                            </div>
                            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                                <div className="bg-red-400 h-full w-[70%]" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                                <span>경쟁 과열</span>
                                <span className="text-muted-foreground">22건</span>
                            </div>
                            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                                <div className="bg-orange-400 h-full w-[25%]" />
                            </div>
                        </div>
                    </div>
                )}

                {size === "large" && (
                    <button className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 w-full justify-end mt-2">
                        분석 로그 보기 <ArrowRight className="h-3 w-3" />
                    </button>
                )}
            </CardContent>
        </Card>
    );
}
