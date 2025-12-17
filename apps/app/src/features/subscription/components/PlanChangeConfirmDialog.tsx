"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@myapp/ui/components/dialog";
import { Button } from "@myapp/ui/components/button";
import { AlertCircle, Calendar, CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  currentPlan: {
    name: string;
    price: number;
  };
  newPlan: {
    name: string;
    price: number;
  };
  isLoading?: boolean;
}

export function PlanChangeConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  currentPlan,
  newPlan,
  isLoading = false,
}: Props) {
  const t = useTranslations("PlanChangeConfirmDialog");

  const isUpgrade = newPlan.price > currentPlan.price;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex gap-2 items-center">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            {isUpgrade ? t("upgradeTitle") : t("downgradeTitle")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("dialogDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* 플랜 변경 정보 */}
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
              <div>
                <p className="text-sm text-slate-600">{t("currentPlan")}</p>
                <p className="font-medium">{currentPlan.name}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{currentPlan.price}</p>
                <p className="text-sm text-slate-600">{t("perMonth")}</p>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="text-slate-400">↓</div>
            </div>

            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <p className="text-sm text-blue-600">{t("newPlan")}</p>
                <p className="font-medium">{newPlan.name}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-blue-600">{newPlan.price}</p>
                <p className="text-sm text-blue-600">{t("perMonth")}</p>
              </div>
            </div>
          </div>

          {/* 과금 정책 설명 */}
          <div className="pt-4 space-y-4 border-t">
            <h4 className="flex gap-2 items-center font-medium">
              <CreditCard className="w-4 h-4" />
              {t("billingPolicyTitle")}
            </h4>

            {isUpgrade ? (
              <div className="space-y-3 text-sm">
                <div className="flex gap-3 items-start">
                  <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                    <Calendar className="w-3 h-3 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">
                      {t("immediateCharge")}
                    </p>
                    <p className="mt-1 text-slate-600">
                      {t("immediateChargeDesc")}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-800">
                    <span className="font-medium">{t("proration")}</span>{" "}
                    {t("prorationDesc")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex gap-3 items-start">
                  <div className="rounded-full bg-green-100 p-1 mt-0.5">
                    <Calendar className="w-3 h-3 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">
                      {t("nextBillingCycle")}
                    </p>
                    <p className="mt-1 text-slate-600">
                      {t("nextBillingCycleDesc")}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800">
                    <span className="font-medium">{t("creditNote")}</span>{" "}
                    {t("creditNoteDesc")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? t("processing") : t("confirmChange")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
