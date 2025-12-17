import { prisma, SubscriptionStatus } from "@myapp/prisma";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import z from "zod";
import { TRPCError } from "@trpc/server";
import {
  cancelLemonSqueezySubscription,
  createLemonSqueezyCheckout,
  getLemonSqueezySubscription,
  updateLemonSqueezySubscription,
} from "../utils/lemonsqueezy";

export const subscriptionRouter = createTRPCRouter({
  createCheckout: protectedProcedure
    .input(
      z.object({
        planId: z.string(),
        locale: z.enum(["ko", "en"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findUnique({
        where: { id: ctx.user.id },
        include: { subscription: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const { subscription } = user;

      if (
        subscription != null &&
        (subscription.status === SubscriptionStatus.ACTIVE ||
          subscription.status === SubscriptionStatus.CANCELLED)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User already has a active subscription",
        });
      }

      // 플랜 정보 조회
      const plan = await prisma.plan.findUnique({
        where: { id: input.planId },
      });

      if (!plan || !plan.available) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Selected plan is not available",
        });
      }

      // 사용자 이메일 정보 조회 (Clerk에서)
      const userEmail = ctx.user.email;
      if (!userEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User email not found",
        });
      }

      // LemonSqueezy 체크아웃 생성 (유틸리티 함수 사용)
      return await createLemonSqueezyCheckout({
        email: userEmail,
        username: ctx.user.username,
        userId: ctx.user.id,
        locale: input.locale,
        planLemonSqueezyVariantId: plan.lemonSqueezyVariantId,
      });
    }),

  getPlans: protectedProcedure.query(async () => {
    return await prisma.plan.findMany({
      where: { available: true },
      orderBy: { price: "asc" },
    });
  }),

  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: ctx.user.id },
      include: { plan: true },
    });

    if (
      subscription?.status !== SubscriptionStatus.ACTIVE &&
      subscription?.status !== SubscriptionStatus.CANCELLED
    ) {
      return null;
    }

    return subscription;
  }),

  getPaymentHistories: protectedProcedure.query(async ({ ctx }) => {
    return await prisma.paymentHistory.findMany({
      where: { userId: ctx.user.id },
    });
  }),

  // 구독 취소
  cancelSubscription: protectedProcedure
    .input(z.object({ subscriptionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 조직 소유권 확인
      const user = await prisma.user.findUnique({
        where: { id: ctx.user.id },
        include: { subscription: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (!user.subscription || user.subscription.id !== input.subscriptionId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription not found",
        });
      }

      if (user.subscription.status !== SubscriptionStatus.ACTIVE) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "활성화된 구독만 취소할 수 있습니다.",
        });
      }

      await cancelLemonSqueezySubscription(user.subscription.lemonSqueezyId);

      return { success: true };
    }),

  getUpdatePaymentMethodUrl: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.user.id },
      include: { subscription: true },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    if (!user.subscription) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Subscription not found",
      });
    }

    const lemonSqueezySubscription = await getLemonSqueezySubscription(
      user.subscription.lemonSqueezyId
    );

    const updatePaymentMethodUrl =
      lemonSqueezySubscription.data?.attributes?.urls?.update_payment_method;

    if (!updatePaymentMethodUrl) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Update payment method url not found",
      });
    }

    return updatePaymentMethodUrl;
  }),
  updateSubscriptionPlan: protectedProcedure
    .input(
      z.object({
        planId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findUnique({
        where: { id: ctx.user.id },
        include: { subscription: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (!user.subscription) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription not found",
        });
      }

      const plan = await prisma.plan.findUnique({
        where: { id: input.planId },
      });

      if (!plan || !plan.available) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plan not found",
        });
      }

      await updateLemonSqueezySubscription({
        lemonSqueezyId: user.subscription.lemonSqueezyId,
        variantId: plan.lemonSqueezyVariantId,
      });

      return { success: true };
    }),
});
