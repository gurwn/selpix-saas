import { TRPCError } from "@trpc/server";

interface CheckoutPayload {
  email: string;
  username: string;
  userId: string;
  locale: "ko" | "en";
  planLemonSqueezyVariantId: string;
}

/**
 * LemonSqueezy API 설정 검증
 */
export function validateLemonSqueezyConfig() {
  const API_KEY = process.env.LEMONSQUEEZY_API_KEY;
  const STORE_ID = process.env.LEMONSQUEEZY_STORE_ID;

  if (!API_KEY) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "LemonSqueezy API key가 설정되지 않았습니다.",
    });
  }

  if (!STORE_ID) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "LemonSqueezy store가 설정되지 않았습니다.",
    });
  }

  return { API_KEY, STORE_ID };
}

export async function getLemonSqueezySubscription(lemonSqueezyId: string) {
  // LemonSqueezy API를 통한 구독 정보 조회 (update_payment_method URL 획득)
  const { API_KEY } = validateLemonSqueezyConfig();

  const response = await fetch(
    `https://api.lemonsqueezy.com/v1/subscriptions/${lemonSqueezyId}`,
    {
      method: "GET",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("LemonSqueezy 구독 정보 조회 실패");
  }

  return await response.json();
}

/**
 * LemonSqueezy 체크아웃 생성
 */
export async function createLemonSqueezyCheckout(payload: CheckoutPayload) {
  const { API_KEY, STORE_ID } = validateLemonSqueezyConfig();

  const checkoutPayload = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          email: payload.email,
          name: payload.username,
          custom: {
            user_id: payload.userId,
            locale: payload.locale,
          },
        },
        checkout_options: {
          embed: false,
          media: false,
          logo: true,
          desc: true,
          dark: false,
          subscription_preview: true,
          button_color: "#2563EB",
        },
        product_options: {
          enabled_variants: [payload.planLemonSqueezyVariantId],
          redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
        },
      },
      relationships: {
        store: {
          data: { type: "stores", id: STORE_ID },
        },
        variant: {
          data: { type: "variants", id: payload.planLemonSqueezyVariantId },
        },
      },
    },
  };

  try {
    const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(checkoutPayload),
    });

    if (!response.ok) {
      let errorMessage = "LemonSqueezy API 호출 실패";
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.errors?.[0]?.detail || errorData.message || errorMessage;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const checkoutResponse = await response.json();
    const checkoutUrl = checkoutResponse.data?.attributes?.url;

    if (!checkoutUrl) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "체크아웃 URL을 생성할 수 없습니다.",
      });
    }

    return {
      paymentUrl: checkoutUrl,
      checkoutId: checkoutResponse.data?.id,
    };
  } catch (error) {
    console.error("LemonSqueezy 체크아웃 생성 오류:", error);

    if (error instanceof TRPCError) {
      throw error;
    }

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "결제 페이지 생성에 실패했습니다. 잠시 후 다시 시도해주세요.",
    });
  }
}

/**
 * LemonSqueezy 구독 재개
 */
export async function resumeLemonSqueezySubscription(lemonSqueezyId: string) {
  const { API_KEY } = validateLemonSqueezyConfig();

  try {
    const response = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions/${lemonSqueezyId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/vnd.api+json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          data: {
            type: "subscriptions",
            id: lemonSqueezyId,
            attributes: {
              cancelled: false,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      let errorMessage = "LemonSqueezy 구독 재개 실패";
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.errors?.[0]?.detail || errorData.message || errorMessage;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error("LemonSqueezy 구독 재개 오류:", error);

    if (error instanceof TRPCError) {
      throw error;
    }

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "구독 재개에 실패했습니다. 잠시 후 다시 시도해주세요.",
    });
  }
}

interface UpdateSubscriptionPayload {
  lemonSqueezyId: string;
  variantId: string;
  invoiceImmediately?: boolean;
  disableProrations?: boolean;
}

/**
 * LemonSqueezy 구독 업데이트 (플랜 변경)
 */
export async function updateLemonSqueezySubscription(
  payload: UpdateSubscriptionPayload
) {
  const { API_KEY } = validateLemonSqueezyConfig();

  try {
    const attributes: Record<string, unknown> = {
      variant_id: payload.variantId,
    };

    // 업그레이드인 경우 즉시 청구, 다운그레이드인 경우 다음 결제일에 적용
    if (payload.invoiceImmediately !== undefined) {
      attributes.invoice_immediately = payload.invoiceImmediately;
    }

    if (payload.disableProrations !== undefined) {
      attributes.disable_prorations = payload.disableProrations;
    }

    const updatePayload = {
      data: {
        type: "subscriptions",
        id: payload.lemonSqueezyId,
        attributes,
      },
    };

    const response = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions/${payload.lemonSqueezyId}`,
      {
        method: "PATCH",
        headers: {
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(updatePayload),
      }
    );

    if (!response.ok) {
      let errorMessage = "LemonSqueezy 구독 업데이트 실패";
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.errors?.[0]?.detail || errorData.message || errorMessage;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error("LemonSqueezy 구독 업데이트 오류:", error);

    if (error instanceof TRPCError) {
      throw error;
    }

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "구독 업데이트에 실패했습니다. 잠시 후 다시 시도해주세요.",
    });
  }
}

export async function cancelLemonSqueezySubscription(lemonSqueezyId: string) {
  const { API_KEY } = validateLemonSqueezyConfig();

  const response = await fetch(
    `https://api.lemonsqueezy.com/v1/subscriptions/${lemonSqueezyId}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    let errorMessage = "LemonSqueezy 구독 취소 실패";
    try {
      const errorData = await response.json();
      errorMessage =
        errorData.errors?.[0]?.detail || errorData.message || errorMessage;
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return await response.json();
}
