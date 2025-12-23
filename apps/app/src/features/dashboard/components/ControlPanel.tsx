"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@myapp/ui/components/card";
import { Switch } from "@myapp/ui/components/switch";
import { Label } from "@myapp/ui/components/label";
import { Slider } from "@myapp/ui/components/slider";
import { Settings2 } from "lucide-react";
import { cn } from "@myapp/ui/lib/utils";

export function ControlPanel({ className }: { className?: string }) {
    return (
        <Card className={cn("h-full w-full flex flex-col overflow-hidden", className)}>
            <CardHeader className="pb-3 border-b shrink-0">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Settings2 className="h-4 w-4 text-muted-foreground" />
                        제어 패널
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 flex-1 overflow-y-auto min-h-0">

                {/* Master Switch */}
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="text-base">마스터 스위치</Label>
                        <p className="text-xs text-muted-foreground">모든 파이프라인 활동 활성화/비활성화</p>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-green-500" />
                </div>

                {/* Auto Sourcing */}
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label>자동 소싱</Label>
                        <p className="text-xs text-muted-foreground">신규 상품 자동 수집</p>
                    </div>
                    <Switch defaultChecked />
                </div>

                {/* Min Margin Slider */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label>최소 마진율</Label>
                        <span className="text-sm font-mono text-muted-foreground">15%</span>
                    </div>
                    <Slider defaultValue={[15]} max={50} step={1} className="w-full" />
                    <p className="text-xs text-muted-foreground">
                        마진 15% 미만 상품은 AI가 자동으로 반려합니다.
                    </p>
                </div>

                {/* Daily Limit */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label>일일 업로드 제한</Label>
                        <span className="text-sm font-mono text-muted-foreground">500</span>
                    </div>
                    <Slider defaultValue={[500]} max={1000} step={50} className="w-full" />
                </div>

            </CardContent>
        </Card>
    );
}
