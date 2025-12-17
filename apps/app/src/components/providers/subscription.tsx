"use client";

import { trpc } from "@/utils/trpc/client";
import { createContext, useContext } from "react";
import type { Plan, Subscription } from "@myapp/prisma";

const SubscriptionContext = createContext<
  | {
      subscription: (Subscription & { plan: Plan }) | null;
    }
  | undefined
>(undefined);

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [subscription] =
    trpc.subscriptionRouter.getSubscription.useSuspenseQuery(undefined, {
      retry: 0,
    });

  return (
    <SubscriptionContext.Provider value={{ subscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return context;
}

export function useSubscriptionPlan() {
  const { subscription } = useSubscription();

  return subscription?.plan;
}
