"use client";

import { PlanSelectDialogProvider } from "@/features/subscription/components/PlanSelectDialog";
import { SubscriptionProvider } from "@/components/providers/subscription";
import { UserProvider } from "@/components/providers/user";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <SubscriptionProvider>
        <PlanSelectDialogProvider>{children}</PlanSelectDialogProvider>
      </SubscriptionProvider>
    </UserProvider>
  );
}
