"use client";

import { Button } from "@myapp/ui/components/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@myapp/ui/components/dialog";
import { Store, CheckCircle2, ArrowRight } from "lucide-react";
import { useState } from "react";

interface ConnectionModalProps {
    open: boolean;
    onConnect: () => Promise<void>;
}

export function ConnectionModal({ open, onConnect }: ConnectionModalProps) {
    const [isConnecting, setIsConnecting] = useState(false);

    const handleConnect = async () => {
        setIsConnecting(true);
        try {
            await onConnect();
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="items-center text-center space-y-4 pt-4">
                    <div className="h-16 w-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-2">
                        <Store className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <DialogTitle className="text-xl">데모마켓 연동하기</DialogTitle>
                    <DialogDescription className="text-center max-w-[80%] mx-auto">
                        데모마켓은 실제 판매 데이터를 시뮬레이션할 수 있는 가상의 도매처입니다. 연동하여 소싱 연습을 시작해보세요.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-3">
                    <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg border">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                        <div className="text-sm">
                            <p className="font-medium">20개의 추천 상품 제공</p>
                            <p className="text-muted-foreground text-xs">고수익/고마진 상품 데이터 포함</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg border">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                        <div className="text-sm">
                            <p className="font-medium">안전한 시뮬레이션</p>
                            <p className="text-muted-foreground text-xs">실제 마켓에 영향을 주지 않습니다</p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-col gap-2">
                    <Button
                        className="w-full gap-2"
                        size="lg"
                        onClick={handleConnect}
                        disabled={isConnecting}
                    >
                        {isConnecting ? "연동 중..." : "동의하고 데모마켓 연결하기"}
                        {!isConnecting && <ArrowRight className="h-4 w-4" />}
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground mt-2">
                        * 본 데이터는 학습 및 테스트 목적으로 제공됩니다.
                    </p>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
