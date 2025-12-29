"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@myapp/ui/components/dialog";
import { PreOrderForm } from "@/components/pre-order-form";
import { useTranslations } from "next-intl";

interface PreOrderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PreOrderDialog({ open, onOpenChange }: PreOrderDialogProps) {
    // const t = useTranslations("common"); // Assuming we'll add translations later if needed

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl">사전예약 신청</DialogTitle>
                    <DialogDescription>
                        서비스 출시 알림을 가장 먼저 받아보세요.
                    </DialogDescription>
                </DialogHeader>
                <PreOrderForm onSuccess={() => onOpenChange(false)} />
            </DialogContent>
        </Dialog>
    );
}
