import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "./_remote";
import {
  prisma,
  SubscriptionStatus,
  SubscriptionPaymentMethod,
  PaymentStatus,
} from "@myapp/prisma";
import { assert, cuid2 } from "@myapp/utils";
import { LemonSubscriptionEvent, LemonInvoiceEvent } from "./_type";
import { isPlanChanged, safeString } from "./_util";

// Allow webhook responses up to 30 seconds
export const maxDuration = 30;

async function handleSubscriptionEvent({
  id,
  attributes,
  meta,
}: LemonSubscriptionEvent) {
  const { status, variant_id, customer_id, order_id, product_id } = attributes;

  assert(!!meta.custom_data, "custom_data가 존재하지 않습니다.");
  assert(!!attributes, "attributes가 존재하지 않습니다.");

  const { user_id } = meta.custom_data;

  // @TODO(warms1995): 임시 조치 ( 은행결제하면 어떻게 들어오는지 모름 )
  const paymentMethod =
    attributes.payment_processor === "stripe"
      ? SubscriptionPaymentMethod.CARD
      : attributes.payment_processor === "paypal"
        ? SubscriptionPaymentMethod.PAYPAL
        : SubscriptionPaymentMethod.BANK_TRANSFER;

  switch (meta.event_name) {
    case "subscription_created": {
      // 트랜잭션으로 subscription 생성
      await prisma.$transaction(async (tx) => {
        // 1. User 확인
        const user = await tx.user.findUnique({
          where: { id: user_id },
          include: { subscription: true },
        });
        assert(user != null, "User not found");

        const plan = await tx.plan.findFirst({
          where: {
            lemonSqueezyVariantId: String(variant_id),
            available: true,
          },
        });

        assert(plan != null, "Plan not found: " + variant_id);

        // 이미 구독이 있는지 확인
        if (
          user.subscription?.status === SubscriptionStatus.ACTIVE ||
          user.subscription?.status === SubscriptionStatus.CANCELLED
        ) {
          throw new Error("Active subscription already exists");
        }

        // EXPIRED 구독이 있는 경우 삭제
        if (user.subscription?.status === SubscriptionStatus.EXPIRED) {
          await tx.subscription.delete({
            where: { id: user.subscription.id },
          });
          console.log(`기존 EXPIRED 구독 삭제: ${user.subscription.id}`);
        }

        // 2. Subscription create
        const newSubscription = await tx.subscription.create({
          data: {
            id: `subs_${cuid2()}`,
            userId: user_id,
            planId: plan.id,
            lemonSqueezyId: id,
            lemonCustomerId: safeString(customer_id) || "",
            lemonOrderId: safeString(order_id) || "",
            lemonProductId: safeString(product_id) || "",
            lemonVariantId: safeString(variant_id) || "",
            status: mapLemonSqueezyStatus(status),
            renewsAt: attributes.renews_at
              ? new Date(attributes.renews_at)
              : null,
            endsAt: attributes.ends_at
              ? new Date(attributes.ends_at)
              : attributes.renews_at
                ? new Date(attributes.renews_at)
                : null,
            paymentMethod,
            cardBrand: attributes.card_brand ?? "",
            cardLast4: attributes.card_last_four ?? "",
          },
        });

        console.log(
          `구독이 성공적으로 생성되었습니다: ${id} - for user(${user_id})`
        );
      });
      break;
    }

    case "subscription_updated": {
      console.log("구독 업데이트 처리 시작:", id, "상태:", status);

      await prisma.$transaction(async (tx) => {
        // 1. 구독 조회
        const subscription = await tx.subscription.findUnique({
          where: { lemonSqueezyId: id },
          include: { plan: true },
        });

        if (!subscription) {
          console.error(`구독을 찾을 수 없습니다: ${id}`);
          return;
        }

        // Variant ID가 변경되었는지 확인 (플랜 변경 감지)
        const variantChanged = isPlanChanged(
          subscription.lemonVariantId,
          variant_id
        );

        let newPlan = subscription.plan;
        if (variantChanged) {
          // 새로운 플랜 조회
          const foundPlan = await tx.plan.findFirst({
            where: {
              lemonSqueezyVariantId: String(variant_id),
              available: true,
            },
          });

          if (foundPlan) {
            newPlan = foundPlan;
            console.log(
              `플랜 변경 감지: ${subscription.plan.name} -> ${foundPlan.name}`
            );
          }
        }

        // 2. 구독 정보 업데이트
        const updateData: any = {
          status: mapLemonSqueezyStatus(status),
          renewsAt: attributes.renews_at
            ? new Date(attributes.renews_at)
            : null,
          endsAt: attributes.ends_at ? new Date(attributes.ends_at) : null,
          cardBrand: attributes.card_brand ?? subscription.cardBrand,
          cardLast4: attributes.card_last_four ?? subscription.cardLast4,
        };

        // 플랜이 변경된 경우 추가 필드 업데이트
        if (variantChanged && newPlan) {
          updateData.planId = newPlan.id;
          updateData.lemonVariantId = safeString(variant_id) || "";
          updateData.lemonProductId = safeString(product_id) || "";
        }

        await tx.subscription.update({
          where: { id: subscription.id },
          data: updateData,
        });

        console.log(
          `구독 업데이트 완료: Subscription ${subscription.id}, 새 상태: ${status} ${
            variantChanged
              ? `, 플랜 변경: ${subscription.plan.name} -> ${newPlan?.name}`
              : ""
          }`
        );
      });
      break;
    }

    case "subscription_cancelled": {
      console.log("구독 취소 처리 시작:", id);

      await prisma.$transaction(async (tx) => {
        // 1. 구독 조회
        const subscription = await tx.subscription.findUnique({
          where: { lemonSqueezyId: id },
        });

        if (!subscription) {
          console.error(`구독을 찾을 수 없습니다: ${id}`);
          return;
        }

        // 2. 구독 상태를 CANCELLED로 업데이트
        // 주의: 취소되어도 ends_at까지는 계속 사용 가능
        await tx.subscription.update({
          where: { id: subscription.id },
          data: {
            status: SubscriptionStatus.CANCELLED,
            endsAt: attributes.ends_at ? new Date(attributes.ends_at) : null,
          },
        });

        console.log(
          `구독 취소 처리 완료: Subscription ${subscription.id}, 만료 예정일: ${attributes.ends_at}`
        );
      });
      break;
    }

    case "subscription_resumed": {
      console.log("구독 재개 처리 시작:", id);

      await prisma.$transaction(async (tx) => {
        // 1. 구독 조회
        const subscription = await tx.subscription.findUnique({
          where: { lemonSqueezyId: id },
          include: {
            plan: true,
          },
        });

        if (!subscription) {
          console.error(`구독을 찾을 수 없습니다: ${id}`);
          return;
        }

        // 2. 구독 상태를 ACTIVE로 업데이트
        await tx.subscription.update({
          where: { id: subscription.id },
          data: {
            status: SubscriptionStatus.ACTIVE,
            renewsAt: attributes.renews_at
              ? new Date(attributes.renews_at)
              : null,
            endsAt: null, // 재개되었으므로 종료일 제거
          },
        });

        console.log(`구독 재개 처리 완료: Subscription ${subscription.id}`);
      });
      break;
    }

    case "subscription_expired": {
      console.log("구독 만료 처리 시작:", id);

      await prisma.$transaction(async (tx) => {
        // 1. 구독 조회
        const subscription = await tx.subscription.findUnique({
          where: { lemonSqueezyId: id },
          include: { plan: true, user: true },
        });

        if (!subscription) {
          console.error(`구독을 찾을 수 없습니다: ${id}`);
          return;
        }

        // 2. 구독 상태를 EXPIRED로 업데이트
        await tx.subscription.update({
          where: { id: subscription.id },
          data: {
            status: SubscriptionStatus.EXPIRED,
            endsAt: new Date(),
          },
        });

        console.log(
          `구독 만료 처리 완료: Subscription ${subscription.id}, User: ${subscription.user.username}`
        );
      });
      break;
    }

    case "subscription_renewed": {
      console.log("구독 갱신 처리 시작:", id);

      await prisma.$transaction(async (tx) => {
        // 1. 구독 정보 조회
        const subscription = await tx.subscription.findUnique({
          where: { lemonSqueezyId: id },
          include: { plan: true },
        });

        if (!subscription) {
          console.error(`구독을 찾을 수 없습니다: ${id}`);
          return;
        }

        // 2. 구독 상태 업데이트 (갱신 날짜 업데이트)
        await tx.subscription.update({
          where: { id: subscription.id },
          data: {
            status: SubscriptionStatus.ACTIVE,
            renewsAt: attributes.renews_at
              ? new Date(attributes.renews_at)
              : null,
          },
        });

        console.log(`구독 갱신 처리 완료: Subscription ${subscription.id}`);
      });
      break;
    }

    default: {
      console.log("알 수 없는 구독 이벤트:", meta.event_name);
      throw new Error("알 수 없는 구독 이벤트: " + meta.event_name);
    }
  }
}

// LemonSqueezy 상태를 우리 DB enum으로 매핑
function mapLemonSqueezyStatus(lemonStatus: string): SubscriptionStatus {
  const statusMap: Record<string, SubscriptionStatus> = {
    active: SubscriptionStatus.ACTIVE,
    cancelled: SubscriptionStatus.CANCELLED,
    expired: SubscriptionStatus.EXPIRED,
    unpaid: SubscriptionStatus.UNPAID,
    past_due: SubscriptionStatus.PAST_DUE,
  };

  return statusMap[lemonStatus] || SubscriptionStatus.ACTIVE;
}

// 결제 이벤트 처리 함수 (구독 인보이스)
async function handleInvoiceEvent({ id, attributes, meta }: LemonInvoiceEvent) {
  const {
    subscription_id,
    customer_id,
    user_email,
    billing_reason,
    status,
    status_formatted,
    currency,
    currency_rate,
    subtotal,
    discount_total,
    tax,
    tax_inclusive,
    total,
    refunded_amount,
    subtotal_usd,
    discount_total_usd,
    tax_usd,
    total_usd,
    refunded_amount_usd,
    card_brand,
    card_last_four,
    urls,
    test_mode,
    refunded_at,
  } = attributes;

  // custom_data가 없으면 처리하지 않음
  if (!meta.custom_data) {
    console.error("Invoice event missing custom_data:", id, {
      event_name: meta.event_name,
      subscription_id,
      user_email,
    });
    return;
  }

  const { user_id } = meta.custom_data;

  if (!user_id) {
    console.error("Invoice event missing user_id in custom_data:", id, {
      custom_data: meta.custom_data,
      event_name: meta.event_name,
      subscription_id,
    });
    return;
  }

  switch (meta.event_name) {
    case "subscription_payment_success": {
      console.log(`구독 결제 성공 처리: Invoice ${id}`);

      await prisma.$transaction(async (tx) => {
        // 1. Organization 확인
        const user = await tx.user.findUnique({
          where: { id: user_id },
        });

        if (!user) {
          throw new Error(`User not found: ${user_id}`);
        }

        // 2. PaymentHistory 생성
        await tx.paymentHistory.create({
          data: {
            id: `pmh_${cuid2()}`,
            userId: user_id,
            invoiceId: id,
            subscriptionId: safeString(subscription_id) || "",
            customerId: safeString(customer_id) || "",
            userEmail: user_email,
            billingReason: billing_reason,
            status: PaymentStatus.SUCCESS,
            statusFormatted: status_formatted,
            currency,
            currencyRate: currency_rate,
            subtotal,
            discountTotal: discount_total,
            tax,
            taxInclusive: tax_inclusive,
            total,
            refundedAmount: refunded_amount,
            subtotalUsd: subtotal_usd,
            discountTotalUsd: discount_total_usd,
            taxUsd: tax_usd,
            totalUsd: total_usd,
            refundedAmountUsd: refunded_amount_usd,
            cardBrand: card_brand,
            cardLastFour: card_last_four,
            invoiceUrl: urls.invoice_url,
            testMode: test_mode,
            refundedAt: refunded_at ? new Date(refunded_at) : null,
          },
        });

        console.log(
          `결제 내역 저장 완료: Invoice ${id}, User ${user.username}(${user.id})`
        );
      });
      break;
    }

    case "subscription_payment_failed": {
      console.log(`구독 결제 실패 처리: Invoice ${id}`);

      await prisma.$transaction(async (tx) => {
        // 1. User 확인
        const user = await tx.user.findUnique({
          where: { id: user_id },
        });

        if (!user) {
          throw new Error(`User not found: ${user_id}`);
        }

        // 2. PaymentHistory 생성
        await tx.paymentHistory.create({
          data: {
            id: `pmh_${cuid2()}`,
            userId: user_id,
            invoiceId: id,
            subscriptionId: safeString(subscription_id) || "",
            customerId: safeString(customer_id) || "",
            userEmail: user_email,
            billingReason: billing_reason,
            status: PaymentStatus.FAILED,
            statusFormatted: status_formatted,
            currency,
            currencyRate: currency_rate,
            subtotal,
            discountTotal: discount_total,
            tax,
            taxInclusive: tax_inclusive,
            total,
            refundedAmount: refunded_amount,
            subtotalUsd: subtotal_usd,
            discountTotalUsd: discount_total_usd,
            taxUsd: tax_usd,
            totalUsd: total_usd,
            refundedAmountUsd: refunded_amount_usd,
            cardBrand: card_brand,
            cardLastFour: card_last_four,
            invoiceUrl: urls.invoice_url,
            testMode: test_mode,
            refundedAt: refunded_at ? new Date(refunded_at) : null,
          },
        });

        console.log(
          `결제 실패 내역 저장 완료: Invoice ${id}, User ${user.username}(${user.id})`
        );
      });
      break;
    }

    default: {
      console.log("처리하지 않는 인보이스 이벤트:", meta.event_name);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. 원본 payload와 시그니처 추출
    const payload = await req.text();
    const signature = req.headers.get("x-signature");
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

    if (!signature) {
      return NextResponse.json(
        { error: "시그니처가 존재하지 않습니다." },
        { status: 401 }
      );
    }

    if (!secret) {
      return NextResponse.json(
        { error: "Webhook secret이 존재하지 않습니다." },
        { status: 500 }
      );
    }

    // 2. 시그니처 검증
    if (!verifyWebhookSignature(payload, signature, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 3. 실제 데이터 파싱 및 처리
    const body = JSON.parse(payload);
    const { data, meta } = body;

    // 4. 중복 이벤트 체크
    const eventId = meta?.event_id;
    if (eventId) {
      const existingEvent = await prisma.webhookEvent.findUnique({
        where: { eventId: String(eventId) },
      });

      if (existingEvent) {
        console.log(`Duplicate webhook event detected: ${eventId}`);
        return NextResponse.json({ message: "Event already processed" });
      }

      // 이벤트 처리 기록
      await prisma.webhookEvent.create({
        data: {
          id: `webh_${cuid2()}`,
          eventId: safeString(eventId) || "",
          eventName: meta.event_name,
          resourceId: safeString(data.id) || "",
          payload: body,
        },
      });
    }

    if (data.type === "subscriptions") {
      await handleSubscriptionEvent({
        id: data.id,
        attributes: data.attributes,
        meta,
      });
    } else if (data.type === "subscription-invoices") {
      await handleInvoiceEvent({
        id: data.id,
        type: data.type,
        attributes: data.attributes,
        meta,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook 처리 오류:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Webhook 처리 중 오류 발생" },
      { status: 500 }
    );
  }
}

// GET 요청에 대한 간단한 상태 확인
export async function GET() {
  return NextResponse.json({
    status: "LemonSqueezy webhook endpoint is active",
    timestamp: new Date().toISOString(),
    version: "2.0",
  });
}
