"use client";

import { useTranslations, useLocale } from "next-intl";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@myapp/ui/components/card";
import { Button } from "@myapp/ui/components/button";
import { Badge } from "@myapp/ui/components/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@myapp/ui/components/table";
import { trpc } from "@/utils/trpc/client";
import { toast } from "@myapp/ui/sonner";
import { usePlanSelectDialog } from "./components/PlanSelectDialog";
import { useSubscription } from "@/components/providers/subscription";
import { formatDate } from "@/utils/dateFormat";

function formatUsd(amountInCents: number | null | undefined) {
  if (amountInCents == null) return "-";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amountInCents / 100);
  } catch {
    return `${amountInCents / 100} USD`;
  }
}

export function SubscriptionPage() {
  const t = useTranslations("SubscriptionPage");
  const locale = useLocale();

  // 현재 구독 정보는 Provider를 통해 suspense 쿼리로 가져옵니다.
  const { subscription } = useSubscription();

  // 결제 내역은 페이지에서 suspense 쿼리로 조회
  const [paymentHistories] =
    trpc.subscriptionRouter.getPaymentHistories.useSuspenseQuery();

  // 결제수단 변경 링크는 사용자 액션 시에만 요청
  const updatePaymentMethodQuery =
    trpc.subscriptionRouter.getUpdatePaymentMethodUrl.useQuery(undefined, {
      enabled: false,
      retry: 0,
    });

  // 구독 취소
  const utils = trpc.useUtils();
  const cancelMutation = trpc.subscriptionRouter.cancelSubscription.useMutation(
    {
      onSuccess: async () => {
        toast.success(t("toast.cancelSuccess"));
        await Promise.all([
          utils.subscriptionRouter.getSubscription.invalidate(),
          utils.subscriptionRouter.getPaymentHistories.invalidate(),
        ]);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }
  );

  const { open: openPlanDialog } = usePlanSelectDialog();

  const handleOpenPaymentMethodPortal = async () => {
    const { data } = await updatePaymentMethodQuery.refetch();
    if (data) {
      window.open(data, "_blank", "noopener,noreferrer");
    } else {
      toast.error(t("toast.openPaymentPortalError"));
    }
  };

  const handleCancelSubscription = () => {
    if (!subscription) return;
    const confirmed = window.confirm(t("actions.cancelConfirm"));
    if (!confirmed) return;
    cancelMutation.mutate({ subscriptionId: subscription.id });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t("title")}</h3>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      {/* 현재 구독 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>{t("current.title")}</CardTitle>
          <CardDescription>
            {subscription ? (
              <span className="inline-flex items-center gap-2">
                <span>{t("current.plan")}: </span>
                <span className="font-medium">{subscription.plan.title}</span>
                <span className="text-muted-foreground">
                  {t("current.pricePerMonth", {
                    price: subscription.plan.price.toNumber(),
                  })}
                </span>
              </span>
            ) : (
              t("current.noSubscription")
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <div className="text-sm text-muted-foreground">
                    {t("current.status")}
                  </div>
                  <div className="mt-1">
                    <Badge>{subscription.status}</Badge>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    {t("current.renewsAt")}
                  </div>
                  <div className="mt-1">
                    {subscription.renewsAt
                      ? formatDate(subscription.renewsAt, locale)
                      : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    {t("current.endsAt")}
                  </div>
                  <div className="mt-1">
                    {subscription.endsAt
                      ? formatDate(subscription.endsAt, locale)
                      : "-"}
                  </div>
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <div className="text-sm text-muted-foreground">
                    {t("current.paymentMethod")}
                  </div>
                  <div className="mt-1">
                    {subscription.cardBrand && subscription.cardLast4 ? (
                      <span>
                        {t("current.card", {
                          brand: subscription.cardBrand,
                          last4: subscription.cardLast4,
                        })}
                      </span>
                    ) : (
                      "-"
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={openPlanDialog}>
                  {t("actions.changePlan")}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleOpenPaymentMethodPortal}
                  disabled={!subscription}
                >
                  {t("actions.updatePaymentMethod")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelSubscription}
                  disabled={!subscription || cancelMutation.isPending}
                >
                  {t("actions.cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {t("current.noSubscription")}
              </div>
              <Button onClick={openPlanDialog}>
                {t("current.choosePlan")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 결제 내역 카드 */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("history.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentHistories.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                {t("history.empty")}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("history.columns.date")}</TableHead>
                    <TableHead>{t("history.columns.amount")}</TableHead>
                    <TableHead>{t("history.columns.status")}</TableHead>
                    <TableHead>{t("history.columns.invoice")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistories.map((ph) => (
                    <TableRow key={ph.id}>
                      <TableCell>
                        {formatDate(ph.createdAt as unknown as Date, locale)}
                      </TableCell>
                      <TableCell>{formatUsd(ph.totalUsd)}</TableCell>
                      <TableCell>
                        <Badge>{ph.statusFormatted || ph.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {ph.invoiceUrl ? (
                          <a
                            href={ph.invoiceUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="text-primary underline"
                          >
                            {t("history.viewInvoice")}
                          </a>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption />
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
