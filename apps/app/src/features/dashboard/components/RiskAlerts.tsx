"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@myapp/ui/components/card";
import { Badge } from "@myapp/ui/components/badge";
import { AlertOctagon, Key, DollarSign } from "lucide-react";
import { Button } from "@myapp/ui/components/button";
import { cn } from "@myapp/ui/lib/utils";

export function RiskAlerts({ className }: { className?: string }) {
    return (
        <Card className={cn("border-red-200 shadow-sm dark:border-red-900/50 h-full w-full flex flex-col overflow-hidden", className)}>
            <CardHeader className="pb-3 bg-red-50/50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-900/30 shrink-0">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertOctagon className="h-4 w-4" />
                    리스크 및 알림
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto min-h-0">
                <div className="divide-y">
                    {/* Risk Item 1 */}
                    <div className="p-4 flex gap-3 items-start hover:bg-muted/50 transition-colors">
                        <div className="mt-1 p-1 bg-red-100 rounded-md text-red-600 dark:bg-red-900/40 dark:text-red-400">
                            <Key className="h-4 w-4" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-start">
                                <p className="text-sm font-medium">쿠팡 API 만료 임박</p>
                                <Badge variant="outline" className="text-[10px] border-red-200 text-red-600">긴급</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">API 키가 2일 뒤 만료됩니다. 중단을 방지하려면 갱신하세요.</p>
                            <Button variant="link" className="h-auto p-0 text-xs text-red-600">키 갱신하기</Button>
                        </div>
                    </div>

                    {/* Risk Item 2 */}
                    <div className="p-4 flex gap-3 items-start hover:bg-muted/50 transition-colors">
                        <div className="mt-1 p-1 bg-yellow-100 rounded-md text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400">
                            <DollarSign className="h-4 w-4" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-start">
                                <p className="text-sm font-medium">마진 경고</p>
                            </div>
                            <p className="text-xs text-muted-foreground">최근 소싱 원가 상승으로 15개 제품의 마진이 10% 미만으로 떨어졌습니다.</p>
                            <Button variant="link" className="h-auto p-0 text-xs text-yellow-600">가격 검토하기</Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
