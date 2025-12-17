"use client";

import { createContext, useContext, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@myapp/ui/components/dialog";
import { Loader2 } from "lucide-react";
import { trpc } from "@/utils/trpc/client";
import { toast } from "@myapp/ui/sonner";
import { useLocale, useTranslations } from "next-intl";
import { PlanChangeConfirmDialog } from "./PlanChangeConfirmDialog";
import { useSubscription } from "@/components/providers/subscription";
import { isEmptyStringOrNil } from "@myapp/utils";
import { PricingCard } from "@myapp/ui/components/pricing-card";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PlanSelectDialogContext = createContext<{ open: () => void }>({
  open: () => {},
});

export function usePlanSelectDialog() {
  const context = useContext(PlanSelectDialogContext);
  if (!context) {
    throw new Error(
      "usePlanSelectDialog must be used within a PlanSelectDialog"
    );
  }
  return context;
}

export function PlanSelectDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <PlanSelectDialogContext.Provider value={{ open: () => setOpen(true) }}>
      {children}
      <PlanSelectDialog open={open} onOpenChange={setOpen} />
    </PlanSelectDialogContext.Provider>
  );
}

export function PlanSelectDialog({ open, onOpenChange }: Props) {
  const t = useTranslations("PlanSelectDialog");
  const locale = useLocale();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // 현재 구독 정보 가져오기
  const { subscription } = useSubscription();

  // 사용 가능한 플랜 조회
  const { data: plans, isLoading: plansLoading } =
    trpc.subscriptionRouter.getPlans.useQuery();

  // tRPC mutation을 사용한 결제 체크아웃 생성
  const createCheckoutMutation =
    trpc.subscriptionRouter.createCheckout.useMutation({
      onSuccess: (data) => {
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else {
          toast.error(t("paymentUrlError"));
        }
      },
      onError: (error) => {
        console.error("체크아웃 생성 오류:", error);
        toast.error(error.message || t("subscriptionProcessError"));
      },
      onSettled: () => {
        setLoadingPlanId(null);
      },
    });

  // 구독 업데이트 mutation
  const updateSubscriptionMutation =
    trpc.subscriptionRouter.updateSubscriptionPlan.useMutation({
      onSuccess: () => {
        toast.success(t("updateSuccess"));
        // 페이지 새로고침하여 구독 정보 업데이트
        window.location.reload();
      },
      onError: (error) => {
        console.error("구독 업데이트 오류:", error);
        toast.error(error.message || t("updateError"));
      },
      onSettled: () => {
        setLoadingPlanId(null);
      },
    });

  const handleSubscribe = async (planId: string) => {
    // 이미 활성화된 구독이 있는 경우 확인 다이얼로그 표시
    if (subscription != null) {
      setSelectedPlanId(planId);
      setShowConfirmDialog(true);
    } else {
      // 새 구독 생성
      setLoadingPlanId(planId);
      createCheckoutMutation.mutate({
        planId,
        locale: locale as "ko" | "en",
      });
    }
  };

  const handleConfirmPlanChange = () => {
    if (!selectedPlanId) return;

    setLoadingPlanId(selectedPlanId);
    setShowConfirmDialog(false);

    updateSubscriptionMutation.mutate({
      planId: selectedPlanId,
    });
  };

  if (plansLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl">
          <div className="flex items-center justify-center min-h-[500px]">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // UI 데이터 변환: plans -> tiers
  const nameToId = new Map<string, string>();

  const tiers = (plans ?? []).map((plan) => {
    nameToId.set(plan.name, plan.id);
    const features = Array.isArray(plan.content)
      ? plan.content
          .map((f: unknown) =>
            isEmptyStringOrNil(String(f)) ? null : String(f)
          )
          .filter(Boolean)
          .map((key) => t(key as string))
      : [];
    return {
      name: plan.name,
      title: plan.title,
      price: { monthly: Number(plan.price) },
      description: plan.description ?? "",
      features,
      cta: t("tryVooster"),
      highlighted: false,
      popular: false,
    } as const;
  });

  // 현재/로딩 플랜 이름 계산이 필요 없으므로 제거

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-6xl !max-h-[95vh] overflow-y-auto p-0">
          <div className="p-8">
            <DialogHeader className="mb-8 text-center">
              <DialogTitle className="mb-6 text-4xl font-normal tracking-tight">
                {t("pricing")}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-6 mx-auto max-w-6xl w-fit sm:grid-cols-2 xl:grid-cols-3">
              {tiers.map((tier) => {
                const planId = nameToId.get(tier.name)!;
                const plan = plans?.find((p) => p.id === planId);
                const isLoading =
                  loadingPlanId === planId &&
                  (createCheckoutMutation.isPending ||
                    updateSubscriptionMutation.isPending);
                const isCurrent =
                  subscription != null && subscription.planId === planId;
                const ctaText = isLoading
                  ? t("processing")
                  : isCurrent
                    ? t("currentPlan")
                    : subscription != null && plan
                      ? Number(plan.price) > Number(subscription.plan.price)
                        ? t("upgradePlan")
                        : t("downgradePlan")
                      : t("tryVooster");

                return (
                  <PricingCard
                    key={tier.name}
                    tier={tier}
                    paymentFrequency="monthly"
                    onSelect={() => handleSubscribe(planId)}
                    disabled={isCurrent}
                    loading={isLoading}
                    ctaText={ctaText}
                  />
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 플랜 변경 확인 다이얼로그 */}
      {showConfirmDialog && selectedPlanId && subscription != null && plans && (
        <PlanChangeConfirmDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          onConfirm={handleConfirmPlanChange}
          currentPlan={{
            name: subscription.plan.name,
            price: Number(subscription.plan.price),
          }}
          newPlan={{
            name: plans.find((p) => p.id === selectedPlanId)?.name || "",
            price: Number(
              plans.find((p) => p.id === selectedPlanId)?.price || 0
            ),
          }}
          isLoading={updateSubscriptionMutation.isPending}
        />
      )}
    </>
  );
}
