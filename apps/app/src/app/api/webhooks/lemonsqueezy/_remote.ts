import crypto from "crypto";

const BASE_URL = "https://api.lemonsqueezy.com/v1/";
const API_KEY = process.env.LEMONSQUEEZY_API_KEY;

// JSON:API 스펙을 준수하는 공통 헤더
const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${API_KEY}`,
});

// 기본 API 호출 함수
export async function lemonRequest(
  method: string,
  endpoint: string,
  data?: any
) {
  const url = `${BASE_URL}${endpoint}`;
  const config: RequestInit = {
    method,
    headers: getHeaders(),
  };

  if (data && (method === "POST" || method === "PATCH")) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorMessage = "Lemon Squeezy API 호출 실패";

    try {
      const errorData = await response.json();
      errorMessage =
        errorData.errors?.[0]?.detail || errorData.message || errorMessage;
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

// HTTP 메서드별 래퍼 함수들
export async function lemonGet(endpoint: string) {
  return lemonRequest("GET", endpoint);
}

export async function lemonPost(endpoint: string, data: any) {
  return lemonRequest("POST", endpoint, data);
}

export async function lemonPatch(endpoint: string, data: any) {
  return lemonRequest("PATCH", endpoint, data);
}

export async function lemonDelete(endpoint: string) {
  return lemonRequest("DELETE", endpoint);
}

// 체크아웃 생성 (JSON:API 스펙 준수)
export async function createCheckout(lemonSqueezyCheckoutRequest: {
  storeId: string;
  variantId: string;
  customPrice?: number;
  productOptions?: Record<string, any>;
  checkoutOptions?: Record<string, any>;
  checkoutData?: Record<string, any>;
  preview?: boolean;
}) {
  const payload = {
    data: {
      type: "checkouts",
      attributes: {
        custom_price: lemonSqueezyCheckoutRequest.customPrice,
        product_options: lemonSqueezyCheckoutRequest.productOptions,
        checkout_options: lemonSqueezyCheckoutRequest.checkoutOptions,
        checkout_data: lemonSqueezyCheckoutRequest.checkoutData,
        preview: lemonSqueezyCheckoutRequest.preview,
      },
      relationships: {
        store: {
          data: {
            type: "stores",
            id: lemonSqueezyCheckoutRequest.storeId,
          },
        },
        variant: {
          data: {
            type: "variants",
            id: lemonSqueezyCheckoutRequest.variantId,
          },
        },
      },
    },
  };

  return lemonPost("checkouts", payload);
}

// 구독 조회
export async function getSubscription(subscriptionId: string) {
  return lemonGet(`subscriptions/${subscriptionId}`);
}

// 구독 업데이트
export async function updateSubscription(
  subscriptionId: string,
  updateData: any
) {
  const data = {
    data: {
      type: "subscriptions",
      id: subscriptionId,
      attributes: updateData,
    },
  };

  return lemonPatch(`subscriptions/${subscriptionId}`, data);
}

// 구독 취소
export async function cancelSubscription(subscriptionId: string) {
  return lemonDelete(`subscriptions/${subscriptionId}`);
}

// 고객 정보 조회
export async function getCustomer(customerId: string) {
  return lemonGet(`customers/${customerId}`);
}

// 스토어 정보 조회
export async function getStore(storeId: string) {
  return lemonGet(`stores/${storeId}`);
}

// 상품 변형 조회
export async function getVariant(variantId: string) {
  return lemonGet(`variants/${variantId}`);
}

// 주문 조회
export async function getOrder(orderId: string) {
  return lemonGet(`orders/${orderId}`);
}

// 라이센스 키 조회
export async function getLicenseKey(licenseKeyId: string) {
  return lemonGet(`license-keys/${licenseKeyId}`);
}

// 사용자별 구독 목록 조회
export async function getUserSubscriptions(customerEmail: string) {
  return lemonGet(
    `subscriptions?filter[customer_email]=${encodeURIComponent(customerEmail)}`
  );
}

// 웹훅 시그니처 검증
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    // 시그니처 형식: sha256=해시값
    const receivedSignature = signature.replace("sha256=", "");

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(receivedSignature, "hex")
    );
  } catch (error) {
    console.error("웹훅 시그니처 검증 오류:", error);
    return false;
  }
}
