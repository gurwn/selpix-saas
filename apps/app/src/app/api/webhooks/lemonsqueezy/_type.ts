export type Locale = "ko" | "en";

interface LemonMeta {
  event_name: string;
  custom_data?: {
    user_id: string;
    locale: Locale;
  };
}

interface LemonAttributes {
  status: string;
  user_email: string;
  variant_id: number;
  product_id: number;
  customer_id: number;
  order_id: number;
  card_brand: string | null;
  card_last_four: string | null;
  renews_at: string | null;
  ends_at: string | null;
  payment_processor: string;
  first_subscription_item?: {
    id: number;
    subscription_id: number;
    price_id: number;
    quantity: number;
    created_at: string;
    updated_at: string;
  };
}

export interface LemonSubscriptionEvent {
  id: string;
  attributes: LemonAttributes;
  meta: LemonMeta;
}

interface LemonInvoiceAttributes {
  store_id: number;
  subscription_id: number;
  customer_id: number;
  user_name: string;
  user_email: string;
  billing_reason: string;
  card_brand: string | null;
  card_last_four: string | null;
  currency: string;
  currency_rate: string;
  status: string;
  status_formatted: string;
  refunded: boolean;
  refunded_at: string | null;
  subtotal: number;
  discount_total: number;
  tax: number;
  tax_inclusive: boolean;
  total: number;
  refunded_amount: number;
  subtotal_usd: number;
  discount_total_usd: number;
  tax_usd: number;
  total_usd: number;
  refunded_amount_usd: number;
  subtotal_formatted: string;
  discount_total_formatted: string;
  tax_formatted: string;
  total_formatted: string;
  refunded_amount_formatted: string;
  urls: {
    invoice_url: string;
  };
  created_at: string;
  updated_at: string;
  test_mode: boolean;
}

export interface LemonInvoiceEvent {
  id: string;
  type: string;
  attributes: LemonInvoiceAttributes;
  meta: LemonMeta;
}
