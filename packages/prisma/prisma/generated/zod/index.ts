import { z } from 'zod';
import { Prisma } from '../../../generated/prisma';
import Decimal from 'decimal.js';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

// JSON
//------------------------------------------------------

export type NullableJsonInput = Prisma.JsonValue | null | 'JsonNull' | 'DbNull' | Prisma.NullTypes.DbNull | Prisma.NullTypes.JsonNull;

export const transformJsonNull = (v?: NullableJsonInput) => {
  if (!v || v === 'DbNull') return Prisma.DbNull;
  if (v === 'JsonNull') return Prisma.JsonNull;
  return v;
};

export const JsonValueSchema: z.ZodType<Prisma.JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.literal(null),
    z.record(z.lazy(() => JsonValueSchema.optional())),
    z.array(z.lazy(() => JsonValueSchema)),
  ])
);

export type JsonValueType = z.infer<typeof JsonValueSchema>;

export const NullableJsonValue = z
  .union([JsonValueSchema, z.literal('DbNull'), z.literal('JsonNull')])
  .nullable()
  .transform((v) => transformJsonNull(v));

export type NullableJsonValueType = z.infer<typeof NullableJsonValue>;

export const InputJsonValueSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.object({ toJSON: z.function(z.tuple([]), z.any()) }),
    z.record(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
    z.array(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
  ])
);

export type InputJsonValueType = z.infer<typeof InputJsonValueSchema>;

// DECIMAL
//------------------------------------------------------

export const DecimalJsLikeSchema: z.ZodType<Prisma.DecimalJsLike> = z.object({
  d: z.array(z.number()),
  e: z.number(),
  s: z.number(),
  toFixed: z.function(z.tuple([]), z.string()),
})

export const DECIMAL_STRING_REGEX = /^(?:-?Infinity|NaN|-?(?:0[bB][01]+(?:\.[01]+)?(?:[pP][-+]?\d+)?|0[oO][0-7]+(?:\.[0-7]+)?(?:[pP][-+]?\d+)?|0[xX][\da-fA-F]+(?:\.[\da-fA-F]+)?(?:[pP][-+]?\d+)?|(?:\d+|\d*\.\d+)(?:[eE][-+]?\d+)?))$/;

export const isValidDecimalInput =
  (v?: null | string | number | Prisma.DecimalJsLike): v is string | number | Prisma.DecimalJsLike => {
    if (v === undefined || v === null) return false;
    return (
      (typeof v === 'object' && 'd' in v && 'e' in v && 's' in v && 'toFixed' in v) ||
      (typeof v === 'string' && DECIMAL_STRING_REGEX.test(v)) ||
      typeof v === 'number'
    )
  };

/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted','ReadCommitted','RepeatableRead','Serializable']);

export const UserScalarFieldEnumSchema = z.enum(['id','clerkId','email','username','createdAt','updatedAt']);

export const SubscriptionScalarFieldEnumSchema = z.enum(['id','userId','planId','status','lemonSqueezyId','lemonSubscriptionItemId','lemonCustomerId','lemonOrderId','lemonProductId','lemonVariantId','renewsAt','endsAt','paymentMethod','cardBrand','cardLast4','createdAt','updatedAt']);

export const PlanScalarFieldEnumSchema = z.enum(['id','title','name','description','content','available','price','lemonSqueezyProductId','lemonSqueezyVariantId','createdAt','updatedAt']);

export const WebhookEventScalarFieldEnumSchema = z.enum(['id','eventId','eventName','resourceId','processedAt','payload','createdAt']);

export const PaymentHistoryScalarFieldEnumSchema = z.enum(['id','userId','invoiceId','subscriptionId','customerId','userEmail','billingReason','status','statusFormatted','currency','currencyRate','subtotal','discountTotal','tax','taxInclusive','total','refundedAmount','subtotalUsd','discountTotalUsd','taxUsd','totalUsd','refundedAmountUsd','cardBrand','cardLastFour','invoiceUrl','testMode','refundedAt','createdAt','updatedAt']);

export const ProductScalarFieldEnumSchema = z.enum(['id','name','wholesalePrice','recommendedPrice','margin','competition','searchVolume','category','image','source','trend','score','createdAt','updatedAt']);

export const RecommendationScalarFieldEnumSchema = z.enum(['id','keyword','createdAt','updatedAt']);

export const RecommendationItemScalarFieldEnumSchema = z.enum(['id','recommendationId','name','wholesalePrice','recommendedPrice','margin','competition','searchVolume','trend','score','createdAt','updatedAt']);

export const WholesaleProductScalarFieldEnumSchema = z.enum(['id','name','price','source','rating','minOrder','url','wholesaleGroupId','createdAt','updatedAt']);

export const WholesaleGroupScalarFieldEnumSchema = z.enum(['id','keyword','createdAt','updatedAt']);

export const MarginScalarFieldEnumSchema = z.enum(['id','productId','productName','wholesalePrice','sellingPrice','shippingCost','commission','adCost','packagingCost','netMargin','marginRate','platform','calculatedAt','createdAt','updatedAt']);

export const DetailPageScalarFieldEnumSchema = z.enum(['id','productId','productName','summary','usps','keywords','template','createdAt','updatedAt']);

export const RegistrationScalarFieldEnumSchema = z.enum(['id','productId','productName','category','recommendedTitle','price','wholesalePrice','status','platform','createdAt','updatedAt']);

export const ActivityLogScalarFieldEnumSchema = z.enum(['id','action','productName','status','price','details','timestamp','createdAt','updatedAt']);

export const DailyStatScalarFieldEnumSchema = z.enum(['id','date','revenue','products','margin','createdAt','updatedAt']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const NullableJsonNullValueInputSchema = z.enum(['DbNull','JsonNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.DbNull : value);

export const JsonNullValueInputSchema = z.enum(['JsonNull',]).transform((value) => (value === 'JsonNull' ? Prisma.JsonNull : value));

export const QueryModeSchema = z.enum(['default','insensitive']);

export const NullsOrderSchema = z.enum(['first','last']);

export const JsonNullValueFilterSchema = z.enum(['DbNull','JsonNull','AnyNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.JsonNull : value === 'AnyNull' ? Prisma.AnyNull : value);

export const SubscriptionStatusSchema = z.enum(['ACTIVE','CANCELLED','EXPIRED','UNPAID','PAST_DUE']);

export type SubscriptionStatusType = `${z.infer<typeof SubscriptionStatusSchema>}`

export const SubscriptionPaymentMethodSchema = z.enum(['CARD','BANK_TRANSFER','PAYPAL']);

export type SubscriptionPaymentMethodType = `${z.infer<typeof SubscriptionPaymentMethodSchema>}`

export const PaymentStatusSchema = z.enum(['SUCCESS','FAILED','REFUNDED','PENDING']);

export type PaymentStatusType = `${z.infer<typeof PaymentStatusSchema>}`

/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

export const UserSchema = z.object({
  id: z.string(),
  clerkId: z.string(),
  email: z.string(),
  username: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type User = z.infer<typeof UserSchema>

/////////////////////////////////////////
// SUBSCRIPTION SCHEMA
/////////////////////////////////////////

export const SubscriptionSchema = z.object({
  status: SubscriptionStatusSchema,
  paymentMethod: SubscriptionPaymentMethodSchema,
  id: z.string(),
  userId: z.string(),
  planId: z.string(),
  lemonSqueezyId: z.string(),
  lemonSubscriptionItemId: z.string().nullable(),
  lemonCustomerId: z.string(),
  lemonOrderId: z.string(),
  lemonProductId: z.string(),
  lemonVariantId: z.string(),
  renewsAt: z.coerce.date().nullable(),
  endsAt: z.coerce.date().nullable(),
  cardBrand: z.string().nullable(),
  cardLast4: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Subscription = z.infer<typeof SubscriptionSchema>

/////////////////////////////////////////
// PLAN SCHEMA
/////////////////////////////////////////

export const PlanSchema = z.object({
  id: z.string(),
  title: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  content: JsonValueSchema.nullable(),
  available: z.boolean(),
  price: z.instanceof(Prisma.Decimal, { message: "Field 'price' must be a Decimal. Location: ['Models', 'Plan']"}),
  lemonSqueezyProductId: z.string(),
  lemonSqueezyVariantId: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Plan = z.infer<typeof PlanSchema>

/////////////////////////////////////////
// WEBHOOK EVENT SCHEMA
/////////////////////////////////////////

export const WebhookEventSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  eventName: z.string(),
  resourceId: z.string(),
  processedAt: z.coerce.date(),
  payload: JsonValueSchema,
  createdAt: z.coerce.date(),
})

export type WebhookEvent = z.infer<typeof WebhookEventSchema>

/////////////////////////////////////////
// PAYMENT HISTORY SCHEMA
/////////////////////////////////////////

export const PaymentHistorySchema = z.object({
  status: PaymentStatusSchema,
  id: z.string(),
  userId: z.string(),
  invoiceId: z.string(),
  subscriptionId: z.string(),
  customerId: z.string(),
  userEmail: z.string(),
  billingReason: z.string(),
  statusFormatted: z.string(),
  currency: z.string(),
  currencyRate: z.string(),
  subtotal: z.number().int(),
  discountTotal: z.number().int(),
  tax: z.number().int(),
  taxInclusive: z.boolean(),
  total: z.number().int(),
  refundedAmount: z.number().int(),
  subtotalUsd: z.number().int(),
  discountTotalUsd: z.number().int(),
  taxUsd: z.number().int(),
  totalUsd: z.number().int(),
  refundedAmountUsd: z.number().int(),
  cardBrand: z.string().nullable(),
  cardLastFour: z.string().nullable(),
  invoiceUrl: z.string().nullable(),
  testMode: z.boolean(),
  refundedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type PaymentHistory = z.infer<typeof PaymentHistorySchema>

/////////////////////////////////////////
// PRODUCT SCHEMA
/////////////////////////////////////////

export const ProductSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  wholesalePrice: z.number().int(),
  recommendedPrice: z.number().int(),
  margin: z.number(),
  competition: z.string(),
  searchVolume: z.number().int(),
  category: z.string(),
  image: z.string(),
  source: z.string(),
  trend: z.string(),
  score: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Product = z.infer<typeof ProductSchema>

/////////////////////////////////////////
// RECOMMENDATION SCHEMA
/////////////////////////////////////////

export const RecommendationSchema = z.object({
  id: z.number().int(),
  keyword: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Recommendation = z.infer<typeof RecommendationSchema>

/////////////////////////////////////////
// RECOMMENDATION ITEM SCHEMA
/////////////////////////////////////////

export const RecommendationItemSchema = z.object({
  id: z.number().int(),
  recommendationId: z.number().int(),
  name: z.string(),
  wholesalePrice: z.number().int(),
  recommendedPrice: z.number().int(),
  margin: z.number(),
  competition: z.string(),
  searchVolume: z.number().int(),
  trend: z.string(),
  score: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type RecommendationItem = z.infer<typeof RecommendationItemSchema>

/////////////////////////////////////////
// WHOLESALE PRODUCT SCHEMA
/////////////////////////////////////////

export const WholesaleProductSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  price: z.number().int(),
  source: z.string(),
  rating: z.number(),
  minOrder: z.number().int(),
  url: z.string(),
  wholesaleGroupId: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type WholesaleProduct = z.infer<typeof WholesaleProductSchema>

/////////////////////////////////////////
// WHOLESALE GROUP SCHEMA
/////////////////////////////////////////

export const WholesaleGroupSchema = z.object({
  id: z.number().int(),
  keyword: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type WholesaleGroup = z.infer<typeof WholesaleGroupSchema>

/////////////////////////////////////////
// MARGIN SCHEMA
/////////////////////////////////////////

export const MarginSchema = z.object({
  id: z.number().int(),
  productId: z.number().int().nullable(),
  productName: z.string(),
  wholesalePrice: z.number().int(),
  sellingPrice: z.number().int(),
  shippingCost: z.number().int(),
  commission: z.number(),
  adCost: z.number().int(),
  packagingCost: z.number().int(),
  netMargin: z.number().int(),
  marginRate: z.number(),
  platform: z.string(),
  calculatedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Margin = z.infer<typeof MarginSchema>

/////////////////////////////////////////
// DETAIL PAGE SCHEMA
/////////////////////////////////////////

export const DetailPageSchema = z.object({
  id: z.number().int(),
  productId: z.number().int().nullable(),
  productName: z.string(),
  summary: z.string(),
  usps: z.string().array(),
  keywords: z.string().array(),
  template: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type DetailPage = z.infer<typeof DetailPageSchema>

/////////////////////////////////////////
// REGISTRATION SCHEMA
/////////////////////////////////////////

export const RegistrationSchema = z.object({
  id: z.number().int(),
  productId: z.number().int().nullable(),
  productName: z.string(),
  category: z.string(),
  recommendedTitle: z.string(),
  price: z.number().int(),
  wholesalePrice: z.number().int(),
  status: z.string(),
  platform: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Registration = z.infer<typeof RegistrationSchema>

/////////////////////////////////////////
// ACTIVITY LOG SCHEMA
/////////////////////////////////////////

export const ActivityLogSchema = z.object({
  id: z.number().int(),
  action: z.string(),
  productName: z.string(),
  status: z.string(),
  price: z.number().int().nullable(),
  details: z.string().nullable(),
  timestamp: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type ActivityLog = z.infer<typeof ActivityLogSchema>

/////////////////////////////////////////
// DAILY STAT SCHEMA
/////////////////////////////////////////

export const DailyStatSchema = z.object({
  id: z.number().int(),
  date: z.string(),
  revenue: z.number().int(),
  products: z.number().int(),
  margin: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type DailyStat = z.infer<typeof DailyStatSchema>

/////////////////////////////////////////
// SELECT & INCLUDE
/////////////////////////////////////////

// USER
//------------------------------------------------------

export const UserIncludeSchema: z.ZodType<Prisma.UserInclude> = z.object({
  subscription: z.union([z.boolean(),z.lazy(() => SubscriptionArgsSchema)]).optional(),
  paymentHistories: z.union([z.boolean(),z.lazy(() => PaymentHistoryFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => UserCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const UserArgsSchema: z.ZodType<Prisma.UserDefaultArgs> = z.object({
  select: z.lazy(() => UserSelectSchema).optional(),
  include: z.lazy(() => UserIncludeSchema).optional(),
}).strict();

export const UserCountOutputTypeArgsSchema: z.ZodType<Prisma.UserCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => UserCountOutputTypeSelectSchema).nullish(),
}).strict();

export const UserCountOutputTypeSelectSchema: z.ZodType<Prisma.UserCountOutputTypeSelect> = z.object({
  paymentHistories: z.boolean().optional(),
}).strict();

export const UserSelectSchema: z.ZodType<Prisma.UserSelect> = z.object({
  id: z.boolean().optional(),
  clerkId: z.boolean().optional(),
  email: z.boolean().optional(),
  username: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  subscription: z.union([z.boolean(),z.lazy(() => SubscriptionArgsSchema)]).optional(),
  paymentHistories: z.union([z.boolean(),z.lazy(() => PaymentHistoryFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => UserCountOutputTypeArgsSchema)]).optional(),
}).strict()

// SUBSCRIPTION
//------------------------------------------------------

export const SubscriptionIncludeSchema: z.ZodType<Prisma.SubscriptionInclude> = z.object({
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  plan: z.union([z.boolean(),z.lazy(() => PlanArgsSchema)]).optional(),
}).strict()

export const SubscriptionArgsSchema: z.ZodType<Prisma.SubscriptionDefaultArgs> = z.object({
  select: z.lazy(() => SubscriptionSelectSchema).optional(),
  include: z.lazy(() => SubscriptionIncludeSchema).optional(),
}).strict();

export const SubscriptionSelectSchema: z.ZodType<Prisma.SubscriptionSelect> = z.object({
  id: z.boolean().optional(),
  userId: z.boolean().optional(),
  planId: z.boolean().optional(),
  status: z.boolean().optional(),
  lemonSqueezyId: z.boolean().optional(),
  lemonSubscriptionItemId: z.boolean().optional(),
  lemonCustomerId: z.boolean().optional(),
  lemonOrderId: z.boolean().optional(),
  lemonProductId: z.boolean().optional(),
  lemonVariantId: z.boolean().optional(),
  renewsAt: z.boolean().optional(),
  endsAt: z.boolean().optional(),
  paymentMethod: z.boolean().optional(),
  cardBrand: z.boolean().optional(),
  cardLast4: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  plan: z.union([z.boolean(),z.lazy(() => PlanArgsSchema)]).optional(),
}).strict()

// PLAN
//------------------------------------------------------

export const PlanIncludeSchema: z.ZodType<Prisma.PlanInclude> = z.object({
  subscriptions: z.union([z.boolean(),z.lazy(() => SubscriptionFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => PlanCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const PlanArgsSchema: z.ZodType<Prisma.PlanDefaultArgs> = z.object({
  select: z.lazy(() => PlanSelectSchema).optional(),
  include: z.lazy(() => PlanIncludeSchema).optional(),
}).strict();

export const PlanCountOutputTypeArgsSchema: z.ZodType<Prisma.PlanCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => PlanCountOutputTypeSelectSchema).nullish(),
}).strict();

export const PlanCountOutputTypeSelectSchema: z.ZodType<Prisma.PlanCountOutputTypeSelect> = z.object({
  subscriptions: z.boolean().optional(),
}).strict();

export const PlanSelectSchema: z.ZodType<Prisma.PlanSelect> = z.object({
  id: z.boolean().optional(),
  title: z.boolean().optional(),
  name: z.boolean().optional(),
  description: z.boolean().optional(),
  content: z.boolean().optional(),
  available: z.boolean().optional(),
  price: z.boolean().optional(),
  lemonSqueezyProductId: z.boolean().optional(),
  lemonSqueezyVariantId: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  subscriptions: z.union([z.boolean(),z.lazy(() => SubscriptionFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => PlanCountOutputTypeArgsSchema)]).optional(),
}).strict()

// WEBHOOK EVENT
//------------------------------------------------------

export const WebhookEventSelectSchema: z.ZodType<Prisma.WebhookEventSelect> = z.object({
  id: z.boolean().optional(),
  eventId: z.boolean().optional(),
  eventName: z.boolean().optional(),
  resourceId: z.boolean().optional(),
  processedAt: z.boolean().optional(),
  payload: z.boolean().optional(),
  createdAt: z.boolean().optional(),
}).strict()

// PAYMENT HISTORY
//------------------------------------------------------

export const PaymentHistoryIncludeSchema: z.ZodType<Prisma.PaymentHistoryInclude> = z.object({
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

export const PaymentHistoryArgsSchema: z.ZodType<Prisma.PaymentHistoryDefaultArgs> = z.object({
  select: z.lazy(() => PaymentHistorySelectSchema).optional(),
  include: z.lazy(() => PaymentHistoryIncludeSchema).optional(),
}).strict();

export const PaymentHistorySelectSchema: z.ZodType<Prisma.PaymentHistorySelect> = z.object({
  id: z.boolean().optional(),
  userId: z.boolean().optional(),
  invoiceId: z.boolean().optional(),
  subscriptionId: z.boolean().optional(),
  customerId: z.boolean().optional(),
  userEmail: z.boolean().optional(),
  billingReason: z.boolean().optional(),
  status: z.boolean().optional(),
  statusFormatted: z.boolean().optional(),
  currency: z.boolean().optional(),
  currencyRate: z.boolean().optional(),
  subtotal: z.boolean().optional(),
  discountTotal: z.boolean().optional(),
  tax: z.boolean().optional(),
  taxInclusive: z.boolean().optional(),
  total: z.boolean().optional(),
  refundedAmount: z.boolean().optional(),
  subtotalUsd: z.boolean().optional(),
  discountTotalUsd: z.boolean().optional(),
  taxUsd: z.boolean().optional(),
  totalUsd: z.boolean().optional(),
  refundedAmountUsd: z.boolean().optional(),
  cardBrand: z.boolean().optional(),
  cardLastFour: z.boolean().optional(),
  invoiceUrl: z.boolean().optional(),
  testMode: z.boolean().optional(),
  refundedAt: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

// PRODUCT
//------------------------------------------------------

export const ProductIncludeSchema: z.ZodType<Prisma.ProductInclude> = z.object({
  margins: z.union([z.boolean(),z.lazy(() => MarginFindManyArgsSchema)]).optional(),
  detailPages: z.union([z.boolean(),z.lazy(() => DetailPageFindManyArgsSchema)]).optional(),
  registrations: z.union([z.boolean(),z.lazy(() => RegistrationFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => ProductCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const ProductArgsSchema: z.ZodType<Prisma.ProductDefaultArgs> = z.object({
  select: z.lazy(() => ProductSelectSchema).optional(),
  include: z.lazy(() => ProductIncludeSchema).optional(),
}).strict();

export const ProductCountOutputTypeArgsSchema: z.ZodType<Prisma.ProductCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => ProductCountOutputTypeSelectSchema).nullish(),
}).strict();

export const ProductCountOutputTypeSelectSchema: z.ZodType<Prisma.ProductCountOutputTypeSelect> = z.object({
  margins: z.boolean().optional(),
  detailPages: z.boolean().optional(),
  registrations: z.boolean().optional(),
}).strict();

export const ProductSelectSchema: z.ZodType<Prisma.ProductSelect> = z.object({
  id: z.boolean().optional(),
  name: z.boolean().optional(),
  wholesalePrice: z.boolean().optional(),
  recommendedPrice: z.boolean().optional(),
  margin: z.boolean().optional(),
  competition: z.boolean().optional(),
  searchVolume: z.boolean().optional(),
  category: z.boolean().optional(),
  image: z.boolean().optional(),
  source: z.boolean().optional(),
  trend: z.boolean().optional(),
  score: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  margins: z.union([z.boolean(),z.lazy(() => MarginFindManyArgsSchema)]).optional(),
  detailPages: z.union([z.boolean(),z.lazy(() => DetailPageFindManyArgsSchema)]).optional(),
  registrations: z.union([z.boolean(),z.lazy(() => RegistrationFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => ProductCountOutputTypeArgsSchema)]).optional(),
}).strict()

// RECOMMENDATION
//------------------------------------------------------

export const RecommendationIncludeSchema: z.ZodType<Prisma.RecommendationInclude> = z.object({
  items: z.union([z.boolean(),z.lazy(() => RecommendationItemFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => RecommendationCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const RecommendationArgsSchema: z.ZodType<Prisma.RecommendationDefaultArgs> = z.object({
  select: z.lazy(() => RecommendationSelectSchema).optional(),
  include: z.lazy(() => RecommendationIncludeSchema).optional(),
}).strict();

export const RecommendationCountOutputTypeArgsSchema: z.ZodType<Prisma.RecommendationCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => RecommendationCountOutputTypeSelectSchema).nullish(),
}).strict();

export const RecommendationCountOutputTypeSelectSchema: z.ZodType<Prisma.RecommendationCountOutputTypeSelect> = z.object({
  items: z.boolean().optional(),
}).strict();

export const RecommendationSelectSchema: z.ZodType<Prisma.RecommendationSelect> = z.object({
  id: z.boolean().optional(),
  keyword: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  items: z.union([z.boolean(),z.lazy(() => RecommendationItemFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => RecommendationCountOutputTypeArgsSchema)]).optional(),
}).strict()

// RECOMMENDATION ITEM
//------------------------------------------------------

export const RecommendationItemIncludeSchema: z.ZodType<Prisma.RecommendationItemInclude> = z.object({
  recommendation: z.union([z.boolean(),z.lazy(() => RecommendationArgsSchema)]).optional(),
}).strict()

export const RecommendationItemArgsSchema: z.ZodType<Prisma.RecommendationItemDefaultArgs> = z.object({
  select: z.lazy(() => RecommendationItemSelectSchema).optional(),
  include: z.lazy(() => RecommendationItemIncludeSchema).optional(),
}).strict();

export const RecommendationItemSelectSchema: z.ZodType<Prisma.RecommendationItemSelect> = z.object({
  id: z.boolean().optional(),
  recommendationId: z.boolean().optional(),
  name: z.boolean().optional(),
  wholesalePrice: z.boolean().optional(),
  recommendedPrice: z.boolean().optional(),
  margin: z.boolean().optional(),
  competition: z.boolean().optional(),
  searchVolume: z.boolean().optional(),
  trend: z.boolean().optional(),
  score: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  recommendation: z.union([z.boolean(),z.lazy(() => RecommendationArgsSchema)]).optional(),
}).strict()

// WHOLESALE PRODUCT
//------------------------------------------------------

export const WholesaleProductIncludeSchema: z.ZodType<Prisma.WholesaleProductInclude> = z.object({
  wholesaleGroup: z.union([z.boolean(),z.lazy(() => WholesaleGroupArgsSchema)]).optional(),
}).strict()

export const WholesaleProductArgsSchema: z.ZodType<Prisma.WholesaleProductDefaultArgs> = z.object({
  select: z.lazy(() => WholesaleProductSelectSchema).optional(),
  include: z.lazy(() => WholesaleProductIncludeSchema).optional(),
}).strict();

export const WholesaleProductSelectSchema: z.ZodType<Prisma.WholesaleProductSelect> = z.object({
  id: z.boolean().optional(),
  name: z.boolean().optional(),
  price: z.boolean().optional(),
  source: z.boolean().optional(),
  rating: z.boolean().optional(),
  minOrder: z.boolean().optional(),
  url: z.boolean().optional(),
  wholesaleGroupId: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  wholesaleGroup: z.union([z.boolean(),z.lazy(() => WholesaleGroupArgsSchema)]).optional(),
}).strict()

// WHOLESALE GROUP
//------------------------------------------------------

export const WholesaleGroupIncludeSchema: z.ZodType<Prisma.WholesaleGroupInclude> = z.object({
  products: z.union([z.boolean(),z.lazy(() => WholesaleProductFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => WholesaleGroupCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const WholesaleGroupArgsSchema: z.ZodType<Prisma.WholesaleGroupDefaultArgs> = z.object({
  select: z.lazy(() => WholesaleGroupSelectSchema).optional(),
  include: z.lazy(() => WholesaleGroupIncludeSchema).optional(),
}).strict();

export const WholesaleGroupCountOutputTypeArgsSchema: z.ZodType<Prisma.WholesaleGroupCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => WholesaleGroupCountOutputTypeSelectSchema).nullish(),
}).strict();

export const WholesaleGroupCountOutputTypeSelectSchema: z.ZodType<Prisma.WholesaleGroupCountOutputTypeSelect> = z.object({
  products: z.boolean().optional(),
}).strict();

export const WholesaleGroupSelectSchema: z.ZodType<Prisma.WholesaleGroupSelect> = z.object({
  id: z.boolean().optional(),
  keyword: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  products: z.union([z.boolean(),z.lazy(() => WholesaleProductFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => WholesaleGroupCountOutputTypeArgsSchema)]).optional(),
}).strict()

// MARGIN
//------------------------------------------------------

export const MarginIncludeSchema: z.ZodType<Prisma.MarginInclude> = z.object({
  product: z.union([z.boolean(),z.lazy(() => ProductArgsSchema)]).optional(),
}).strict()

export const MarginArgsSchema: z.ZodType<Prisma.MarginDefaultArgs> = z.object({
  select: z.lazy(() => MarginSelectSchema).optional(),
  include: z.lazy(() => MarginIncludeSchema).optional(),
}).strict();

export const MarginSelectSchema: z.ZodType<Prisma.MarginSelect> = z.object({
  id: z.boolean().optional(),
  productId: z.boolean().optional(),
  productName: z.boolean().optional(),
  wholesalePrice: z.boolean().optional(),
  sellingPrice: z.boolean().optional(),
  shippingCost: z.boolean().optional(),
  commission: z.boolean().optional(),
  adCost: z.boolean().optional(),
  packagingCost: z.boolean().optional(),
  netMargin: z.boolean().optional(),
  marginRate: z.boolean().optional(),
  platform: z.boolean().optional(),
  calculatedAt: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  product: z.union([z.boolean(),z.lazy(() => ProductArgsSchema)]).optional(),
}).strict()

// DETAIL PAGE
//------------------------------------------------------

export const DetailPageIncludeSchema: z.ZodType<Prisma.DetailPageInclude> = z.object({
  product: z.union([z.boolean(),z.lazy(() => ProductArgsSchema)]).optional(),
}).strict()

export const DetailPageArgsSchema: z.ZodType<Prisma.DetailPageDefaultArgs> = z.object({
  select: z.lazy(() => DetailPageSelectSchema).optional(),
  include: z.lazy(() => DetailPageIncludeSchema).optional(),
}).strict();

export const DetailPageSelectSchema: z.ZodType<Prisma.DetailPageSelect> = z.object({
  id: z.boolean().optional(),
  productId: z.boolean().optional(),
  productName: z.boolean().optional(),
  summary: z.boolean().optional(),
  usps: z.boolean().optional(),
  keywords: z.boolean().optional(),
  template: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  product: z.union([z.boolean(),z.lazy(() => ProductArgsSchema)]).optional(),
}).strict()

// REGISTRATION
//------------------------------------------------------

export const RegistrationIncludeSchema: z.ZodType<Prisma.RegistrationInclude> = z.object({
  product: z.union([z.boolean(),z.lazy(() => ProductArgsSchema)]).optional(),
}).strict()

export const RegistrationArgsSchema: z.ZodType<Prisma.RegistrationDefaultArgs> = z.object({
  select: z.lazy(() => RegistrationSelectSchema).optional(),
  include: z.lazy(() => RegistrationIncludeSchema).optional(),
}).strict();

export const RegistrationSelectSchema: z.ZodType<Prisma.RegistrationSelect> = z.object({
  id: z.boolean().optional(),
  productId: z.boolean().optional(),
  productName: z.boolean().optional(),
  category: z.boolean().optional(),
  recommendedTitle: z.boolean().optional(),
  price: z.boolean().optional(),
  wholesalePrice: z.boolean().optional(),
  status: z.boolean().optional(),
  platform: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  product: z.union([z.boolean(),z.lazy(() => ProductArgsSchema)]).optional(),
}).strict()

// ACTIVITY LOG
//------------------------------------------------------

export const ActivityLogSelectSchema: z.ZodType<Prisma.ActivityLogSelect> = z.object({
  id: z.boolean().optional(),
  action: z.boolean().optional(),
  productName: z.boolean().optional(),
  status: z.boolean().optional(),
  price: z.boolean().optional(),
  details: z.boolean().optional(),
  timestamp: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
}).strict()

// DAILY STAT
//------------------------------------------------------

export const DailyStatSelectSchema: z.ZodType<Prisma.DailyStatSelect> = z.object({
  id: z.boolean().optional(),
  date: z.boolean().optional(),
  revenue: z.boolean().optional(),
  products: z.boolean().optional(),
  margin: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
}).strict()


/////////////////////////////////////////
// INPUT TYPES
/////////////////////////////////////////

export const UserWhereInputSchema: z.ZodType<Prisma.UserWhereInput> = z.object({
  AND: z.union([ z.lazy(() => UserWhereInputSchema),z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWhereInputSchema),z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  clerkId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  email: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  username: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  subscription: z.union([ z.lazy(() => SubscriptionNullableScalarRelationFilterSchema),z.lazy(() => SubscriptionWhereInputSchema) ]).optional().nullable(),
  paymentHistories: z.lazy(() => PaymentHistoryListRelationFilterSchema).optional()
}).strict();

export const UserOrderByWithRelationInputSchema: z.ZodType<Prisma.UserOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  clerkId: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  username: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  subscription: z.lazy(() => SubscriptionOrderByWithRelationInputSchema).optional(),
  paymentHistories: z.lazy(() => PaymentHistoryOrderByRelationAggregateInputSchema).optional()
}).strict();

export const UserWhereUniqueInputSchema: z.ZodType<Prisma.UserWhereUniqueInput> = z.union([
  z.object({
    id: z.string(),
    clerkId: z.string(),
    email: z.string()
  }),
  z.object({
    id: z.string(),
    clerkId: z.string(),
  }),
  z.object({
    id: z.string(),
    email: z.string(),
  }),
  z.object({
    id: z.string(),
  }),
  z.object({
    clerkId: z.string(),
    email: z.string(),
  }),
  z.object({
    clerkId: z.string(),
  }),
  z.object({
    email: z.string(),
  }),
])
.and(z.object({
  id: z.string().optional(),
  clerkId: z.string().optional(),
  email: z.string().optional(),
  AND: z.union([ z.lazy(() => UserWhereInputSchema),z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWhereInputSchema),z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  username: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  subscription: z.union([ z.lazy(() => SubscriptionNullableScalarRelationFilterSchema),z.lazy(() => SubscriptionWhereInputSchema) ]).optional().nullable(),
  paymentHistories: z.lazy(() => PaymentHistoryListRelationFilterSchema).optional()
}).strict());

export const UserOrderByWithAggregationInputSchema: z.ZodType<Prisma.UserOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  clerkId: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  username: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => UserCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => UserMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => UserMinOrderByAggregateInputSchema).optional()
}).strict();

export const UserScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.UserScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => UserScalarWhereWithAggregatesInputSchema),z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserScalarWhereWithAggregatesInputSchema),z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  clerkId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  email: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  username: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const SubscriptionWhereInputSchema: z.ZodType<Prisma.SubscriptionWhereInput> = z.object({
  AND: z.union([ z.lazy(() => SubscriptionWhereInputSchema),z.lazy(() => SubscriptionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SubscriptionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SubscriptionWhereInputSchema),z.lazy(() => SubscriptionWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  planId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  status: z.union([ z.lazy(() => EnumSubscriptionStatusFilterSchema),z.lazy(() => SubscriptionStatusSchema) ]).optional(),
  lemonSqueezyId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  lemonSubscriptionItemId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  lemonCustomerId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  lemonOrderId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  lemonProductId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  lemonVariantId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  renewsAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  endsAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  paymentMethod: z.union([ z.lazy(() => EnumSubscriptionPaymentMethodFilterSchema),z.lazy(() => SubscriptionPaymentMethodSchema) ]).optional(),
  cardBrand: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  cardLast4: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
  plan: z.union([ z.lazy(() => PlanScalarRelationFilterSchema),z.lazy(() => PlanWhereInputSchema) ]).optional(),
}).strict();

export const SubscriptionOrderByWithRelationInputSchema: z.ZodType<Prisma.SubscriptionOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  planId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  lemonSqueezyId: z.lazy(() => SortOrderSchema).optional(),
  lemonSubscriptionItemId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  lemonCustomerId: z.lazy(() => SortOrderSchema).optional(),
  lemonOrderId: z.lazy(() => SortOrderSchema).optional(),
  lemonProductId: z.lazy(() => SortOrderSchema).optional(),
  lemonVariantId: z.lazy(() => SortOrderSchema).optional(),
  renewsAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  endsAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  paymentMethod: z.lazy(() => SortOrderSchema).optional(),
  cardBrand: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  cardLast4: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  plan: z.lazy(() => PlanOrderByWithRelationInputSchema).optional()
}).strict();

export const SubscriptionWhereUniqueInputSchema: z.ZodType<Prisma.SubscriptionWhereUniqueInput> = z.union([
  z.object({
    id: z.string(),
    userId: z.string(),
    lemonSqueezyId: z.string(),
    lemonOrderId: z.string()
  }),
  z.object({
    id: z.string(),
    userId: z.string(),
    lemonSqueezyId: z.string(),
  }),
  z.object({
    id: z.string(),
    userId: z.string(),
    lemonOrderId: z.string(),
  }),
  z.object({
    id: z.string(),
    userId: z.string(),
  }),
  z.object({
    id: z.string(),
    lemonSqueezyId: z.string(),
    lemonOrderId: z.string(),
  }),
  z.object({
    id: z.string(),
    lemonSqueezyId: z.string(),
  }),
  z.object({
    id: z.string(),
    lemonOrderId: z.string(),
  }),
  z.object({
    id: z.string(),
  }),
  z.object({
    userId: z.string(),
    lemonSqueezyId: z.string(),
    lemonOrderId: z.string(),
  }),
  z.object({
    userId: z.string(),
    lemonSqueezyId: z.string(),
  }),
  z.object({
    userId: z.string(),
    lemonOrderId: z.string(),
  }),
  z.object({
    userId: z.string(),
  }),
  z.object({
    lemonSqueezyId: z.string(),
    lemonOrderId: z.string(),
  }),
  z.object({
    lemonSqueezyId: z.string(),
  }),
  z.object({
    lemonOrderId: z.string(),
  }),
])
.and(z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  lemonSqueezyId: z.string().optional(),
  lemonOrderId: z.string().optional(),
  AND: z.union([ z.lazy(() => SubscriptionWhereInputSchema),z.lazy(() => SubscriptionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SubscriptionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SubscriptionWhereInputSchema),z.lazy(() => SubscriptionWhereInputSchema).array() ]).optional(),
  planId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  status: z.union([ z.lazy(() => EnumSubscriptionStatusFilterSchema),z.lazy(() => SubscriptionStatusSchema) ]).optional(),
  lemonSubscriptionItemId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  lemonCustomerId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  lemonProductId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  lemonVariantId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  renewsAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  endsAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  paymentMethod: z.union([ z.lazy(() => EnumSubscriptionPaymentMethodFilterSchema),z.lazy(() => SubscriptionPaymentMethodSchema) ]).optional(),
  cardBrand: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  cardLast4: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
  plan: z.union([ z.lazy(() => PlanScalarRelationFilterSchema),z.lazy(() => PlanWhereInputSchema) ]).optional(),
}).strict());

export const SubscriptionOrderByWithAggregationInputSchema: z.ZodType<Prisma.SubscriptionOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  planId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  lemonSqueezyId: z.lazy(() => SortOrderSchema).optional(),
  lemonSubscriptionItemId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  lemonCustomerId: z.lazy(() => SortOrderSchema).optional(),
  lemonOrderId: z.lazy(() => SortOrderSchema).optional(),
  lemonProductId: z.lazy(() => SortOrderSchema).optional(),
  lemonVariantId: z.lazy(() => SortOrderSchema).optional(),
  renewsAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  endsAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  paymentMethod: z.lazy(() => SortOrderSchema).optional(),
  cardBrand: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  cardLast4: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => SubscriptionCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => SubscriptionMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => SubscriptionMinOrderByAggregateInputSchema).optional()
}).strict();

export const SubscriptionScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.SubscriptionScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => SubscriptionScalarWhereWithAggregatesInputSchema),z.lazy(() => SubscriptionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => SubscriptionScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SubscriptionScalarWhereWithAggregatesInputSchema),z.lazy(() => SubscriptionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  planId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  status: z.union([ z.lazy(() => EnumSubscriptionStatusWithAggregatesFilterSchema),z.lazy(() => SubscriptionStatusSchema) ]).optional(),
  lemonSqueezyId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  lemonSubscriptionItemId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  lemonCustomerId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  lemonOrderId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  lemonProductId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  lemonVariantId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  renewsAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema),z.coerce.date() ]).optional().nullable(),
  endsAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema),z.coerce.date() ]).optional().nullable(),
  paymentMethod: z.union([ z.lazy(() => EnumSubscriptionPaymentMethodWithAggregatesFilterSchema),z.lazy(() => SubscriptionPaymentMethodSchema) ]).optional(),
  cardBrand: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  cardLast4: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const PlanWhereInputSchema: z.ZodType<Prisma.PlanWhereInput> = z.object({
  AND: z.union([ z.lazy(() => PlanWhereInputSchema),z.lazy(() => PlanWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PlanWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PlanWhereInputSchema),z.lazy(() => PlanWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  title: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  content: z.lazy(() => JsonNullableFilterSchema).optional(),
  available: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  price: z.union([ z.lazy(() => DecimalFilterSchema),z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  lemonSqueezyProductId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  lemonSqueezyVariantId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  subscriptions: z.lazy(() => SubscriptionListRelationFilterSchema).optional()
}).strict();

export const PlanOrderByWithRelationInputSchema: z.ZodType<Prisma.PlanOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  content: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  available: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  lemonSqueezyProductId: z.lazy(() => SortOrderSchema).optional(),
  lemonSqueezyVariantId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionOrderByRelationAggregateInputSchema).optional()
}).strict();

export const PlanWhereUniqueInputSchema: z.ZodType<Prisma.PlanWhereUniqueInput> = z.object({
  id: z.string()
})
.and(z.object({
  id: z.string().optional(),
  AND: z.union([ z.lazy(() => PlanWhereInputSchema),z.lazy(() => PlanWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PlanWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PlanWhereInputSchema),z.lazy(() => PlanWhereInputSchema).array() ]).optional(),
  title: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  content: z.lazy(() => JsonNullableFilterSchema).optional(),
  available: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  price: z.union([ z.lazy(() => DecimalFilterSchema),z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  lemonSqueezyProductId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  lemonSqueezyVariantId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  subscriptions: z.lazy(() => SubscriptionListRelationFilterSchema).optional()
}).strict());

export const PlanOrderByWithAggregationInputSchema: z.ZodType<Prisma.PlanOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  content: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  available: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  lemonSqueezyProductId: z.lazy(() => SortOrderSchema).optional(),
  lemonSqueezyVariantId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => PlanCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => PlanAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => PlanMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => PlanMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => PlanSumOrderByAggregateInputSchema).optional()
}).strict();

export const PlanScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.PlanScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => PlanScalarWhereWithAggregatesInputSchema),z.lazy(() => PlanScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => PlanScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PlanScalarWhereWithAggregatesInputSchema),z.lazy(() => PlanScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  title: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  content: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  available: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema),z.boolean() ]).optional(),
  price: z.union([ z.lazy(() => DecimalWithAggregatesFilterSchema),z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  lemonSqueezyProductId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  lemonSqueezyVariantId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const WebhookEventWhereInputSchema: z.ZodType<Prisma.WebhookEventWhereInput> = z.object({
  AND: z.union([ z.lazy(() => WebhookEventWhereInputSchema),z.lazy(() => WebhookEventWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => WebhookEventWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => WebhookEventWhereInputSchema),z.lazy(() => WebhookEventWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  eventName: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  resourceId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  processedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  payload: z.lazy(() => JsonFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const WebhookEventOrderByWithRelationInputSchema: z.ZodType<Prisma.WebhookEventOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  eventName: z.lazy(() => SortOrderSchema).optional(),
  resourceId: z.lazy(() => SortOrderSchema).optional(),
  processedAt: z.lazy(() => SortOrderSchema).optional(),
  payload: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const WebhookEventWhereUniqueInputSchema: z.ZodType<Prisma.WebhookEventWhereUniqueInput> = z.union([
  z.object({
    id: z.string(),
    eventId: z.string()
  }),
  z.object({
    id: z.string(),
  }),
  z.object({
    eventId: z.string(),
  }),
])
.and(z.object({
  id: z.string().optional(),
  eventId: z.string().optional(),
  AND: z.union([ z.lazy(() => WebhookEventWhereInputSchema),z.lazy(() => WebhookEventWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => WebhookEventWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => WebhookEventWhereInputSchema),z.lazy(() => WebhookEventWhereInputSchema).array() ]).optional(),
  eventName: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  resourceId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  processedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  payload: z.lazy(() => JsonFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict());

export const WebhookEventOrderByWithAggregationInputSchema: z.ZodType<Prisma.WebhookEventOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  eventName: z.lazy(() => SortOrderSchema).optional(),
  resourceId: z.lazy(() => SortOrderSchema).optional(),
  processedAt: z.lazy(() => SortOrderSchema).optional(),
  payload: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => WebhookEventCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => WebhookEventMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => WebhookEventMinOrderByAggregateInputSchema).optional()
}).strict();

export const WebhookEventScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.WebhookEventScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => WebhookEventScalarWhereWithAggregatesInputSchema),z.lazy(() => WebhookEventScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => WebhookEventScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => WebhookEventScalarWhereWithAggregatesInputSchema),z.lazy(() => WebhookEventScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  eventId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  eventName: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  resourceId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  processedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  payload: z.lazy(() => JsonWithAggregatesFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const PaymentHistoryWhereInputSchema: z.ZodType<Prisma.PaymentHistoryWhereInput> = z.object({
  AND: z.union([ z.lazy(() => PaymentHistoryWhereInputSchema),z.lazy(() => PaymentHistoryWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PaymentHistoryWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PaymentHistoryWhereInputSchema),z.lazy(() => PaymentHistoryWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  invoiceId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  subscriptionId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  customerId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  userEmail: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  billingReason: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  status: z.union([ z.lazy(() => EnumPaymentStatusFilterSchema),z.lazy(() => PaymentStatusSchema) ]).optional(),
  statusFormatted: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  currency: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  currencyRate: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  subtotal: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  discountTotal: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  tax: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  taxInclusive: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  total: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  refundedAmount: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  subtotalUsd: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  discountTotalUsd: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  taxUsd: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  totalUsd: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  refundedAmountUsd: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  cardBrand: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  cardLastFour: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  invoiceUrl: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  testMode: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  refundedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
}).strict();

export const PaymentHistoryOrderByWithRelationInputSchema: z.ZodType<Prisma.PaymentHistoryOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  invoiceId: z.lazy(() => SortOrderSchema).optional(),
  subscriptionId: z.lazy(() => SortOrderSchema).optional(),
  customerId: z.lazy(() => SortOrderSchema).optional(),
  userEmail: z.lazy(() => SortOrderSchema).optional(),
  billingReason: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  statusFormatted: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  currencyRate: z.lazy(() => SortOrderSchema).optional(),
  subtotal: z.lazy(() => SortOrderSchema).optional(),
  discountTotal: z.lazy(() => SortOrderSchema).optional(),
  tax: z.lazy(() => SortOrderSchema).optional(),
  taxInclusive: z.lazy(() => SortOrderSchema).optional(),
  total: z.lazy(() => SortOrderSchema).optional(),
  refundedAmount: z.lazy(() => SortOrderSchema).optional(),
  subtotalUsd: z.lazy(() => SortOrderSchema).optional(),
  discountTotalUsd: z.lazy(() => SortOrderSchema).optional(),
  taxUsd: z.lazy(() => SortOrderSchema).optional(),
  totalUsd: z.lazy(() => SortOrderSchema).optional(),
  refundedAmountUsd: z.lazy(() => SortOrderSchema).optional(),
  cardBrand: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  cardLastFour: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  invoiceUrl: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  testMode: z.lazy(() => SortOrderSchema).optional(),
  refundedAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional()
}).strict();

export const PaymentHistoryWhereUniqueInputSchema: z.ZodType<Prisma.PaymentHistoryWhereUniqueInput> = z.union([
  z.object({
    id: z.string(),
    invoiceId: z.string()
  }),
  z.object({
    id: z.string(),
  }),
  z.object({
    invoiceId: z.string(),
  }),
])
.and(z.object({
  id: z.string().optional(),
  invoiceId: z.string().optional(),
  AND: z.union([ z.lazy(() => PaymentHistoryWhereInputSchema),z.lazy(() => PaymentHistoryWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PaymentHistoryWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PaymentHistoryWhereInputSchema),z.lazy(() => PaymentHistoryWhereInputSchema).array() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  subscriptionId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  customerId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  userEmail: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  billingReason: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  status: z.union([ z.lazy(() => EnumPaymentStatusFilterSchema),z.lazy(() => PaymentStatusSchema) ]).optional(),
  statusFormatted: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  currency: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  currencyRate: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  subtotal: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  discountTotal: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  tax: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  taxInclusive: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  total: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  refundedAmount: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  subtotalUsd: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  discountTotalUsd: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  taxUsd: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  totalUsd: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  refundedAmountUsd: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  cardBrand: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  cardLastFour: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  invoiceUrl: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  testMode: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  refundedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
}).strict());

export const PaymentHistoryOrderByWithAggregationInputSchema: z.ZodType<Prisma.PaymentHistoryOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  invoiceId: z.lazy(() => SortOrderSchema).optional(),
  subscriptionId: z.lazy(() => SortOrderSchema).optional(),
  customerId: z.lazy(() => SortOrderSchema).optional(),
  userEmail: z.lazy(() => SortOrderSchema).optional(),
  billingReason: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  statusFormatted: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  currencyRate: z.lazy(() => SortOrderSchema).optional(),
  subtotal: z.lazy(() => SortOrderSchema).optional(),
  discountTotal: z.lazy(() => SortOrderSchema).optional(),
  tax: z.lazy(() => SortOrderSchema).optional(),
  taxInclusive: z.lazy(() => SortOrderSchema).optional(),
  total: z.lazy(() => SortOrderSchema).optional(),
  refundedAmount: z.lazy(() => SortOrderSchema).optional(),
  subtotalUsd: z.lazy(() => SortOrderSchema).optional(),
  discountTotalUsd: z.lazy(() => SortOrderSchema).optional(),
  taxUsd: z.lazy(() => SortOrderSchema).optional(),
  totalUsd: z.lazy(() => SortOrderSchema).optional(),
  refundedAmountUsd: z.lazy(() => SortOrderSchema).optional(),
  cardBrand: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  cardLastFour: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  invoiceUrl: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  testMode: z.lazy(() => SortOrderSchema).optional(),
  refundedAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => PaymentHistoryCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => PaymentHistoryAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => PaymentHistoryMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => PaymentHistoryMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => PaymentHistorySumOrderByAggregateInputSchema).optional()
}).strict();

export const PaymentHistoryScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.PaymentHistoryScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => PaymentHistoryScalarWhereWithAggregatesInputSchema),z.lazy(() => PaymentHistoryScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => PaymentHistoryScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PaymentHistoryScalarWhereWithAggregatesInputSchema),z.lazy(() => PaymentHistoryScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  invoiceId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  subscriptionId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  customerId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  userEmail: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  billingReason: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  status: z.union([ z.lazy(() => EnumPaymentStatusWithAggregatesFilterSchema),z.lazy(() => PaymentStatusSchema) ]).optional(),
  statusFormatted: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  currency: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  currencyRate: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  subtotal: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  discountTotal: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  tax: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  taxInclusive: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema),z.boolean() ]).optional(),
  total: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  refundedAmount: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  subtotalUsd: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  discountTotalUsd: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  taxUsd: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  totalUsd: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  refundedAmountUsd: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  cardBrand: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  cardLastFour: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  invoiceUrl: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  testMode: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema),z.boolean() ]).optional(),
  refundedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema),z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const ProductWhereInputSchema: z.ZodType<Prisma.ProductWhereInput> = z.object({
  AND: z.union([ z.lazy(() => ProductWhereInputSchema),z.lazy(() => ProductWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ProductWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ProductWhereInputSchema),z.lazy(() => ProductWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  wholesalePrice: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  recommendedPrice: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  margin: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  competition: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  searchVolume: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  category: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  image: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  source: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  trend: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  score: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  margins: z.lazy(() => MarginListRelationFilterSchema).optional(),
  detailPages: z.lazy(() => DetailPageListRelationFilterSchema).optional(),
  registrations: z.lazy(() => RegistrationListRelationFilterSchema).optional()
}).strict();

export const ProductOrderByWithRelationInputSchema: z.ZodType<Prisma.ProductOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  wholesalePrice: z.lazy(() => SortOrderSchema).optional(),
  recommendedPrice: z.lazy(() => SortOrderSchema).optional(),
  margin: z.lazy(() => SortOrderSchema).optional(),
  competition: z.lazy(() => SortOrderSchema).optional(),
  searchVolume: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  image: z.lazy(() => SortOrderSchema).optional(),
  source: z.lazy(() => SortOrderSchema).optional(),
  trend: z.lazy(() => SortOrderSchema).optional(),
  score: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  margins: z.lazy(() => MarginOrderByRelationAggregateInputSchema).optional(),
  detailPages: z.lazy(() => DetailPageOrderByRelationAggregateInputSchema).optional(),
  registrations: z.lazy(() => RegistrationOrderByRelationAggregateInputSchema).optional()
}).strict();

export const ProductWhereUniqueInputSchema: z.ZodType<Prisma.ProductWhereUniqueInput> = z.object({
  id: z.number().int()
})
.and(z.object({
  id: z.number().int().optional(),
  AND: z.union([ z.lazy(() => ProductWhereInputSchema),z.lazy(() => ProductWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ProductWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ProductWhereInputSchema),z.lazy(() => ProductWhereInputSchema).array() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  wholesalePrice: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  recommendedPrice: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  margin: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  competition: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  searchVolume: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  category: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  image: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  source: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  trend: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  score: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  margins: z.lazy(() => MarginListRelationFilterSchema).optional(),
  detailPages: z.lazy(() => DetailPageListRelationFilterSchema).optional(),
  registrations: z.lazy(() => RegistrationListRelationFilterSchema).optional()
}).strict());

export const ProductOrderByWithAggregationInputSchema: z.ZodType<Prisma.ProductOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  wholesalePrice: z.lazy(() => SortOrderSchema).optional(),
  recommendedPrice: z.lazy(() => SortOrderSchema).optional(),
  margin: z.lazy(() => SortOrderSchema).optional(),
  competition: z.lazy(() => SortOrderSchema).optional(),
  searchVolume: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  image: z.lazy(() => SortOrderSchema).optional(),
  source: z.lazy(() => SortOrderSchema).optional(),
  trend: z.lazy(() => SortOrderSchema).optional(),
  score: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => ProductCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => ProductAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => ProductMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => ProductMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => ProductSumOrderByAggregateInputSchema).optional()
}).strict();

export const ProductScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.ProductScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => ProductScalarWhereWithAggregatesInputSchema),z.lazy(() => ProductScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => ProductScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ProductScalarWhereWithAggregatesInputSchema),z.lazy(() => ProductScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  name: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  wholesalePrice: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  recommendedPrice: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  margin: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  competition: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  searchVolume: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  category: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  image: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  source: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  trend: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  score: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const RecommendationWhereInputSchema: z.ZodType<Prisma.RecommendationWhereInput> = z.object({
  AND: z.union([ z.lazy(() => RecommendationWhereInputSchema),z.lazy(() => RecommendationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => RecommendationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => RecommendationWhereInputSchema),z.lazy(() => RecommendationWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  keyword: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  items: z.lazy(() => RecommendationItemListRelationFilterSchema).optional()
}).strict();

export const RecommendationOrderByWithRelationInputSchema: z.ZodType<Prisma.RecommendationOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  keyword: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  items: z.lazy(() => RecommendationItemOrderByRelationAggregateInputSchema).optional()
}).strict();

export const RecommendationWhereUniqueInputSchema: z.ZodType<Prisma.RecommendationWhereUniqueInput> = z.object({
  id: z.number().int()
})
.and(z.object({
  id: z.number().int().optional(),
  AND: z.union([ z.lazy(() => RecommendationWhereInputSchema),z.lazy(() => RecommendationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => RecommendationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => RecommendationWhereInputSchema),z.lazy(() => RecommendationWhereInputSchema).array() ]).optional(),
  keyword: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  items: z.lazy(() => RecommendationItemListRelationFilterSchema).optional()
}).strict());

export const RecommendationOrderByWithAggregationInputSchema: z.ZodType<Prisma.RecommendationOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  keyword: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => RecommendationCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => RecommendationAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => RecommendationMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => RecommendationMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => RecommendationSumOrderByAggregateInputSchema).optional()
}).strict();

export const RecommendationScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.RecommendationScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => RecommendationScalarWhereWithAggregatesInputSchema),z.lazy(() => RecommendationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => RecommendationScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => RecommendationScalarWhereWithAggregatesInputSchema),z.lazy(() => RecommendationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  keyword: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const RecommendationItemWhereInputSchema: z.ZodType<Prisma.RecommendationItemWhereInput> = z.object({
  AND: z.union([ z.lazy(() => RecommendationItemWhereInputSchema),z.lazy(() => RecommendationItemWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => RecommendationItemWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => RecommendationItemWhereInputSchema),z.lazy(() => RecommendationItemWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  recommendationId: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  wholesalePrice: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  recommendedPrice: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  margin: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  competition: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  searchVolume: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  trend: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  score: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  recommendation: z.union([ z.lazy(() => RecommendationScalarRelationFilterSchema),z.lazy(() => RecommendationWhereInputSchema) ]).optional(),
}).strict();

export const RecommendationItemOrderByWithRelationInputSchema: z.ZodType<Prisma.RecommendationItemOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  recommendationId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  wholesalePrice: z.lazy(() => SortOrderSchema).optional(),
  recommendedPrice: z.lazy(() => SortOrderSchema).optional(),
  margin: z.lazy(() => SortOrderSchema).optional(),
  competition: z.lazy(() => SortOrderSchema).optional(),
  searchVolume: z.lazy(() => SortOrderSchema).optional(),
  trend: z.lazy(() => SortOrderSchema).optional(),
  score: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  recommendation: z.lazy(() => RecommendationOrderByWithRelationInputSchema).optional()
}).strict();

export const RecommendationItemWhereUniqueInputSchema: z.ZodType<Prisma.RecommendationItemWhereUniqueInput> = z.object({
  id: z.number().int()
})
.and(z.object({
  id: z.number().int().optional(),
  AND: z.union([ z.lazy(() => RecommendationItemWhereInputSchema),z.lazy(() => RecommendationItemWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => RecommendationItemWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => RecommendationItemWhereInputSchema),z.lazy(() => RecommendationItemWhereInputSchema).array() ]).optional(),
  recommendationId: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  wholesalePrice: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  recommendedPrice: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  margin: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  competition: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  searchVolume: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  trend: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  score: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  recommendation: z.union([ z.lazy(() => RecommendationScalarRelationFilterSchema),z.lazy(() => RecommendationWhereInputSchema) ]).optional(),
}).strict());

export const RecommendationItemOrderByWithAggregationInputSchema: z.ZodType<Prisma.RecommendationItemOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  recommendationId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  wholesalePrice: z.lazy(() => SortOrderSchema).optional(),
  recommendedPrice: z.lazy(() => SortOrderSchema).optional(),
  margin: z.lazy(() => SortOrderSchema).optional(),
  competition: z.lazy(() => SortOrderSchema).optional(),
  searchVolume: z.lazy(() => SortOrderSchema).optional(),
  trend: z.lazy(() => SortOrderSchema).optional(),
  score: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => RecommendationItemCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => RecommendationItemAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => RecommendationItemMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => RecommendationItemMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => RecommendationItemSumOrderByAggregateInputSchema).optional()
}).strict();

export const RecommendationItemScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.RecommendationItemScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => RecommendationItemScalarWhereWithAggregatesInputSchema),z.lazy(() => RecommendationItemScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => RecommendationItemScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => RecommendationItemScalarWhereWithAggregatesInputSchema),z.lazy(() => RecommendationItemScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  recommendationId: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  name: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  wholesalePrice: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  recommendedPrice: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  margin: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  competition: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  searchVolume: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  trend: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  score: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const WholesaleProductWhereInputSchema: z.ZodType<Prisma.WholesaleProductWhereInput> = z.object({
  AND: z.union([ z.lazy(() => WholesaleProductWhereInputSchema),z.lazy(() => WholesaleProductWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => WholesaleProductWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => WholesaleProductWhereInputSchema),z.lazy(() => WholesaleProductWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  price: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  source: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  rating: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  minOrder: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  url: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  wholesaleGroupId: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  wholesaleGroup: z.union([ z.lazy(() => WholesaleGroupScalarRelationFilterSchema),z.lazy(() => WholesaleGroupWhereInputSchema) ]).optional(),
}).strict();

export const WholesaleProductOrderByWithRelationInputSchema: z.ZodType<Prisma.WholesaleProductOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  source: z.lazy(() => SortOrderSchema).optional(),
  rating: z.lazy(() => SortOrderSchema).optional(),
  minOrder: z.lazy(() => SortOrderSchema).optional(),
  url: z.lazy(() => SortOrderSchema).optional(),
  wholesaleGroupId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  wholesaleGroup: z.lazy(() => WholesaleGroupOrderByWithRelationInputSchema).optional()
}).strict();

export const WholesaleProductWhereUniqueInputSchema: z.ZodType<Prisma.WholesaleProductWhereUniqueInput> = z.object({
  id: z.number().int()
})
.and(z.object({
  id: z.number().int().optional(),
  AND: z.union([ z.lazy(() => WholesaleProductWhereInputSchema),z.lazy(() => WholesaleProductWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => WholesaleProductWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => WholesaleProductWhereInputSchema),z.lazy(() => WholesaleProductWhereInputSchema).array() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  price: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  source: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  rating: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  minOrder: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  url: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  wholesaleGroupId: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  wholesaleGroup: z.union([ z.lazy(() => WholesaleGroupScalarRelationFilterSchema),z.lazy(() => WholesaleGroupWhereInputSchema) ]).optional(),
}).strict());

export const WholesaleProductOrderByWithAggregationInputSchema: z.ZodType<Prisma.WholesaleProductOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  source: z.lazy(() => SortOrderSchema).optional(),
  rating: z.lazy(() => SortOrderSchema).optional(),
  minOrder: z.lazy(() => SortOrderSchema).optional(),
  url: z.lazy(() => SortOrderSchema).optional(),
  wholesaleGroupId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => WholesaleProductCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => WholesaleProductAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => WholesaleProductMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => WholesaleProductMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => WholesaleProductSumOrderByAggregateInputSchema).optional()
}).strict();

export const WholesaleProductScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.WholesaleProductScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => WholesaleProductScalarWhereWithAggregatesInputSchema),z.lazy(() => WholesaleProductScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => WholesaleProductScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => WholesaleProductScalarWhereWithAggregatesInputSchema),z.lazy(() => WholesaleProductScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  name: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  price: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  source: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  rating: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  minOrder: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  url: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  wholesaleGroupId: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const WholesaleGroupWhereInputSchema: z.ZodType<Prisma.WholesaleGroupWhereInput> = z.object({
  AND: z.union([ z.lazy(() => WholesaleGroupWhereInputSchema),z.lazy(() => WholesaleGroupWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => WholesaleGroupWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => WholesaleGroupWhereInputSchema),z.lazy(() => WholesaleGroupWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  keyword: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  products: z.lazy(() => WholesaleProductListRelationFilterSchema).optional()
}).strict();

export const WholesaleGroupOrderByWithRelationInputSchema: z.ZodType<Prisma.WholesaleGroupOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  keyword: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  products: z.lazy(() => WholesaleProductOrderByRelationAggregateInputSchema).optional()
}).strict();

export const WholesaleGroupWhereUniqueInputSchema: z.ZodType<Prisma.WholesaleGroupWhereUniqueInput> = z.object({
  id: z.number().int()
})
.and(z.object({
  id: z.number().int().optional(),
  AND: z.union([ z.lazy(() => WholesaleGroupWhereInputSchema),z.lazy(() => WholesaleGroupWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => WholesaleGroupWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => WholesaleGroupWhereInputSchema),z.lazy(() => WholesaleGroupWhereInputSchema).array() ]).optional(),
  keyword: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  products: z.lazy(() => WholesaleProductListRelationFilterSchema).optional()
}).strict());

export const WholesaleGroupOrderByWithAggregationInputSchema: z.ZodType<Prisma.WholesaleGroupOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  keyword: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => WholesaleGroupCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => WholesaleGroupAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => WholesaleGroupMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => WholesaleGroupMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => WholesaleGroupSumOrderByAggregateInputSchema).optional()
}).strict();

export const WholesaleGroupScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.WholesaleGroupScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => WholesaleGroupScalarWhereWithAggregatesInputSchema),z.lazy(() => WholesaleGroupScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => WholesaleGroupScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => WholesaleGroupScalarWhereWithAggregatesInputSchema),z.lazy(() => WholesaleGroupScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  keyword: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const MarginWhereInputSchema: z.ZodType<Prisma.MarginWhereInput> = z.object({
  AND: z.union([ z.lazy(() => MarginWhereInputSchema),z.lazy(() => MarginWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => MarginWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => MarginWhereInputSchema),z.lazy(() => MarginWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  productId: z.union([ z.lazy(() => IntNullableFilterSchema),z.number() ]).optional().nullable(),
  productName: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  wholesalePrice: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  sellingPrice: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  shippingCost: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  commission: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  adCost: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  packagingCost: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  netMargin: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  marginRate: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  platform: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  calculatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  product: z.union([ z.lazy(() => ProductNullableScalarRelationFilterSchema),z.lazy(() => ProductWhereInputSchema) ]).optional().nullable(),
}).strict();

export const MarginOrderByWithRelationInputSchema: z.ZodType<Prisma.MarginOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  productId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  productName: z.lazy(() => SortOrderSchema).optional(),
  wholesalePrice: z.lazy(() => SortOrderSchema).optional(),
  sellingPrice: z.lazy(() => SortOrderSchema).optional(),
  shippingCost: z.lazy(() => SortOrderSchema).optional(),
  commission: z.lazy(() => SortOrderSchema).optional(),
  adCost: z.lazy(() => SortOrderSchema).optional(),
  packagingCost: z.lazy(() => SortOrderSchema).optional(),
  netMargin: z.lazy(() => SortOrderSchema).optional(),
  marginRate: z.lazy(() => SortOrderSchema).optional(),
  platform: z.lazy(() => SortOrderSchema).optional(),
  calculatedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  product: z.lazy(() => ProductOrderByWithRelationInputSchema).optional()
}).strict();

export const MarginWhereUniqueInputSchema: z.ZodType<Prisma.MarginWhereUniqueInput> = z.object({
  id: z.number().int()
})
.and(z.object({
  id: z.number().int().optional(),
  AND: z.union([ z.lazy(() => MarginWhereInputSchema),z.lazy(() => MarginWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => MarginWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => MarginWhereInputSchema),z.lazy(() => MarginWhereInputSchema).array() ]).optional(),
  productId: z.union([ z.lazy(() => IntNullableFilterSchema),z.number().int() ]).optional().nullable(),
  productName: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  wholesalePrice: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  sellingPrice: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  shippingCost: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  commission: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  adCost: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  packagingCost: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  netMargin: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  marginRate: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  platform: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  calculatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  product: z.union([ z.lazy(() => ProductNullableScalarRelationFilterSchema),z.lazy(() => ProductWhereInputSchema) ]).optional().nullable(),
}).strict());

export const MarginOrderByWithAggregationInputSchema: z.ZodType<Prisma.MarginOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  productId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  productName: z.lazy(() => SortOrderSchema).optional(),
  wholesalePrice: z.lazy(() => SortOrderSchema).optional(),
  sellingPrice: z.lazy(() => SortOrderSchema).optional(),
  shippingCost: z.lazy(() => SortOrderSchema).optional(),
  commission: z.lazy(() => SortOrderSchema).optional(),
  adCost: z.lazy(() => SortOrderSchema).optional(),
  packagingCost: z.lazy(() => SortOrderSchema).optional(),
  netMargin: z.lazy(() => SortOrderSchema).optional(),
  marginRate: z.lazy(() => SortOrderSchema).optional(),
  platform: z.lazy(() => SortOrderSchema).optional(),
  calculatedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => MarginCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => MarginAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => MarginMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => MarginMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => MarginSumOrderByAggregateInputSchema).optional()
}).strict();

export const MarginScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.MarginScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => MarginScalarWhereWithAggregatesInputSchema),z.lazy(() => MarginScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => MarginScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => MarginScalarWhereWithAggregatesInputSchema),z.lazy(() => MarginScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  productId: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema),z.number() ]).optional().nullable(),
  productName: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  wholesalePrice: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  sellingPrice: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  shippingCost: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  commission: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  adCost: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  packagingCost: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  netMargin: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  marginRate: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  platform: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  calculatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const DetailPageWhereInputSchema: z.ZodType<Prisma.DetailPageWhereInput> = z.object({
  AND: z.union([ z.lazy(() => DetailPageWhereInputSchema),z.lazy(() => DetailPageWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => DetailPageWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => DetailPageWhereInputSchema),z.lazy(() => DetailPageWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  productId: z.union([ z.lazy(() => IntNullableFilterSchema),z.number() ]).optional().nullable(),
  productName: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  summary: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  usps: z.lazy(() => StringNullableListFilterSchema).optional(),
  keywords: z.lazy(() => StringNullableListFilterSchema).optional(),
  template: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  product: z.union([ z.lazy(() => ProductNullableScalarRelationFilterSchema),z.lazy(() => ProductWhereInputSchema) ]).optional().nullable(),
}).strict();

export const DetailPageOrderByWithRelationInputSchema: z.ZodType<Prisma.DetailPageOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  productId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  productName: z.lazy(() => SortOrderSchema).optional(),
  summary: z.lazy(() => SortOrderSchema).optional(),
  usps: z.lazy(() => SortOrderSchema).optional(),
  keywords: z.lazy(() => SortOrderSchema).optional(),
  template: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  product: z.lazy(() => ProductOrderByWithRelationInputSchema).optional()
}).strict();

export const DetailPageWhereUniqueInputSchema: z.ZodType<Prisma.DetailPageWhereUniqueInput> = z.object({
  id: z.number().int()
})
.and(z.object({
  id: z.number().int().optional(),
  AND: z.union([ z.lazy(() => DetailPageWhereInputSchema),z.lazy(() => DetailPageWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => DetailPageWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => DetailPageWhereInputSchema),z.lazy(() => DetailPageWhereInputSchema).array() ]).optional(),
  productId: z.union([ z.lazy(() => IntNullableFilterSchema),z.number().int() ]).optional().nullable(),
  productName: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  summary: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  usps: z.lazy(() => StringNullableListFilterSchema).optional(),
  keywords: z.lazy(() => StringNullableListFilterSchema).optional(),
  template: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  product: z.union([ z.lazy(() => ProductNullableScalarRelationFilterSchema),z.lazy(() => ProductWhereInputSchema) ]).optional().nullable(),
}).strict());

export const DetailPageOrderByWithAggregationInputSchema: z.ZodType<Prisma.DetailPageOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  productId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  productName: z.lazy(() => SortOrderSchema).optional(),
  summary: z.lazy(() => SortOrderSchema).optional(),
  usps: z.lazy(() => SortOrderSchema).optional(),
  keywords: z.lazy(() => SortOrderSchema).optional(),
  template: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => DetailPageCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => DetailPageAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => DetailPageMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => DetailPageMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => DetailPageSumOrderByAggregateInputSchema).optional()
}).strict();

export const DetailPageScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.DetailPageScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => DetailPageScalarWhereWithAggregatesInputSchema),z.lazy(() => DetailPageScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => DetailPageScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => DetailPageScalarWhereWithAggregatesInputSchema),z.lazy(() => DetailPageScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  productId: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema),z.number() ]).optional().nullable(),
  productName: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  summary: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  usps: z.lazy(() => StringNullableListFilterSchema).optional(),
  keywords: z.lazy(() => StringNullableListFilterSchema).optional(),
  template: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const RegistrationWhereInputSchema: z.ZodType<Prisma.RegistrationWhereInput> = z.object({
  AND: z.union([ z.lazy(() => RegistrationWhereInputSchema),z.lazy(() => RegistrationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => RegistrationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => RegistrationWhereInputSchema),z.lazy(() => RegistrationWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  productId: z.union([ z.lazy(() => IntNullableFilterSchema),z.number() ]).optional().nullable(),
  productName: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  category: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  recommendedTitle: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  price: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  wholesalePrice: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  status: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  platform: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  product: z.union([ z.lazy(() => ProductNullableScalarRelationFilterSchema),z.lazy(() => ProductWhereInputSchema) ]).optional().nullable(),
}).strict();

export const RegistrationOrderByWithRelationInputSchema: z.ZodType<Prisma.RegistrationOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  productId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  productName: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  recommendedTitle: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  wholesalePrice: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  platform: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  product: z.lazy(() => ProductOrderByWithRelationInputSchema).optional()
}).strict();

export const RegistrationWhereUniqueInputSchema: z.ZodType<Prisma.RegistrationWhereUniqueInput> = z.object({
  id: z.number().int()
})
.and(z.object({
  id: z.number().int().optional(),
  AND: z.union([ z.lazy(() => RegistrationWhereInputSchema),z.lazy(() => RegistrationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => RegistrationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => RegistrationWhereInputSchema),z.lazy(() => RegistrationWhereInputSchema).array() ]).optional(),
  productId: z.union([ z.lazy(() => IntNullableFilterSchema),z.number().int() ]).optional().nullable(),
  productName: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  category: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  recommendedTitle: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  price: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  wholesalePrice: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  status: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  platform: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  product: z.union([ z.lazy(() => ProductNullableScalarRelationFilterSchema),z.lazy(() => ProductWhereInputSchema) ]).optional().nullable(),
}).strict());

export const RegistrationOrderByWithAggregationInputSchema: z.ZodType<Prisma.RegistrationOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  productId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  productName: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  recommendedTitle: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  wholesalePrice: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  platform: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => RegistrationCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => RegistrationAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => RegistrationMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => RegistrationMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => RegistrationSumOrderByAggregateInputSchema).optional()
}).strict();

export const RegistrationScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.RegistrationScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => RegistrationScalarWhereWithAggregatesInputSchema),z.lazy(() => RegistrationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => RegistrationScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => RegistrationScalarWhereWithAggregatesInputSchema),z.lazy(() => RegistrationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  productId: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema),z.number() ]).optional().nullable(),
  productName: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  category: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  recommendedTitle: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  price: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  wholesalePrice: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  status: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  platform: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const ActivityLogWhereInputSchema: z.ZodType<Prisma.ActivityLogWhereInput> = z.object({
  AND: z.union([ z.lazy(() => ActivityLogWhereInputSchema),z.lazy(() => ActivityLogWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ActivityLogWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ActivityLogWhereInputSchema),z.lazy(() => ActivityLogWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  action: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  productName: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  status: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  price: z.union([ z.lazy(() => IntNullableFilterSchema),z.number() ]).optional().nullable(),
  details: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  timestamp: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const ActivityLogOrderByWithRelationInputSchema: z.ZodType<Prisma.ActivityLogOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  action: z.lazy(() => SortOrderSchema).optional(),
  productName: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  price: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  details: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  timestamp: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const ActivityLogWhereUniqueInputSchema: z.ZodType<Prisma.ActivityLogWhereUniqueInput> = z.object({
  id: z.number().int()
})
.and(z.object({
  id: z.number().int().optional(),
  AND: z.union([ z.lazy(() => ActivityLogWhereInputSchema),z.lazy(() => ActivityLogWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ActivityLogWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ActivityLogWhereInputSchema),z.lazy(() => ActivityLogWhereInputSchema).array() ]).optional(),
  action: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  productName: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  status: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  price: z.union([ z.lazy(() => IntNullableFilterSchema),z.number().int() ]).optional().nullable(),
  details: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  timestamp: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict());

export const ActivityLogOrderByWithAggregationInputSchema: z.ZodType<Prisma.ActivityLogOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  action: z.lazy(() => SortOrderSchema).optional(),
  productName: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  price: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  details: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  timestamp: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => ActivityLogCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => ActivityLogAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => ActivityLogMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => ActivityLogMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => ActivityLogSumOrderByAggregateInputSchema).optional()
}).strict();

export const ActivityLogScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.ActivityLogScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => ActivityLogScalarWhereWithAggregatesInputSchema),z.lazy(() => ActivityLogScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => ActivityLogScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ActivityLogScalarWhereWithAggregatesInputSchema),z.lazy(() => ActivityLogScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  action: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  productName: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  status: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  price: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema),z.number() ]).optional().nullable(),
  details: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  timestamp: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const DailyStatWhereInputSchema: z.ZodType<Prisma.DailyStatWhereInput> = z.object({
  AND: z.union([ z.lazy(() => DailyStatWhereInputSchema),z.lazy(() => DailyStatWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => DailyStatWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => DailyStatWhereInputSchema),z.lazy(() => DailyStatWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  date: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  revenue: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  products: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  margin: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const DailyStatOrderByWithRelationInputSchema: z.ZodType<Prisma.DailyStatOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional(),
  revenue: z.lazy(() => SortOrderSchema).optional(),
  products: z.lazy(() => SortOrderSchema).optional(),
  margin: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const DailyStatWhereUniqueInputSchema: z.ZodType<Prisma.DailyStatWhereUniqueInput> = z.object({
  id: z.number().int()
})
.and(z.object({
  id: z.number().int().optional(),
  AND: z.union([ z.lazy(() => DailyStatWhereInputSchema),z.lazy(() => DailyStatWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => DailyStatWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => DailyStatWhereInputSchema),z.lazy(() => DailyStatWhereInputSchema).array() ]).optional(),
  date: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  revenue: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  products: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  margin: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict());

export const DailyStatOrderByWithAggregationInputSchema: z.ZodType<Prisma.DailyStatOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional(),
  revenue: z.lazy(() => SortOrderSchema).optional(),
  products: z.lazy(() => SortOrderSchema).optional(),
  margin: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => DailyStatCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => DailyStatAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => DailyStatMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => DailyStatMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => DailyStatSumOrderByAggregateInputSchema).optional()
}).strict();

export const DailyStatScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.DailyStatScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => DailyStatScalarWhereWithAggregatesInputSchema),z.lazy(() => DailyStatScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => DailyStatScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => DailyStatScalarWhereWithAggregatesInputSchema),z.lazy(() => DailyStatScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  date: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  revenue: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  products: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  margin: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const UserCreateInputSchema: z.ZodType<Prisma.UserCreateInput> = z.object({
  id: z.string(),
  clerkId: z.string(),
  email: z.string(),
  username: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  subscription: z.lazy(() => SubscriptionCreateNestedOneWithoutUserInputSchema).optional(),
  paymentHistories: z.lazy(() => PaymentHistoryCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserUncheckedCreateInputSchema: z.ZodType<Prisma.UserUncheckedCreateInput> = z.object({
  id: z.string(),
  clerkId: z.string(),
  email: z.string(),
  username: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  subscription: z.lazy(() => SubscriptionUncheckedCreateNestedOneWithoutUserInputSchema).optional(),
  paymentHistories: z.lazy(() => PaymentHistoryUncheckedCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserUpdateInputSchema: z.ZodType<Prisma.UserUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  clerkId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  subscription: z.lazy(() => SubscriptionUpdateOneWithoutUserNestedInputSchema).optional(),
  paymentHistories: z.lazy(() => PaymentHistoryUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const UserUncheckedUpdateInputSchema: z.ZodType<Prisma.UserUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  clerkId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  subscription: z.lazy(() => SubscriptionUncheckedUpdateOneWithoutUserNestedInputSchema).optional(),
  paymentHistories: z.lazy(() => PaymentHistoryUncheckedUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const UserCreateManyInputSchema: z.ZodType<Prisma.UserCreateManyInput> = z.object({
  id: z.string(),
  clerkId: z.string(),
  email: z.string(),
  username: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const UserUpdateManyMutationInputSchema: z.ZodType<Prisma.UserUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  clerkId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const UserUncheckedUpdateManyInputSchema: z.ZodType<Prisma.UserUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  clerkId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const SubscriptionCreateInputSchema: z.ZodType<Prisma.SubscriptionCreateInput> = z.object({
  id: z.string(),
  status: z.lazy(() => SubscriptionStatusSchema),
  lemonSqueezyId: z.string(),
  lemonSubscriptionItemId: z.string().optional().nullable(),
  lemonCustomerId: z.string(),
  lemonOrderId: z.string(),
  lemonProductId: z.string(),
  lemonVariantId: z.string(),
  renewsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  paymentMethod: z.lazy(() => SubscriptionPaymentMethodSchema),
  cardBrand: z.string().optional().nullable(),
  cardLast4: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutSubscriptionInputSchema),
  plan: z.lazy(() => PlanCreateNestedOneWithoutSubscriptionsInputSchema)
}).strict();

export const SubscriptionUncheckedCreateInputSchema: z.ZodType<Prisma.SubscriptionUncheckedCreateInput> = z.object({
  id: z.string(),
  userId: z.string(),
  planId: z.string(),
  status: z.lazy(() => SubscriptionStatusSchema),
  lemonSqueezyId: z.string(),
  lemonSubscriptionItemId: z.string().optional().nullable(),
  lemonCustomerId: z.string(),
  lemonOrderId: z.string(),
  lemonProductId: z.string(),
  lemonVariantId: z.string(),
  renewsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  paymentMethod: z.lazy(() => SubscriptionPaymentMethodSchema),
  cardBrand: z.string().optional().nullable(),
  cardLast4: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const SubscriptionUpdateInputSchema: z.ZodType<Prisma.SubscriptionUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => SubscriptionStatusSchema),z.lazy(() => EnumSubscriptionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  lemonSqueezyId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonSubscriptionItemId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lemonCustomerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonOrderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonProductId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonVariantId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  renewsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  paymentMethod: z.union([ z.lazy(() => SubscriptionPaymentMethodSchema),z.lazy(() => EnumSubscriptionPaymentMethodFieldUpdateOperationsInputSchema) ]).optional(),
  cardBrand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cardLast4: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutSubscriptionNestedInputSchema).optional(),
  plan: z.lazy(() => PlanUpdateOneRequiredWithoutSubscriptionsNestedInputSchema).optional()
}).strict();

export const SubscriptionUncheckedUpdateInputSchema: z.ZodType<Prisma.SubscriptionUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  planId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => SubscriptionStatusSchema),z.lazy(() => EnumSubscriptionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  lemonSqueezyId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonSubscriptionItemId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lemonCustomerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonOrderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonProductId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonVariantId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  renewsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  paymentMethod: z.union([ z.lazy(() => SubscriptionPaymentMethodSchema),z.lazy(() => EnumSubscriptionPaymentMethodFieldUpdateOperationsInputSchema) ]).optional(),
  cardBrand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cardLast4: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const SubscriptionCreateManyInputSchema: z.ZodType<Prisma.SubscriptionCreateManyInput> = z.object({
  id: z.string(),
  userId: z.string(),
  planId: z.string(),
  status: z.lazy(() => SubscriptionStatusSchema),
  lemonSqueezyId: z.string(),
  lemonSubscriptionItemId: z.string().optional().nullable(),
  lemonCustomerId: z.string(),
  lemonOrderId: z.string(),
  lemonProductId: z.string(),
  lemonVariantId: z.string(),
  renewsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  paymentMethod: z.lazy(() => SubscriptionPaymentMethodSchema),
  cardBrand: z.string().optional().nullable(),
  cardLast4: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const SubscriptionUpdateManyMutationInputSchema: z.ZodType<Prisma.SubscriptionUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => SubscriptionStatusSchema),z.lazy(() => EnumSubscriptionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  lemonSqueezyId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonSubscriptionItemId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lemonCustomerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonOrderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonProductId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonVariantId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  renewsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  paymentMethod: z.union([ z.lazy(() => SubscriptionPaymentMethodSchema),z.lazy(() => EnumSubscriptionPaymentMethodFieldUpdateOperationsInputSchema) ]).optional(),
  cardBrand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cardLast4: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const SubscriptionUncheckedUpdateManyInputSchema: z.ZodType<Prisma.SubscriptionUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  planId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => SubscriptionStatusSchema),z.lazy(() => EnumSubscriptionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  lemonSqueezyId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonSubscriptionItemId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lemonCustomerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonOrderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonProductId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonVariantId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  renewsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  paymentMethod: z.union([ z.lazy(() => SubscriptionPaymentMethodSchema),z.lazy(() => EnumSubscriptionPaymentMethodFieldUpdateOperationsInputSchema) ]).optional(),
  cardBrand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cardLast4: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const PlanCreateInputSchema: z.ZodType<Prisma.PlanCreateInput> = z.object({
  id: z.string(),
  title: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  content: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  available: z.boolean().optional(),
  price: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  lemonSqueezyProductId: z.string(),
  lemonSqueezyVariantId: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  subscriptions: z.lazy(() => SubscriptionCreateNestedManyWithoutPlanInputSchema).optional()
}).strict();

export const PlanUncheckedCreateInputSchema: z.ZodType<Prisma.PlanUncheckedCreateInput> = z.object({
  id: z.string(),
  title: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  content: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  available: z.boolean().optional(),
  price: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  lemonSqueezyProductId: z.string(),
  lemonSqueezyVariantId: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  subscriptions: z.lazy(() => SubscriptionUncheckedCreateNestedManyWithoutPlanInputSchema).optional()
}).strict();

export const PlanUpdateInputSchema: z.ZodType<Prisma.PlanUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  content: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  available: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  lemonSqueezyProductId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonSqueezyVariantId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  subscriptions: z.lazy(() => SubscriptionUpdateManyWithoutPlanNestedInputSchema).optional()
}).strict();

export const PlanUncheckedUpdateInputSchema: z.ZodType<Prisma.PlanUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  content: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  available: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  lemonSqueezyProductId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonSqueezyVariantId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  subscriptions: z.lazy(() => SubscriptionUncheckedUpdateManyWithoutPlanNestedInputSchema).optional()
}).strict();

export const PlanCreateManyInputSchema: z.ZodType<Prisma.PlanCreateManyInput> = z.object({
  id: z.string(),
  title: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  content: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  available: z.boolean().optional(),
  price: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  lemonSqueezyProductId: z.string(),
  lemonSqueezyVariantId: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const PlanUpdateManyMutationInputSchema: z.ZodType<Prisma.PlanUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  content: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  available: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  lemonSqueezyProductId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonSqueezyVariantId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const PlanUncheckedUpdateManyInputSchema: z.ZodType<Prisma.PlanUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  content: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  available: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  lemonSqueezyProductId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonSqueezyVariantId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const WebhookEventCreateInputSchema: z.ZodType<Prisma.WebhookEventCreateInput> = z.object({
  id: z.string(),
  eventId: z.string(),
  eventName: z.string(),
  resourceId: z.string(),
  processedAt: z.coerce.date().optional(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]),
  createdAt: z.coerce.date().optional()
}).strict();

export const WebhookEventUncheckedCreateInputSchema: z.ZodType<Prisma.WebhookEventUncheckedCreateInput> = z.object({
  id: z.string(),
  eventId: z.string(),
  eventName: z.string(),
  resourceId: z.string(),
  processedAt: z.coerce.date().optional(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]),
  createdAt: z.coerce.date().optional()
}).strict();

export const WebhookEventUpdateInputSchema: z.ZodType<Prisma.WebhookEventUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  resourceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  processedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const WebhookEventUncheckedUpdateInputSchema: z.ZodType<Prisma.WebhookEventUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  resourceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  processedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const WebhookEventCreateManyInputSchema: z.ZodType<Prisma.WebhookEventCreateManyInput> = z.object({
  id: z.string(),
  eventId: z.string(),
  eventName: z.string(),
  resourceId: z.string(),
  processedAt: z.coerce.date().optional(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]),
  createdAt: z.coerce.date().optional()
}).strict();

export const WebhookEventUpdateManyMutationInputSchema: z.ZodType<Prisma.WebhookEventUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  resourceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  processedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const WebhookEventUncheckedUpdateManyInputSchema: z.ZodType<Prisma.WebhookEventUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  eventName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  resourceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  processedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  payload: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const PaymentHistoryCreateInputSchema: z.ZodType<Prisma.PaymentHistoryCreateInput> = z.object({
  id: z.string(),
  invoiceId: z.string(),
  subscriptionId: z.string(),
  customerId: z.string(),
  userEmail: z.string(),
  billingReason: z.string(),
  status: z.lazy(() => PaymentStatusSchema),
  statusFormatted: z.string(),
  currency: z.string(),
  currencyRate: z.string(),
  subtotal: z.number().int(),
  discountTotal: z.number().int(),
  tax: z.number().int(),
  taxInclusive: z.boolean(),
  total: z.number().int(),
  refundedAmount: z.number().int().optional(),
  subtotalUsd: z.number().int(),
  discountTotalUsd: z.number().int(),
  taxUsd: z.number().int(),
  totalUsd: z.number().int(),
  refundedAmountUsd: z.number().int().optional(),
  cardBrand: z.string().optional().nullable(),
  cardLastFour: z.string().optional().nullable(),
  invoiceUrl: z.string().optional().nullable(),
  testMode: z.boolean().optional(),
  refundedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutPaymentHistoriesInputSchema)
}).strict();

export const PaymentHistoryUncheckedCreateInputSchema: z.ZodType<Prisma.PaymentHistoryUncheckedCreateInput> = z.object({
  id: z.string(),
  userId: z.string(),
  invoiceId: z.string(),
  subscriptionId: z.string(),
  customerId: z.string(),
  userEmail: z.string(),
  billingReason: z.string(),
  status: z.lazy(() => PaymentStatusSchema),
  statusFormatted: z.string(),
  currency: z.string(),
  currencyRate: z.string(),
  subtotal: z.number().int(),
  discountTotal: z.number().int(),
  tax: z.number().int(),
  taxInclusive: z.boolean(),
  total: z.number().int(),
  refundedAmount: z.number().int().optional(),
  subtotalUsd: z.number().int(),
  discountTotalUsd: z.number().int(),
  taxUsd: z.number().int(),
  totalUsd: z.number().int(),
  refundedAmountUsd: z.number().int().optional(),
  cardBrand: z.string().optional().nullable(),
  cardLastFour: z.string().optional().nullable(),
  invoiceUrl: z.string().optional().nullable(),
  testMode: z.boolean().optional(),
  refundedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const PaymentHistoryUpdateInputSchema: z.ZodType<Prisma.PaymentHistoryUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  invoiceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subscriptionId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userEmail: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  billingReason: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => PaymentStatusSchema),z.lazy(() => EnumPaymentStatusFieldUpdateOperationsInputSchema) ]).optional(),
  statusFormatted: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currencyRate: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subtotal: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  discountTotal: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  tax: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  taxInclusive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  total: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  subtotalUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  discountTotalUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  taxUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  totalUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedAmountUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  cardBrand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cardLastFour: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  invoiceUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  testMode: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  refundedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutPaymentHistoriesNestedInputSchema).optional()
}).strict();

export const PaymentHistoryUncheckedUpdateInputSchema: z.ZodType<Prisma.PaymentHistoryUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  invoiceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subscriptionId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userEmail: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  billingReason: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => PaymentStatusSchema),z.lazy(() => EnumPaymentStatusFieldUpdateOperationsInputSchema) ]).optional(),
  statusFormatted: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currencyRate: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subtotal: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  discountTotal: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  tax: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  taxInclusive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  total: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  subtotalUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  discountTotalUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  taxUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  totalUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedAmountUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  cardBrand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cardLastFour: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  invoiceUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  testMode: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  refundedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const PaymentHistoryCreateManyInputSchema: z.ZodType<Prisma.PaymentHistoryCreateManyInput> = z.object({
  id: z.string(),
  userId: z.string(),
  invoiceId: z.string(),
  subscriptionId: z.string(),
  customerId: z.string(),
  userEmail: z.string(),
  billingReason: z.string(),
  status: z.lazy(() => PaymentStatusSchema),
  statusFormatted: z.string(),
  currency: z.string(),
  currencyRate: z.string(),
  subtotal: z.number().int(),
  discountTotal: z.number().int(),
  tax: z.number().int(),
  taxInclusive: z.boolean(),
  total: z.number().int(),
  refundedAmount: z.number().int().optional(),
  subtotalUsd: z.number().int(),
  discountTotalUsd: z.number().int(),
  taxUsd: z.number().int(),
  totalUsd: z.number().int(),
  refundedAmountUsd: z.number().int().optional(),
  cardBrand: z.string().optional().nullable(),
  cardLastFour: z.string().optional().nullable(),
  invoiceUrl: z.string().optional().nullable(),
  testMode: z.boolean().optional(),
  refundedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const PaymentHistoryUpdateManyMutationInputSchema: z.ZodType<Prisma.PaymentHistoryUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  invoiceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subscriptionId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userEmail: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  billingReason: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => PaymentStatusSchema),z.lazy(() => EnumPaymentStatusFieldUpdateOperationsInputSchema) ]).optional(),
  statusFormatted: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currencyRate: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subtotal: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  discountTotal: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  tax: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  taxInclusive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  total: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  subtotalUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  discountTotalUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  taxUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  totalUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedAmountUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  cardBrand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cardLastFour: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  invoiceUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  testMode: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  refundedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const PaymentHistoryUncheckedUpdateManyInputSchema: z.ZodType<Prisma.PaymentHistoryUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  invoiceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subscriptionId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userEmail: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  billingReason: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => PaymentStatusSchema),z.lazy(() => EnumPaymentStatusFieldUpdateOperationsInputSchema) ]).optional(),
  statusFormatted: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currencyRate: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subtotal: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  discountTotal: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  tax: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  taxInclusive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  total: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  subtotalUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  discountTotalUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  taxUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  totalUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedAmountUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  cardBrand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cardLastFour: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  invoiceUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  testMode: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  refundedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const ProductCreateInputSchema: z.ZodType<Prisma.ProductCreateInput> = z.object({
  name: z.string(),
  wholesalePrice: z.number().int(),
  recommendedPrice: z.number().int(),
  margin: z.number(),
  competition: z.string(),
  searchVolume: z.number().int(),
  category: z.string(),
  image: z.string(),
  source: z.string(),
  trend: z.string(),
  score: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  margins: z.lazy(() => MarginCreateNestedManyWithoutProductInputSchema).optional(),
  detailPages: z.lazy(() => DetailPageCreateNestedManyWithoutProductInputSchema).optional(),
  registrations: z.lazy(() => RegistrationCreateNestedManyWithoutProductInputSchema).optional()
}).strict();

export const ProductUncheckedCreateInputSchema: z.ZodType<Prisma.ProductUncheckedCreateInput> = z.object({
  id: z.number().int().optional(),
  name: z.string(),
  wholesalePrice: z.number().int(),
  recommendedPrice: z.number().int(),
  margin: z.number(),
  competition: z.string(),
  searchVolume: z.number().int(),
  category: z.string(),
  image: z.string(),
  source: z.string(),
  trend: z.string(),
  score: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  margins: z.lazy(() => MarginUncheckedCreateNestedManyWithoutProductInputSchema).optional(),
  detailPages: z.lazy(() => DetailPageUncheckedCreateNestedManyWithoutProductInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUncheckedCreateNestedManyWithoutProductInputSchema).optional()
}).strict();

export const ProductUpdateInputSchema: z.ZodType<Prisma.ProductUpdateInput> = z.object({
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  wholesalePrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  recommendedPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  margin: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  competition: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  searchVolume: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  source: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  trend: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  score: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  margins: z.lazy(() => MarginUpdateManyWithoutProductNestedInputSchema).optional(),
  detailPages: z.lazy(() => DetailPageUpdateManyWithoutProductNestedInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUpdateManyWithoutProductNestedInputSchema).optional()
}).strict();

export const ProductUncheckedUpdateInputSchema: z.ZodType<Prisma.ProductUncheckedUpdateInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  wholesalePrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  recommendedPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  margin: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  competition: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  searchVolume: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  source: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  trend: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  score: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  margins: z.lazy(() => MarginUncheckedUpdateManyWithoutProductNestedInputSchema).optional(),
  detailPages: z.lazy(() => DetailPageUncheckedUpdateManyWithoutProductNestedInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUncheckedUpdateManyWithoutProductNestedInputSchema).optional()
}).strict();

export const ProductCreateManyInputSchema: z.ZodType<Prisma.ProductCreateManyInput> = z.object({
  id: z.number().int().optional(),
  name: z.string(),
  wholesalePrice: z.number().int(),
  recommendedPrice: z.number().int(),
  margin: z.number(),
  competition: z.string(),
  searchVolume: z.number().int(),
  category: z.string(),
  image: z.string(),
  source: z.string(),
  trend: z.string(),
  score: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const ProductUpdateManyMutationInputSchema: z.ZodType<Prisma.ProductUpdateManyMutationInput> = z.object({
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  wholesalePrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  recommendedPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  margin: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  competition: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  searchVolume: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  source: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  trend: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  score: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const ProductUncheckedUpdateManyInputSchema: z.ZodType<Prisma.ProductUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  wholesalePrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  recommendedPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  margin: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  competition: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  searchVolume: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  source: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  trend: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  score: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const RecommendationCreateInputSchema: z.ZodType<Prisma.RecommendationCreateInput> = z.object({
  keyword: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  items: z.lazy(() => RecommendationItemCreateNestedManyWithoutRecommendationInputSchema).optional()
}).strict();

export const RecommendationUncheckedCreateInputSchema: z.ZodType<Prisma.RecommendationUncheckedCreateInput> = z.object({
  id: z.number().int().optional(),
  keyword: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  items: z.lazy(() => RecommendationItemUncheckedCreateNestedManyWithoutRecommendationInputSchema).optional()
}).strict();

export const RecommendationUpdateInputSchema: z.ZodType<Prisma.RecommendationUpdateInput> = z.object({
  keyword: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  items: z.lazy(() => RecommendationItemUpdateManyWithoutRecommendationNestedInputSchema).optional()
}).strict();

export const RecommendationUncheckedUpdateInputSchema: z.ZodType<Prisma.RecommendationUncheckedUpdateInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  keyword: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  items: z.lazy(() => RecommendationItemUncheckedUpdateManyWithoutRecommendationNestedInputSchema).optional()
}).strict();

export const RecommendationCreateManyInputSchema: z.ZodType<Prisma.RecommendationCreateManyInput> = z.object({
  id: z.number().int().optional(),
  keyword: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const RecommendationUpdateManyMutationInputSchema: z.ZodType<Prisma.RecommendationUpdateManyMutationInput> = z.object({
  keyword: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const RecommendationUncheckedUpdateManyInputSchema: z.ZodType<Prisma.RecommendationUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  keyword: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const RecommendationItemCreateInputSchema: z.ZodType<Prisma.RecommendationItemCreateInput> = z.object({
  name: z.string(),
  wholesalePrice: z.number().int(),
  recommendedPrice: z.number().int(),
  margin: z.number(),
  competition: z.string(),
  searchVolume: z.number().int(),
  trend: z.string(),
  score: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  recommendation: z.lazy(() => RecommendationCreateNestedOneWithoutItemsInputSchema)
}).strict();

export const RecommendationItemUncheckedCreateInputSchema: z.ZodType<Prisma.RecommendationItemUncheckedCreateInput> = z.object({
  id: z.number().int().optional(),
  recommendationId: z.number().int(),
  name: z.string(),
  wholesalePrice: z.number().int(),
  recommendedPrice: z.number().int(),
  margin: z.number(),
  competition: z.string(),
  searchVolume: z.number().int(),
  trend: z.string(),
  score: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const RecommendationItemUpdateInputSchema: z.ZodType<Prisma.RecommendationItemUpdateInput> = z.object({
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  wholesalePrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  recommendedPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  margin: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  competition: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  searchVolume: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  trend: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  score: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  recommendation: z.lazy(() => RecommendationUpdateOneRequiredWithoutItemsNestedInputSchema).optional()
}).strict();

export const RecommendationItemUncheckedUpdateInputSchema: z.ZodType<Prisma.RecommendationItemUncheckedUpdateInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  recommendationId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  wholesalePrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  recommendedPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  margin: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  competition: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  searchVolume: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  trend: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  score: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const RecommendationItemCreateManyInputSchema: z.ZodType<Prisma.RecommendationItemCreateManyInput> = z.object({
  id: z.number().int().optional(),
  recommendationId: z.number().int(),
  name: z.string(),
  wholesalePrice: z.number().int(),
  recommendedPrice: z.number().int(),
  margin: z.number(),
  competition: z.string(),
  searchVolume: z.number().int(),
  trend: z.string(),
  score: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const RecommendationItemUpdateManyMutationInputSchema: z.ZodType<Prisma.RecommendationItemUpdateManyMutationInput> = z.object({
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  wholesalePrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  recommendedPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  margin: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  competition: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  searchVolume: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  trend: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  score: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const RecommendationItemUncheckedUpdateManyInputSchema: z.ZodType<Prisma.RecommendationItemUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  recommendationId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  wholesalePrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  recommendedPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  margin: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  competition: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  searchVolume: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  trend: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  score: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const WholesaleProductCreateInputSchema: z.ZodType<Prisma.WholesaleProductCreateInput> = z.object({
  name: z.string(),
  price: z.number().int(),
  source: z.string(),
  rating: z.number(),
  minOrder: z.number().int(),
  url: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  wholesaleGroup: z.lazy(() => WholesaleGroupCreateNestedOneWithoutProductsInputSchema)
}).strict();

export const WholesaleProductUncheckedCreateInputSchema: z.ZodType<Prisma.WholesaleProductUncheckedCreateInput> = z.object({
  id: z.number().int().optional(),
  name: z.string(),
  price: z.number().int(),
  source: z.string(),
  rating: z.number(),
  minOrder: z.number().int(),
  url: z.string(),
  wholesaleGroupId: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const WholesaleProductUpdateInputSchema: z.ZodType<Prisma.WholesaleProductUpdateInput> = z.object({
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  source: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  rating: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  minOrder: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  wholesaleGroup: z.lazy(() => WholesaleGroupUpdateOneRequiredWithoutProductsNestedInputSchema).optional()
}).strict();

export const WholesaleProductUncheckedUpdateInputSchema: z.ZodType<Prisma.WholesaleProductUncheckedUpdateInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  source: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  rating: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  minOrder: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  wholesaleGroupId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const WholesaleProductCreateManyInputSchema: z.ZodType<Prisma.WholesaleProductCreateManyInput> = z.object({
  id: z.number().int().optional(),
  name: z.string(),
  price: z.number().int(),
  source: z.string(),
  rating: z.number(),
  minOrder: z.number().int(),
  url: z.string(),
  wholesaleGroupId: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const WholesaleProductUpdateManyMutationInputSchema: z.ZodType<Prisma.WholesaleProductUpdateManyMutationInput> = z.object({
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  source: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  rating: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  minOrder: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const WholesaleProductUncheckedUpdateManyInputSchema: z.ZodType<Prisma.WholesaleProductUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  source: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  rating: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  minOrder: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  wholesaleGroupId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const WholesaleGroupCreateInputSchema: z.ZodType<Prisma.WholesaleGroupCreateInput> = z.object({
  keyword: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  products: z.lazy(() => WholesaleProductCreateNestedManyWithoutWholesaleGroupInputSchema).optional()
}).strict();

export const WholesaleGroupUncheckedCreateInputSchema: z.ZodType<Prisma.WholesaleGroupUncheckedCreateInput> = z.object({
  id: z.number().int().optional(),
  keyword: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  products: z.lazy(() => WholesaleProductUncheckedCreateNestedManyWithoutWholesaleGroupInputSchema).optional()
}).strict();

export const WholesaleGroupUpdateInputSchema: z.ZodType<Prisma.WholesaleGroupUpdateInput> = z.object({
  keyword: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  products: z.lazy(() => WholesaleProductUpdateManyWithoutWholesaleGroupNestedInputSchema).optional()
}).strict();

export const WholesaleGroupUncheckedUpdateInputSchema: z.ZodType<Prisma.WholesaleGroupUncheckedUpdateInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  keyword: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  products: z.lazy(() => WholesaleProductUncheckedUpdateManyWithoutWholesaleGroupNestedInputSchema).optional()
}).strict();

export const WholesaleGroupCreateManyInputSchema: z.ZodType<Prisma.WholesaleGroupCreateManyInput> = z.object({
  id: z.number().int().optional(),
  keyword: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const WholesaleGroupUpdateManyMutationInputSchema: z.ZodType<Prisma.WholesaleGroupUpdateManyMutationInput> = z.object({
  keyword: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const WholesaleGroupUncheckedUpdateManyInputSchema: z.ZodType<Prisma.WholesaleGroupUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  keyword: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const MarginCreateInputSchema: z.ZodType<Prisma.MarginCreateInput> = z.object({
  productName: z.string(),
  wholesalePrice: z.number().int(),
  sellingPrice: z.number().int(),
  shippingCost: z.number().int(),
  commission: z.number(),
  adCost: z.number().int(),
  packagingCost: z.number().int(),
  netMargin: z.number().int(),
  marginRate: z.number(),
  platform: z.string(),
  calculatedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  product: z.lazy(() => ProductCreateNestedOneWithoutMarginsInputSchema).optional()
}).strict();

export const MarginUncheckedCreateInputSchema: z.ZodType<Prisma.MarginUncheckedCreateInput> = z.object({
  id: z.number().int().optional(),
  productId: z.number().int().optional().nullable(),
  productName: z.string(),
  wholesalePrice: z.number().int(),
  sellingPrice: z.number().int(),
  shippingCost: z.number().int(),
  commission: z.number(),
  adCost: z.number().int(),
  packagingCost: z.number().int(),
  netMargin: z.number().int(),
  marginRate: z.number(),
  platform: z.string(),
  calculatedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const MarginUpdateInputSchema: z.ZodType<Prisma.MarginUpdateInput> = z.object({
  productName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  wholesalePrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  sellingPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  shippingCost: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  commission: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  adCost: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  packagingCost: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  netMargin: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  marginRate: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  platform: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  calculatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  product: z.lazy(() => ProductUpdateOneWithoutMarginsNestedInputSchema).optional()
}).strict();

export const MarginUncheckedUpdateInputSchema: z.ZodType<Prisma.MarginUncheckedUpdateInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  productId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  productName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  wholesalePrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  sellingPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  shippingCost: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  commission: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  adCost: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  packagingCost: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  netMargin: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  marginRate: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  platform: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  calculatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const MarginCreateManyInputSchema: z.ZodType<Prisma.MarginCreateManyInput> = z.object({
  id: z.number().int().optional(),
  productId: z.number().int().optional().nullable(),
  productName: z.string(),
  wholesalePrice: z.number().int(),
  sellingPrice: z.number().int(),
  shippingCost: z.number().int(),
  commission: z.number(),
  adCost: z.number().int(),
  packagingCost: z.number().int(),
  netMargin: z.number().int(),
  marginRate: z.number(),
  platform: z.string(),
  calculatedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const MarginUpdateManyMutationInputSchema: z.ZodType<Prisma.MarginUpdateManyMutationInput> = z.object({
  productName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  wholesalePrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  sellingPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  shippingCost: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  commission: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  adCost: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  packagingCost: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  netMargin: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  marginRate: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  platform: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  calculatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const MarginUncheckedUpdateManyInputSchema: z.ZodType<Prisma.MarginUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  productId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  productName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  wholesalePrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  sellingPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  shippingCost: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  commission: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  adCost: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  packagingCost: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  netMargin: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  marginRate: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  platform: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  calculatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const DetailPageCreateInputSchema: z.ZodType<Prisma.DetailPageCreateInput> = z.object({
  productName: z.string(),
  summary: z.string(),
  usps: z.union([ z.lazy(() => DetailPageCreateuspsInputSchema),z.string().array() ]).optional(),
  keywords: z.union([ z.lazy(() => DetailPageCreatekeywordsInputSchema),z.string().array() ]).optional(),
  template: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  product: z.lazy(() => ProductCreateNestedOneWithoutDetailPagesInputSchema).optional()
}).strict();

export const DetailPageUncheckedCreateInputSchema: z.ZodType<Prisma.DetailPageUncheckedCreateInput> = z.object({
  id: z.number().int().optional(),
  productId: z.number().int().optional().nullable(),
  productName: z.string(),
  summary: z.string(),
  usps: z.union([ z.lazy(() => DetailPageCreateuspsInputSchema),z.string().array() ]).optional(),
  keywords: z.union([ z.lazy(() => DetailPageCreatekeywordsInputSchema),z.string().array() ]).optional(),
  template: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const DetailPageUpdateInputSchema: z.ZodType<Prisma.DetailPageUpdateInput> = z.object({
  productName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  summary: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  usps: z.union([ z.lazy(() => DetailPageUpdateuspsInputSchema),z.string().array() ]).optional(),
  keywords: z.union([ z.lazy(() => DetailPageUpdatekeywordsInputSchema),z.string().array() ]).optional(),
  template: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  product: z.lazy(() => ProductUpdateOneWithoutDetailPagesNestedInputSchema).optional()
}).strict();

export const DetailPageUncheckedUpdateInputSchema: z.ZodType<Prisma.DetailPageUncheckedUpdateInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  productId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  productName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  summary: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  usps: z.union([ z.lazy(() => DetailPageUpdateuspsInputSchema),z.string().array() ]).optional(),
  keywords: z.union([ z.lazy(() => DetailPageUpdatekeywordsInputSchema),z.string().array() ]).optional(),
  template: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const DetailPageCreateManyInputSchema: z.ZodType<Prisma.DetailPageCreateManyInput> = z.object({
  id: z.number().int().optional(),
  productId: z.number().int().optional().nullable(),
  productName: z.string(),
  summary: z.string(),
  usps: z.union([ z.lazy(() => DetailPageCreateuspsInputSchema),z.string().array() ]).optional(),
  keywords: z.union([ z.lazy(() => DetailPageCreatekeywordsInputSchema),z.string().array() ]).optional(),
  template: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const DetailPageUpdateManyMutationInputSchema: z.ZodType<Prisma.DetailPageUpdateManyMutationInput> = z.object({
  productName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  summary: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  usps: z.union([ z.lazy(() => DetailPageUpdateuspsInputSchema),z.string().array() ]).optional(),
  keywords: z.union([ z.lazy(() => DetailPageUpdatekeywordsInputSchema),z.string().array() ]).optional(),
  template: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const DetailPageUncheckedUpdateManyInputSchema: z.ZodType<Prisma.DetailPageUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  productId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  productName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  summary: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  usps: z.union([ z.lazy(() => DetailPageUpdateuspsInputSchema),z.string().array() ]).optional(),
  keywords: z.union([ z.lazy(() => DetailPageUpdatekeywordsInputSchema),z.string().array() ]).optional(),
  template: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const RegistrationCreateInputSchema: z.ZodType<Prisma.RegistrationCreateInput> = z.object({
  productName: z.string(),
  category: z.string(),
  recommendedTitle: z.string(),
  price: z.number().int(),
  wholesalePrice: z.number().int(),
  status: z.string(),
  platform: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  product: z.lazy(() => ProductCreateNestedOneWithoutRegistrationsInputSchema).optional()
}).strict();

export const RegistrationUncheckedCreateInputSchema: z.ZodType<Prisma.RegistrationUncheckedCreateInput> = z.object({
  id: z.number().int().optional(),
  productId: z.number().int().optional().nullable(),
  productName: z.string(),
  category: z.string(),
  recommendedTitle: z.string(),
  price: z.number().int(),
  wholesalePrice: z.number().int(),
  status: z.string(),
  platform: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const RegistrationUpdateInputSchema: z.ZodType<Prisma.RegistrationUpdateInput> = z.object({
  productName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  recommendedTitle: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  wholesalePrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  platform: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  product: z.lazy(() => ProductUpdateOneWithoutRegistrationsNestedInputSchema).optional()
}).strict();

export const RegistrationUncheckedUpdateInputSchema: z.ZodType<Prisma.RegistrationUncheckedUpdateInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  productId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  productName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  recommendedTitle: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  wholesalePrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  platform: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const RegistrationCreateManyInputSchema: z.ZodType<Prisma.RegistrationCreateManyInput> = z.object({
  id: z.number().int().optional(),
  productId: z.number().int().optional().nullable(),
  productName: z.string(),
  category: z.string(),
  recommendedTitle: z.string(),
  price: z.number().int(),
  wholesalePrice: z.number().int(),
  status: z.string(),
  platform: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const RegistrationUpdateManyMutationInputSchema: z.ZodType<Prisma.RegistrationUpdateManyMutationInput> = z.object({
  productName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  recommendedTitle: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  wholesalePrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  platform: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const RegistrationUncheckedUpdateManyInputSchema: z.ZodType<Prisma.RegistrationUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  productId: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  productName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  recommendedTitle: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  wholesalePrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  platform: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const ActivityLogCreateInputSchema: z.ZodType<Prisma.ActivityLogCreateInput> = z.object({
  action: z.string(),
  productName: z.string(),
  status: z.string(),
  price: z.number().int().optional().nullable(),
  details: z.string().optional().nullable(),
  timestamp: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const ActivityLogUncheckedCreateInputSchema: z.ZodType<Prisma.ActivityLogUncheckedCreateInput> = z.object({
  id: z.number().int().optional(),
  action: z.string(),
  productName: z.string(),
  status: z.string(),
  price: z.number().int().optional().nullable(),
  details: z.string().optional().nullable(),
  timestamp: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const ActivityLogUpdateInputSchema: z.ZodType<Prisma.ActivityLogUpdateInput> = z.object({
  action: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  details: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  timestamp: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const ActivityLogUncheckedUpdateInputSchema: z.ZodType<Prisma.ActivityLogUncheckedUpdateInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  action: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  details: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  timestamp: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const ActivityLogCreateManyInputSchema: z.ZodType<Prisma.ActivityLogCreateManyInput> = z.object({
  id: z.number().int().optional(),
  action: z.string(),
  productName: z.string(),
  status: z.string(),
  price: z.number().int().optional().nullable(),
  details: z.string().optional().nullable(),
  timestamp: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const ActivityLogUpdateManyMutationInputSchema: z.ZodType<Prisma.ActivityLogUpdateManyMutationInput> = z.object({
  action: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  details: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  timestamp: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const ActivityLogUncheckedUpdateManyInputSchema: z.ZodType<Prisma.ActivityLogUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  action: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  details: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  timestamp: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const DailyStatCreateInputSchema: z.ZodType<Prisma.DailyStatCreateInput> = z.object({
  date: z.string(),
  revenue: z.number().int(),
  products: z.number().int(),
  margin: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const DailyStatUncheckedCreateInputSchema: z.ZodType<Prisma.DailyStatUncheckedCreateInput> = z.object({
  id: z.number().int().optional(),
  date: z.string(),
  revenue: z.number().int(),
  products: z.number().int(),
  margin: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const DailyStatUpdateInputSchema: z.ZodType<Prisma.DailyStatUpdateInput> = z.object({
  date: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  revenue: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  products: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  margin: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const DailyStatUncheckedUpdateInputSchema: z.ZodType<Prisma.DailyStatUncheckedUpdateInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  revenue: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  products: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  margin: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const DailyStatCreateManyInputSchema: z.ZodType<Prisma.DailyStatCreateManyInput> = z.object({
  id: z.number().int().optional(),
  date: z.string(),
  revenue: z.number().int(),
  products: z.number().int(),
  margin: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const DailyStatUpdateManyMutationInputSchema: z.ZodType<Prisma.DailyStatUpdateManyMutationInput> = z.object({
  date: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  revenue: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  products: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  margin: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const DailyStatUncheckedUpdateManyInputSchema: z.ZodType<Prisma.DailyStatUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  revenue: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  products: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  margin: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const StringFilterSchema: z.ZodType<Prisma.StringFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
}).strict();

export const StringNullableFilterSchema: z.ZodType<Prisma.StringNullableFilter> = z.object({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const DateTimeFilterSchema: z.ZodType<Prisma.DateTimeFilter> = z.object({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeFilterSchema) ]).optional(),
}).strict();

export const SubscriptionNullableScalarRelationFilterSchema: z.ZodType<Prisma.SubscriptionNullableScalarRelationFilter> = z.object({
  is: z.lazy(() => SubscriptionWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => SubscriptionWhereInputSchema).optional().nullable()
}).strict();

export const PaymentHistoryListRelationFilterSchema: z.ZodType<Prisma.PaymentHistoryListRelationFilter> = z.object({
  every: z.lazy(() => PaymentHistoryWhereInputSchema).optional(),
  some: z.lazy(() => PaymentHistoryWhereInputSchema).optional(),
  none: z.lazy(() => PaymentHistoryWhereInputSchema).optional()
}).strict();

export const SortOrderInputSchema: z.ZodType<Prisma.SortOrderInput> = z.object({
  sort: z.lazy(() => SortOrderSchema),
  nulls: z.lazy(() => NullsOrderSchema).optional()
}).strict();

export const PaymentHistoryOrderByRelationAggregateInputSchema: z.ZodType<Prisma.PaymentHistoryOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const UserCountOrderByAggregateInputSchema: z.ZodType<Prisma.UserCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  clerkId: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  username: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const UserMaxOrderByAggregateInputSchema: z.ZodType<Prisma.UserMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  clerkId: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  username: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const UserMinOrderByAggregateInputSchema: z.ZodType<Prisma.UserMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  clerkId: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  username: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const StringWithAggregatesFilterSchema: z.ZodType<Prisma.StringWithAggregatesFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional()
}).strict();

export const StringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.StringNullableWithAggregatesFilter> = z.object({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional()
}).strict();

export const DateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeWithAggregatesFilter> = z.object({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeFilterSchema).optional()
}).strict();

export const EnumSubscriptionStatusFilterSchema: z.ZodType<Prisma.EnumSubscriptionStatusFilter> = z.object({
  equals: z.lazy(() => SubscriptionStatusSchema).optional(),
  in: z.lazy(() => SubscriptionStatusSchema).array().optional(),
  notIn: z.lazy(() => SubscriptionStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => SubscriptionStatusSchema),z.lazy(() => NestedEnumSubscriptionStatusFilterSchema) ]).optional(),
}).strict();

export const DateTimeNullableFilterSchema: z.ZodType<Prisma.DateTimeNullableFilter> = z.object({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const EnumSubscriptionPaymentMethodFilterSchema: z.ZodType<Prisma.EnumSubscriptionPaymentMethodFilter> = z.object({
  equals: z.lazy(() => SubscriptionPaymentMethodSchema).optional(),
  in: z.lazy(() => SubscriptionPaymentMethodSchema).array().optional(),
  notIn: z.lazy(() => SubscriptionPaymentMethodSchema).array().optional(),
  not: z.union([ z.lazy(() => SubscriptionPaymentMethodSchema),z.lazy(() => NestedEnumSubscriptionPaymentMethodFilterSchema) ]).optional(),
}).strict();

export const UserScalarRelationFilterSchema: z.ZodType<Prisma.UserScalarRelationFilter> = z.object({
  is: z.lazy(() => UserWhereInputSchema).optional(),
  isNot: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export const PlanScalarRelationFilterSchema: z.ZodType<Prisma.PlanScalarRelationFilter> = z.object({
  is: z.lazy(() => PlanWhereInputSchema).optional(),
  isNot: z.lazy(() => PlanWhereInputSchema).optional()
}).strict();

export const SubscriptionCountOrderByAggregateInputSchema: z.ZodType<Prisma.SubscriptionCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  planId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  lemonSqueezyId: z.lazy(() => SortOrderSchema).optional(),
  lemonSubscriptionItemId: z.lazy(() => SortOrderSchema).optional(),
  lemonCustomerId: z.lazy(() => SortOrderSchema).optional(),
  lemonOrderId: z.lazy(() => SortOrderSchema).optional(),
  lemonProductId: z.lazy(() => SortOrderSchema).optional(),
  lemonVariantId: z.lazy(() => SortOrderSchema).optional(),
  renewsAt: z.lazy(() => SortOrderSchema).optional(),
  endsAt: z.lazy(() => SortOrderSchema).optional(),
  paymentMethod: z.lazy(() => SortOrderSchema).optional(),
  cardBrand: z.lazy(() => SortOrderSchema).optional(),
  cardLast4: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const SubscriptionMaxOrderByAggregateInputSchema: z.ZodType<Prisma.SubscriptionMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  planId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  lemonSqueezyId: z.lazy(() => SortOrderSchema).optional(),
  lemonSubscriptionItemId: z.lazy(() => SortOrderSchema).optional(),
  lemonCustomerId: z.lazy(() => SortOrderSchema).optional(),
  lemonOrderId: z.lazy(() => SortOrderSchema).optional(),
  lemonProductId: z.lazy(() => SortOrderSchema).optional(),
  lemonVariantId: z.lazy(() => SortOrderSchema).optional(),
  renewsAt: z.lazy(() => SortOrderSchema).optional(),
  endsAt: z.lazy(() => SortOrderSchema).optional(),
  paymentMethod: z.lazy(() => SortOrderSchema).optional(),
  cardBrand: z.lazy(() => SortOrderSchema).optional(),
  cardLast4: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const SubscriptionMinOrderByAggregateInputSchema: z.ZodType<Prisma.SubscriptionMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  planId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  lemonSqueezyId: z.lazy(() => SortOrderSchema).optional(),
  lemonSubscriptionItemId: z.lazy(() => SortOrderSchema).optional(),
  lemonCustomerId: z.lazy(() => SortOrderSchema).optional(),
  lemonOrderId: z.lazy(() => SortOrderSchema).optional(),
  lemonProductId: z.lazy(() => SortOrderSchema).optional(),
  lemonVariantId: z.lazy(() => SortOrderSchema).optional(),
  renewsAt: z.lazy(() => SortOrderSchema).optional(),
  endsAt: z.lazy(() => SortOrderSchema).optional(),
  paymentMethod: z.lazy(() => SortOrderSchema).optional(),
  cardBrand: z.lazy(() => SortOrderSchema).optional(),
  cardLast4: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const EnumSubscriptionStatusWithAggregatesFilterSchema: z.ZodType<Prisma.EnumSubscriptionStatusWithAggregatesFilter> = z.object({
  equals: z.lazy(() => SubscriptionStatusSchema).optional(),
  in: z.lazy(() => SubscriptionStatusSchema).array().optional(),
  notIn: z.lazy(() => SubscriptionStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => SubscriptionStatusSchema),z.lazy(() => NestedEnumSubscriptionStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumSubscriptionStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumSubscriptionStatusFilterSchema).optional()
}).strict();

export const DateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeNullableWithAggregatesFilter> = z.object({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional()
}).strict();

export const EnumSubscriptionPaymentMethodWithAggregatesFilterSchema: z.ZodType<Prisma.EnumSubscriptionPaymentMethodWithAggregatesFilter> = z.object({
  equals: z.lazy(() => SubscriptionPaymentMethodSchema).optional(),
  in: z.lazy(() => SubscriptionPaymentMethodSchema).array().optional(),
  notIn: z.lazy(() => SubscriptionPaymentMethodSchema).array().optional(),
  not: z.union([ z.lazy(() => SubscriptionPaymentMethodSchema),z.lazy(() => NestedEnumSubscriptionPaymentMethodWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumSubscriptionPaymentMethodFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumSubscriptionPaymentMethodFilterSchema).optional()
}).strict();

export const JsonNullableFilterSchema: z.ZodType<Prisma.JsonNullableFilter> = z.object({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional()
}).strict();

export const BoolFilterSchema: z.ZodType<Prisma.BoolFilter> = z.object({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
}).strict();

export const DecimalFilterSchema: z.ZodType<Prisma.DecimalFilter> = z.object({
  equals: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  in: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional(),
  notIn: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional(),
  lt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  lte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  not: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NestedDecimalFilterSchema) ]).optional(),
}).strict();

export const SubscriptionListRelationFilterSchema: z.ZodType<Prisma.SubscriptionListRelationFilter> = z.object({
  every: z.lazy(() => SubscriptionWhereInputSchema).optional(),
  some: z.lazy(() => SubscriptionWhereInputSchema).optional(),
  none: z.lazy(() => SubscriptionWhereInputSchema).optional()
}).strict();

export const SubscriptionOrderByRelationAggregateInputSchema: z.ZodType<Prisma.SubscriptionOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const PlanCountOrderByAggregateInputSchema: z.ZodType<Prisma.PlanCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  content: z.lazy(() => SortOrderSchema).optional(),
  available: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  lemonSqueezyProductId: z.lazy(() => SortOrderSchema).optional(),
  lemonSqueezyVariantId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const PlanAvgOrderByAggregateInputSchema: z.ZodType<Prisma.PlanAvgOrderByAggregateInput> = z.object({
  price: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const PlanMaxOrderByAggregateInputSchema: z.ZodType<Prisma.PlanMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  available: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  lemonSqueezyProductId: z.lazy(() => SortOrderSchema).optional(),
  lemonSqueezyVariantId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const PlanMinOrderByAggregateInputSchema: z.ZodType<Prisma.PlanMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  available: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  lemonSqueezyProductId: z.lazy(() => SortOrderSchema).optional(),
  lemonSqueezyVariantId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const PlanSumOrderByAggregateInputSchema: z.ZodType<Prisma.PlanSumOrderByAggregateInput> = z.object({
  price: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const JsonNullableWithAggregatesFilterSchema: z.ZodType<Prisma.JsonNullableWithAggregatesFilter> = z.object({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedJsonNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedJsonNullableFilterSchema).optional()
}).strict();

export const BoolWithAggregatesFilterSchema: z.ZodType<Prisma.BoolWithAggregatesFilter> = z.object({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional()
}).strict();

export const DecimalWithAggregatesFilterSchema: z.ZodType<Prisma.DecimalWithAggregatesFilter> = z.object({
  equals: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  in: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional(),
  notIn: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional(),
  lt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  lte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  not: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NestedDecimalWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedDecimalFilterSchema).optional(),
  _sum: z.lazy(() => NestedDecimalFilterSchema).optional(),
  _min: z.lazy(() => NestedDecimalFilterSchema).optional(),
  _max: z.lazy(() => NestedDecimalFilterSchema).optional()
}).strict();

export const JsonFilterSchema: z.ZodType<Prisma.JsonFilter> = z.object({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional()
}).strict();

export const WebhookEventCountOrderByAggregateInputSchema: z.ZodType<Prisma.WebhookEventCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  eventName: z.lazy(() => SortOrderSchema).optional(),
  resourceId: z.lazy(() => SortOrderSchema).optional(),
  processedAt: z.lazy(() => SortOrderSchema).optional(),
  payload: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const WebhookEventMaxOrderByAggregateInputSchema: z.ZodType<Prisma.WebhookEventMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  eventName: z.lazy(() => SortOrderSchema).optional(),
  resourceId: z.lazy(() => SortOrderSchema).optional(),
  processedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const WebhookEventMinOrderByAggregateInputSchema: z.ZodType<Prisma.WebhookEventMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  eventId: z.lazy(() => SortOrderSchema).optional(),
  eventName: z.lazy(() => SortOrderSchema).optional(),
  resourceId: z.lazy(() => SortOrderSchema).optional(),
  processedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const JsonWithAggregatesFilterSchema: z.ZodType<Prisma.JsonWithAggregatesFilter> = z.object({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedJsonFilterSchema).optional(),
  _max: z.lazy(() => NestedJsonFilterSchema).optional()
}).strict();

export const EnumPaymentStatusFilterSchema: z.ZodType<Prisma.EnumPaymentStatusFilter> = z.object({
  equals: z.lazy(() => PaymentStatusSchema).optional(),
  in: z.lazy(() => PaymentStatusSchema).array().optional(),
  notIn: z.lazy(() => PaymentStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => PaymentStatusSchema),z.lazy(() => NestedEnumPaymentStatusFilterSchema) ]).optional(),
}).strict();

export const IntFilterSchema: z.ZodType<Prisma.IntFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntFilterSchema) ]).optional(),
}).strict();

export const PaymentHistoryCountOrderByAggregateInputSchema: z.ZodType<Prisma.PaymentHistoryCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  invoiceId: z.lazy(() => SortOrderSchema).optional(),
  subscriptionId: z.lazy(() => SortOrderSchema).optional(),
  customerId: z.lazy(() => SortOrderSchema).optional(),
  userEmail: z.lazy(() => SortOrderSchema).optional(),
  billingReason: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  statusFormatted: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  currencyRate: z.lazy(() => SortOrderSchema).optional(),
  subtotal: z.lazy(() => SortOrderSchema).optional(),
  discountTotal: z.lazy(() => SortOrderSchema).optional(),
  tax: z.lazy(() => SortOrderSchema).optional(),
  taxInclusive: z.lazy(() => SortOrderSchema).optional(),
  total: z.lazy(() => SortOrderSchema).optional(),
  refundedAmount: z.lazy(() => SortOrderSchema).optional(),
  subtotalUsd: z.lazy(() => SortOrderSchema).optional(),
  discountTotalUsd: z.lazy(() => SortOrderSchema).optional(),
  taxUsd: z.lazy(() => SortOrderSchema).optional(),
  totalUsd: z.lazy(() => SortOrderSchema).optional(),
  refundedAmountUsd: z.lazy(() => SortOrderSchema).optional(),
  cardBrand: z.lazy(() => SortOrderSchema).optional(),
  cardLastFour: z.lazy(() => SortOrderSchema).optional(),
  invoiceUrl: z.lazy(() => SortOrderSchema).optional(),
  testMode: z.lazy(() => SortOrderSchema).optional(),
  refundedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const PaymentHistoryAvgOrderByAggregateInputSchema: z.ZodType<Prisma.PaymentHistoryAvgOrderByAggregateInput> = z.object({
  subtotal: z.lazy(() => SortOrderSchema).optional(),
  discountTotal: z.lazy(() => SortOrderSchema).optional(),
  tax: z.lazy(() => SortOrderSchema).optional(),
  total: z.lazy(() => SortOrderSchema).optional(),
  refundedAmount: z.lazy(() => SortOrderSchema).optional(),
  subtotalUsd: z.lazy(() => SortOrderSchema).optional(),
  discountTotalUsd: z.lazy(() => SortOrderSchema).optional(),
  taxUsd: z.lazy(() => SortOrderSchema).optional(),
  totalUsd: z.lazy(() => SortOrderSchema).optional(),
  refundedAmountUsd: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const PaymentHistoryMaxOrderByAggregateInputSchema: z.ZodType<Prisma.PaymentHistoryMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  invoiceId: z.lazy(() => SortOrderSchema).optional(),
  subscriptionId: z.lazy(() => SortOrderSchema).optional(),
  customerId: z.lazy(() => SortOrderSchema).optional(),
  userEmail: z.lazy(() => SortOrderSchema).optional(),
  billingReason: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  statusFormatted: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  currencyRate: z.lazy(() => SortOrderSchema).optional(),
  subtotal: z.lazy(() => SortOrderSchema).optional(),
  discountTotal: z.lazy(() => SortOrderSchema).optional(),
  tax: z.lazy(() => SortOrderSchema).optional(),
  taxInclusive: z.lazy(() => SortOrderSchema).optional(),
  total: z.lazy(() => SortOrderSchema).optional(),
  refundedAmount: z.lazy(() => SortOrderSchema).optional(),
  subtotalUsd: z.lazy(() => SortOrderSchema).optional(),
  discountTotalUsd: z.lazy(() => SortOrderSchema).optional(),
  taxUsd: z.lazy(() => SortOrderSchema).optional(),
  totalUsd: z.lazy(() => SortOrderSchema).optional(),
  refundedAmountUsd: z.lazy(() => SortOrderSchema).optional(),
  cardBrand: z.lazy(() => SortOrderSchema).optional(),
  cardLastFour: z.lazy(() => SortOrderSchema).optional(),
  invoiceUrl: z.lazy(() => SortOrderSchema).optional(),
  testMode: z.lazy(() => SortOrderSchema).optional(),
  refundedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const PaymentHistoryMinOrderByAggregateInputSchema: z.ZodType<Prisma.PaymentHistoryMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  invoiceId: z.lazy(() => SortOrderSchema).optional(),
  subscriptionId: z.lazy(() => SortOrderSchema).optional(),
  customerId: z.lazy(() => SortOrderSchema).optional(),
  userEmail: z.lazy(() => SortOrderSchema).optional(),
  billingReason: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  statusFormatted: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  currencyRate: z.lazy(() => SortOrderSchema).optional(),
  subtotal: z.lazy(() => SortOrderSchema).optional(),
  discountTotal: z.lazy(() => SortOrderSchema).optional(),
  tax: z.lazy(() => SortOrderSchema).optional(),
  taxInclusive: z.lazy(() => SortOrderSchema).optional(),
  total: z.lazy(() => SortOrderSchema).optional(),
  refundedAmount: z.lazy(() => SortOrderSchema).optional(),
  subtotalUsd: z.lazy(() => SortOrderSchema).optional(),
  discountTotalUsd: z.lazy(() => SortOrderSchema).optional(),
  taxUsd: z.lazy(() => SortOrderSchema).optional(),
  totalUsd: z.lazy(() => SortOrderSchema).optional(),
  refundedAmountUsd: z.lazy(() => SortOrderSchema).optional(),
  cardBrand: z.lazy(() => SortOrderSchema).optional(),
  cardLastFour: z.lazy(() => SortOrderSchema).optional(),
  invoiceUrl: z.lazy(() => SortOrderSchema).optional(),
  testMode: z.lazy(() => SortOrderSchema).optional(),
  refundedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const PaymentHistorySumOrderByAggregateInputSchema: z.ZodType<Prisma.PaymentHistorySumOrderByAggregateInput> = z.object({
  subtotal: z.lazy(() => SortOrderSchema).optional(),
  discountTotal: z.lazy(() => SortOrderSchema).optional(),
  tax: z.lazy(() => SortOrderSchema).optional(),
  total: z.lazy(() => SortOrderSchema).optional(),
  refundedAmount: z.lazy(() => SortOrderSchema).optional(),
  subtotalUsd: z.lazy(() => SortOrderSchema).optional(),
  discountTotalUsd: z.lazy(() => SortOrderSchema).optional(),
  taxUsd: z.lazy(() => SortOrderSchema).optional(),
  totalUsd: z.lazy(() => SortOrderSchema).optional(),
  refundedAmountUsd: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const EnumPaymentStatusWithAggregatesFilterSchema: z.ZodType<Prisma.EnumPaymentStatusWithAggregatesFilter> = z.object({
  equals: z.lazy(() => PaymentStatusSchema).optional(),
  in: z.lazy(() => PaymentStatusSchema).array().optional(),
  notIn: z.lazy(() => PaymentStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => PaymentStatusSchema),z.lazy(() => NestedEnumPaymentStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumPaymentStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumPaymentStatusFilterSchema).optional()
}).strict();

export const IntWithAggregatesFilterSchema: z.ZodType<Prisma.IntWithAggregatesFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedIntFilterSchema).optional(),
  _max: z.lazy(() => NestedIntFilterSchema).optional()
}).strict();

export const FloatFilterSchema: z.ZodType<Prisma.FloatFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatFilterSchema) ]).optional(),
}).strict();

export const MarginListRelationFilterSchema: z.ZodType<Prisma.MarginListRelationFilter> = z.object({
  every: z.lazy(() => MarginWhereInputSchema).optional(),
  some: z.lazy(() => MarginWhereInputSchema).optional(),
  none: z.lazy(() => MarginWhereInputSchema).optional()
}).strict();

export const DetailPageListRelationFilterSchema: z.ZodType<Prisma.DetailPageListRelationFilter> = z.object({
  every: z.lazy(() => DetailPageWhereInputSchema).optional(),
  some: z.lazy(() => DetailPageWhereInputSchema).optional(),
  none: z.lazy(() => DetailPageWhereInputSchema).optional()
}).strict();

export const RegistrationListRelationFilterSchema: z.ZodType<Prisma.RegistrationListRelationFilter> = z.object({
  every: z.lazy(() => RegistrationWhereInputSchema).optional(),
  some: z.lazy(() => RegistrationWhereInputSchema).optional(),
  none: z.lazy(() => RegistrationWhereInputSchema).optional()
}).strict();

export const MarginOrderByRelationAggregateInputSchema: z.ZodType<Prisma.MarginOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const DetailPageOrderByRelationAggregateInputSchema: z.ZodType<Prisma.DetailPageOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const RegistrationOrderByRelationAggregateInputSchema: z.ZodType<Prisma.RegistrationOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const ProductCountOrderByAggregateInputSchema: z.ZodType<Prisma.ProductCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  wholesalePrice: z.lazy(() => SortOrderSchema).optional(),
  recommendedPrice: z.lazy(() => SortOrderSchema).optional(),
  margin: z.lazy(() => SortOrderSchema).optional(),
  competition: z.lazy(() => SortOrderSchema).optional(),
  searchVolume: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  image: z.lazy(() => SortOrderSchema).optional(),
  source: z.lazy(() => SortOrderSchema).optional(),
  trend: z.lazy(() => SortOrderSchema).optional(),
  score: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const ProductAvgOrderByAggregateInputSchema: z.ZodType<Prisma.ProductAvgOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  wholesalePrice: z.lazy(() => SortOrderSchema).optional(),
  recommendedPrice: z.lazy(() => SortOrderSchema).optional(),
  margin: z.lazy(() => SortOrderSchema).optional(),
  searchVolume: z.lazy(() => SortOrderSchema).optional(),
  score: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const ProductMaxOrderByAggregateInputSchema: z.ZodType<Prisma.ProductMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  wholesalePrice: z.lazy(() => SortOrderSchema).optional(),
  recommendedPrice: z.lazy(() => SortOrderSchema).optional(),
  margin: z.lazy(() => SortOrderSchema).optional(),
  competition: z.lazy(() => SortOrderSchema).optional(),
  searchVolume: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  image: z.lazy(() => SortOrderSchema).optional(),
  source: z.lazy(() => SortOrderSchema).optional(),
  trend: z.lazy(() => SortOrderSchema).optional(),
  score: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const ProductMinOrderByAggregateInputSchema: z.ZodType<Prisma.ProductMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  wholesalePrice: z.lazy(() => SortOrderSchema).optional(),
  recommendedPrice: z.lazy(() => SortOrderSchema).optional(),
  margin: z.lazy(() => SortOrderSchema).optional(),
  competition: z.lazy(() => SortOrderSchema).optional(),
  searchVolume: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  image: z.lazy(() => SortOrderSchema).optional(),
  source: z.lazy(() => SortOrderSchema).optional(),
  trend: z.lazy(() => SortOrderSchema).optional(),
  score: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const ProductSumOrderByAggregateInputSchema: z.ZodType<Prisma.ProductSumOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  wholesalePrice: z.lazy(() => SortOrderSchema).optional(),
  recommendedPrice: z.lazy(() => SortOrderSchema).optional(),
  margin: z.lazy(() => SortOrderSchema).optional(),
  searchVolume: z.lazy(() => SortOrderSchema).optional(),
  score: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const FloatWithAggregatesFilterSchema: z.ZodType<Prisma.FloatWithAggregatesFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedFloatFilterSchema).optional(),
  _min: z.lazy(() => NestedFloatFilterSchema).optional(),
  _max: z.lazy(() => NestedFloatFilterSchema).optional()
}).strict();

export const RecommendationItemListRelationFilterSchema: z.ZodType<Prisma.RecommendationItemListRelationFilter> = z.object({
  every: z.lazy(() => RecommendationItemWhereInputSchema).optional(),
  some: z.lazy(() => RecommendationItemWhereInputSchema).optional(),
  none: z.lazy(() => RecommendationItemWhereInputSchema).optional()
}).strict();

export const RecommendationItemOrderByRelationAggregateInputSchema: z.ZodType<Prisma.RecommendationItemOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const RecommendationCountOrderByAggregateInputSchema: z.ZodType<Prisma.RecommendationCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  keyword: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const RecommendationAvgOrderByAggregateInputSchema: z.ZodType<Prisma.RecommendationAvgOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const RecommendationMaxOrderByAggregateInputSchema: z.ZodType<Prisma.RecommendationMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  keyword: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const RecommendationMinOrderByAggregateInputSchema: z.ZodType<Prisma.RecommendationMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  keyword: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const RecommendationSumOrderByAggregateInputSchema: z.ZodType<Prisma.RecommendationSumOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const RecommendationScalarRelationFilterSchema: z.ZodType<Prisma.RecommendationScalarRelationFilter> = z.object({
  is: z.lazy(() => RecommendationWhereInputSchema).optional(),
  isNot: z.lazy(() => RecommendationWhereInputSchema).optional()
}).strict();

export const RecommendationItemCountOrderByAggregateInputSchema: z.ZodType<Prisma.RecommendationItemCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  recommendationId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  wholesalePrice: z.lazy(() => SortOrderSchema).optional(),
  recommendedPrice: z.lazy(() => SortOrderSchema).optional(),
  margin: z.lazy(() => SortOrderSchema).optional(),
  competition: z.lazy(() => SortOrderSchema).optional(),
  searchVolume: z.lazy(() => SortOrderSchema).optional(),
  trend: z.lazy(() => SortOrderSchema).optional(),
  score: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const RecommendationItemAvgOrderByAggregateInputSchema: z.ZodType<Prisma.RecommendationItemAvgOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  recommendationId: z.lazy(() => SortOrderSchema).optional(),
  wholesalePrice: z.lazy(() => SortOrderSchema).optional(),
  recommendedPrice: z.lazy(() => SortOrderSchema).optional(),
  margin: z.lazy(() => SortOrderSchema).optional(),
  searchVolume: z.lazy(() => SortOrderSchema).optional(),
  score: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const RecommendationItemMaxOrderByAggregateInputSchema: z.ZodType<Prisma.RecommendationItemMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  recommendationId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  wholesalePrice: z.lazy(() => SortOrderSchema).optional(),
  recommendedPrice: z.lazy(() => SortOrderSchema).optional(),
  margin: z.lazy(() => SortOrderSchema).optional(),
  competition: z.lazy(() => SortOrderSchema).optional(),
  searchVolume: z.lazy(() => SortOrderSchema).optional(),
  trend: z.lazy(() => SortOrderSchema).optional(),
  score: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const RecommendationItemMinOrderByAggregateInputSchema: z.ZodType<Prisma.RecommendationItemMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  recommendationId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  wholesalePrice: z.lazy(() => SortOrderSchema).optional(),
  recommendedPrice: z.lazy(() => SortOrderSchema).optional(),
  margin: z.lazy(() => SortOrderSchema).optional(),
  competition: z.lazy(() => SortOrderSchema).optional(),
  searchVolume: z.lazy(() => SortOrderSchema).optional(),
  trend: z.lazy(() => SortOrderSchema).optional(),
  score: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const RecommendationItemSumOrderByAggregateInputSchema: z.ZodType<Prisma.RecommendationItemSumOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  recommendationId: z.lazy(() => SortOrderSchema).optional(),
  wholesalePrice: z.lazy(() => SortOrderSchema).optional(),
  recommendedPrice: z.lazy(() => SortOrderSchema).optional(),
  margin: z.lazy(() => SortOrderSchema).optional(),
  searchVolume: z.lazy(() => SortOrderSchema).optional(),
  score: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const WholesaleGroupScalarRelationFilterSchema: z.ZodType<Prisma.WholesaleGroupScalarRelationFilter> = z.object({
  is: z.lazy(() => WholesaleGroupWhereInputSchema).optional(),
  isNot: z.lazy(() => WholesaleGroupWhereInputSchema).optional()
}).strict();

export const WholesaleProductCountOrderByAggregateInputSchema: z.ZodType<Prisma.WholesaleProductCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  source: z.lazy(() => SortOrderSchema).optional(),
  rating: z.lazy(() => SortOrderSchema).optional(),
  minOrder: z.lazy(() => SortOrderSchema).optional(),
  url: z.lazy(() => SortOrderSchema).optional(),
  wholesaleGroupId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const WholesaleProductAvgOrderByAggregateInputSchema: z.ZodType<Prisma.WholesaleProductAvgOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  rating: z.lazy(() => SortOrderSchema).optional(),
  minOrder: z.lazy(() => SortOrderSchema).optional(),
  wholesaleGroupId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const WholesaleProductMaxOrderByAggregateInputSchema: z.ZodType<Prisma.WholesaleProductMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  source: z.lazy(() => SortOrderSchema).optional(),
  rating: z.lazy(() => SortOrderSchema).optional(),
  minOrder: z.lazy(() => SortOrderSchema).optional(),
  url: z.lazy(() => SortOrderSchema).optional(),
  wholesaleGroupId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const WholesaleProductMinOrderByAggregateInputSchema: z.ZodType<Prisma.WholesaleProductMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  source: z.lazy(() => SortOrderSchema).optional(),
  rating: z.lazy(() => SortOrderSchema).optional(),
  minOrder: z.lazy(() => SortOrderSchema).optional(),
  url: z.lazy(() => SortOrderSchema).optional(),
  wholesaleGroupId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const WholesaleProductSumOrderByAggregateInputSchema: z.ZodType<Prisma.WholesaleProductSumOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  rating: z.lazy(() => SortOrderSchema).optional(),
  minOrder: z.lazy(() => SortOrderSchema).optional(),
  wholesaleGroupId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const WholesaleProductListRelationFilterSchema: z.ZodType<Prisma.WholesaleProductListRelationFilter> = z.object({
  every: z.lazy(() => WholesaleProductWhereInputSchema).optional(),
  some: z.lazy(() => WholesaleProductWhereInputSchema).optional(),
  none: z.lazy(() => WholesaleProductWhereInputSchema).optional()
}).strict();

export const WholesaleProductOrderByRelationAggregateInputSchema: z.ZodType<Prisma.WholesaleProductOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const WholesaleGroupCountOrderByAggregateInputSchema: z.ZodType<Prisma.WholesaleGroupCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  keyword: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const WholesaleGroupAvgOrderByAggregateInputSchema: z.ZodType<Prisma.WholesaleGroupAvgOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const WholesaleGroupMaxOrderByAggregateInputSchema: z.ZodType<Prisma.WholesaleGroupMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  keyword: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const WholesaleGroupMinOrderByAggregateInputSchema: z.ZodType<Prisma.WholesaleGroupMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  keyword: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const WholesaleGroupSumOrderByAggregateInputSchema: z.ZodType<Prisma.WholesaleGroupSumOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const IntNullableFilterSchema: z.ZodType<Prisma.IntNullableFilter> = z.object({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const ProductNullableScalarRelationFilterSchema: z.ZodType<Prisma.ProductNullableScalarRelationFilter> = z.object({
  is: z.lazy(() => ProductWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => ProductWhereInputSchema).optional().nullable()
}).strict();

export const MarginCountOrderByAggregateInputSchema: z.ZodType<Prisma.MarginCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  productId: z.lazy(() => SortOrderSchema).optional(),
  productName: z.lazy(() => SortOrderSchema).optional(),
  wholesalePrice: z.lazy(() => SortOrderSchema).optional(),
  sellingPrice: z.lazy(() => SortOrderSchema).optional(),
  shippingCost: z.lazy(() => SortOrderSchema).optional(),
  commission: z.lazy(() => SortOrderSchema).optional(),
  adCost: z.lazy(() => SortOrderSchema).optional(),
  packagingCost: z.lazy(() => SortOrderSchema).optional(),
  netMargin: z.lazy(() => SortOrderSchema).optional(),
  marginRate: z.lazy(() => SortOrderSchema).optional(),
  platform: z.lazy(() => SortOrderSchema).optional(),
  calculatedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const MarginAvgOrderByAggregateInputSchema: z.ZodType<Prisma.MarginAvgOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  productId: z.lazy(() => SortOrderSchema).optional(),
  wholesalePrice: z.lazy(() => SortOrderSchema).optional(),
  sellingPrice: z.lazy(() => SortOrderSchema).optional(),
  shippingCost: z.lazy(() => SortOrderSchema).optional(),
  commission: z.lazy(() => SortOrderSchema).optional(),
  adCost: z.lazy(() => SortOrderSchema).optional(),
  packagingCost: z.lazy(() => SortOrderSchema).optional(),
  netMargin: z.lazy(() => SortOrderSchema).optional(),
  marginRate: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const MarginMaxOrderByAggregateInputSchema: z.ZodType<Prisma.MarginMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  productId: z.lazy(() => SortOrderSchema).optional(),
  productName: z.lazy(() => SortOrderSchema).optional(),
  wholesalePrice: z.lazy(() => SortOrderSchema).optional(),
  sellingPrice: z.lazy(() => SortOrderSchema).optional(),
  shippingCost: z.lazy(() => SortOrderSchema).optional(),
  commission: z.lazy(() => SortOrderSchema).optional(),
  adCost: z.lazy(() => SortOrderSchema).optional(),
  packagingCost: z.lazy(() => SortOrderSchema).optional(),
  netMargin: z.lazy(() => SortOrderSchema).optional(),
  marginRate: z.lazy(() => SortOrderSchema).optional(),
  platform: z.lazy(() => SortOrderSchema).optional(),
  calculatedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const MarginMinOrderByAggregateInputSchema: z.ZodType<Prisma.MarginMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  productId: z.lazy(() => SortOrderSchema).optional(),
  productName: z.lazy(() => SortOrderSchema).optional(),
  wholesalePrice: z.lazy(() => SortOrderSchema).optional(),
  sellingPrice: z.lazy(() => SortOrderSchema).optional(),
  shippingCost: z.lazy(() => SortOrderSchema).optional(),
  commission: z.lazy(() => SortOrderSchema).optional(),
  adCost: z.lazy(() => SortOrderSchema).optional(),
  packagingCost: z.lazy(() => SortOrderSchema).optional(),
  netMargin: z.lazy(() => SortOrderSchema).optional(),
  marginRate: z.lazy(() => SortOrderSchema).optional(),
  platform: z.lazy(() => SortOrderSchema).optional(),
  calculatedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const MarginSumOrderByAggregateInputSchema: z.ZodType<Prisma.MarginSumOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  productId: z.lazy(() => SortOrderSchema).optional(),
  wholesalePrice: z.lazy(() => SortOrderSchema).optional(),
  sellingPrice: z.lazy(() => SortOrderSchema).optional(),
  shippingCost: z.lazy(() => SortOrderSchema).optional(),
  commission: z.lazy(() => SortOrderSchema).optional(),
  adCost: z.lazy(() => SortOrderSchema).optional(),
  packagingCost: z.lazy(() => SortOrderSchema).optional(),
  netMargin: z.lazy(() => SortOrderSchema).optional(),
  marginRate: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const IntNullableWithAggregatesFilterSchema: z.ZodType<Prisma.IntNullableWithAggregatesFilter> = z.object({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedIntNullableFilterSchema).optional()
}).strict();

export const StringNullableListFilterSchema: z.ZodType<Prisma.StringNullableListFilter> = z.object({
  equals: z.string().array().optional().nullable(),
  has: z.string().optional().nullable(),
  hasEvery: z.string().array().optional(),
  hasSome: z.string().array().optional(),
  isEmpty: z.boolean().optional()
}).strict();

export const DetailPageCountOrderByAggregateInputSchema: z.ZodType<Prisma.DetailPageCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  productId: z.lazy(() => SortOrderSchema).optional(),
  productName: z.lazy(() => SortOrderSchema).optional(),
  summary: z.lazy(() => SortOrderSchema).optional(),
  usps: z.lazy(() => SortOrderSchema).optional(),
  keywords: z.lazy(() => SortOrderSchema).optional(),
  template: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const DetailPageAvgOrderByAggregateInputSchema: z.ZodType<Prisma.DetailPageAvgOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  productId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const DetailPageMaxOrderByAggregateInputSchema: z.ZodType<Prisma.DetailPageMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  productId: z.lazy(() => SortOrderSchema).optional(),
  productName: z.lazy(() => SortOrderSchema).optional(),
  summary: z.lazy(() => SortOrderSchema).optional(),
  template: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const DetailPageMinOrderByAggregateInputSchema: z.ZodType<Prisma.DetailPageMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  productId: z.lazy(() => SortOrderSchema).optional(),
  productName: z.lazy(() => SortOrderSchema).optional(),
  summary: z.lazy(() => SortOrderSchema).optional(),
  template: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const DetailPageSumOrderByAggregateInputSchema: z.ZodType<Prisma.DetailPageSumOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  productId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const RegistrationCountOrderByAggregateInputSchema: z.ZodType<Prisma.RegistrationCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  productId: z.lazy(() => SortOrderSchema).optional(),
  productName: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  recommendedTitle: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  wholesalePrice: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  platform: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const RegistrationAvgOrderByAggregateInputSchema: z.ZodType<Prisma.RegistrationAvgOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  productId: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  wholesalePrice: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const RegistrationMaxOrderByAggregateInputSchema: z.ZodType<Prisma.RegistrationMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  productId: z.lazy(() => SortOrderSchema).optional(),
  productName: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  recommendedTitle: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  wholesalePrice: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  platform: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const RegistrationMinOrderByAggregateInputSchema: z.ZodType<Prisma.RegistrationMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  productId: z.lazy(() => SortOrderSchema).optional(),
  productName: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  recommendedTitle: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  wholesalePrice: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  platform: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const RegistrationSumOrderByAggregateInputSchema: z.ZodType<Prisma.RegistrationSumOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  productId: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  wholesalePrice: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const ActivityLogCountOrderByAggregateInputSchema: z.ZodType<Prisma.ActivityLogCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  action: z.lazy(() => SortOrderSchema).optional(),
  productName: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  details: z.lazy(() => SortOrderSchema).optional(),
  timestamp: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const ActivityLogAvgOrderByAggregateInputSchema: z.ZodType<Prisma.ActivityLogAvgOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const ActivityLogMaxOrderByAggregateInputSchema: z.ZodType<Prisma.ActivityLogMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  action: z.lazy(() => SortOrderSchema).optional(),
  productName: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  details: z.lazy(() => SortOrderSchema).optional(),
  timestamp: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const ActivityLogMinOrderByAggregateInputSchema: z.ZodType<Prisma.ActivityLogMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  action: z.lazy(() => SortOrderSchema).optional(),
  productName: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  details: z.lazy(() => SortOrderSchema).optional(),
  timestamp: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const ActivityLogSumOrderByAggregateInputSchema: z.ZodType<Prisma.ActivityLogSumOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const DailyStatCountOrderByAggregateInputSchema: z.ZodType<Prisma.DailyStatCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional(),
  revenue: z.lazy(() => SortOrderSchema).optional(),
  products: z.lazy(() => SortOrderSchema).optional(),
  margin: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const DailyStatAvgOrderByAggregateInputSchema: z.ZodType<Prisma.DailyStatAvgOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  revenue: z.lazy(() => SortOrderSchema).optional(),
  products: z.lazy(() => SortOrderSchema).optional(),
  margin: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const DailyStatMaxOrderByAggregateInputSchema: z.ZodType<Prisma.DailyStatMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional(),
  revenue: z.lazy(() => SortOrderSchema).optional(),
  products: z.lazy(() => SortOrderSchema).optional(),
  margin: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const DailyStatMinOrderByAggregateInputSchema: z.ZodType<Prisma.DailyStatMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional(),
  revenue: z.lazy(() => SortOrderSchema).optional(),
  products: z.lazy(() => SortOrderSchema).optional(),
  margin: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const DailyStatSumOrderByAggregateInputSchema: z.ZodType<Prisma.DailyStatSumOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  revenue: z.lazy(() => SortOrderSchema).optional(),
  products: z.lazy(() => SortOrderSchema).optional(),
  margin: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const SubscriptionCreateNestedOneWithoutUserInputSchema: z.ZodType<Prisma.SubscriptionCreateNestedOneWithoutUserInput> = z.object({
  create: z.union([ z.lazy(() => SubscriptionCreateWithoutUserInputSchema),z.lazy(() => SubscriptionUncheckedCreateWithoutUserInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => SubscriptionCreateOrConnectWithoutUserInputSchema).optional(),
  connect: z.lazy(() => SubscriptionWhereUniqueInputSchema).optional()
}).strict();

export const PaymentHistoryCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.PaymentHistoryCreateNestedManyWithoutUserInput> = z.object({
  create: z.union([ z.lazy(() => PaymentHistoryCreateWithoutUserInputSchema),z.lazy(() => PaymentHistoryCreateWithoutUserInputSchema).array(),z.lazy(() => PaymentHistoryUncheckedCreateWithoutUserInputSchema),z.lazy(() => PaymentHistoryUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PaymentHistoryCreateOrConnectWithoutUserInputSchema),z.lazy(() => PaymentHistoryCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PaymentHistoryCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => PaymentHistoryWhereUniqueInputSchema),z.lazy(() => PaymentHistoryWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const SubscriptionUncheckedCreateNestedOneWithoutUserInputSchema: z.ZodType<Prisma.SubscriptionUncheckedCreateNestedOneWithoutUserInput> = z.object({
  create: z.union([ z.lazy(() => SubscriptionCreateWithoutUserInputSchema),z.lazy(() => SubscriptionUncheckedCreateWithoutUserInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => SubscriptionCreateOrConnectWithoutUserInputSchema).optional(),
  connect: z.lazy(() => SubscriptionWhereUniqueInputSchema).optional()
}).strict();

export const PaymentHistoryUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.PaymentHistoryUncheckedCreateNestedManyWithoutUserInput> = z.object({
  create: z.union([ z.lazy(() => PaymentHistoryCreateWithoutUserInputSchema),z.lazy(() => PaymentHistoryCreateWithoutUserInputSchema).array(),z.lazy(() => PaymentHistoryUncheckedCreateWithoutUserInputSchema),z.lazy(() => PaymentHistoryUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PaymentHistoryCreateOrConnectWithoutUserInputSchema),z.lazy(() => PaymentHistoryCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PaymentHistoryCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => PaymentHistoryWhereUniqueInputSchema),z.lazy(() => PaymentHistoryWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const StringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.StringFieldUpdateOperationsInput> = z.object({
  set: z.string().optional()
}).strict();

export const NullableStringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableStringFieldUpdateOperationsInput> = z.object({
  set: z.string().optional().nullable()
}).strict();

export const DateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.DateTimeFieldUpdateOperationsInput> = z.object({
  set: z.coerce.date().optional()
}).strict();

export const SubscriptionUpdateOneWithoutUserNestedInputSchema: z.ZodType<Prisma.SubscriptionUpdateOneWithoutUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => SubscriptionCreateWithoutUserInputSchema),z.lazy(() => SubscriptionUncheckedCreateWithoutUserInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => SubscriptionCreateOrConnectWithoutUserInputSchema).optional(),
  upsert: z.lazy(() => SubscriptionUpsertWithoutUserInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => SubscriptionWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => SubscriptionWhereInputSchema) ]).optional(),
  connect: z.lazy(() => SubscriptionWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => SubscriptionUpdateToOneWithWhereWithoutUserInputSchema),z.lazy(() => SubscriptionUpdateWithoutUserInputSchema),z.lazy(() => SubscriptionUncheckedUpdateWithoutUserInputSchema) ]).optional(),
}).strict();

export const PaymentHistoryUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.PaymentHistoryUpdateManyWithoutUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => PaymentHistoryCreateWithoutUserInputSchema),z.lazy(() => PaymentHistoryCreateWithoutUserInputSchema).array(),z.lazy(() => PaymentHistoryUncheckedCreateWithoutUserInputSchema),z.lazy(() => PaymentHistoryUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PaymentHistoryCreateOrConnectWithoutUserInputSchema),z.lazy(() => PaymentHistoryCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PaymentHistoryUpsertWithWhereUniqueWithoutUserInputSchema),z.lazy(() => PaymentHistoryUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PaymentHistoryCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => PaymentHistoryWhereUniqueInputSchema),z.lazy(() => PaymentHistoryWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PaymentHistoryWhereUniqueInputSchema),z.lazy(() => PaymentHistoryWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PaymentHistoryWhereUniqueInputSchema),z.lazy(() => PaymentHistoryWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PaymentHistoryWhereUniqueInputSchema),z.lazy(() => PaymentHistoryWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PaymentHistoryUpdateWithWhereUniqueWithoutUserInputSchema),z.lazy(() => PaymentHistoryUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PaymentHistoryUpdateManyWithWhereWithoutUserInputSchema),z.lazy(() => PaymentHistoryUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PaymentHistoryScalarWhereInputSchema),z.lazy(() => PaymentHistoryScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const SubscriptionUncheckedUpdateOneWithoutUserNestedInputSchema: z.ZodType<Prisma.SubscriptionUncheckedUpdateOneWithoutUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => SubscriptionCreateWithoutUserInputSchema),z.lazy(() => SubscriptionUncheckedCreateWithoutUserInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => SubscriptionCreateOrConnectWithoutUserInputSchema).optional(),
  upsert: z.lazy(() => SubscriptionUpsertWithoutUserInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => SubscriptionWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => SubscriptionWhereInputSchema) ]).optional(),
  connect: z.lazy(() => SubscriptionWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => SubscriptionUpdateToOneWithWhereWithoutUserInputSchema),z.lazy(() => SubscriptionUpdateWithoutUserInputSchema),z.lazy(() => SubscriptionUncheckedUpdateWithoutUserInputSchema) ]).optional(),
}).strict();

export const PaymentHistoryUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.PaymentHistoryUncheckedUpdateManyWithoutUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => PaymentHistoryCreateWithoutUserInputSchema),z.lazy(() => PaymentHistoryCreateWithoutUserInputSchema).array(),z.lazy(() => PaymentHistoryUncheckedCreateWithoutUserInputSchema),z.lazy(() => PaymentHistoryUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PaymentHistoryCreateOrConnectWithoutUserInputSchema),z.lazy(() => PaymentHistoryCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PaymentHistoryUpsertWithWhereUniqueWithoutUserInputSchema),z.lazy(() => PaymentHistoryUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PaymentHistoryCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => PaymentHistoryWhereUniqueInputSchema),z.lazy(() => PaymentHistoryWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PaymentHistoryWhereUniqueInputSchema),z.lazy(() => PaymentHistoryWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PaymentHistoryWhereUniqueInputSchema),z.lazy(() => PaymentHistoryWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PaymentHistoryWhereUniqueInputSchema),z.lazy(() => PaymentHistoryWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PaymentHistoryUpdateWithWhereUniqueWithoutUserInputSchema),z.lazy(() => PaymentHistoryUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PaymentHistoryUpdateManyWithWhereWithoutUserInputSchema),z.lazy(() => PaymentHistoryUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PaymentHistoryScalarWhereInputSchema),z.lazy(() => PaymentHistoryScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const UserCreateNestedOneWithoutSubscriptionInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutSubscriptionInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutSubscriptionInputSchema),z.lazy(() => UserUncheckedCreateWithoutSubscriptionInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutSubscriptionInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional()
}).strict();

export const PlanCreateNestedOneWithoutSubscriptionsInputSchema: z.ZodType<Prisma.PlanCreateNestedOneWithoutSubscriptionsInput> = z.object({
  create: z.union([ z.lazy(() => PlanCreateWithoutSubscriptionsInputSchema),z.lazy(() => PlanUncheckedCreateWithoutSubscriptionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PlanCreateOrConnectWithoutSubscriptionsInputSchema).optional(),
  connect: z.lazy(() => PlanWhereUniqueInputSchema).optional()
}).strict();

export const EnumSubscriptionStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumSubscriptionStatusFieldUpdateOperationsInput> = z.object({
  set: z.lazy(() => SubscriptionStatusSchema).optional()
}).strict();

export const NullableDateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableDateTimeFieldUpdateOperationsInput> = z.object({
  set: z.coerce.date().optional().nullable()
}).strict();

export const EnumSubscriptionPaymentMethodFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumSubscriptionPaymentMethodFieldUpdateOperationsInput> = z.object({
  set: z.lazy(() => SubscriptionPaymentMethodSchema).optional()
}).strict();

export const UserUpdateOneRequiredWithoutSubscriptionNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutSubscriptionNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutSubscriptionInputSchema),z.lazy(() => UserUncheckedCreateWithoutSubscriptionInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutSubscriptionInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutSubscriptionInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutSubscriptionInputSchema),z.lazy(() => UserUpdateWithoutSubscriptionInputSchema),z.lazy(() => UserUncheckedUpdateWithoutSubscriptionInputSchema) ]).optional(),
}).strict();

export const PlanUpdateOneRequiredWithoutSubscriptionsNestedInputSchema: z.ZodType<Prisma.PlanUpdateOneRequiredWithoutSubscriptionsNestedInput> = z.object({
  create: z.union([ z.lazy(() => PlanCreateWithoutSubscriptionsInputSchema),z.lazy(() => PlanUncheckedCreateWithoutSubscriptionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PlanCreateOrConnectWithoutSubscriptionsInputSchema).optional(),
  upsert: z.lazy(() => PlanUpsertWithoutSubscriptionsInputSchema).optional(),
  connect: z.lazy(() => PlanWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => PlanUpdateToOneWithWhereWithoutSubscriptionsInputSchema),z.lazy(() => PlanUpdateWithoutSubscriptionsInputSchema),z.lazy(() => PlanUncheckedUpdateWithoutSubscriptionsInputSchema) ]).optional(),
}).strict();

export const SubscriptionCreateNestedManyWithoutPlanInputSchema: z.ZodType<Prisma.SubscriptionCreateNestedManyWithoutPlanInput> = z.object({
  create: z.union([ z.lazy(() => SubscriptionCreateWithoutPlanInputSchema),z.lazy(() => SubscriptionCreateWithoutPlanInputSchema).array(),z.lazy(() => SubscriptionUncheckedCreateWithoutPlanInputSchema),z.lazy(() => SubscriptionUncheckedCreateWithoutPlanInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SubscriptionCreateOrConnectWithoutPlanInputSchema),z.lazy(() => SubscriptionCreateOrConnectWithoutPlanInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SubscriptionCreateManyPlanInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => SubscriptionWhereUniqueInputSchema),z.lazy(() => SubscriptionWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const SubscriptionUncheckedCreateNestedManyWithoutPlanInputSchema: z.ZodType<Prisma.SubscriptionUncheckedCreateNestedManyWithoutPlanInput> = z.object({
  create: z.union([ z.lazy(() => SubscriptionCreateWithoutPlanInputSchema),z.lazy(() => SubscriptionCreateWithoutPlanInputSchema).array(),z.lazy(() => SubscriptionUncheckedCreateWithoutPlanInputSchema),z.lazy(() => SubscriptionUncheckedCreateWithoutPlanInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SubscriptionCreateOrConnectWithoutPlanInputSchema),z.lazy(() => SubscriptionCreateOrConnectWithoutPlanInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SubscriptionCreateManyPlanInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => SubscriptionWhereUniqueInputSchema),z.lazy(() => SubscriptionWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const BoolFieldUpdateOperationsInputSchema: z.ZodType<Prisma.BoolFieldUpdateOperationsInput> = z.object({
  set: z.boolean().optional()
}).strict();

export const DecimalFieldUpdateOperationsInputSchema: z.ZodType<Prisma.DecimalFieldUpdateOperationsInput> = z.object({
  set: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  increment: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  decrement: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  multiply: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  divide: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional()
}).strict();

export const SubscriptionUpdateManyWithoutPlanNestedInputSchema: z.ZodType<Prisma.SubscriptionUpdateManyWithoutPlanNestedInput> = z.object({
  create: z.union([ z.lazy(() => SubscriptionCreateWithoutPlanInputSchema),z.lazy(() => SubscriptionCreateWithoutPlanInputSchema).array(),z.lazy(() => SubscriptionUncheckedCreateWithoutPlanInputSchema),z.lazy(() => SubscriptionUncheckedCreateWithoutPlanInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SubscriptionCreateOrConnectWithoutPlanInputSchema),z.lazy(() => SubscriptionCreateOrConnectWithoutPlanInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SubscriptionUpsertWithWhereUniqueWithoutPlanInputSchema),z.lazy(() => SubscriptionUpsertWithWhereUniqueWithoutPlanInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SubscriptionCreateManyPlanInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => SubscriptionWhereUniqueInputSchema),z.lazy(() => SubscriptionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SubscriptionWhereUniqueInputSchema),z.lazy(() => SubscriptionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SubscriptionWhereUniqueInputSchema),z.lazy(() => SubscriptionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SubscriptionWhereUniqueInputSchema),z.lazy(() => SubscriptionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SubscriptionUpdateWithWhereUniqueWithoutPlanInputSchema),z.lazy(() => SubscriptionUpdateWithWhereUniqueWithoutPlanInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SubscriptionUpdateManyWithWhereWithoutPlanInputSchema),z.lazy(() => SubscriptionUpdateManyWithWhereWithoutPlanInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SubscriptionScalarWhereInputSchema),z.lazy(() => SubscriptionScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const SubscriptionUncheckedUpdateManyWithoutPlanNestedInputSchema: z.ZodType<Prisma.SubscriptionUncheckedUpdateManyWithoutPlanNestedInput> = z.object({
  create: z.union([ z.lazy(() => SubscriptionCreateWithoutPlanInputSchema),z.lazy(() => SubscriptionCreateWithoutPlanInputSchema).array(),z.lazy(() => SubscriptionUncheckedCreateWithoutPlanInputSchema),z.lazy(() => SubscriptionUncheckedCreateWithoutPlanInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SubscriptionCreateOrConnectWithoutPlanInputSchema),z.lazy(() => SubscriptionCreateOrConnectWithoutPlanInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SubscriptionUpsertWithWhereUniqueWithoutPlanInputSchema),z.lazy(() => SubscriptionUpsertWithWhereUniqueWithoutPlanInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SubscriptionCreateManyPlanInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => SubscriptionWhereUniqueInputSchema),z.lazy(() => SubscriptionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SubscriptionWhereUniqueInputSchema),z.lazy(() => SubscriptionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SubscriptionWhereUniqueInputSchema),z.lazy(() => SubscriptionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SubscriptionWhereUniqueInputSchema),z.lazy(() => SubscriptionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SubscriptionUpdateWithWhereUniqueWithoutPlanInputSchema),z.lazy(() => SubscriptionUpdateWithWhereUniqueWithoutPlanInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SubscriptionUpdateManyWithWhereWithoutPlanInputSchema),z.lazy(() => SubscriptionUpdateManyWithWhereWithoutPlanInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SubscriptionScalarWhereInputSchema),z.lazy(() => SubscriptionScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const UserCreateNestedOneWithoutPaymentHistoriesInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutPaymentHistoriesInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutPaymentHistoriesInputSchema),z.lazy(() => UserUncheckedCreateWithoutPaymentHistoriesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutPaymentHistoriesInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional()
}).strict();

export const EnumPaymentStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumPaymentStatusFieldUpdateOperationsInput> = z.object({
  set: z.lazy(() => PaymentStatusSchema).optional()
}).strict();

export const IntFieldUpdateOperationsInputSchema: z.ZodType<Prisma.IntFieldUpdateOperationsInput> = z.object({
  set: z.number().optional(),
  increment: z.number().optional(),
  decrement: z.number().optional(),
  multiply: z.number().optional(),
  divide: z.number().optional()
}).strict();

export const UserUpdateOneRequiredWithoutPaymentHistoriesNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutPaymentHistoriesNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutPaymentHistoriesInputSchema),z.lazy(() => UserUncheckedCreateWithoutPaymentHistoriesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutPaymentHistoriesInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutPaymentHistoriesInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutPaymentHistoriesInputSchema),z.lazy(() => UserUpdateWithoutPaymentHistoriesInputSchema),z.lazy(() => UserUncheckedUpdateWithoutPaymentHistoriesInputSchema) ]).optional(),
}).strict();

export const MarginCreateNestedManyWithoutProductInputSchema: z.ZodType<Prisma.MarginCreateNestedManyWithoutProductInput> = z.object({
  create: z.union([ z.lazy(() => MarginCreateWithoutProductInputSchema),z.lazy(() => MarginCreateWithoutProductInputSchema).array(),z.lazy(() => MarginUncheckedCreateWithoutProductInputSchema),z.lazy(() => MarginUncheckedCreateWithoutProductInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => MarginCreateOrConnectWithoutProductInputSchema),z.lazy(() => MarginCreateOrConnectWithoutProductInputSchema).array() ]).optional(),
  createMany: z.lazy(() => MarginCreateManyProductInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => MarginWhereUniqueInputSchema),z.lazy(() => MarginWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const DetailPageCreateNestedManyWithoutProductInputSchema: z.ZodType<Prisma.DetailPageCreateNestedManyWithoutProductInput> = z.object({
  create: z.union([ z.lazy(() => DetailPageCreateWithoutProductInputSchema),z.lazy(() => DetailPageCreateWithoutProductInputSchema).array(),z.lazy(() => DetailPageUncheckedCreateWithoutProductInputSchema),z.lazy(() => DetailPageUncheckedCreateWithoutProductInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => DetailPageCreateOrConnectWithoutProductInputSchema),z.lazy(() => DetailPageCreateOrConnectWithoutProductInputSchema).array() ]).optional(),
  createMany: z.lazy(() => DetailPageCreateManyProductInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => DetailPageWhereUniqueInputSchema),z.lazy(() => DetailPageWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const RegistrationCreateNestedManyWithoutProductInputSchema: z.ZodType<Prisma.RegistrationCreateNestedManyWithoutProductInput> = z.object({
  create: z.union([ z.lazy(() => RegistrationCreateWithoutProductInputSchema),z.lazy(() => RegistrationCreateWithoutProductInputSchema).array(),z.lazy(() => RegistrationUncheckedCreateWithoutProductInputSchema),z.lazy(() => RegistrationUncheckedCreateWithoutProductInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RegistrationCreateOrConnectWithoutProductInputSchema),z.lazy(() => RegistrationCreateOrConnectWithoutProductInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RegistrationCreateManyProductInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema),z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const MarginUncheckedCreateNestedManyWithoutProductInputSchema: z.ZodType<Prisma.MarginUncheckedCreateNestedManyWithoutProductInput> = z.object({
  create: z.union([ z.lazy(() => MarginCreateWithoutProductInputSchema),z.lazy(() => MarginCreateWithoutProductInputSchema).array(),z.lazy(() => MarginUncheckedCreateWithoutProductInputSchema),z.lazy(() => MarginUncheckedCreateWithoutProductInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => MarginCreateOrConnectWithoutProductInputSchema),z.lazy(() => MarginCreateOrConnectWithoutProductInputSchema).array() ]).optional(),
  createMany: z.lazy(() => MarginCreateManyProductInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => MarginWhereUniqueInputSchema),z.lazy(() => MarginWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const DetailPageUncheckedCreateNestedManyWithoutProductInputSchema: z.ZodType<Prisma.DetailPageUncheckedCreateNestedManyWithoutProductInput> = z.object({
  create: z.union([ z.lazy(() => DetailPageCreateWithoutProductInputSchema),z.lazy(() => DetailPageCreateWithoutProductInputSchema).array(),z.lazy(() => DetailPageUncheckedCreateWithoutProductInputSchema),z.lazy(() => DetailPageUncheckedCreateWithoutProductInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => DetailPageCreateOrConnectWithoutProductInputSchema),z.lazy(() => DetailPageCreateOrConnectWithoutProductInputSchema).array() ]).optional(),
  createMany: z.lazy(() => DetailPageCreateManyProductInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => DetailPageWhereUniqueInputSchema),z.lazy(() => DetailPageWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const RegistrationUncheckedCreateNestedManyWithoutProductInputSchema: z.ZodType<Prisma.RegistrationUncheckedCreateNestedManyWithoutProductInput> = z.object({
  create: z.union([ z.lazy(() => RegistrationCreateWithoutProductInputSchema),z.lazy(() => RegistrationCreateWithoutProductInputSchema).array(),z.lazy(() => RegistrationUncheckedCreateWithoutProductInputSchema),z.lazy(() => RegistrationUncheckedCreateWithoutProductInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RegistrationCreateOrConnectWithoutProductInputSchema),z.lazy(() => RegistrationCreateOrConnectWithoutProductInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RegistrationCreateManyProductInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema),z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const FloatFieldUpdateOperationsInputSchema: z.ZodType<Prisma.FloatFieldUpdateOperationsInput> = z.object({
  set: z.number().optional(),
  increment: z.number().optional(),
  decrement: z.number().optional(),
  multiply: z.number().optional(),
  divide: z.number().optional()
}).strict();

export const MarginUpdateManyWithoutProductNestedInputSchema: z.ZodType<Prisma.MarginUpdateManyWithoutProductNestedInput> = z.object({
  create: z.union([ z.lazy(() => MarginCreateWithoutProductInputSchema),z.lazy(() => MarginCreateWithoutProductInputSchema).array(),z.lazy(() => MarginUncheckedCreateWithoutProductInputSchema),z.lazy(() => MarginUncheckedCreateWithoutProductInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => MarginCreateOrConnectWithoutProductInputSchema),z.lazy(() => MarginCreateOrConnectWithoutProductInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => MarginUpsertWithWhereUniqueWithoutProductInputSchema),z.lazy(() => MarginUpsertWithWhereUniqueWithoutProductInputSchema).array() ]).optional(),
  createMany: z.lazy(() => MarginCreateManyProductInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => MarginWhereUniqueInputSchema),z.lazy(() => MarginWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => MarginWhereUniqueInputSchema),z.lazy(() => MarginWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => MarginWhereUniqueInputSchema),z.lazy(() => MarginWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => MarginWhereUniqueInputSchema),z.lazy(() => MarginWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => MarginUpdateWithWhereUniqueWithoutProductInputSchema),z.lazy(() => MarginUpdateWithWhereUniqueWithoutProductInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => MarginUpdateManyWithWhereWithoutProductInputSchema),z.lazy(() => MarginUpdateManyWithWhereWithoutProductInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => MarginScalarWhereInputSchema),z.lazy(() => MarginScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const DetailPageUpdateManyWithoutProductNestedInputSchema: z.ZodType<Prisma.DetailPageUpdateManyWithoutProductNestedInput> = z.object({
  create: z.union([ z.lazy(() => DetailPageCreateWithoutProductInputSchema),z.lazy(() => DetailPageCreateWithoutProductInputSchema).array(),z.lazy(() => DetailPageUncheckedCreateWithoutProductInputSchema),z.lazy(() => DetailPageUncheckedCreateWithoutProductInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => DetailPageCreateOrConnectWithoutProductInputSchema),z.lazy(() => DetailPageCreateOrConnectWithoutProductInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => DetailPageUpsertWithWhereUniqueWithoutProductInputSchema),z.lazy(() => DetailPageUpsertWithWhereUniqueWithoutProductInputSchema).array() ]).optional(),
  createMany: z.lazy(() => DetailPageCreateManyProductInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => DetailPageWhereUniqueInputSchema),z.lazy(() => DetailPageWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => DetailPageWhereUniqueInputSchema),z.lazy(() => DetailPageWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => DetailPageWhereUniqueInputSchema),z.lazy(() => DetailPageWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => DetailPageWhereUniqueInputSchema),z.lazy(() => DetailPageWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => DetailPageUpdateWithWhereUniqueWithoutProductInputSchema),z.lazy(() => DetailPageUpdateWithWhereUniqueWithoutProductInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => DetailPageUpdateManyWithWhereWithoutProductInputSchema),z.lazy(() => DetailPageUpdateManyWithWhereWithoutProductInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => DetailPageScalarWhereInputSchema),z.lazy(() => DetailPageScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const RegistrationUpdateManyWithoutProductNestedInputSchema: z.ZodType<Prisma.RegistrationUpdateManyWithoutProductNestedInput> = z.object({
  create: z.union([ z.lazy(() => RegistrationCreateWithoutProductInputSchema),z.lazy(() => RegistrationCreateWithoutProductInputSchema).array(),z.lazy(() => RegistrationUncheckedCreateWithoutProductInputSchema),z.lazy(() => RegistrationUncheckedCreateWithoutProductInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RegistrationCreateOrConnectWithoutProductInputSchema),z.lazy(() => RegistrationCreateOrConnectWithoutProductInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => RegistrationUpsertWithWhereUniqueWithoutProductInputSchema),z.lazy(() => RegistrationUpsertWithWhereUniqueWithoutProductInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RegistrationCreateManyProductInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema),z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema),z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema),z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema),z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => RegistrationUpdateWithWhereUniqueWithoutProductInputSchema),z.lazy(() => RegistrationUpdateWithWhereUniqueWithoutProductInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => RegistrationUpdateManyWithWhereWithoutProductInputSchema),z.lazy(() => RegistrationUpdateManyWithWhereWithoutProductInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => RegistrationScalarWhereInputSchema),z.lazy(() => RegistrationScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const MarginUncheckedUpdateManyWithoutProductNestedInputSchema: z.ZodType<Prisma.MarginUncheckedUpdateManyWithoutProductNestedInput> = z.object({
  create: z.union([ z.lazy(() => MarginCreateWithoutProductInputSchema),z.lazy(() => MarginCreateWithoutProductInputSchema).array(),z.lazy(() => MarginUncheckedCreateWithoutProductInputSchema),z.lazy(() => MarginUncheckedCreateWithoutProductInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => MarginCreateOrConnectWithoutProductInputSchema),z.lazy(() => MarginCreateOrConnectWithoutProductInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => MarginUpsertWithWhereUniqueWithoutProductInputSchema),z.lazy(() => MarginUpsertWithWhereUniqueWithoutProductInputSchema).array() ]).optional(),
  createMany: z.lazy(() => MarginCreateManyProductInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => MarginWhereUniqueInputSchema),z.lazy(() => MarginWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => MarginWhereUniqueInputSchema),z.lazy(() => MarginWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => MarginWhereUniqueInputSchema),z.lazy(() => MarginWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => MarginWhereUniqueInputSchema),z.lazy(() => MarginWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => MarginUpdateWithWhereUniqueWithoutProductInputSchema),z.lazy(() => MarginUpdateWithWhereUniqueWithoutProductInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => MarginUpdateManyWithWhereWithoutProductInputSchema),z.lazy(() => MarginUpdateManyWithWhereWithoutProductInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => MarginScalarWhereInputSchema),z.lazy(() => MarginScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const DetailPageUncheckedUpdateManyWithoutProductNestedInputSchema: z.ZodType<Prisma.DetailPageUncheckedUpdateManyWithoutProductNestedInput> = z.object({
  create: z.union([ z.lazy(() => DetailPageCreateWithoutProductInputSchema),z.lazy(() => DetailPageCreateWithoutProductInputSchema).array(),z.lazy(() => DetailPageUncheckedCreateWithoutProductInputSchema),z.lazy(() => DetailPageUncheckedCreateWithoutProductInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => DetailPageCreateOrConnectWithoutProductInputSchema),z.lazy(() => DetailPageCreateOrConnectWithoutProductInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => DetailPageUpsertWithWhereUniqueWithoutProductInputSchema),z.lazy(() => DetailPageUpsertWithWhereUniqueWithoutProductInputSchema).array() ]).optional(),
  createMany: z.lazy(() => DetailPageCreateManyProductInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => DetailPageWhereUniqueInputSchema),z.lazy(() => DetailPageWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => DetailPageWhereUniqueInputSchema),z.lazy(() => DetailPageWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => DetailPageWhereUniqueInputSchema),z.lazy(() => DetailPageWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => DetailPageWhereUniqueInputSchema),z.lazy(() => DetailPageWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => DetailPageUpdateWithWhereUniqueWithoutProductInputSchema),z.lazy(() => DetailPageUpdateWithWhereUniqueWithoutProductInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => DetailPageUpdateManyWithWhereWithoutProductInputSchema),z.lazy(() => DetailPageUpdateManyWithWhereWithoutProductInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => DetailPageScalarWhereInputSchema),z.lazy(() => DetailPageScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const RegistrationUncheckedUpdateManyWithoutProductNestedInputSchema: z.ZodType<Prisma.RegistrationUncheckedUpdateManyWithoutProductNestedInput> = z.object({
  create: z.union([ z.lazy(() => RegistrationCreateWithoutProductInputSchema),z.lazy(() => RegistrationCreateWithoutProductInputSchema).array(),z.lazy(() => RegistrationUncheckedCreateWithoutProductInputSchema),z.lazy(() => RegistrationUncheckedCreateWithoutProductInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RegistrationCreateOrConnectWithoutProductInputSchema),z.lazy(() => RegistrationCreateOrConnectWithoutProductInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => RegistrationUpsertWithWhereUniqueWithoutProductInputSchema),z.lazy(() => RegistrationUpsertWithWhereUniqueWithoutProductInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RegistrationCreateManyProductInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema),z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema),z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema),z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => RegistrationWhereUniqueInputSchema),z.lazy(() => RegistrationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => RegistrationUpdateWithWhereUniqueWithoutProductInputSchema),z.lazy(() => RegistrationUpdateWithWhereUniqueWithoutProductInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => RegistrationUpdateManyWithWhereWithoutProductInputSchema),z.lazy(() => RegistrationUpdateManyWithWhereWithoutProductInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => RegistrationScalarWhereInputSchema),z.lazy(() => RegistrationScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const RecommendationItemCreateNestedManyWithoutRecommendationInputSchema: z.ZodType<Prisma.RecommendationItemCreateNestedManyWithoutRecommendationInput> = z.object({
  create: z.union([ z.lazy(() => RecommendationItemCreateWithoutRecommendationInputSchema),z.lazy(() => RecommendationItemCreateWithoutRecommendationInputSchema).array(),z.lazy(() => RecommendationItemUncheckedCreateWithoutRecommendationInputSchema),z.lazy(() => RecommendationItemUncheckedCreateWithoutRecommendationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RecommendationItemCreateOrConnectWithoutRecommendationInputSchema),z.lazy(() => RecommendationItemCreateOrConnectWithoutRecommendationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RecommendationItemCreateManyRecommendationInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => RecommendationItemWhereUniqueInputSchema),z.lazy(() => RecommendationItemWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const RecommendationItemUncheckedCreateNestedManyWithoutRecommendationInputSchema: z.ZodType<Prisma.RecommendationItemUncheckedCreateNestedManyWithoutRecommendationInput> = z.object({
  create: z.union([ z.lazy(() => RecommendationItemCreateWithoutRecommendationInputSchema),z.lazy(() => RecommendationItemCreateWithoutRecommendationInputSchema).array(),z.lazy(() => RecommendationItemUncheckedCreateWithoutRecommendationInputSchema),z.lazy(() => RecommendationItemUncheckedCreateWithoutRecommendationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RecommendationItemCreateOrConnectWithoutRecommendationInputSchema),z.lazy(() => RecommendationItemCreateOrConnectWithoutRecommendationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RecommendationItemCreateManyRecommendationInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => RecommendationItemWhereUniqueInputSchema),z.lazy(() => RecommendationItemWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const RecommendationItemUpdateManyWithoutRecommendationNestedInputSchema: z.ZodType<Prisma.RecommendationItemUpdateManyWithoutRecommendationNestedInput> = z.object({
  create: z.union([ z.lazy(() => RecommendationItemCreateWithoutRecommendationInputSchema),z.lazy(() => RecommendationItemCreateWithoutRecommendationInputSchema).array(),z.lazy(() => RecommendationItemUncheckedCreateWithoutRecommendationInputSchema),z.lazy(() => RecommendationItemUncheckedCreateWithoutRecommendationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RecommendationItemCreateOrConnectWithoutRecommendationInputSchema),z.lazy(() => RecommendationItemCreateOrConnectWithoutRecommendationInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => RecommendationItemUpsertWithWhereUniqueWithoutRecommendationInputSchema),z.lazy(() => RecommendationItemUpsertWithWhereUniqueWithoutRecommendationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RecommendationItemCreateManyRecommendationInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => RecommendationItemWhereUniqueInputSchema),z.lazy(() => RecommendationItemWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => RecommendationItemWhereUniqueInputSchema),z.lazy(() => RecommendationItemWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => RecommendationItemWhereUniqueInputSchema),z.lazy(() => RecommendationItemWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => RecommendationItemWhereUniqueInputSchema),z.lazy(() => RecommendationItemWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => RecommendationItemUpdateWithWhereUniqueWithoutRecommendationInputSchema),z.lazy(() => RecommendationItemUpdateWithWhereUniqueWithoutRecommendationInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => RecommendationItemUpdateManyWithWhereWithoutRecommendationInputSchema),z.lazy(() => RecommendationItemUpdateManyWithWhereWithoutRecommendationInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => RecommendationItemScalarWhereInputSchema),z.lazy(() => RecommendationItemScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const RecommendationItemUncheckedUpdateManyWithoutRecommendationNestedInputSchema: z.ZodType<Prisma.RecommendationItemUncheckedUpdateManyWithoutRecommendationNestedInput> = z.object({
  create: z.union([ z.lazy(() => RecommendationItemCreateWithoutRecommendationInputSchema),z.lazy(() => RecommendationItemCreateWithoutRecommendationInputSchema).array(),z.lazy(() => RecommendationItemUncheckedCreateWithoutRecommendationInputSchema),z.lazy(() => RecommendationItemUncheckedCreateWithoutRecommendationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => RecommendationItemCreateOrConnectWithoutRecommendationInputSchema),z.lazy(() => RecommendationItemCreateOrConnectWithoutRecommendationInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => RecommendationItemUpsertWithWhereUniqueWithoutRecommendationInputSchema),z.lazy(() => RecommendationItemUpsertWithWhereUniqueWithoutRecommendationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => RecommendationItemCreateManyRecommendationInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => RecommendationItemWhereUniqueInputSchema),z.lazy(() => RecommendationItemWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => RecommendationItemWhereUniqueInputSchema),z.lazy(() => RecommendationItemWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => RecommendationItemWhereUniqueInputSchema),z.lazy(() => RecommendationItemWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => RecommendationItemWhereUniqueInputSchema),z.lazy(() => RecommendationItemWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => RecommendationItemUpdateWithWhereUniqueWithoutRecommendationInputSchema),z.lazy(() => RecommendationItemUpdateWithWhereUniqueWithoutRecommendationInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => RecommendationItemUpdateManyWithWhereWithoutRecommendationInputSchema),z.lazy(() => RecommendationItemUpdateManyWithWhereWithoutRecommendationInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => RecommendationItemScalarWhereInputSchema),z.lazy(() => RecommendationItemScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const RecommendationCreateNestedOneWithoutItemsInputSchema: z.ZodType<Prisma.RecommendationCreateNestedOneWithoutItemsInput> = z.object({
  create: z.union([ z.lazy(() => RecommendationCreateWithoutItemsInputSchema),z.lazy(() => RecommendationUncheckedCreateWithoutItemsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => RecommendationCreateOrConnectWithoutItemsInputSchema).optional(),
  connect: z.lazy(() => RecommendationWhereUniqueInputSchema).optional()
}).strict();

export const RecommendationUpdateOneRequiredWithoutItemsNestedInputSchema: z.ZodType<Prisma.RecommendationUpdateOneRequiredWithoutItemsNestedInput> = z.object({
  create: z.union([ z.lazy(() => RecommendationCreateWithoutItemsInputSchema),z.lazy(() => RecommendationUncheckedCreateWithoutItemsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => RecommendationCreateOrConnectWithoutItemsInputSchema).optional(),
  upsert: z.lazy(() => RecommendationUpsertWithoutItemsInputSchema).optional(),
  connect: z.lazy(() => RecommendationWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => RecommendationUpdateToOneWithWhereWithoutItemsInputSchema),z.lazy(() => RecommendationUpdateWithoutItemsInputSchema),z.lazy(() => RecommendationUncheckedUpdateWithoutItemsInputSchema) ]).optional(),
}).strict();

export const WholesaleGroupCreateNestedOneWithoutProductsInputSchema: z.ZodType<Prisma.WholesaleGroupCreateNestedOneWithoutProductsInput> = z.object({
  create: z.union([ z.lazy(() => WholesaleGroupCreateWithoutProductsInputSchema),z.lazy(() => WholesaleGroupUncheckedCreateWithoutProductsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => WholesaleGroupCreateOrConnectWithoutProductsInputSchema).optional(),
  connect: z.lazy(() => WholesaleGroupWhereUniqueInputSchema).optional()
}).strict();

export const WholesaleGroupUpdateOneRequiredWithoutProductsNestedInputSchema: z.ZodType<Prisma.WholesaleGroupUpdateOneRequiredWithoutProductsNestedInput> = z.object({
  create: z.union([ z.lazy(() => WholesaleGroupCreateWithoutProductsInputSchema),z.lazy(() => WholesaleGroupUncheckedCreateWithoutProductsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => WholesaleGroupCreateOrConnectWithoutProductsInputSchema).optional(),
  upsert: z.lazy(() => WholesaleGroupUpsertWithoutProductsInputSchema).optional(),
  connect: z.lazy(() => WholesaleGroupWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => WholesaleGroupUpdateToOneWithWhereWithoutProductsInputSchema),z.lazy(() => WholesaleGroupUpdateWithoutProductsInputSchema),z.lazy(() => WholesaleGroupUncheckedUpdateWithoutProductsInputSchema) ]).optional(),
}).strict();

export const WholesaleProductCreateNestedManyWithoutWholesaleGroupInputSchema: z.ZodType<Prisma.WholesaleProductCreateNestedManyWithoutWholesaleGroupInput> = z.object({
  create: z.union([ z.lazy(() => WholesaleProductCreateWithoutWholesaleGroupInputSchema),z.lazy(() => WholesaleProductCreateWithoutWholesaleGroupInputSchema).array(),z.lazy(() => WholesaleProductUncheckedCreateWithoutWholesaleGroupInputSchema),z.lazy(() => WholesaleProductUncheckedCreateWithoutWholesaleGroupInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => WholesaleProductCreateOrConnectWithoutWholesaleGroupInputSchema),z.lazy(() => WholesaleProductCreateOrConnectWithoutWholesaleGroupInputSchema).array() ]).optional(),
  createMany: z.lazy(() => WholesaleProductCreateManyWholesaleGroupInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => WholesaleProductWhereUniqueInputSchema),z.lazy(() => WholesaleProductWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const WholesaleProductUncheckedCreateNestedManyWithoutWholesaleGroupInputSchema: z.ZodType<Prisma.WholesaleProductUncheckedCreateNestedManyWithoutWholesaleGroupInput> = z.object({
  create: z.union([ z.lazy(() => WholesaleProductCreateWithoutWholesaleGroupInputSchema),z.lazy(() => WholesaleProductCreateWithoutWholesaleGroupInputSchema).array(),z.lazy(() => WholesaleProductUncheckedCreateWithoutWholesaleGroupInputSchema),z.lazy(() => WholesaleProductUncheckedCreateWithoutWholesaleGroupInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => WholesaleProductCreateOrConnectWithoutWholesaleGroupInputSchema),z.lazy(() => WholesaleProductCreateOrConnectWithoutWholesaleGroupInputSchema).array() ]).optional(),
  createMany: z.lazy(() => WholesaleProductCreateManyWholesaleGroupInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => WholesaleProductWhereUniqueInputSchema),z.lazy(() => WholesaleProductWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const WholesaleProductUpdateManyWithoutWholesaleGroupNestedInputSchema: z.ZodType<Prisma.WholesaleProductUpdateManyWithoutWholesaleGroupNestedInput> = z.object({
  create: z.union([ z.lazy(() => WholesaleProductCreateWithoutWholesaleGroupInputSchema),z.lazy(() => WholesaleProductCreateWithoutWholesaleGroupInputSchema).array(),z.lazy(() => WholesaleProductUncheckedCreateWithoutWholesaleGroupInputSchema),z.lazy(() => WholesaleProductUncheckedCreateWithoutWholesaleGroupInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => WholesaleProductCreateOrConnectWithoutWholesaleGroupInputSchema),z.lazy(() => WholesaleProductCreateOrConnectWithoutWholesaleGroupInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => WholesaleProductUpsertWithWhereUniqueWithoutWholesaleGroupInputSchema),z.lazy(() => WholesaleProductUpsertWithWhereUniqueWithoutWholesaleGroupInputSchema).array() ]).optional(),
  createMany: z.lazy(() => WholesaleProductCreateManyWholesaleGroupInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => WholesaleProductWhereUniqueInputSchema),z.lazy(() => WholesaleProductWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => WholesaleProductWhereUniqueInputSchema),z.lazy(() => WholesaleProductWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => WholesaleProductWhereUniqueInputSchema),z.lazy(() => WholesaleProductWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => WholesaleProductWhereUniqueInputSchema),z.lazy(() => WholesaleProductWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => WholesaleProductUpdateWithWhereUniqueWithoutWholesaleGroupInputSchema),z.lazy(() => WholesaleProductUpdateWithWhereUniqueWithoutWholesaleGroupInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => WholesaleProductUpdateManyWithWhereWithoutWholesaleGroupInputSchema),z.lazy(() => WholesaleProductUpdateManyWithWhereWithoutWholesaleGroupInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => WholesaleProductScalarWhereInputSchema),z.lazy(() => WholesaleProductScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const WholesaleProductUncheckedUpdateManyWithoutWholesaleGroupNestedInputSchema: z.ZodType<Prisma.WholesaleProductUncheckedUpdateManyWithoutWholesaleGroupNestedInput> = z.object({
  create: z.union([ z.lazy(() => WholesaleProductCreateWithoutWholesaleGroupInputSchema),z.lazy(() => WholesaleProductCreateWithoutWholesaleGroupInputSchema).array(),z.lazy(() => WholesaleProductUncheckedCreateWithoutWholesaleGroupInputSchema),z.lazy(() => WholesaleProductUncheckedCreateWithoutWholesaleGroupInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => WholesaleProductCreateOrConnectWithoutWholesaleGroupInputSchema),z.lazy(() => WholesaleProductCreateOrConnectWithoutWholesaleGroupInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => WholesaleProductUpsertWithWhereUniqueWithoutWholesaleGroupInputSchema),z.lazy(() => WholesaleProductUpsertWithWhereUniqueWithoutWholesaleGroupInputSchema).array() ]).optional(),
  createMany: z.lazy(() => WholesaleProductCreateManyWholesaleGroupInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => WholesaleProductWhereUniqueInputSchema),z.lazy(() => WholesaleProductWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => WholesaleProductWhereUniqueInputSchema),z.lazy(() => WholesaleProductWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => WholesaleProductWhereUniqueInputSchema),z.lazy(() => WholesaleProductWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => WholesaleProductWhereUniqueInputSchema),z.lazy(() => WholesaleProductWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => WholesaleProductUpdateWithWhereUniqueWithoutWholesaleGroupInputSchema),z.lazy(() => WholesaleProductUpdateWithWhereUniqueWithoutWholesaleGroupInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => WholesaleProductUpdateManyWithWhereWithoutWholesaleGroupInputSchema),z.lazy(() => WholesaleProductUpdateManyWithWhereWithoutWholesaleGroupInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => WholesaleProductScalarWhereInputSchema),z.lazy(() => WholesaleProductScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const ProductCreateNestedOneWithoutMarginsInputSchema: z.ZodType<Prisma.ProductCreateNestedOneWithoutMarginsInput> = z.object({
  create: z.union([ z.lazy(() => ProductCreateWithoutMarginsInputSchema),z.lazy(() => ProductUncheckedCreateWithoutMarginsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ProductCreateOrConnectWithoutMarginsInputSchema).optional(),
  connect: z.lazy(() => ProductWhereUniqueInputSchema).optional()
}).strict();

export const ProductUpdateOneWithoutMarginsNestedInputSchema: z.ZodType<Prisma.ProductUpdateOneWithoutMarginsNestedInput> = z.object({
  create: z.union([ z.lazy(() => ProductCreateWithoutMarginsInputSchema),z.lazy(() => ProductUncheckedCreateWithoutMarginsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ProductCreateOrConnectWithoutMarginsInputSchema).optional(),
  upsert: z.lazy(() => ProductUpsertWithoutMarginsInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => ProductWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => ProductWhereInputSchema) ]).optional(),
  connect: z.lazy(() => ProductWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => ProductUpdateToOneWithWhereWithoutMarginsInputSchema),z.lazy(() => ProductUpdateWithoutMarginsInputSchema),z.lazy(() => ProductUncheckedUpdateWithoutMarginsInputSchema) ]).optional(),
}).strict();

export const NullableIntFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableIntFieldUpdateOperationsInput> = z.object({
  set: z.number().optional().nullable(),
  increment: z.number().optional(),
  decrement: z.number().optional(),
  multiply: z.number().optional(),
  divide: z.number().optional()
}).strict();

export const DetailPageCreateuspsInputSchema: z.ZodType<Prisma.DetailPageCreateuspsInput> = z.object({
  set: z.string().array()
}).strict();

export const DetailPageCreatekeywordsInputSchema: z.ZodType<Prisma.DetailPageCreatekeywordsInput> = z.object({
  set: z.string().array()
}).strict();

export const ProductCreateNestedOneWithoutDetailPagesInputSchema: z.ZodType<Prisma.ProductCreateNestedOneWithoutDetailPagesInput> = z.object({
  create: z.union([ z.lazy(() => ProductCreateWithoutDetailPagesInputSchema),z.lazy(() => ProductUncheckedCreateWithoutDetailPagesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ProductCreateOrConnectWithoutDetailPagesInputSchema).optional(),
  connect: z.lazy(() => ProductWhereUniqueInputSchema).optional()
}).strict();

export const DetailPageUpdateuspsInputSchema: z.ZodType<Prisma.DetailPageUpdateuspsInput> = z.object({
  set: z.string().array().optional(),
  push: z.union([ z.string(),z.string().array() ]).optional(),
}).strict();

export const DetailPageUpdatekeywordsInputSchema: z.ZodType<Prisma.DetailPageUpdatekeywordsInput> = z.object({
  set: z.string().array().optional(),
  push: z.union([ z.string(),z.string().array() ]).optional(),
}).strict();

export const ProductUpdateOneWithoutDetailPagesNestedInputSchema: z.ZodType<Prisma.ProductUpdateOneWithoutDetailPagesNestedInput> = z.object({
  create: z.union([ z.lazy(() => ProductCreateWithoutDetailPagesInputSchema),z.lazy(() => ProductUncheckedCreateWithoutDetailPagesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ProductCreateOrConnectWithoutDetailPagesInputSchema).optional(),
  upsert: z.lazy(() => ProductUpsertWithoutDetailPagesInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => ProductWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => ProductWhereInputSchema) ]).optional(),
  connect: z.lazy(() => ProductWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => ProductUpdateToOneWithWhereWithoutDetailPagesInputSchema),z.lazy(() => ProductUpdateWithoutDetailPagesInputSchema),z.lazy(() => ProductUncheckedUpdateWithoutDetailPagesInputSchema) ]).optional(),
}).strict();

export const ProductCreateNestedOneWithoutRegistrationsInputSchema: z.ZodType<Prisma.ProductCreateNestedOneWithoutRegistrationsInput> = z.object({
  create: z.union([ z.lazy(() => ProductCreateWithoutRegistrationsInputSchema),z.lazy(() => ProductUncheckedCreateWithoutRegistrationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ProductCreateOrConnectWithoutRegistrationsInputSchema).optional(),
  connect: z.lazy(() => ProductWhereUniqueInputSchema).optional()
}).strict();

export const ProductUpdateOneWithoutRegistrationsNestedInputSchema: z.ZodType<Prisma.ProductUpdateOneWithoutRegistrationsNestedInput> = z.object({
  create: z.union([ z.lazy(() => ProductCreateWithoutRegistrationsInputSchema),z.lazy(() => ProductUncheckedCreateWithoutRegistrationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ProductCreateOrConnectWithoutRegistrationsInputSchema).optional(),
  upsert: z.lazy(() => ProductUpsertWithoutRegistrationsInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => ProductWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => ProductWhereInputSchema) ]).optional(),
  connect: z.lazy(() => ProductWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => ProductUpdateToOneWithWhereWithoutRegistrationsInputSchema),z.lazy(() => ProductUpdateWithoutRegistrationsInputSchema),z.lazy(() => ProductUncheckedUpdateWithoutRegistrationsInputSchema) ]).optional(),
}).strict();

export const NestedStringFilterSchema: z.ZodType<Prisma.NestedStringFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
}).strict();

export const NestedStringNullableFilterSchema: z.ZodType<Prisma.NestedStringNullableFilter> = z.object({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const NestedDateTimeFilterSchema: z.ZodType<Prisma.NestedDateTimeFilter> = z.object({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeFilterSchema) ]).optional(),
}).strict();

export const NestedStringWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringWithAggregatesFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional()
}).strict();

export const NestedIntFilterSchema: z.ZodType<Prisma.NestedIntFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntFilterSchema) ]).optional(),
}).strict();

export const NestedStringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringNullableWithAggregatesFilter> = z.object({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional()
}).strict();

export const NestedIntNullableFilterSchema: z.ZodType<Prisma.NestedIntNullableFilter> = z.object({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const NestedDateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeWithAggregatesFilter> = z.object({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeFilterSchema).optional()
}).strict();

export const NestedEnumSubscriptionStatusFilterSchema: z.ZodType<Prisma.NestedEnumSubscriptionStatusFilter> = z.object({
  equals: z.lazy(() => SubscriptionStatusSchema).optional(),
  in: z.lazy(() => SubscriptionStatusSchema).array().optional(),
  notIn: z.lazy(() => SubscriptionStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => SubscriptionStatusSchema),z.lazy(() => NestedEnumSubscriptionStatusFilterSchema) ]).optional(),
}).strict();

export const NestedDateTimeNullableFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableFilter> = z.object({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const NestedEnumSubscriptionPaymentMethodFilterSchema: z.ZodType<Prisma.NestedEnumSubscriptionPaymentMethodFilter> = z.object({
  equals: z.lazy(() => SubscriptionPaymentMethodSchema).optional(),
  in: z.lazy(() => SubscriptionPaymentMethodSchema).array().optional(),
  notIn: z.lazy(() => SubscriptionPaymentMethodSchema).array().optional(),
  not: z.union([ z.lazy(() => SubscriptionPaymentMethodSchema),z.lazy(() => NestedEnumSubscriptionPaymentMethodFilterSchema) ]).optional(),
}).strict();

export const NestedEnumSubscriptionStatusWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumSubscriptionStatusWithAggregatesFilter> = z.object({
  equals: z.lazy(() => SubscriptionStatusSchema).optional(),
  in: z.lazy(() => SubscriptionStatusSchema).array().optional(),
  notIn: z.lazy(() => SubscriptionStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => SubscriptionStatusSchema),z.lazy(() => NestedEnumSubscriptionStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumSubscriptionStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumSubscriptionStatusFilterSchema).optional()
}).strict();

export const NestedDateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableWithAggregatesFilter> = z.object({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional()
}).strict();

export const NestedEnumSubscriptionPaymentMethodWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumSubscriptionPaymentMethodWithAggregatesFilter> = z.object({
  equals: z.lazy(() => SubscriptionPaymentMethodSchema).optional(),
  in: z.lazy(() => SubscriptionPaymentMethodSchema).array().optional(),
  notIn: z.lazy(() => SubscriptionPaymentMethodSchema).array().optional(),
  not: z.union([ z.lazy(() => SubscriptionPaymentMethodSchema),z.lazy(() => NestedEnumSubscriptionPaymentMethodWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumSubscriptionPaymentMethodFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumSubscriptionPaymentMethodFilterSchema).optional()
}).strict();

export const NestedBoolFilterSchema: z.ZodType<Prisma.NestedBoolFilter> = z.object({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
}).strict();

export const NestedDecimalFilterSchema: z.ZodType<Prisma.NestedDecimalFilter> = z.object({
  equals: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  in: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional(),
  notIn: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional(),
  lt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  lte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  not: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NestedDecimalFilterSchema) ]).optional(),
}).strict();

export const NestedJsonNullableFilterSchema: z.ZodType<Prisma.NestedJsonNullableFilter> = z.object({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional()
}).strict();

export const NestedBoolWithAggregatesFilterSchema: z.ZodType<Prisma.NestedBoolWithAggregatesFilter> = z.object({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional()
}).strict();

export const NestedDecimalWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDecimalWithAggregatesFilter> = z.object({
  equals: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  in: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional(),
  notIn: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional(),
  lt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  lte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  not: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NestedDecimalWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedDecimalFilterSchema).optional(),
  _sum: z.lazy(() => NestedDecimalFilterSchema).optional(),
  _min: z.lazy(() => NestedDecimalFilterSchema).optional(),
  _max: z.lazy(() => NestedDecimalFilterSchema).optional()
}).strict();

export const NestedJsonFilterSchema: z.ZodType<Prisma.NestedJsonFilter> = z.object({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional()
}).strict();

export const NestedEnumPaymentStatusFilterSchema: z.ZodType<Prisma.NestedEnumPaymentStatusFilter> = z.object({
  equals: z.lazy(() => PaymentStatusSchema).optional(),
  in: z.lazy(() => PaymentStatusSchema).array().optional(),
  notIn: z.lazy(() => PaymentStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => PaymentStatusSchema),z.lazy(() => NestedEnumPaymentStatusFilterSchema) ]).optional(),
}).strict();

export const NestedEnumPaymentStatusWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumPaymentStatusWithAggregatesFilter> = z.object({
  equals: z.lazy(() => PaymentStatusSchema).optional(),
  in: z.lazy(() => PaymentStatusSchema).array().optional(),
  notIn: z.lazy(() => PaymentStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => PaymentStatusSchema),z.lazy(() => NestedEnumPaymentStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumPaymentStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumPaymentStatusFilterSchema).optional()
}).strict();

export const NestedIntWithAggregatesFilterSchema: z.ZodType<Prisma.NestedIntWithAggregatesFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedIntFilterSchema).optional(),
  _max: z.lazy(() => NestedIntFilterSchema).optional()
}).strict();

export const NestedFloatFilterSchema: z.ZodType<Prisma.NestedFloatFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatFilterSchema) ]).optional(),
}).strict();

export const NestedFloatWithAggregatesFilterSchema: z.ZodType<Prisma.NestedFloatWithAggregatesFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedFloatFilterSchema).optional(),
  _min: z.lazy(() => NestedFloatFilterSchema).optional(),
  _max: z.lazy(() => NestedFloatFilterSchema).optional()
}).strict();

export const NestedIntNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedIntNullableWithAggregatesFilter> = z.object({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedIntNullableFilterSchema).optional()
}).strict();

export const NestedFloatNullableFilterSchema: z.ZodType<Prisma.NestedFloatNullableFilter> = z.object({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const SubscriptionCreateWithoutUserInputSchema: z.ZodType<Prisma.SubscriptionCreateWithoutUserInput> = z.object({
  id: z.string(),
  status: z.lazy(() => SubscriptionStatusSchema),
  lemonSqueezyId: z.string(),
  lemonSubscriptionItemId: z.string().optional().nullable(),
  lemonCustomerId: z.string(),
  lemonOrderId: z.string(),
  lemonProductId: z.string(),
  lemonVariantId: z.string(),
  renewsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  paymentMethod: z.lazy(() => SubscriptionPaymentMethodSchema),
  cardBrand: z.string().optional().nullable(),
  cardLast4: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  plan: z.lazy(() => PlanCreateNestedOneWithoutSubscriptionsInputSchema)
}).strict();

export const SubscriptionUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.SubscriptionUncheckedCreateWithoutUserInput> = z.object({
  id: z.string(),
  planId: z.string(),
  status: z.lazy(() => SubscriptionStatusSchema),
  lemonSqueezyId: z.string(),
  lemonSubscriptionItemId: z.string().optional().nullable(),
  lemonCustomerId: z.string(),
  lemonOrderId: z.string(),
  lemonProductId: z.string(),
  lemonVariantId: z.string(),
  renewsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  paymentMethod: z.lazy(() => SubscriptionPaymentMethodSchema),
  cardBrand: z.string().optional().nullable(),
  cardLast4: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const SubscriptionCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.SubscriptionCreateOrConnectWithoutUserInput> = z.object({
  where: z.lazy(() => SubscriptionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => SubscriptionCreateWithoutUserInputSchema),z.lazy(() => SubscriptionUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export const PaymentHistoryCreateWithoutUserInputSchema: z.ZodType<Prisma.PaymentHistoryCreateWithoutUserInput> = z.object({
  id: z.string(),
  invoiceId: z.string(),
  subscriptionId: z.string(),
  customerId: z.string(),
  userEmail: z.string(),
  billingReason: z.string(),
  status: z.lazy(() => PaymentStatusSchema),
  statusFormatted: z.string(),
  currency: z.string(),
  currencyRate: z.string(),
  subtotal: z.number().int(),
  discountTotal: z.number().int(),
  tax: z.number().int(),
  taxInclusive: z.boolean(),
  total: z.number().int(),
  refundedAmount: z.number().int().optional(),
  subtotalUsd: z.number().int(),
  discountTotalUsd: z.number().int(),
  taxUsd: z.number().int(),
  totalUsd: z.number().int(),
  refundedAmountUsd: z.number().int().optional(),
  cardBrand: z.string().optional().nullable(),
  cardLastFour: z.string().optional().nullable(),
  invoiceUrl: z.string().optional().nullable(),
  testMode: z.boolean().optional(),
  refundedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const PaymentHistoryUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.PaymentHistoryUncheckedCreateWithoutUserInput> = z.object({
  id: z.string(),
  invoiceId: z.string(),
  subscriptionId: z.string(),
  customerId: z.string(),
  userEmail: z.string(),
  billingReason: z.string(),
  status: z.lazy(() => PaymentStatusSchema),
  statusFormatted: z.string(),
  currency: z.string(),
  currencyRate: z.string(),
  subtotal: z.number().int(),
  discountTotal: z.number().int(),
  tax: z.number().int(),
  taxInclusive: z.boolean(),
  total: z.number().int(),
  refundedAmount: z.number().int().optional(),
  subtotalUsd: z.number().int(),
  discountTotalUsd: z.number().int(),
  taxUsd: z.number().int(),
  totalUsd: z.number().int(),
  refundedAmountUsd: z.number().int().optional(),
  cardBrand: z.string().optional().nullable(),
  cardLastFour: z.string().optional().nullable(),
  invoiceUrl: z.string().optional().nullable(),
  testMode: z.boolean().optional(),
  refundedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const PaymentHistoryCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.PaymentHistoryCreateOrConnectWithoutUserInput> = z.object({
  where: z.lazy(() => PaymentHistoryWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PaymentHistoryCreateWithoutUserInputSchema),z.lazy(() => PaymentHistoryUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export const PaymentHistoryCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.PaymentHistoryCreateManyUserInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => PaymentHistoryCreateManyUserInputSchema),z.lazy(() => PaymentHistoryCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const SubscriptionUpsertWithoutUserInputSchema: z.ZodType<Prisma.SubscriptionUpsertWithoutUserInput> = z.object({
  update: z.union([ z.lazy(() => SubscriptionUpdateWithoutUserInputSchema),z.lazy(() => SubscriptionUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => SubscriptionCreateWithoutUserInputSchema),z.lazy(() => SubscriptionUncheckedCreateWithoutUserInputSchema) ]),
  where: z.lazy(() => SubscriptionWhereInputSchema).optional()
}).strict();

export const SubscriptionUpdateToOneWithWhereWithoutUserInputSchema: z.ZodType<Prisma.SubscriptionUpdateToOneWithWhereWithoutUserInput> = z.object({
  where: z.lazy(() => SubscriptionWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => SubscriptionUpdateWithoutUserInputSchema),z.lazy(() => SubscriptionUncheckedUpdateWithoutUserInputSchema) ]),
}).strict();

export const SubscriptionUpdateWithoutUserInputSchema: z.ZodType<Prisma.SubscriptionUpdateWithoutUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => SubscriptionStatusSchema),z.lazy(() => EnumSubscriptionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  lemonSqueezyId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonSubscriptionItemId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lemonCustomerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonOrderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonProductId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonVariantId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  renewsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  paymentMethod: z.union([ z.lazy(() => SubscriptionPaymentMethodSchema),z.lazy(() => EnumSubscriptionPaymentMethodFieldUpdateOperationsInputSchema) ]).optional(),
  cardBrand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cardLast4: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  plan: z.lazy(() => PlanUpdateOneRequiredWithoutSubscriptionsNestedInputSchema).optional()
}).strict();

export const SubscriptionUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.SubscriptionUncheckedUpdateWithoutUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  planId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => SubscriptionStatusSchema),z.lazy(() => EnumSubscriptionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  lemonSqueezyId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonSubscriptionItemId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lemonCustomerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonOrderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonProductId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonVariantId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  renewsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  paymentMethod: z.union([ z.lazy(() => SubscriptionPaymentMethodSchema),z.lazy(() => EnumSubscriptionPaymentMethodFieldUpdateOperationsInputSchema) ]).optional(),
  cardBrand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cardLast4: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const PaymentHistoryUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.PaymentHistoryUpsertWithWhereUniqueWithoutUserInput> = z.object({
  where: z.lazy(() => PaymentHistoryWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => PaymentHistoryUpdateWithoutUserInputSchema),z.lazy(() => PaymentHistoryUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => PaymentHistoryCreateWithoutUserInputSchema),z.lazy(() => PaymentHistoryUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export const PaymentHistoryUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.PaymentHistoryUpdateWithWhereUniqueWithoutUserInput> = z.object({
  where: z.lazy(() => PaymentHistoryWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => PaymentHistoryUpdateWithoutUserInputSchema),z.lazy(() => PaymentHistoryUncheckedUpdateWithoutUserInputSchema) ]),
}).strict();

export const PaymentHistoryUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.PaymentHistoryUpdateManyWithWhereWithoutUserInput> = z.object({
  where: z.lazy(() => PaymentHistoryScalarWhereInputSchema),
  data: z.union([ z.lazy(() => PaymentHistoryUpdateManyMutationInputSchema),z.lazy(() => PaymentHistoryUncheckedUpdateManyWithoutUserInputSchema) ]),
}).strict();

export const PaymentHistoryScalarWhereInputSchema: z.ZodType<Prisma.PaymentHistoryScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => PaymentHistoryScalarWhereInputSchema),z.lazy(() => PaymentHistoryScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PaymentHistoryScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PaymentHistoryScalarWhereInputSchema),z.lazy(() => PaymentHistoryScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  invoiceId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  subscriptionId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  customerId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  userEmail: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  billingReason: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  status: z.union([ z.lazy(() => EnumPaymentStatusFilterSchema),z.lazy(() => PaymentStatusSchema) ]).optional(),
  statusFormatted: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  currency: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  currencyRate: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  subtotal: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  discountTotal: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  tax: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  taxInclusive: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  total: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  refundedAmount: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  subtotalUsd: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  discountTotalUsd: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  taxUsd: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  totalUsd: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  refundedAmountUsd: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  cardBrand: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  cardLastFour: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  invoiceUrl: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  testMode: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  refundedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const UserCreateWithoutSubscriptionInputSchema: z.ZodType<Prisma.UserCreateWithoutSubscriptionInput> = z.object({
  id: z.string(),
  clerkId: z.string(),
  email: z.string(),
  username: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  paymentHistories: z.lazy(() => PaymentHistoryCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserUncheckedCreateWithoutSubscriptionInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutSubscriptionInput> = z.object({
  id: z.string(),
  clerkId: z.string(),
  email: z.string(),
  username: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  paymentHistories: z.lazy(() => PaymentHistoryUncheckedCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserCreateOrConnectWithoutSubscriptionInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutSubscriptionInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutSubscriptionInputSchema),z.lazy(() => UserUncheckedCreateWithoutSubscriptionInputSchema) ]),
}).strict();

export const PlanCreateWithoutSubscriptionsInputSchema: z.ZodType<Prisma.PlanCreateWithoutSubscriptionsInput> = z.object({
  id: z.string(),
  title: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  content: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  available: z.boolean().optional(),
  price: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  lemonSqueezyProductId: z.string(),
  lemonSqueezyVariantId: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const PlanUncheckedCreateWithoutSubscriptionsInputSchema: z.ZodType<Prisma.PlanUncheckedCreateWithoutSubscriptionsInput> = z.object({
  id: z.string(),
  title: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  content: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  available: z.boolean().optional(),
  price: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  lemonSqueezyProductId: z.string(),
  lemonSqueezyVariantId: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const PlanCreateOrConnectWithoutSubscriptionsInputSchema: z.ZodType<Prisma.PlanCreateOrConnectWithoutSubscriptionsInput> = z.object({
  where: z.lazy(() => PlanWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PlanCreateWithoutSubscriptionsInputSchema),z.lazy(() => PlanUncheckedCreateWithoutSubscriptionsInputSchema) ]),
}).strict();

export const UserUpsertWithoutSubscriptionInputSchema: z.ZodType<Prisma.UserUpsertWithoutSubscriptionInput> = z.object({
  update: z.union([ z.lazy(() => UserUpdateWithoutSubscriptionInputSchema),z.lazy(() => UserUncheckedUpdateWithoutSubscriptionInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutSubscriptionInputSchema),z.lazy(() => UserUncheckedCreateWithoutSubscriptionInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export const UserUpdateToOneWithWhereWithoutSubscriptionInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutSubscriptionInput> = z.object({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutSubscriptionInputSchema),z.lazy(() => UserUncheckedUpdateWithoutSubscriptionInputSchema) ]),
}).strict();

export const UserUpdateWithoutSubscriptionInputSchema: z.ZodType<Prisma.UserUpdateWithoutSubscriptionInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  clerkId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  paymentHistories: z.lazy(() => PaymentHistoryUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const UserUncheckedUpdateWithoutSubscriptionInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutSubscriptionInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  clerkId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  paymentHistories: z.lazy(() => PaymentHistoryUncheckedUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const PlanUpsertWithoutSubscriptionsInputSchema: z.ZodType<Prisma.PlanUpsertWithoutSubscriptionsInput> = z.object({
  update: z.union([ z.lazy(() => PlanUpdateWithoutSubscriptionsInputSchema),z.lazy(() => PlanUncheckedUpdateWithoutSubscriptionsInputSchema) ]),
  create: z.union([ z.lazy(() => PlanCreateWithoutSubscriptionsInputSchema),z.lazy(() => PlanUncheckedCreateWithoutSubscriptionsInputSchema) ]),
  where: z.lazy(() => PlanWhereInputSchema).optional()
}).strict();

export const PlanUpdateToOneWithWhereWithoutSubscriptionsInputSchema: z.ZodType<Prisma.PlanUpdateToOneWithWhereWithoutSubscriptionsInput> = z.object({
  where: z.lazy(() => PlanWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => PlanUpdateWithoutSubscriptionsInputSchema),z.lazy(() => PlanUncheckedUpdateWithoutSubscriptionsInputSchema) ]),
}).strict();

export const PlanUpdateWithoutSubscriptionsInputSchema: z.ZodType<Prisma.PlanUpdateWithoutSubscriptionsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  content: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  available: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  lemonSqueezyProductId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonSqueezyVariantId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const PlanUncheckedUpdateWithoutSubscriptionsInputSchema: z.ZodType<Prisma.PlanUncheckedUpdateWithoutSubscriptionsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  content: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  available: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  lemonSqueezyProductId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonSqueezyVariantId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const SubscriptionCreateWithoutPlanInputSchema: z.ZodType<Prisma.SubscriptionCreateWithoutPlanInput> = z.object({
  id: z.string(),
  status: z.lazy(() => SubscriptionStatusSchema),
  lemonSqueezyId: z.string(),
  lemonSubscriptionItemId: z.string().optional().nullable(),
  lemonCustomerId: z.string(),
  lemonOrderId: z.string(),
  lemonProductId: z.string(),
  lemonVariantId: z.string(),
  renewsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  paymentMethod: z.lazy(() => SubscriptionPaymentMethodSchema),
  cardBrand: z.string().optional().nullable(),
  cardLast4: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutSubscriptionInputSchema)
}).strict();

export const SubscriptionUncheckedCreateWithoutPlanInputSchema: z.ZodType<Prisma.SubscriptionUncheckedCreateWithoutPlanInput> = z.object({
  id: z.string(),
  userId: z.string(),
  status: z.lazy(() => SubscriptionStatusSchema),
  lemonSqueezyId: z.string(),
  lemonSubscriptionItemId: z.string().optional().nullable(),
  lemonCustomerId: z.string(),
  lemonOrderId: z.string(),
  lemonProductId: z.string(),
  lemonVariantId: z.string(),
  renewsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  paymentMethod: z.lazy(() => SubscriptionPaymentMethodSchema),
  cardBrand: z.string().optional().nullable(),
  cardLast4: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const SubscriptionCreateOrConnectWithoutPlanInputSchema: z.ZodType<Prisma.SubscriptionCreateOrConnectWithoutPlanInput> = z.object({
  where: z.lazy(() => SubscriptionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => SubscriptionCreateWithoutPlanInputSchema),z.lazy(() => SubscriptionUncheckedCreateWithoutPlanInputSchema) ]),
}).strict();

export const SubscriptionCreateManyPlanInputEnvelopeSchema: z.ZodType<Prisma.SubscriptionCreateManyPlanInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => SubscriptionCreateManyPlanInputSchema),z.lazy(() => SubscriptionCreateManyPlanInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const SubscriptionUpsertWithWhereUniqueWithoutPlanInputSchema: z.ZodType<Prisma.SubscriptionUpsertWithWhereUniqueWithoutPlanInput> = z.object({
  where: z.lazy(() => SubscriptionWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => SubscriptionUpdateWithoutPlanInputSchema),z.lazy(() => SubscriptionUncheckedUpdateWithoutPlanInputSchema) ]),
  create: z.union([ z.lazy(() => SubscriptionCreateWithoutPlanInputSchema),z.lazy(() => SubscriptionUncheckedCreateWithoutPlanInputSchema) ]),
}).strict();

export const SubscriptionUpdateWithWhereUniqueWithoutPlanInputSchema: z.ZodType<Prisma.SubscriptionUpdateWithWhereUniqueWithoutPlanInput> = z.object({
  where: z.lazy(() => SubscriptionWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => SubscriptionUpdateWithoutPlanInputSchema),z.lazy(() => SubscriptionUncheckedUpdateWithoutPlanInputSchema) ]),
}).strict();

export const SubscriptionUpdateManyWithWhereWithoutPlanInputSchema: z.ZodType<Prisma.SubscriptionUpdateManyWithWhereWithoutPlanInput> = z.object({
  where: z.lazy(() => SubscriptionScalarWhereInputSchema),
  data: z.union([ z.lazy(() => SubscriptionUpdateManyMutationInputSchema),z.lazy(() => SubscriptionUncheckedUpdateManyWithoutPlanInputSchema) ]),
}).strict();

export const SubscriptionScalarWhereInputSchema: z.ZodType<Prisma.SubscriptionScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => SubscriptionScalarWhereInputSchema),z.lazy(() => SubscriptionScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SubscriptionScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SubscriptionScalarWhereInputSchema),z.lazy(() => SubscriptionScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  planId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  status: z.union([ z.lazy(() => EnumSubscriptionStatusFilterSchema),z.lazy(() => SubscriptionStatusSchema) ]).optional(),
  lemonSqueezyId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  lemonSubscriptionItemId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  lemonCustomerId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  lemonOrderId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  lemonProductId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  lemonVariantId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  renewsAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  endsAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  paymentMethod: z.union([ z.lazy(() => EnumSubscriptionPaymentMethodFilterSchema),z.lazy(() => SubscriptionPaymentMethodSchema) ]).optional(),
  cardBrand: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  cardLast4: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const UserCreateWithoutPaymentHistoriesInputSchema: z.ZodType<Prisma.UserCreateWithoutPaymentHistoriesInput> = z.object({
  id: z.string(),
  clerkId: z.string(),
  email: z.string(),
  username: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  subscription: z.lazy(() => SubscriptionCreateNestedOneWithoutUserInputSchema).optional()
}).strict();

export const UserUncheckedCreateWithoutPaymentHistoriesInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutPaymentHistoriesInput> = z.object({
  id: z.string(),
  clerkId: z.string(),
  email: z.string(),
  username: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  subscription: z.lazy(() => SubscriptionUncheckedCreateNestedOneWithoutUserInputSchema).optional()
}).strict();

export const UserCreateOrConnectWithoutPaymentHistoriesInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutPaymentHistoriesInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutPaymentHistoriesInputSchema),z.lazy(() => UserUncheckedCreateWithoutPaymentHistoriesInputSchema) ]),
}).strict();

export const UserUpsertWithoutPaymentHistoriesInputSchema: z.ZodType<Prisma.UserUpsertWithoutPaymentHistoriesInput> = z.object({
  update: z.union([ z.lazy(() => UserUpdateWithoutPaymentHistoriesInputSchema),z.lazy(() => UserUncheckedUpdateWithoutPaymentHistoriesInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutPaymentHistoriesInputSchema),z.lazy(() => UserUncheckedCreateWithoutPaymentHistoriesInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export const UserUpdateToOneWithWhereWithoutPaymentHistoriesInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutPaymentHistoriesInput> = z.object({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutPaymentHistoriesInputSchema),z.lazy(() => UserUncheckedUpdateWithoutPaymentHistoriesInputSchema) ]),
}).strict();

export const UserUpdateWithoutPaymentHistoriesInputSchema: z.ZodType<Prisma.UserUpdateWithoutPaymentHistoriesInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  clerkId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  subscription: z.lazy(() => SubscriptionUpdateOneWithoutUserNestedInputSchema).optional()
}).strict();

export const UserUncheckedUpdateWithoutPaymentHistoriesInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutPaymentHistoriesInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  clerkId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  subscription: z.lazy(() => SubscriptionUncheckedUpdateOneWithoutUserNestedInputSchema).optional()
}).strict();

export const MarginCreateWithoutProductInputSchema: z.ZodType<Prisma.MarginCreateWithoutProductInput> = z.object({
  productName: z.string(),
  wholesalePrice: z.number().int(),
  sellingPrice: z.number().int(),
  shippingCost: z.number().int(),
  commission: z.number(),
  adCost: z.number().int(),
  packagingCost: z.number().int(),
  netMargin: z.number().int(),
  marginRate: z.number(),
  platform: z.string(),
  calculatedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const MarginUncheckedCreateWithoutProductInputSchema: z.ZodType<Prisma.MarginUncheckedCreateWithoutProductInput> = z.object({
  id: z.number().int().optional(),
  productName: z.string(),
  wholesalePrice: z.number().int(),
  sellingPrice: z.number().int(),
  shippingCost: z.number().int(),
  commission: z.number(),
  adCost: z.number().int(),
  packagingCost: z.number().int(),
  netMargin: z.number().int(),
  marginRate: z.number(),
  platform: z.string(),
  calculatedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const MarginCreateOrConnectWithoutProductInputSchema: z.ZodType<Prisma.MarginCreateOrConnectWithoutProductInput> = z.object({
  where: z.lazy(() => MarginWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => MarginCreateWithoutProductInputSchema),z.lazy(() => MarginUncheckedCreateWithoutProductInputSchema) ]),
}).strict();

export const MarginCreateManyProductInputEnvelopeSchema: z.ZodType<Prisma.MarginCreateManyProductInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => MarginCreateManyProductInputSchema),z.lazy(() => MarginCreateManyProductInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const DetailPageCreateWithoutProductInputSchema: z.ZodType<Prisma.DetailPageCreateWithoutProductInput> = z.object({
  productName: z.string(),
  summary: z.string(),
  usps: z.union([ z.lazy(() => DetailPageCreateuspsInputSchema),z.string().array() ]).optional(),
  keywords: z.union([ z.lazy(() => DetailPageCreatekeywordsInputSchema),z.string().array() ]).optional(),
  template: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const DetailPageUncheckedCreateWithoutProductInputSchema: z.ZodType<Prisma.DetailPageUncheckedCreateWithoutProductInput> = z.object({
  id: z.number().int().optional(),
  productName: z.string(),
  summary: z.string(),
  usps: z.union([ z.lazy(() => DetailPageCreateuspsInputSchema),z.string().array() ]).optional(),
  keywords: z.union([ z.lazy(() => DetailPageCreatekeywordsInputSchema),z.string().array() ]).optional(),
  template: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const DetailPageCreateOrConnectWithoutProductInputSchema: z.ZodType<Prisma.DetailPageCreateOrConnectWithoutProductInput> = z.object({
  where: z.lazy(() => DetailPageWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => DetailPageCreateWithoutProductInputSchema),z.lazy(() => DetailPageUncheckedCreateWithoutProductInputSchema) ]),
}).strict();

export const DetailPageCreateManyProductInputEnvelopeSchema: z.ZodType<Prisma.DetailPageCreateManyProductInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => DetailPageCreateManyProductInputSchema),z.lazy(() => DetailPageCreateManyProductInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const RegistrationCreateWithoutProductInputSchema: z.ZodType<Prisma.RegistrationCreateWithoutProductInput> = z.object({
  productName: z.string(),
  category: z.string(),
  recommendedTitle: z.string(),
  price: z.number().int(),
  wholesalePrice: z.number().int(),
  status: z.string(),
  platform: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const RegistrationUncheckedCreateWithoutProductInputSchema: z.ZodType<Prisma.RegistrationUncheckedCreateWithoutProductInput> = z.object({
  id: z.number().int().optional(),
  productName: z.string(),
  category: z.string(),
  recommendedTitle: z.string(),
  price: z.number().int(),
  wholesalePrice: z.number().int(),
  status: z.string(),
  platform: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const RegistrationCreateOrConnectWithoutProductInputSchema: z.ZodType<Prisma.RegistrationCreateOrConnectWithoutProductInput> = z.object({
  where: z.lazy(() => RegistrationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => RegistrationCreateWithoutProductInputSchema),z.lazy(() => RegistrationUncheckedCreateWithoutProductInputSchema) ]),
}).strict();

export const RegistrationCreateManyProductInputEnvelopeSchema: z.ZodType<Prisma.RegistrationCreateManyProductInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => RegistrationCreateManyProductInputSchema),z.lazy(() => RegistrationCreateManyProductInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const MarginUpsertWithWhereUniqueWithoutProductInputSchema: z.ZodType<Prisma.MarginUpsertWithWhereUniqueWithoutProductInput> = z.object({
  where: z.lazy(() => MarginWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => MarginUpdateWithoutProductInputSchema),z.lazy(() => MarginUncheckedUpdateWithoutProductInputSchema) ]),
  create: z.union([ z.lazy(() => MarginCreateWithoutProductInputSchema),z.lazy(() => MarginUncheckedCreateWithoutProductInputSchema) ]),
}).strict();

export const MarginUpdateWithWhereUniqueWithoutProductInputSchema: z.ZodType<Prisma.MarginUpdateWithWhereUniqueWithoutProductInput> = z.object({
  where: z.lazy(() => MarginWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => MarginUpdateWithoutProductInputSchema),z.lazy(() => MarginUncheckedUpdateWithoutProductInputSchema) ]),
}).strict();

export const MarginUpdateManyWithWhereWithoutProductInputSchema: z.ZodType<Prisma.MarginUpdateManyWithWhereWithoutProductInput> = z.object({
  where: z.lazy(() => MarginScalarWhereInputSchema),
  data: z.union([ z.lazy(() => MarginUpdateManyMutationInputSchema),z.lazy(() => MarginUncheckedUpdateManyWithoutProductInputSchema) ]),
}).strict();

export const MarginScalarWhereInputSchema: z.ZodType<Prisma.MarginScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => MarginScalarWhereInputSchema),z.lazy(() => MarginScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => MarginScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => MarginScalarWhereInputSchema),z.lazy(() => MarginScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  productId: z.union([ z.lazy(() => IntNullableFilterSchema),z.number() ]).optional().nullable(),
  productName: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  wholesalePrice: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  sellingPrice: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  shippingCost: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  commission: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  adCost: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  packagingCost: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  netMargin: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  marginRate: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  platform: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  calculatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const DetailPageUpsertWithWhereUniqueWithoutProductInputSchema: z.ZodType<Prisma.DetailPageUpsertWithWhereUniqueWithoutProductInput> = z.object({
  where: z.lazy(() => DetailPageWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => DetailPageUpdateWithoutProductInputSchema),z.lazy(() => DetailPageUncheckedUpdateWithoutProductInputSchema) ]),
  create: z.union([ z.lazy(() => DetailPageCreateWithoutProductInputSchema),z.lazy(() => DetailPageUncheckedCreateWithoutProductInputSchema) ]),
}).strict();

export const DetailPageUpdateWithWhereUniqueWithoutProductInputSchema: z.ZodType<Prisma.DetailPageUpdateWithWhereUniqueWithoutProductInput> = z.object({
  where: z.lazy(() => DetailPageWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => DetailPageUpdateWithoutProductInputSchema),z.lazy(() => DetailPageUncheckedUpdateWithoutProductInputSchema) ]),
}).strict();

export const DetailPageUpdateManyWithWhereWithoutProductInputSchema: z.ZodType<Prisma.DetailPageUpdateManyWithWhereWithoutProductInput> = z.object({
  where: z.lazy(() => DetailPageScalarWhereInputSchema),
  data: z.union([ z.lazy(() => DetailPageUpdateManyMutationInputSchema),z.lazy(() => DetailPageUncheckedUpdateManyWithoutProductInputSchema) ]),
}).strict();

export const DetailPageScalarWhereInputSchema: z.ZodType<Prisma.DetailPageScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => DetailPageScalarWhereInputSchema),z.lazy(() => DetailPageScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => DetailPageScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => DetailPageScalarWhereInputSchema),z.lazy(() => DetailPageScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  productId: z.union([ z.lazy(() => IntNullableFilterSchema),z.number() ]).optional().nullable(),
  productName: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  summary: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  usps: z.lazy(() => StringNullableListFilterSchema).optional(),
  keywords: z.lazy(() => StringNullableListFilterSchema).optional(),
  template: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const RegistrationUpsertWithWhereUniqueWithoutProductInputSchema: z.ZodType<Prisma.RegistrationUpsertWithWhereUniqueWithoutProductInput> = z.object({
  where: z.lazy(() => RegistrationWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => RegistrationUpdateWithoutProductInputSchema),z.lazy(() => RegistrationUncheckedUpdateWithoutProductInputSchema) ]),
  create: z.union([ z.lazy(() => RegistrationCreateWithoutProductInputSchema),z.lazy(() => RegistrationUncheckedCreateWithoutProductInputSchema) ]),
}).strict();

export const RegistrationUpdateWithWhereUniqueWithoutProductInputSchema: z.ZodType<Prisma.RegistrationUpdateWithWhereUniqueWithoutProductInput> = z.object({
  where: z.lazy(() => RegistrationWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => RegistrationUpdateWithoutProductInputSchema),z.lazy(() => RegistrationUncheckedUpdateWithoutProductInputSchema) ]),
}).strict();

export const RegistrationUpdateManyWithWhereWithoutProductInputSchema: z.ZodType<Prisma.RegistrationUpdateManyWithWhereWithoutProductInput> = z.object({
  where: z.lazy(() => RegistrationScalarWhereInputSchema),
  data: z.union([ z.lazy(() => RegistrationUpdateManyMutationInputSchema),z.lazy(() => RegistrationUncheckedUpdateManyWithoutProductInputSchema) ]),
}).strict();

export const RegistrationScalarWhereInputSchema: z.ZodType<Prisma.RegistrationScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => RegistrationScalarWhereInputSchema),z.lazy(() => RegistrationScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => RegistrationScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => RegistrationScalarWhereInputSchema),z.lazy(() => RegistrationScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  productId: z.union([ z.lazy(() => IntNullableFilterSchema),z.number() ]).optional().nullable(),
  productName: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  category: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  recommendedTitle: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  price: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  wholesalePrice: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  status: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  platform: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const RecommendationItemCreateWithoutRecommendationInputSchema: z.ZodType<Prisma.RecommendationItemCreateWithoutRecommendationInput> = z.object({
  name: z.string(),
  wholesalePrice: z.number().int(),
  recommendedPrice: z.number().int(),
  margin: z.number(),
  competition: z.string(),
  searchVolume: z.number().int(),
  trend: z.string(),
  score: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const RecommendationItemUncheckedCreateWithoutRecommendationInputSchema: z.ZodType<Prisma.RecommendationItemUncheckedCreateWithoutRecommendationInput> = z.object({
  id: z.number().int().optional(),
  name: z.string(),
  wholesalePrice: z.number().int(),
  recommendedPrice: z.number().int(),
  margin: z.number(),
  competition: z.string(),
  searchVolume: z.number().int(),
  trend: z.string(),
  score: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const RecommendationItemCreateOrConnectWithoutRecommendationInputSchema: z.ZodType<Prisma.RecommendationItemCreateOrConnectWithoutRecommendationInput> = z.object({
  where: z.lazy(() => RecommendationItemWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => RecommendationItemCreateWithoutRecommendationInputSchema),z.lazy(() => RecommendationItemUncheckedCreateWithoutRecommendationInputSchema) ]),
}).strict();

export const RecommendationItemCreateManyRecommendationInputEnvelopeSchema: z.ZodType<Prisma.RecommendationItemCreateManyRecommendationInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => RecommendationItemCreateManyRecommendationInputSchema),z.lazy(() => RecommendationItemCreateManyRecommendationInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const RecommendationItemUpsertWithWhereUniqueWithoutRecommendationInputSchema: z.ZodType<Prisma.RecommendationItemUpsertWithWhereUniqueWithoutRecommendationInput> = z.object({
  where: z.lazy(() => RecommendationItemWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => RecommendationItemUpdateWithoutRecommendationInputSchema),z.lazy(() => RecommendationItemUncheckedUpdateWithoutRecommendationInputSchema) ]),
  create: z.union([ z.lazy(() => RecommendationItemCreateWithoutRecommendationInputSchema),z.lazy(() => RecommendationItemUncheckedCreateWithoutRecommendationInputSchema) ]),
}).strict();

export const RecommendationItemUpdateWithWhereUniqueWithoutRecommendationInputSchema: z.ZodType<Prisma.RecommendationItemUpdateWithWhereUniqueWithoutRecommendationInput> = z.object({
  where: z.lazy(() => RecommendationItemWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => RecommendationItemUpdateWithoutRecommendationInputSchema),z.lazy(() => RecommendationItemUncheckedUpdateWithoutRecommendationInputSchema) ]),
}).strict();

export const RecommendationItemUpdateManyWithWhereWithoutRecommendationInputSchema: z.ZodType<Prisma.RecommendationItemUpdateManyWithWhereWithoutRecommendationInput> = z.object({
  where: z.lazy(() => RecommendationItemScalarWhereInputSchema),
  data: z.union([ z.lazy(() => RecommendationItemUpdateManyMutationInputSchema),z.lazy(() => RecommendationItemUncheckedUpdateManyWithoutRecommendationInputSchema) ]),
}).strict();

export const RecommendationItemScalarWhereInputSchema: z.ZodType<Prisma.RecommendationItemScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => RecommendationItemScalarWhereInputSchema),z.lazy(() => RecommendationItemScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => RecommendationItemScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => RecommendationItemScalarWhereInputSchema),z.lazy(() => RecommendationItemScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  recommendationId: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  wholesalePrice: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  recommendedPrice: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  margin: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  competition: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  searchVolume: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  trend: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  score: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const RecommendationCreateWithoutItemsInputSchema: z.ZodType<Prisma.RecommendationCreateWithoutItemsInput> = z.object({
  keyword: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const RecommendationUncheckedCreateWithoutItemsInputSchema: z.ZodType<Prisma.RecommendationUncheckedCreateWithoutItemsInput> = z.object({
  id: z.number().int().optional(),
  keyword: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const RecommendationCreateOrConnectWithoutItemsInputSchema: z.ZodType<Prisma.RecommendationCreateOrConnectWithoutItemsInput> = z.object({
  where: z.lazy(() => RecommendationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => RecommendationCreateWithoutItemsInputSchema),z.lazy(() => RecommendationUncheckedCreateWithoutItemsInputSchema) ]),
}).strict();

export const RecommendationUpsertWithoutItemsInputSchema: z.ZodType<Prisma.RecommendationUpsertWithoutItemsInput> = z.object({
  update: z.union([ z.lazy(() => RecommendationUpdateWithoutItemsInputSchema),z.lazy(() => RecommendationUncheckedUpdateWithoutItemsInputSchema) ]),
  create: z.union([ z.lazy(() => RecommendationCreateWithoutItemsInputSchema),z.lazy(() => RecommendationUncheckedCreateWithoutItemsInputSchema) ]),
  where: z.lazy(() => RecommendationWhereInputSchema).optional()
}).strict();

export const RecommendationUpdateToOneWithWhereWithoutItemsInputSchema: z.ZodType<Prisma.RecommendationUpdateToOneWithWhereWithoutItemsInput> = z.object({
  where: z.lazy(() => RecommendationWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => RecommendationUpdateWithoutItemsInputSchema),z.lazy(() => RecommendationUncheckedUpdateWithoutItemsInputSchema) ]),
}).strict();

export const RecommendationUpdateWithoutItemsInputSchema: z.ZodType<Prisma.RecommendationUpdateWithoutItemsInput> = z.object({
  keyword: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const RecommendationUncheckedUpdateWithoutItemsInputSchema: z.ZodType<Prisma.RecommendationUncheckedUpdateWithoutItemsInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  keyword: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const WholesaleGroupCreateWithoutProductsInputSchema: z.ZodType<Prisma.WholesaleGroupCreateWithoutProductsInput> = z.object({
  keyword: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const WholesaleGroupUncheckedCreateWithoutProductsInputSchema: z.ZodType<Prisma.WholesaleGroupUncheckedCreateWithoutProductsInput> = z.object({
  id: z.number().int().optional(),
  keyword: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const WholesaleGroupCreateOrConnectWithoutProductsInputSchema: z.ZodType<Prisma.WholesaleGroupCreateOrConnectWithoutProductsInput> = z.object({
  where: z.lazy(() => WholesaleGroupWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => WholesaleGroupCreateWithoutProductsInputSchema),z.lazy(() => WholesaleGroupUncheckedCreateWithoutProductsInputSchema) ]),
}).strict();

export const WholesaleGroupUpsertWithoutProductsInputSchema: z.ZodType<Prisma.WholesaleGroupUpsertWithoutProductsInput> = z.object({
  update: z.union([ z.lazy(() => WholesaleGroupUpdateWithoutProductsInputSchema),z.lazy(() => WholesaleGroupUncheckedUpdateWithoutProductsInputSchema) ]),
  create: z.union([ z.lazy(() => WholesaleGroupCreateWithoutProductsInputSchema),z.lazy(() => WholesaleGroupUncheckedCreateWithoutProductsInputSchema) ]),
  where: z.lazy(() => WholesaleGroupWhereInputSchema).optional()
}).strict();

export const WholesaleGroupUpdateToOneWithWhereWithoutProductsInputSchema: z.ZodType<Prisma.WholesaleGroupUpdateToOneWithWhereWithoutProductsInput> = z.object({
  where: z.lazy(() => WholesaleGroupWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => WholesaleGroupUpdateWithoutProductsInputSchema),z.lazy(() => WholesaleGroupUncheckedUpdateWithoutProductsInputSchema) ]),
}).strict();

export const WholesaleGroupUpdateWithoutProductsInputSchema: z.ZodType<Prisma.WholesaleGroupUpdateWithoutProductsInput> = z.object({
  keyword: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const WholesaleGroupUncheckedUpdateWithoutProductsInputSchema: z.ZodType<Prisma.WholesaleGroupUncheckedUpdateWithoutProductsInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  keyword: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const WholesaleProductCreateWithoutWholesaleGroupInputSchema: z.ZodType<Prisma.WholesaleProductCreateWithoutWholesaleGroupInput> = z.object({
  name: z.string(),
  price: z.number().int(),
  source: z.string(),
  rating: z.number(),
  minOrder: z.number().int(),
  url: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const WholesaleProductUncheckedCreateWithoutWholesaleGroupInputSchema: z.ZodType<Prisma.WholesaleProductUncheckedCreateWithoutWholesaleGroupInput> = z.object({
  id: z.number().int().optional(),
  name: z.string(),
  price: z.number().int(),
  source: z.string(),
  rating: z.number(),
  minOrder: z.number().int(),
  url: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const WholesaleProductCreateOrConnectWithoutWholesaleGroupInputSchema: z.ZodType<Prisma.WholesaleProductCreateOrConnectWithoutWholesaleGroupInput> = z.object({
  where: z.lazy(() => WholesaleProductWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => WholesaleProductCreateWithoutWholesaleGroupInputSchema),z.lazy(() => WholesaleProductUncheckedCreateWithoutWholesaleGroupInputSchema) ]),
}).strict();

export const WholesaleProductCreateManyWholesaleGroupInputEnvelopeSchema: z.ZodType<Prisma.WholesaleProductCreateManyWholesaleGroupInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => WholesaleProductCreateManyWholesaleGroupInputSchema),z.lazy(() => WholesaleProductCreateManyWholesaleGroupInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const WholesaleProductUpsertWithWhereUniqueWithoutWholesaleGroupInputSchema: z.ZodType<Prisma.WholesaleProductUpsertWithWhereUniqueWithoutWholesaleGroupInput> = z.object({
  where: z.lazy(() => WholesaleProductWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => WholesaleProductUpdateWithoutWholesaleGroupInputSchema),z.lazy(() => WholesaleProductUncheckedUpdateWithoutWholesaleGroupInputSchema) ]),
  create: z.union([ z.lazy(() => WholesaleProductCreateWithoutWholesaleGroupInputSchema),z.lazy(() => WholesaleProductUncheckedCreateWithoutWholesaleGroupInputSchema) ]),
}).strict();

export const WholesaleProductUpdateWithWhereUniqueWithoutWholesaleGroupInputSchema: z.ZodType<Prisma.WholesaleProductUpdateWithWhereUniqueWithoutWholesaleGroupInput> = z.object({
  where: z.lazy(() => WholesaleProductWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => WholesaleProductUpdateWithoutWholesaleGroupInputSchema),z.lazy(() => WholesaleProductUncheckedUpdateWithoutWholesaleGroupInputSchema) ]),
}).strict();

export const WholesaleProductUpdateManyWithWhereWithoutWholesaleGroupInputSchema: z.ZodType<Prisma.WholesaleProductUpdateManyWithWhereWithoutWholesaleGroupInput> = z.object({
  where: z.lazy(() => WholesaleProductScalarWhereInputSchema),
  data: z.union([ z.lazy(() => WholesaleProductUpdateManyMutationInputSchema),z.lazy(() => WholesaleProductUncheckedUpdateManyWithoutWholesaleGroupInputSchema) ]),
}).strict();

export const WholesaleProductScalarWhereInputSchema: z.ZodType<Prisma.WholesaleProductScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => WholesaleProductScalarWhereInputSchema),z.lazy(() => WholesaleProductScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => WholesaleProductScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => WholesaleProductScalarWhereInputSchema),z.lazy(() => WholesaleProductScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  price: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  source: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  rating: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  minOrder: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  url: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  wholesaleGroupId: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const ProductCreateWithoutMarginsInputSchema: z.ZodType<Prisma.ProductCreateWithoutMarginsInput> = z.object({
  name: z.string(),
  wholesalePrice: z.number().int(),
  recommendedPrice: z.number().int(),
  margin: z.number(),
  competition: z.string(),
  searchVolume: z.number().int(),
  category: z.string(),
  image: z.string(),
  source: z.string(),
  trend: z.string(),
  score: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  detailPages: z.lazy(() => DetailPageCreateNestedManyWithoutProductInputSchema).optional(),
  registrations: z.lazy(() => RegistrationCreateNestedManyWithoutProductInputSchema).optional()
}).strict();

export const ProductUncheckedCreateWithoutMarginsInputSchema: z.ZodType<Prisma.ProductUncheckedCreateWithoutMarginsInput> = z.object({
  id: z.number().int().optional(),
  name: z.string(),
  wholesalePrice: z.number().int(),
  recommendedPrice: z.number().int(),
  margin: z.number(),
  competition: z.string(),
  searchVolume: z.number().int(),
  category: z.string(),
  image: z.string(),
  source: z.string(),
  trend: z.string(),
  score: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  detailPages: z.lazy(() => DetailPageUncheckedCreateNestedManyWithoutProductInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUncheckedCreateNestedManyWithoutProductInputSchema).optional()
}).strict();

export const ProductCreateOrConnectWithoutMarginsInputSchema: z.ZodType<Prisma.ProductCreateOrConnectWithoutMarginsInput> = z.object({
  where: z.lazy(() => ProductWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ProductCreateWithoutMarginsInputSchema),z.lazy(() => ProductUncheckedCreateWithoutMarginsInputSchema) ]),
}).strict();

export const ProductUpsertWithoutMarginsInputSchema: z.ZodType<Prisma.ProductUpsertWithoutMarginsInput> = z.object({
  update: z.union([ z.lazy(() => ProductUpdateWithoutMarginsInputSchema),z.lazy(() => ProductUncheckedUpdateWithoutMarginsInputSchema) ]),
  create: z.union([ z.lazy(() => ProductCreateWithoutMarginsInputSchema),z.lazy(() => ProductUncheckedCreateWithoutMarginsInputSchema) ]),
  where: z.lazy(() => ProductWhereInputSchema).optional()
}).strict();

export const ProductUpdateToOneWithWhereWithoutMarginsInputSchema: z.ZodType<Prisma.ProductUpdateToOneWithWhereWithoutMarginsInput> = z.object({
  where: z.lazy(() => ProductWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => ProductUpdateWithoutMarginsInputSchema),z.lazy(() => ProductUncheckedUpdateWithoutMarginsInputSchema) ]),
}).strict();

export const ProductUpdateWithoutMarginsInputSchema: z.ZodType<Prisma.ProductUpdateWithoutMarginsInput> = z.object({
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  wholesalePrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  recommendedPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  margin: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  competition: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  searchVolume: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  source: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  trend: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  score: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  detailPages: z.lazy(() => DetailPageUpdateManyWithoutProductNestedInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUpdateManyWithoutProductNestedInputSchema).optional()
}).strict();

export const ProductUncheckedUpdateWithoutMarginsInputSchema: z.ZodType<Prisma.ProductUncheckedUpdateWithoutMarginsInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  wholesalePrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  recommendedPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  margin: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  competition: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  searchVolume: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  source: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  trend: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  score: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  detailPages: z.lazy(() => DetailPageUncheckedUpdateManyWithoutProductNestedInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUncheckedUpdateManyWithoutProductNestedInputSchema).optional()
}).strict();

export const ProductCreateWithoutDetailPagesInputSchema: z.ZodType<Prisma.ProductCreateWithoutDetailPagesInput> = z.object({
  name: z.string(),
  wholesalePrice: z.number().int(),
  recommendedPrice: z.number().int(),
  margin: z.number(),
  competition: z.string(),
  searchVolume: z.number().int(),
  category: z.string(),
  image: z.string(),
  source: z.string(),
  trend: z.string(),
  score: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  margins: z.lazy(() => MarginCreateNestedManyWithoutProductInputSchema).optional(),
  registrations: z.lazy(() => RegistrationCreateNestedManyWithoutProductInputSchema).optional()
}).strict();

export const ProductUncheckedCreateWithoutDetailPagesInputSchema: z.ZodType<Prisma.ProductUncheckedCreateWithoutDetailPagesInput> = z.object({
  id: z.number().int().optional(),
  name: z.string(),
  wholesalePrice: z.number().int(),
  recommendedPrice: z.number().int(),
  margin: z.number(),
  competition: z.string(),
  searchVolume: z.number().int(),
  category: z.string(),
  image: z.string(),
  source: z.string(),
  trend: z.string(),
  score: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  margins: z.lazy(() => MarginUncheckedCreateNestedManyWithoutProductInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUncheckedCreateNestedManyWithoutProductInputSchema).optional()
}).strict();

export const ProductCreateOrConnectWithoutDetailPagesInputSchema: z.ZodType<Prisma.ProductCreateOrConnectWithoutDetailPagesInput> = z.object({
  where: z.lazy(() => ProductWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ProductCreateWithoutDetailPagesInputSchema),z.lazy(() => ProductUncheckedCreateWithoutDetailPagesInputSchema) ]),
}).strict();

export const ProductUpsertWithoutDetailPagesInputSchema: z.ZodType<Prisma.ProductUpsertWithoutDetailPagesInput> = z.object({
  update: z.union([ z.lazy(() => ProductUpdateWithoutDetailPagesInputSchema),z.lazy(() => ProductUncheckedUpdateWithoutDetailPagesInputSchema) ]),
  create: z.union([ z.lazy(() => ProductCreateWithoutDetailPagesInputSchema),z.lazy(() => ProductUncheckedCreateWithoutDetailPagesInputSchema) ]),
  where: z.lazy(() => ProductWhereInputSchema).optional()
}).strict();

export const ProductUpdateToOneWithWhereWithoutDetailPagesInputSchema: z.ZodType<Prisma.ProductUpdateToOneWithWhereWithoutDetailPagesInput> = z.object({
  where: z.lazy(() => ProductWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => ProductUpdateWithoutDetailPagesInputSchema),z.lazy(() => ProductUncheckedUpdateWithoutDetailPagesInputSchema) ]),
}).strict();

export const ProductUpdateWithoutDetailPagesInputSchema: z.ZodType<Prisma.ProductUpdateWithoutDetailPagesInput> = z.object({
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  wholesalePrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  recommendedPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  margin: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  competition: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  searchVolume: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  source: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  trend: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  score: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  margins: z.lazy(() => MarginUpdateManyWithoutProductNestedInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUpdateManyWithoutProductNestedInputSchema).optional()
}).strict();

export const ProductUncheckedUpdateWithoutDetailPagesInputSchema: z.ZodType<Prisma.ProductUncheckedUpdateWithoutDetailPagesInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  wholesalePrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  recommendedPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  margin: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  competition: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  searchVolume: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  source: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  trend: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  score: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  margins: z.lazy(() => MarginUncheckedUpdateManyWithoutProductNestedInputSchema).optional(),
  registrations: z.lazy(() => RegistrationUncheckedUpdateManyWithoutProductNestedInputSchema).optional()
}).strict();

export const ProductCreateWithoutRegistrationsInputSchema: z.ZodType<Prisma.ProductCreateWithoutRegistrationsInput> = z.object({
  name: z.string(),
  wholesalePrice: z.number().int(),
  recommendedPrice: z.number().int(),
  margin: z.number(),
  competition: z.string(),
  searchVolume: z.number().int(),
  category: z.string(),
  image: z.string(),
  source: z.string(),
  trend: z.string(),
  score: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  margins: z.lazy(() => MarginCreateNestedManyWithoutProductInputSchema).optional(),
  detailPages: z.lazy(() => DetailPageCreateNestedManyWithoutProductInputSchema).optional()
}).strict();

export const ProductUncheckedCreateWithoutRegistrationsInputSchema: z.ZodType<Prisma.ProductUncheckedCreateWithoutRegistrationsInput> = z.object({
  id: z.number().int().optional(),
  name: z.string(),
  wholesalePrice: z.number().int(),
  recommendedPrice: z.number().int(),
  margin: z.number(),
  competition: z.string(),
  searchVolume: z.number().int(),
  category: z.string(),
  image: z.string(),
  source: z.string(),
  trend: z.string(),
  score: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  margins: z.lazy(() => MarginUncheckedCreateNestedManyWithoutProductInputSchema).optional(),
  detailPages: z.lazy(() => DetailPageUncheckedCreateNestedManyWithoutProductInputSchema).optional()
}).strict();

export const ProductCreateOrConnectWithoutRegistrationsInputSchema: z.ZodType<Prisma.ProductCreateOrConnectWithoutRegistrationsInput> = z.object({
  where: z.lazy(() => ProductWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ProductCreateWithoutRegistrationsInputSchema),z.lazy(() => ProductUncheckedCreateWithoutRegistrationsInputSchema) ]),
}).strict();

export const ProductUpsertWithoutRegistrationsInputSchema: z.ZodType<Prisma.ProductUpsertWithoutRegistrationsInput> = z.object({
  update: z.union([ z.lazy(() => ProductUpdateWithoutRegistrationsInputSchema),z.lazy(() => ProductUncheckedUpdateWithoutRegistrationsInputSchema) ]),
  create: z.union([ z.lazy(() => ProductCreateWithoutRegistrationsInputSchema),z.lazy(() => ProductUncheckedCreateWithoutRegistrationsInputSchema) ]),
  where: z.lazy(() => ProductWhereInputSchema).optional()
}).strict();

export const ProductUpdateToOneWithWhereWithoutRegistrationsInputSchema: z.ZodType<Prisma.ProductUpdateToOneWithWhereWithoutRegistrationsInput> = z.object({
  where: z.lazy(() => ProductWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => ProductUpdateWithoutRegistrationsInputSchema),z.lazy(() => ProductUncheckedUpdateWithoutRegistrationsInputSchema) ]),
}).strict();

export const ProductUpdateWithoutRegistrationsInputSchema: z.ZodType<Prisma.ProductUpdateWithoutRegistrationsInput> = z.object({
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  wholesalePrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  recommendedPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  margin: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  competition: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  searchVolume: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  source: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  trend: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  score: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  margins: z.lazy(() => MarginUpdateManyWithoutProductNestedInputSchema).optional(),
  detailPages: z.lazy(() => DetailPageUpdateManyWithoutProductNestedInputSchema).optional()
}).strict();

export const ProductUncheckedUpdateWithoutRegistrationsInputSchema: z.ZodType<Prisma.ProductUncheckedUpdateWithoutRegistrationsInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  wholesalePrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  recommendedPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  margin: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  competition: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  searchVolume: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  source: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  trend: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  score: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  margins: z.lazy(() => MarginUncheckedUpdateManyWithoutProductNestedInputSchema).optional(),
  detailPages: z.lazy(() => DetailPageUncheckedUpdateManyWithoutProductNestedInputSchema).optional()
}).strict();

export const PaymentHistoryCreateManyUserInputSchema: z.ZodType<Prisma.PaymentHistoryCreateManyUserInput> = z.object({
  id: z.string(),
  invoiceId: z.string(),
  subscriptionId: z.string(),
  customerId: z.string(),
  userEmail: z.string(),
  billingReason: z.string(),
  status: z.lazy(() => PaymentStatusSchema),
  statusFormatted: z.string(),
  currency: z.string(),
  currencyRate: z.string(),
  subtotal: z.number().int(),
  discountTotal: z.number().int(),
  tax: z.number().int(),
  taxInclusive: z.boolean(),
  total: z.number().int(),
  refundedAmount: z.number().int().optional(),
  subtotalUsd: z.number().int(),
  discountTotalUsd: z.number().int(),
  taxUsd: z.number().int(),
  totalUsd: z.number().int(),
  refundedAmountUsd: z.number().int().optional(),
  cardBrand: z.string().optional().nullable(),
  cardLastFour: z.string().optional().nullable(),
  invoiceUrl: z.string().optional().nullable(),
  testMode: z.boolean().optional(),
  refundedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const PaymentHistoryUpdateWithoutUserInputSchema: z.ZodType<Prisma.PaymentHistoryUpdateWithoutUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  invoiceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subscriptionId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userEmail: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  billingReason: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => PaymentStatusSchema),z.lazy(() => EnumPaymentStatusFieldUpdateOperationsInputSchema) ]).optional(),
  statusFormatted: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currencyRate: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subtotal: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  discountTotal: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  tax: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  taxInclusive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  total: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  subtotalUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  discountTotalUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  taxUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  totalUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedAmountUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  cardBrand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cardLastFour: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  invoiceUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  testMode: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  refundedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const PaymentHistoryUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.PaymentHistoryUncheckedUpdateWithoutUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  invoiceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subscriptionId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userEmail: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  billingReason: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => PaymentStatusSchema),z.lazy(() => EnumPaymentStatusFieldUpdateOperationsInputSchema) ]).optional(),
  statusFormatted: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currencyRate: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subtotal: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  discountTotal: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  tax: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  taxInclusive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  total: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  subtotalUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  discountTotalUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  taxUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  totalUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedAmountUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  cardBrand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cardLastFour: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  invoiceUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  testMode: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  refundedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const PaymentHistoryUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.PaymentHistoryUncheckedUpdateManyWithoutUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  invoiceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subscriptionId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userEmail: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  billingReason: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => PaymentStatusSchema),z.lazy(() => EnumPaymentStatusFieldUpdateOperationsInputSchema) ]).optional(),
  statusFormatted: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currencyRate: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subtotal: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  discountTotal: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  tax: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  taxInclusive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  total: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  subtotalUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  discountTotalUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  taxUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  totalUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedAmountUsd: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  cardBrand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cardLastFour: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  invoiceUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  testMode: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  refundedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const SubscriptionCreateManyPlanInputSchema: z.ZodType<Prisma.SubscriptionCreateManyPlanInput> = z.object({
  id: z.string(),
  userId: z.string(),
  status: z.lazy(() => SubscriptionStatusSchema),
  lemonSqueezyId: z.string(),
  lemonSubscriptionItemId: z.string().optional().nullable(),
  lemonCustomerId: z.string(),
  lemonOrderId: z.string(),
  lemonProductId: z.string(),
  lemonVariantId: z.string(),
  renewsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  paymentMethod: z.lazy(() => SubscriptionPaymentMethodSchema),
  cardBrand: z.string().optional().nullable(),
  cardLast4: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const SubscriptionUpdateWithoutPlanInputSchema: z.ZodType<Prisma.SubscriptionUpdateWithoutPlanInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => SubscriptionStatusSchema),z.lazy(() => EnumSubscriptionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  lemonSqueezyId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonSubscriptionItemId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lemonCustomerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonOrderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonProductId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonVariantId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  renewsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  paymentMethod: z.union([ z.lazy(() => SubscriptionPaymentMethodSchema),z.lazy(() => EnumSubscriptionPaymentMethodFieldUpdateOperationsInputSchema) ]).optional(),
  cardBrand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cardLast4: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutSubscriptionNestedInputSchema).optional()
}).strict();

export const SubscriptionUncheckedUpdateWithoutPlanInputSchema: z.ZodType<Prisma.SubscriptionUncheckedUpdateWithoutPlanInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => SubscriptionStatusSchema),z.lazy(() => EnumSubscriptionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  lemonSqueezyId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonSubscriptionItemId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lemonCustomerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonOrderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonProductId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonVariantId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  renewsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  paymentMethod: z.union([ z.lazy(() => SubscriptionPaymentMethodSchema),z.lazy(() => EnumSubscriptionPaymentMethodFieldUpdateOperationsInputSchema) ]).optional(),
  cardBrand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cardLast4: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const SubscriptionUncheckedUpdateManyWithoutPlanInputSchema: z.ZodType<Prisma.SubscriptionUncheckedUpdateManyWithoutPlanInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => SubscriptionStatusSchema),z.lazy(() => EnumSubscriptionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  lemonSqueezyId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonSubscriptionItemId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lemonCustomerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonOrderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonProductId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lemonVariantId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  renewsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  paymentMethod: z.union([ z.lazy(() => SubscriptionPaymentMethodSchema),z.lazy(() => EnumSubscriptionPaymentMethodFieldUpdateOperationsInputSchema) ]).optional(),
  cardBrand: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cardLast4: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const MarginCreateManyProductInputSchema: z.ZodType<Prisma.MarginCreateManyProductInput> = z.object({
  id: z.number().int().optional(),
  productName: z.string(),
  wholesalePrice: z.number().int(),
  sellingPrice: z.number().int(),
  shippingCost: z.number().int(),
  commission: z.number(),
  adCost: z.number().int(),
  packagingCost: z.number().int(),
  netMargin: z.number().int(),
  marginRate: z.number(),
  platform: z.string(),
  calculatedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const DetailPageCreateManyProductInputSchema: z.ZodType<Prisma.DetailPageCreateManyProductInput> = z.object({
  id: z.number().int().optional(),
  productName: z.string(),
  summary: z.string(),
  usps: z.union([ z.lazy(() => DetailPageCreateuspsInputSchema),z.string().array() ]).optional(),
  keywords: z.union([ z.lazy(() => DetailPageCreatekeywordsInputSchema),z.string().array() ]).optional(),
  template: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const RegistrationCreateManyProductInputSchema: z.ZodType<Prisma.RegistrationCreateManyProductInput> = z.object({
  id: z.number().int().optional(),
  productName: z.string(),
  category: z.string(),
  recommendedTitle: z.string(),
  price: z.number().int(),
  wholesalePrice: z.number().int(),
  status: z.string(),
  platform: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const MarginUpdateWithoutProductInputSchema: z.ZodType<Prisma.MarginUpdateWithoutProductInput> = z.object({
  productName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  wholesalePrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  sellingPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  shippingCost: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  commission: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  adCost: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  packagingCost: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  netMargin: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  marginRate: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  platform: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  calculatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const MarginUncheckedUpdateWithoutProductInputSchema: z.ZodType<Prisma.MarginUncheckedUpdateWithoutProductInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  productName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  wholesalePrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  sellingPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  shippingCost: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  commission: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  adCost: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  packagingCost: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  netMargin: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  marginRate: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  platform: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  calculatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const MarginUncheckedUpdateManyWithoutProductInputSchema: z.ZodType<Prisma.MarginUncheckedUpdateManyWithoutProductInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  productName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  wholesalePrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  sellingPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  shippingCost: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  commission: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  adCost: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  packagingCost: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  netMargin: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  marginRate: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  platform: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  calculatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const DetailPageUpdateWithoutProductInputSchema: z.ZodType<Prisma.DetailPageUpdateWithoutProductInput> = z.object({
  productName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  summary: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  usps: z.union([ z.lazy(() => DetailPageUpdateuspsInputSchema),z.string().array() ]).optional(),
  keywords: z.union([ z.lazy(() => DetailPageUpdatekeywordsInputSchema),z.string().array() ]).optional(),
  template: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const DetailPageUncheckedUpdateWithoutProductInputSchema: z.ZodType<Prisma.DetailPageUncheckedUpdateWithoutProductInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  productName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  summary: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  usps: z.union([ z.lazy(() => DetailPageUpdateuspsInputSchema),z.string().array() ]).optional(),
  keywords: z.union([ z.lazy(() => DetailPageUpdatekeywordsInputSchema),z.string().array() ]).optional(),
  template: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const DetailPageUncheckedUpdateManyWithoutProductInputSchema: z.ZodType<Prisma.DetailPageUncheckedUpdateManyWithoutProductInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  productName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  summary: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  usps: z.union([ z.lazy(() => DetailPageUpdateuspsInputSchema),z.string().array() ]).optional(),
  keywords: z.union([ z.lazy(() => DetailPageUpdatekeywordsInputSchema),z.string().array() ]).optional(),
  template: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const RegistrationUpdateWithoutProductInputSchema: z.ZodType<Prisma.RegistrationUpdateWithoutProductInput> = z.object({
  productName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  recommendedTitle: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  wholesalePrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  platform: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const RegistrationUncheckedUpdateWithoutProductInputSchema: z.ZodType<Prisma.RegistrationUncheckedUpdateWithoutProductInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  productName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  recommendedTitle: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  wholesalePrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  platform: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const RegistrationUncheckedUpdateManyWithoutProductInputSchema: z.ZodType<Prisma.RegistrationUncheckedUpdateManyWithoutProductInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  productName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  recommendedTitle: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  wholesalePrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  platform: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const RecommendationItemCreateManyRecommendationInputSchema: z.ZodType<Prisma.RecommendationItemCreateManyRecommendationInput> = z.object({
  id: z.number().int().optional(),
  name: z.string(),
  wholesalePrice: z.number().int(),
  recommendedPrice: z.number().int(),
  margin: z.number(),
  competition: z.string(),
  searchVolume: z.number().int(),
  trend: z.string(),
  score: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const RecommendationItemUpdateWithoutRecommendationInputSchema: z.ZodType<Prisma.RecommendationItemUpdateWithoutRecommendationInput> = z.object({
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  wholesalePrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  recommendedPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  margin: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  competition: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  searchVolume: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  trend: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  score: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const RecommendationItemUncheckedUpdateWithoutRecommendationInputSchema: z.ZodType<Prisma.RecommendationItemUncheckedUpdateWithoutRecommendationInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  wholesalePrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  recommendedPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  margin: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  competition: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  searchVolume: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  trend: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  score: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const RecommendationItemUncheckedUpdateManyWithoutRecommendationInputSchema: z.ZodType<Prisma.RecommendationItemUncheckedUpdateManyWithoutRecommendationInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  wholesalePrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  recommendedPrice: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  margin: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  competition: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  searchVolume: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  trend: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  score: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const WholesaleProductCreateManyWholesaleGroupInputSchema: z.ZodType<Prisma.WholesaleProductCreateManyWholesaleGroupInput> = z.object({
  id: z.number().int().optional(),
  name: z.string(),
  price: z.number().int(),
  source: z.string(),
  rating: z.number(),
  minOrder: z.number().int(),
  url: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const WholesaleProductUpdateWithoutWholesaleGroupInputSchema: z.ZodType<Prisma.WholesaleProductUpdateWithoutWholesaleGroupInput> = z.object({
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  source: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  rating: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  minOrder: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const WholesaleProductUncheckedUpdateWithoutWholesaleGroupInputSchema: z.ZodType<Prisma.WholesaleProductUncheckedUpdateWithoutWholesaleGroupInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  source: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  rating: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  minOrder: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const WholesaleProductUncheckedUpdateManyWithoutWholesaleGroupInputSchema: z.ZodType<Prisma.WholesaleProductUncheckedUpdateManyWithoutWholesaleGroupInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  source: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  rating: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  minOrder: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  url: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

/////////////////////////////////////////
// ARGS
/////////////////////////////////////////

export const UserFindFirstArgsSchema: z.ZodType<Prisma.UserFindFirstArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(),UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema,UserScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const UserFindFirstOrThrowArgsSchema: z.ZodType<Prisma.UserFindFirstOrThrowArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(),UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema,UserScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const UserFindManyArgsSchema: z.ZodType<Prisma.UserFindManyArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(),UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema,UserScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const UserAggregateArgsSchema: z.ZodType<Prisma.UserAggregateArgs> = z.object({
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(),UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const UserGroupByArgsSchema: z.ZodType<Prisma.UserGroupByArgs> = z.object({
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithAggregationInputSchema.array(),UserOrderByWithAggregationInputSchema ]).optional(),
  by: UserScalarFieldEnumSchema.array(),
  having: UserScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const UserFindUniqueArgsSchema: z.ZodType<Prisma.UserFindUniqueArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema,
}).strict() ;

export const UserFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.UserFindUniqueOrThrowArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema,
}).strict() ;

export const SubscriptionFindFirstArgsSchema: z.ZodType<Prisma.SubscriptionFindFirstArgs> = z.object({
  select: SubscriptionSelectSchema.optional(),
  include: SubscriptionIncludeSchema.optional(),
  where: SubscriptionWhereInputSchema.optional(),
  orderBy: z.union([ SubscriptionOrderByWithRelationInputSchema.array(),SubscriptionOrderByWithRelationInputSchema ]).optional(),
  cursor: SubscriptionWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SubscriptionScalarFieldEnumSchema,SubscriptionScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const SubscriptionFindFirstOrThrowArgsSchema: z.ZodType<Prisma.SubscriptionFindFirstOrThrowArgs> = z.object({
  select: SubscriptionSelectSchema.optional(),
  include: SubscriptionIncludeSchema.optional(),
  where: SubscriptionWhereInputSchema.optional(),
  orderBy: z.union([ SubscriptionOrderByWithRelationInputSchema.array(),SubscriptionOrderByWithRelationInputSchema ]).optional(),
  cursor: SubscriptionWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SubscriptionScalarFieldEnumSchema,SubscriptionScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const SubscriptionFindManyArgsSchema: z.ZodType<Prisma.SubscriptionFindManyArgs> = z.object({
  select: SubscriptionSelectSchema.optional(),
  include: SubscriptionIncludeSchema.optional(),
  where: SubscriptionWhereInputSchema.optional(),
  orderBy: z.union([ SubscriptionOrderByWithRelationInputSchema.array(),SubscriptionOrderByWithRelationInputSchema ]).optional(),
  cursor: SubscriptionWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SubscriptionScalarFieldEnumSchema,SubscriptionScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const SubscriptionAggregateArgsSchema: z.ZodType<Prisma.SubscriptionAggregateArgs> = z.object({
  where: SubscriptionWhereInputSchema.optional(),
  orderBy: z.union([ SubscriptionOrderByWithRelationInputSchema.array(),SubscriptionOrderByWithRelationInputSchema ]).optional(),
  cursor: SubscriptionWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const SubscriptionGroupByArgsSchema: z.ZodType<Prisma.SubscriptionGroupByArgs> = z.object({
  where: SubscriptionWhereInputSchema.optional(),
  orderBy: z.union([ SubscriptionOrderByWithAggregationInputSchema.array(),SubscriptionOrderByWithAggregationInputSchema ]).optional(),
  by: SubscriptionScalarFieldEnumSchema.array(),
  having: SubscriptionScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const SubscriptionFindUniqueArgsSchema: z.ZodType<Prisma.SubscriptionFindUniqueArgs> = z.object({
  select: SubscriptionSelectSchema.optional(),
  include: SubscriptionIncludeSchema.optional(),
  where: SubscriptionWhereUniqueInputSchema,
}).strict() ;

export const SubscriptionFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.SubscriptionFindUniqueOrThrowArgs> = z.object({
  select: SubscriptionSelectSchema.optional(),
  include: SubscriptionIncludeSchema.optional(),
  where: SubscriptionWhereUniqueInputSchema,
}).strict() ;

export const PlanFindFirstArgsSchema: z.ZodType<Prisma.PlanFindFirstArgs> = z.object({
  select: PlanSelectSchema.optional(),
  include: PlanIncludeSchema.optional(),
  where: PlanWhereInputSchema.optional(),
  orderBy: z.union([ PlanOrderByWithRelationInputSchema.array(),PlanOrderByWithRelationInputSchema ]).optional(),
  cursor: PlanWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PlanScalarFieldEnumSchema,PlanScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const PlanFindFirstOrThrowArgsSchema: z.ZodType<Prisma.PlanFindFirstOrThrowArgs> = z.object({
  select: PlanSelectSchema.optional(),
  include: PlanIncludeSchema.optional(),
  where: PlanWhereInputSchema.optional(),
  orderBy: z.union([ PlanOrderByWithRelationInputSchema.array(),PlanOrderByWithRelationInputSchema ]).optional(),
  cursor: PlanWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PlanScalarFieldEnumSchema,PlanScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const PlanFindManyArgsSchema: z.ZodType<Prisma.PlanFindManyArgs> = z.object({
  select: PlanSelectSchema.optional(),
  include: PlanIncludeSchema.optional(),
  where: PlanWhereInputSchema.optional(),
  orderBy: z.union([ PlanOrderByWithRelationInputSchema.array(),PlanOrderByWithRelationInputSchema ]).optional(),
  cursor: PlanWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PlanScalarFieldEnumSchema,PlanScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const PlanAggregateArgsSchema: z.ZodType<Prisma.PlanAggregateArgs> = z.object({
  where: PlanWhereInputSchema.optional(),
  orderBy: z.union([ PlanOrderByWithRelationInputSchema.array(),PlanOrderByWithRelationInputSchema ]).optional(),
  cursor: PlanWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const PlanGroupByArgsSchema: z.ZodType<Prisma.PlanGroupByArgs> = z.object({
  where: PlanWhereInputSchema.optional(),
  orderBy: z.union([ PlanOrderByWithAggregationInputSchema.array(),PlanOrderByWithAggregationInputSchema ]).optional(),
  by: PlanScalarFieldEnumSchema.array(),
  having: PlanScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const PlanFindUniqueArgsSchema: z.ZodType<Prisma.PlanFindUniqueArgs> = z.object({
  select: PlanSelectSchema.optional(),
  include: PlanIncludeSchema.optional(),
  where: PlanWhereUniqueInputSchema,
}).strict() ;

export const PlanFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.PlanFindUniqueOrThrowArgs> = z.object({
  select: PlanSelectSchema.optional(),
  include: PlanIncludeSchema.optional(),
  where: PlanWhereUniqueInputSchema,
}).strict() ;

export const WebhookEventFindFirstArgsSchema: z.ZodType<Prisma.WebhookEventFindFirstArgs> = z.object({
  select: WebhookEventSelectSchema.optional(),
  where: WebhookEventWhereInputSchema.optional(),
  orderBy: z.union([ WebhookEventOrderByWithRelationInputSchema.array(),WebhookEventOrderByWithRelationInputSchema ]).optional(),
  cursor: WebhookEventWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ WebhookEventScalarFieldEnumSchema,WebhookEventScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const WebhookEventFindFirstOrThrowArgsSchema: z.ZodType<Prisma.WebhookEventFindFirstOrThrowArgs> = z.object({
  select: WebhookEventSelectSchema.optional(),
  where: WebhookEventWhereInputSchema.optional(),
  orderBy: z.union([ WebhookEventOrderByWithRelationInputSchema.array(),WebhookEventOrderByWithRelationInputSchema ]).optional(),
  cursor: WebhookEventWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ WebhookEventScalarFieldEnumSchema,WebhookEventScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const WebhookEventFindManyArgsSchema: z.ZodType<Prisma.WebhookEventFindManyArgs> = z.object({
  select: WebhookEventSelectSchema.optional(),
  where: WebhookEventWhereInputSchema.optional(),
  orderBy: z.union([ WebhookEventOrderByWithRelationInputSchema.array(),WebhookEventOrderByWithRelationInputSchema ]).optional(),
  cursor: WebhookEventWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ WebhookEventScalarFieldEnumSchema,WebhookEventScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const WebhookEventAggregateArgsSchema: z.ZodType<Prisma.WebhookEventAggregateArgs> = z.object({
  where: WebhookEventWhereInputSchema.optional(),
  orderBy: z.union([ WebhookEventOrderByWithRelationInputSchema.array(),WebhookEventOrderByWithRelationInputSchema ]).optional(),
  cursor: WebhookEventWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const WebhookEventGroupByArgsSchema: z.ZodType<Prisma.WebhookEventGroupByArgs> = z.object({
  where: WebhookEventWhereInputSchema.optional(),
  orderBy: z.union([ WebhookEventOrderByWithAggregationInputSchema.array(),WebhookEventOrderByWithAggregationInputSchema ]).optional(),
  by: WebhookEventScalarFieldEnumSchema.array(),
  having: WebhookEventScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const WebhookEventFindUniqueArgsSchema: z.ZodType<Prisma.WebhookEventFindUniqueArgs> = z.object({
  select: WebhookEventSelectSchema.optional(),
  where: WebhookEventWhereUniqueInputSchema,
}).strict() ;

export const WebhookEventFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.WebhookEventFindUniqueOrThrowArgs> = z.object({
  select: WebhookEventSelectSchema.optional(),
  where: WebhookEventWhereUniqueInputSchema,
}).strict() ;

export const PaymentHistoryFindFirstArgsSchema: z.ZodType<Prisma.PaymentHistoryFindFirstArgs> = z.object({
  select: PaymentHistorySelectSchema.optional(),
  include: PaymentHistoryIncludeSchema.optional(),
  where: PaymentHistoryWhereInputSchema.optional(),
  orderBy: z.union([ PaymentHistoryOrderByWithRelationInputSchema.array(),PaymentHistoryOrderByWithRelationInputSchema ]).optional(),
  cursor: PaymentHistoryWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PaymentHistoryScalarFieldEnumSchema,PaymentHistoryScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const PaymentHistoryFindFirstOrThrowArgsSchema: z.ZodType<Prisma.PaymentHistoryFindFirstOrThrowArgs> = z.object({
  select: PaymentHistorySelectSchema.optional(),
  include: PaymentHistoryIncludeSchema.optional(),
  where: PaymentHistoryWhereInputSchema.optional(),
  orderBy: z.union([ PaymentHistoryOrderByWithRelationInputSchema.array(),PaymentHistoryOrderByWithRelationInputSchema ]).optional(),
  cursor: PaymentHistoryWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PaymentHistoryScalarFieldEnumSchema,PaymentHistoryScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const PaymentHistoryFindManyArgsSchema: z.ZodType<Prisma.PaymentHistoryFindManyArgs> = z.object({
  select: PaymentHistorySelectSchema.optional(),
  include: PaymentHistoryIncludeSchema.optional(),
  where: PaymentHistoryWhereInputSchema.optional(),
  orderBy: z.union([ PaymentHistoryOrderByWithRelationInputSchema.array(),PaymentHistoryOrderByWithRelationInputSchema ]).optional(),
  cursor: PaymentHistoryWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PaymentHistoryScalarFieldEnumSchema,PaymentHistoryScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const PaymentHistoryAggregateArgsSchema: z.ZodType<Prisma.PaymentHistoryAggregateArgs> = z.object({
  where: PaymentHistoryWhereInputSchema.optional(),
  orderBy: z.union([ PaymentHistoryOrderByWithRelationInputSchema.array(),PaymentHistoryOrderByWithRelationInputSchema ]).optional(),
  cursor: PaymentHistoryWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const PaymentHistoryGroupByArgsSchema: z.ZodType<Prisma.PaymentHistoryGroupByArgs> = z.object({
  where: PaymentHistoryWhereInputSchema.optional(),
  orderBy: z.union([ PaymentHistoryOrderByWithAggregationInputSchema.array(),PaymentHistoryOrderByWithAggregationInputSchema ]).optional(),
  by: PaymentHistoryScalarFieldEnumSchema.array(),
  having: PaymentHistoryScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const PaymentHistoryFindUniqueArgsSchema: z.ZodType<Prisma.PaymentHistoryFindUniqueArgs> = z.object({
  select: PaymentHistorySelectSchema.optional(),
  include: PaymentHistoryIncludeSchema.optional(),
  where: PaymentHistoryWhereUniqueInputSchema,
}).strict() ;

export const PaymentHistoryFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.PaymentHistoryFindUniqueOrThrowArgs> = z.object({
  select: PaymentHistorySelectSchema.optional(),
  include: PaymentHistoryIncludeSchema.optional(),
  where: PaymentHistoryWhereUniqueInputSchema,
}).strict() ;

export const ProductFindFirstArgsSchema: z.ZodType<Prisma.ProductFindFirstArgs> = z.object({
  select: ProductSelectSchema.optional(),
  include: ProductIncludeSchema.optional(),
  where: ProductWhereInputSchema.optional(),
  orderBy: z.union([ ProductOrderByWithRelationInputSchema.array(),ProductOrderByWithRelationInputSchema ]).optional(),
  cursor: ProductWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ProductScalarFieldEnumSchema,ProductScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const ProductFindFirstOrThrowArgsSchema: z.ZodType<Prisma.ProductFindFirstOrThrowArgs> = z.object({
  select: ProductSelectSchema.optional(),
  include: ProductIncludeSchema.optional(),
  where: ProductWhereInputSchema.optional(),
  orderBy: z.union([ ProductOrderByWithRelationInputSchema.array(),ProductOrderByWithRelationInputSchema ]).optional(),
  cursor: ProductWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ProductScalarFieldEnumSchema,ProductScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const ProductFindManyArgsSchema: z.ZodType<Prisma.ProductFindManyArgs> = z.object({
  select: ProductSelectSchema.optional(),
  include: ProductIncludeSchema.optional(),
  where: ProductWhereInputSchema.optional(),
  orderBy: z.union([ ProductOrderByWithRelationInputSchema.array(),ProductOrderByWithRelationInputSchema ]).optional(),
  cursor: ProductWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ProductScalarFieldEnumSchema,ProductScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const ProductAggregateArgsSchema: z.ZodType<Prisma.ProductAggregateArgs> = z.object({
  where: ProductWhereInputSchema.optional(),
  orderBy: z.union([ ProductOrderByWithRelationInputSchema.array(),ProductOrderByWithRelationInputSchema ]).optional(),
  cursor: ProductWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const ProductGroupByArgsSchema: z.ZodType<Prisma.ProductGroupByArgs> = z.object({
  where: ProductWhereInputSchema.optional(),
  orderBy: z.union([ ProductOrderByWithAggregationInputSchema.array(),ProductOrderByWithAggregationInputSchema ]).optional(),
  by: ProductScalarFieldEnumSchema.array(),
  having: ProductScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const ProductFindUniqueArgsSchema: z.ZodType<Prisma.ProductFindUniqueArgs> = z.object({
  select: ProductSelectSchema.optional(),
  include: ProductIncludeSchema.optional(),
  where: ProductWhereUniqueInputSchema,
}).strict() ;

export const ProductFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.ProductFindUniqueOrThrowArgs> = z.object({
  select: ProductSelectSchema.optional(),
  include: ProductIncludeSchema.optional(),
  where: ProductWhereUniqueInputSchema,
}).strict() ;

export const RecommendationFindFirstArgsSchema: z.ZodType<Prisma.RecommendationFindFirstArgs> = z.object({
  select: RecommendationSelectSchema.optional(),
  include: RecommendationIncludeSchema.optional(),
  where: RecommendationWhereInputSchema.optional(),
  orderBy: z.union([ RecommendationOrderByWithRelationInputSchema.array(),RecommendationOrderByWithRelationInputSchema ]).optional(),
  cursor: RecommendationWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ RecommendationScalarFieldEnumSchema,RecommendationScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const RecommendationFindFirstOrThrowArgsSchema: z.ZodType<Prisma.RecommendationFindFirstOrThrowArgs> = z.object({
  select: RecommendationSelectSchema.optional(),
  include: RecommendationIncludeSchema.optional(),
  where: RecommendationWhereInputSchema.optional(),
  orderBy: z.union([ RecommendationOrderByWithRelationInputSchema.array(),RecommendationOrderByWithRelationInputSchema ]).optional(),
  cursor: RecommendationWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ RecommendationScalarFieldEnumSchema,RecommendationScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const RecommendationFindManyArgsSchema: z.ZodType<Prisma.RecommendationFindManyArgs> = z.object({
  select: RecommendationSelectSchema.optional(),
  include: RecommendationIncludeSchema.optional(),
  where: RecommendationWhereInputSchema.optional(),
  orderBy: z.union([ RecommendationOrderByWithRelationInputSchema.array(),RecommendationOrderByWithRelationInputSchema ]).optional(),
  cursor: RecommendationWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ RecommendationScalarFieldEnumSchema,RecommendationScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const RecommendationAggregateArgsSchema: z.ZodType<Prisma.RecommendationAggregateArgs> = z.object({
  where: RecommendationWhereInputSchema.optional(),
  orderBy: z.union([ RecommendationOrderByWithRelationInputSchema.array(),RecommendationOrderByWithRelationInputSchema ]).optional(),
  cursor: RecommendationWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const RecommendationGroupByArgsSchema: z.ZodType<Prisma.RecommendationGroupByArgs> = z.object({
  where: RecommendationWhereInputSchema.optional(),
  orderBy: z.union([ RecommendationOrderByWithAggregationInputSchema.array(),RecommendationOrderByWithAggregationInputSchema ]).optional(),
  by: RecommendationScalarFieldEnumSchema.array(),
  having: RecommendationScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const RecommendationFindUniqueArgsSchema: z.ZodType<Prisma.RecommendationFindUniqueArgs> = z.object({
  select: RecommendationSelectSchema.optional(),
  include: RecommendationIncludeSchema.optional(),
  where: RecommendationWhereUniqueInputSchema,
}).strict() ;

export const RecommendationFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.RecommendationFindUniqueOrThrowArgs> = z.object({
  select: RecommendationSelectSchema.optional(),
  include: RecommendationIncludeSchema.optional(),
  where: RecommendationWhereUniqueInputSchema,
}).strict() ;

export const RecommendationItemFindFirstArgsSchema: z.ZodType<Prisma.RecommendationItemFindFirstArgs> = z.object({
  select: RecommendationItemSelectSchema.optional(),
  include: RecommendationItemIncludeSchema.optional(),
  where: RecommendationItemWhereInputSchema.optional(),
  orderBy: z.union([ RecommendationItemOrderByWithRelationInputSchema.array(),RecommendationItemOrderByWithRelationInputSchema ]).optional(),
  cursor: RecommendationItemWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ RecommendationItemScalarFieldEnumSchema,RecommendationItemScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const RecommendationItemFindFirstOrThrowArgsSchema: z.ZodType<Prisma.RecommendationItemFindFirstOrThrowArgs> = z.object({
  select: RecommendationItemSelectSchema.optional(),
  include: RecommendationItemIncludeSchema.optional(),
  where: RecommendationItemWhereInputSchema.optional(),
  orderBy: z.union([ RecommendationItemOrderByWithRelationInputSchema.array(),RecommendationItemOrderByWithRelationInputSchema ]).optional(),
  cursor: RecommendationItemWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ RecommendationItemScalarFieldEnumSchema,RecommendationItemScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const RecommendationItemFindManyArgsSchema: z.ZodType<Prisma.RecommendationItemFindManyArgs> = z.object({
  select: RecommendationItemSelectSchema.optional(),
  include: RecommendationItemIncludeSchema.optional(),
  where: RecommendationItemWhereInputSchema.optional(),
  orderBy: z.union([ RecommendationItemOrderByWithRelationInputSchema.array(),RecommendationItemOrderByWithRelationInputSchema ]).optional(),
  cursor: RecommendationItemWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ RecommendationItemScalarFieldEnumSchema,RecommendationItemScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const RecommendationItemAggregateArgsSchema: z.ZodType<Prisma.RecommendationItemAggregateArgs> = z.object({
  where: RecommendationItemWhereInputSchema.optional(),
  orderBy: z.union([ RecommendationItemOrderByWithRelationInputSchema.array(),RecommendationItemOrderByWithRelationInputSchema ]).optional(),
  cursor: RecommendationItemWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const RecommendationItemGroupByArgsSchema: z.ZodType<Prisma.RecommendationItemGroupByArgs> = z.object({
  where: RecommendationItemWhereInputSchema.optional(),
  orderBy: z.union([ RecommendationItemOrderByWithAggregationInputSchema.array(),RecommendationItemOrderByWithAggregationInputSchema ]).optional(),
  by: RecommendationItemScalarFieldEnumSchema.array(),
  having: RecommendationItemScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const RecommendationItemFindUniqueArgsSchema: z.ZodType<Prisma.RecommendationItemFindUniqueArgs> = z.object({
  select: RecommendationItemSelectSchema.optional(),
  include: RecommendationItemIncludeSchema.optional(),
  where: RecommendationItemWhereUniqueInputSchema,
}).strict() ;

export const RecommendationItemFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.RecommendationItemFindUniqueOrThrowArgs> = z.object({
  select: RecommendationItemSelectSchema.optional(),
  include: RecommendationItemIncludeSchema.optional(),
  where: RecommendationItemWhereUniqueInputSchema,
}).strict() ;

export const WholesaleProductFindFirstArgsSchema: z.ZodType<Prisma.WholesaleProductFindFirstArgs> = z.object({
  select: WholesaleProductSelectSchema.optional(),
  include: WholesaleProductIncludeSchema.optional(),
  where: WholesaleProductWhereInputSchema.optional(),
  orderBy: z.union([ WholesaleProductOrderByWithRelationInputSchema.array(),WholesaleProductOrderByWithRelationInputSchema ]).optional(),
  cursor: WholesaleProductWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ WholesaleProductScalarFieldEnumSchema,WholesaleProductScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const WholesaleProductFindFirstOrThrowArgsSchema: z.ZodType<Prisma.WholesaleProductFindFirstOrThrowArgs> = z.object({
  select: WholesaleProductSelectSchema.optional(),
  include: WholesaleProductIncludeSchema.optional(),
  where: WholesaleProductWhereInputSchema.optional(),
  orderBy: z.union([ WholesaleProductOrderByWithRelationInputSchema.array(),WholesaleProductOrderByWithRelationInputSchema ]).optional(),
  cursor: WholesaleProductWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ WholesaleProductScalarFieldEnumSchema,WholesaleProductScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const WholesaleProductFindManyArgsSchema: z.ZodType<Prisma.WholesaleProductFindManyArgs> = z.object({
  select: WholesaleProductSelectSchema.optional(),
  include: WholesaleProductIncludeSchema.optional(),
  where: WholesaleProductWhereInputSchema.optional(),
  orderBy: z.union([ WholesaleProductOrderByWithRelationInputSchema.array(),WholesaleProductOrderByWithRelationInputSchema ]).optional(),
  cursor: WholesaleProductWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ WholesaleProductScalarFieldEnumSchema,WholesaleProductScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const WholesaleProductAggregateArgsSchema: z.ZodType<Prisma.WholesaleProductAggregateArgs> = z.object({
  where: WholesaleProductWhereInputSchema.optional(),
  orderBy: z.union([ WholesaleProductOrderByWithRelationInputSchema.array(),WholesaleProductOrderByWithRelationInputSchema ]).optional(),
  cursor: WholesaleProductWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const WholesaleProductGroupByArgsSchema: z.ZodType<Prisma.WholesaleProductGroupByArgs> = z.object({
  where: WholesaleProductWhereInputSchema.optional(),
  orderBy: z.union([ WholesaleProductOrderByWithAggregationInputSchema.array(),WholesaleProductOrderByWithAggregationInputSchema ]).optional(),
  by: WholesaleProductScalarFieldEnumSchema.array(),
  having: WholesaleProductScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const WholesaleProductFindUniqueArgsSchema: z.ZodType<Prisma.WholesaleProductFindUniqueArgs> = z.object({
  select: WholesaleProductSelectSchema.optional(),
  include: WholesaleProductIncludeSchema.optional(),
  where: WholesaleProductWhereUniqueInputSchema,
}).strict() ;

export const WholesaleProductFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.WholesaleProductFindUniqueOrThrowArgs> = z.object({
  select: WholesaleProductSelectSchema.optional(),
  include: WholesaleProductIncludeSchema.optional(),
  where: WholesaleProductWhereUniqueInputSchema,
}).strict() ;

export const WholesaleGroupFindFirstArgsSchema: z.ZodType<Prisma.WholesaleGroupFindFirstArgs> = z.object({
  select: WholesaleGroupSelectSchema.optional(),
  include: WholesaleGroupIncludeSchema.optional(),
  where: WholesaleGroupWhereInputSchema.optional(),
  orderBy: z.union([ WholesaleGroupOrderByWithRelationInputSchema.array(),WholesaleGroupOrderByWithRelationInputSchema ]).optional(),
  cursor: WholesaleGroupWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ WholesaleGroupScalarFieldEnumSchema,WholesaleGroupScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const WholesaleGroupFindFirstOrThrowArgsSchema: z.ZodType<Prisma.WholesaleGroupFindFirstOrThrowArgs> = z.object({
  select: WholesaleGroupSelectSchema.optional(),
  include: WholesaleGroupIncludeSchema.optional(),
  where: WholesaleGroupWhereInputSchema.optional(),
  orderBy: z.union([ WholesaleGroupOrderByWithRelationInputSchema.array(),WholesaleGroupOrderByWithRelationInputSchema ]).optional(),
  cursor: WholesaleGroupWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ WholesaleGroupScalarFieldEnumSchema,WholesaleGroupScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const WholesaleGroupFindManyArgsSchema: z.ZodType<Prisma.WholesaleGroupFindManyArgs> = z.object({
  select: WholesaleGroupSelectSchema.optional(),
  include: WholesaleGroupIncludeSchema.optional(),
  where: WholesaleGroupWhereInputSchema.optional(),
  orderBy: z.union([ WholesaleGroupOrderByWithRelationInputSchema.array(),WholesaleGroupOrderByWithRelationInputSchema ]).optional(),
  cursor: WholesaleGroupWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ WholesaleGroupScalarFieldEnumSchema,WholesaleGroupScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const WholesaleGroupAggregateArgsSchema: z.ZodType<Prisma.WholesaleGroupAggregateArgs> = z.object({
  where: WholesaleGroupWhereInputSchema.optional(),
  orderBy: z.union([ WholesaleGroupOrderByWithRelationInputSchema.array(),WholesaleGroupOrderByWithRelationInputSchema ]).optional(),
  cursor: WholesaleGroupWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const WholesaleGroupGroupByArgsSchema: z.ZodType<Prisma.WholesaleGroupGroupByArgs> = z.object({
  where: WholesaleGroupWhereInputSchema.optional(),
  orderBy: z.union([ WholesaleGroupOrderByWithAggregationInputSchema.array(),WholesaleGroupOrderByWithAggregationInputSchema ]).optional(),
  by: WholesaleGroupScalarFieldEnumSchema.array(),
  having: WholesaleGroupScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const WholesaleGroupFindUniqueArgsSchema: z.ZodType<Prisma.WholesaleGroupFindUniqueArgs> = z.object({
  select: WholesaleGroupSelectSchema.optional(),
  include: WholesaleGroupIncludeSchema.optional(),
  where: WholesaleGroupWhereUniqueInputSchema,
}).strict() ;

export const WholesaleGroupFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.WholesaleGroupFindUniqueOrThrowArgs> = z.object({
  select: WholesaleGroupSelectSchema.optional(),
  include: WholesaleGroupIncludeSchema.optional(),
  where: WholesaleGroupWhereUniqueInputSchema,
}).strict() ;

export const MarginFindFirstArgsSchema: z.ZodType<Prisma.MarginFindFirstArgs> = z.object({
  select: MarginSelectSchema.optional(),
  include: MarginIncludeSchema.optional(),
  where: MarginWhereInputSchema.optional(),
  orderBy: z.union([ MarginOrderByWithRelationInputSchema.array(),MarginOrderByWithRelationInputSchema ]).optional(),
  cursor: MarginWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ MarginScalarFieldEnumSchema,MarginScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const MarginFindFirstOrThrowArgsSchema: z.ZodType<Prisma.MarginFindFirstOrThrowArgs> = z.object({
  select: MarginSelectSchema.optional(),
  include: MarginIncludeSchema.optional(),
  where: MarginWhereInputSchema.optional(),
  orderBy: z.union([ MarginOrderByWithRelationInputSchema.array(),MarginOrderByWithRelationInputSchema ]).optional(),
  cursor: MarginWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ MarginScalarFieldEnumSchema,MarginScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const MarginFindManyArgsSchema: z.ZodType<Prisma.MarginFindManyArgs> = z.object({
  select: MarginSelectSchema.optional(),
  include: MarginIncludeSchema.optional(),
  where: MarginWhereInputSchema.optional(),
  orderBy: z.union([ MarginOrderByWithRelationInputSchema.array(),MarginOrderByWithRelationInputSchema ]).optional(),
  cursor: MarginWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ MarginScalarFieldEnumSchema,MarginScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const MarginAggregateArgsSchema: z.ZodType<Prisma.MarginAggregateArgs> = z.object({
  where: MarginWhereInputSchema.optional(),
  orderBy: z.union([ MarginOrderByWithRelationInputSchema.array(),MarginOrderByWithRelationInputSchema ]).optional(),
  cursor: MarginWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const MarginGroupByArgsSchema: z.ZodType<Prisma.MarginGroupByArgs> = z.object({
  where: MarginWhereInputSchema.optional(),
  orderBy: z.union([ MarginOrderByWithAggregationInputSchema.array(),MarginOrderByWithAggregationInputSchema ]).optional(),
  by: MarginScalarFieldEnumSchema.array(),
  having: MarginScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const MarginFindUniqueArgsSchema: z.ZodType<Prisma.MarginFindUniqueArgs> = z.object({
  select: MarginSelectSchema.optional(),
  include: MarginIncludeSchema.optional(),
  where: MarginWhereUniqueInputSchema,
}).strict() ;

export const MarginFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.MarginFindUniqueOrThrowArgs> = z.object({
  select: MarginSelectSchema.optional(),
  include: MarginIncludeSchema.optional(),
  where: MarginWhereUniqueInputSchema,
}).strict() ;

export const DetailPageFindFirstArgsSchema: z.ZodType<Prisma.DetailPageFindFirstArgs> = z.object({
  select: DetailPageSelectSchema.optional(),
  include: DetailPageIncludeSchema.optional(),
  where: DetailPageWhereInputSchema.optional(),
  orderBy: z.union([ DetailPageOrderByWithRelationInputSchema.array(),DetailPageOrderByWithRelationInputSchema ]).optional(),
  cursor: DetailPageWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ DetailPageScalarFieldEnumSchema,DetailPageScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const DetailPageFindFirstOrThrowArgsSchema: z.ZodType<Prisma.DetailPageFindFirstOrThrowArgs> = z.object({
  select: DetailPageSelectSchema.optional(),
  include: DetailPageIncludeSchema.optional(),
  where: DetailPageWhereInputSchema.optional(),
  orderBy: z.union([ DetailPageOrderByWithRelationInputSchema.array(),DetailPageOrderByWithRelationInputSchema ]).optional(),
  cursor: DetailPageWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ DetailPageScalarFieldEnumSchema,DetailPageScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const DetailPageFindManyArgsSchema: z.ZodType<Prisma.DetailPageFindManyArgs> = z.object({
  select: DetailPageSelectSchema.optional(),
  include: DetailPageIncludeSchema.optional(),
  where: DetailPageWhereInputSchema.optional(),
  orderBy: z.union([ DetailPageOrderByWithRelationInputSchema.array(),DetailPageOrderByWithRelationInputSchema ]).optional(),
  cursor: DetailPageWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ DetailPageScalarFieldEnumSchema,DetailPageScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const DetailPageAggregateArgsSchema: z.ZodType<Prisma.DetailPageAggregateArgs> = z.object({
  where: DetailPageWhereInputSchema.optional(),
  orderBy: z.union([ DetailPageOrderByWithRelationInputSchema.array(),DetailPageOrderByWithRelationInputSchema ]).optional(),
  cursor: DetailPageWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const DetailPageGroupByArgsSchema: z.ZodType<Prisma.DetailPageGroupByArgs> = z.object({
  where: DetailPageWhereInputSchema.optional(),
  orderBy: z.union([ DetailPageOrderByWithAggregationInputSchema.array(),DetailPageOrderByWithAggregationInputSchema ]).optional(),
  by: DetailPageScalarFieldEnumSchema.array(),
  having: DetailPageScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const DetailPageFindUniqueArgsSchema: z.ZodType<Prisma.DetailPageFindUniqueArgs> = z.object({
  select: DetailPageSelectSchema.optional(),
  include: DetailPageIncludeSchema.optional(),
  where: DetailPageWhereUniqueInputSchema,
}).strict() ;

export const DetailPageFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.DetailPageFindUniqueOrThrowArgs> = z.object({
  select: DetailPageSelectSchema.optional(),
  include: DetailPageIncludeSchema.optional(),
  where: DetailPageWhereUniqueInputSchema,
}).strict() ;

export const RegistrationFindFirstArgsSchema: z.ZodType<Prisma.RegistrationFindFirstArgs> = z.object({
  select: RegistrationSelectSchema.optional(),
  include: RegistrationIncludeSchema.optional(),
  where: RegistrationWhereInputSchema.optional(),
  orderBy: z.union([ RegistrationOrderByWithRelationInputSchema.array(),RegistrationOrderByWithRelationInputSchema ]).optional(),
  cursor: RegistrationWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ RegistrationScalarFieldEnumSchema,RegistrationScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const RegistrationFindFirstOrThrowArgsSchema: z.ZodType<Prisma.RegistrationFindFirstOrThrowArgs> = z.object({
  select: RegistrationSelectSchema.optional(),
  include: RegistrationIncludeSchema.optional(),
  where: RegistrationWhereInputSchema.optional(),
  orderBy: z.union([ RegistrationOrderByWithRelationInputSchema.array(),RegistrationOrderByWithRelationInputSchema ]).optional(),
  cursor: RegistrationWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ RegistrationScalarFieldEnumSchema,RegistrationScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const RegistrationFindManyArgsSchema: z.ZodType<Prisma.RegistrationFindManyArgs> = z.object({
  select: RegistrationSelectSchema.optional(),
  include: RegistrationIncludeSchema.optional(),
  where: RegistrationWhereInputSchema.optional(),
  orderBy: z.union([ RegistrationOrderByWithRelationInputSchema.array(),RegistrationOrderByWithRelationInputSchema ]).optional(),
  cursor: RegistrationWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ RegistrationScalarFieldEnumSchema,RegistrationScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const RegistrationAggregateArgsSchema: z.ZodType<Prisma.RegistrationAggregateArgs> = z.object({
  where: RegistrationWhereInputSchema.optional(),
  orderBy: z.union([ RegistrationOrderByWithRelationInputSchema.array(),RegistrationOrderByWithRelationInputSchema ]).optional(),
  cursor: RegistrationWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const RegistrationGroupByArgsSchema: z.ZodType<Prisma.RegistrationGroupByArgs> = z.object({
  where: RegistrationWhereInputSchema.optional(),
  orderBy: z.union([ RegistrationOrderByWithAggregationInputSchema.array(),RegistrationOrderByWithAggregationInputSchema ]).optional(),
  by: RegistrationScalarFieldEnumSchema.array(),
  having: RegistrationScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const RegistrationFindUniqueArgsSchema: z.ZodType<Prisma.RegistrationFindUniqueArgs> = z.object({
  select: RegistrationSelectSchema.optional(),
  include: RegistrationIncludeSchema.optional(),
  where: RegistrationWhereUniqueInputSchema,
}).strict() ;

export const RegistrationFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.RegistrationFindUniqueOrThrowArgs> = z.object({
  select: RegistrationSelectSchema.optional(),
  include: RegistrationIncludeSchema.optional(),
  where: RegistrationWhereUniqueInputSchema,
}).strict() ;

export const ActivityLogFindFirstArgsSchema: z.ZodType<Prisma.ActivityLogFindFirstArgs> = z.object({
  select: ActivityLogSelectSchema.optional(),
  where: ActivityLogWhereInputSchema.optional(),
  orderBy: z.union([ ActivityLogOrderByWithRelationInputSchema.array(),ActivityLogOrderByWithRelationInputSchema ]).optional(),
  cursor: ActivityLogWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ActivityLogScalarFieldEnumSchema,ActivityLogScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const ActivityLogFindFirstOrThrowArgsSchema: z.ZodType<Prisma.ActivityLogFindFirstOrThrowArgs> = z.object({
  select: ActivityLogSelectSchema.optional(),
  where: ActivityLogWhereInputSchema.optional(),
  orderBy: z.union([ ActivityLogOrderByWithRelationInputSchema.array(),ActivityLogOrderByWithRelationInputSchema ]).optional(),
  cursor: ActivityLogWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ActivityLogScalarFieldEnumSchema,ActivityLogScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const ActivityLogFindManyArgsSchema: z.ZodType<Prisma.ActivityLogFindManyArgs> = z.object({
  select: ActivityLogSelectSchema.optional(),
  where: ActivityLogWhereInputSchema.optional(),
  orderBy: z.union([ ActivityLogOrderByWithRelationInputSchema.array(),ActivityLogOrderByWithRelationInputSchema ]).optional(),
  cursor: ActivityLogWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ActivityLogScalarFieldEnumSchema,ActivityLogScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const ActivityLogAggregateArgsSchema: z.ZodType<Prisma.ActivityLogAggregateArgs> = z.object({
  where: ActivityLogWhereInputSchema.optional(),
  orderBy: z.union([ ActivityLogOrderByWithRelationInputSchema.array(),ActivityLogOrderByWithRelationInputSchema ]).optional(),
  cursor: ActivityLogWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const ActivityLogGroupByArgsSchema: z.ZodType<Prisma.ActivityLogGroupByArgs> = z.object({
  where: ActivityLogWhereInputSchema.optional(),
  orderBy: z.union([ ActivityLogOrderByWithAggregationInputSchema.array(),ActivityLogOrderByWithAggregationInputSchema ]).optional(),
  by: ActivityLogScalarFieldEnumSchema.array(),
  having: ActivityLogScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const ActivityLogFindUniqueArgsSchema: z.ZodType<Prisma.ActivityLogFindUniqueArgs> = z.object({
  select: ActivityLogSelectSchema.optional(),
  where: ActivityLogWhereUniqueInputSchema,
}).strict() ;

export const ActivityLogFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.ActivityLogFindUniqueOrThrowArgs> = z.object({
  select: ActivityLogSelectSchema.optional(),
  where: ActivityLogWhereUniqueInputSchema,
}).strict() ;

export const DailyStatFindFirstArgsSchema: z.ZodType<Prisma.DailyStatFindFirstArgs> = z.object({
  select: DailyStatSelectSchema.optional(),
  where: DailyStatWhereInputSchema.optional(),
  orderBy: z.union([ DailyStatOrderByWithRelationInputSchema.array(),DailyStatOrderByWithRelationInputSchema ]).optional(),
  cursor: DailyStatWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ DailyStatScalarFieldEnumSchema,DailyStatScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const DailyStatFindFirstOrThrowArgsSchema: z.ZodType<Prisma.DailyStatFindFirstOrThrowArgs> = z.object({
  select: DailyStatSelectSchema.optional(),
  where: DailyStatWhereInputSchema.optional(),
  orderBy: z.union([ DailyStatOrderByWithRelationInputSchema.array(),DailyStatOrderByWithRelationInputSchema ]).optional(),
  cursor: DailyStatWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ DailyStatScalarFieldEnumSchema,DailyStatScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const DailyStatFindManyArgsSchema: z.ZodType<Prisma.DailyStatFindManyArgs> = z.object({
  select: DailyStatSelectSchema.optional(),
  where: DailyStatWhereInputSchema.optional(),
  orderBy: z.union([ DailyStatOrderByWithRelationInputSchema.array(),DailyStatOrderByWithRelationInputSchema ]).optional(),
  cursor: DailyStatWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ DailyStatScalarFieldEnumSchema,DailyStatScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const DailyStatAggregateArgsSchema: z.ZodType<Prisma.DailyStatAggregateArgs> = z.object({
  where: DailyStatWhereInputSchema.optional(),
  orderBy: z.union([ DailyStatOrderByWithRelationInputSchema.array(),DailyStatOrderByWithRelationInputSchema ]).optional(),
  cursor: DailyStatWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const DailyStatGroupByArgsSchema: z.ZodType<Prisma.DailyStatGroupByArgs> = z.object({
  where: DailyStatWhereInputSchema.optional(),
  orderBy: z.union([ DailyStatOrderByWithAggregationInputSchema.array(),DailyStatOrderByWithAggregationInputSchema ]).optional(),
  by: DailyStatScalarFieldEnumSchema.array(),
  having: DailyStatScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const DailyStatFindUniqueArgsSchema: z.ZodType<Prisma.DailyStatFindUniqueArgs> = z.object({
  select: DailyStatSelectSchema.optional(),
  where: DailyStatWhereUniqueInputSchema,
}).strict() ;

export const DailyStatFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.DailyStatFindUniqueOrThrowArgs> = z.object({
  select: DailyStatSelectSchema.optional(),
  where: DailyStatWhereUniqueInputSchema,
}).strict() ;

export const UserCreateArgsSchema: z.ZodType<Prisma.UserCreateArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  data: z.union([ UserCreateInputSchema,UserUncheckedCreateInputSchema ]),
}).strict() ;

export const UserUpsertArgsSchema: z.ZodType<Prisma.UserUpsertArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema,
  create: z.union([ UserCreateInputSchema,UserUncheckedCreateInputSchema ]),
  update: z.union([ UserUpdateInputSchema,UserUncheckedUpdateInputSchema ]),
}).strict() ;

export const UserCreateManyArgsSchema: z.ZodType<Prisma.UserCreateManyArgs> = z.object({
  data: z.union([ UserCreateManyInputSchema,UserCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const UserCreateManyAndReturnArgsSchema: z.ZodType<Prisma.UserCreateManyAndReturnArgs> = z.object({
  data: z.union([ UserCreateManyInputSchema,UserCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const UserDeleteArgsSchema: z.ZodType<Prisma.UserDeleteArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema,
}).strict() ;

export const UserUpdateArgsSchema: z.ZodType<Prisma.UserUpdateArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  data: z.union([ UserUpdateInputSchema,UserUncheckedUpdateInputSchema ]),
  where: UserWhereUniqueInputSchema,
}).strict() ;

export const UserUpdateManyArgsSchema: z.ZodType<Prisma.UserUpdateManyArgs> = z.object({
  data: z.union([ UserUpdateManyMutationInputSchema,UserUncheckedUpdateManyInputSchema ]),
  where: UserWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const UserUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.UserUpdateManyAndReturnArgs> = z.object({
  data: z.union([ UserUpdateManyMutationInputSchema,UserUncheckedUpdateManyInputSchema ]),
  where: UserWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const UserDeleteManyArgsSchema: z.ZodType<Prisma.UserDeleteManyArgs> = z.object({
  where: UserWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const SubscriptionCreateArgsSchema: z.ZodType<Prisma.SubscriptionCreateArgs> = z.object({
  select: SubscriptionSelectSchema.optional(),
  include: SubscriptionIncludeSchema.optional(),
  data: z.union([ SubscriptionCreateInputSchema,SubscriptionUncheckedCreateInputSchema ]),
}).strict() ;

export const SubscriptionUpsertArgsSchema: z.ZodType<Prisma.SubscriptionUpsertArgs> = z.object({
  select: SubscriptionSelectSchema.optional(),
  include: SubscriptionIncludeSchema.optional(),
  where: SubscriptionWhereUniqueInputSchema,
  create: z.union([ SubscriptionCreateInputSchema,SubscriptionUncheckedCreateInputSchema ]),
  update: z.union([ SubscriptionUpdateInputSchema,SubscriptionUncheckedUpdateInputSchema ]),
}).strict() ;

export const SubscriptionCreateManyArgsSchema: z.ZodType<Prisma.SubscriptionCreateManyArgs> = z.object({
  data: z.union([ SubscriptionCreateManyInputSchema,SubscriptionCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const SubscriptionCreateManyAndReturnArgsSchema: z.ZodType<Prisma.SubscriptionCreateManyAndReturnArgs> = z.object({
  data: z.union([ SubscriptionCreateManyInputSchema,SubscriptionCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const SubscriptionDeleteArgsSchema: z.ZodType<Prisma.SubscriptionDeleteArgs> = z.object({
  select: SubscriptionSelectSchema.optional(),
  include: SubscriptionIncludeSchema.optional(),
  where: SubscriptionWhereUniqueInputSchema,
}).strict() ;

export const SubscriptionUpdateArgsSchema: z.ZodType<Prisma.SubscriptionUpdateArgs> = z.object({
  select: SubscriptionSelectSchema.optional(),
  include: SubscriptionIncludeSchema.optional(),
  data: z.union([ SubscriptionUpdateInputSchema,SubscriptionUncheckedUpdateInputSchema ]),
  where: SubscriptionWhereUniqueInputSchema,
}).strict() ;

export const SubscriptionUpdateManyArgsSchema: z.ZodType<Prisma.SubscriptionUpdateManyArgs> = z.object({
  data: z.union([ SubscriptionUpdateManyMutationInputSchema,SubscriptionUncheckedUpdateManyInputSchema ]),
  where: SubscriptionWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const SubscriptionUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.SubscriptionUpdateManyAndReturnArgs> = z.object({
  data: z.union([ SubscriptionUpdateManyMutationInputSchema,SubscriptionUncheckedUpdateManyInputSchema ]),
  where: SubscriptionWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const SubscriptionDeleteManyArgsSchema: z.ZodType<Prisma.SubscriptionDeleteManyArgs> = z.object({
  where: SubscriptionWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const PlanCreateArgsSchema: z.ZodType<Prisma.PlanCreateArgs> = z.object({
  select: PlanSelectSchema.optional(),
  include: PlanIncludeSchema.optional(),
  data: z.union([ PlanCreateInputSchema,PlanUncheckedCreateInputSchema ]),
}).strict() ;

export const PlanUpsertArgsSchema: z.ZodType<Prisma.PlanUpsertArgs> = z.object({
  select: PlanSelectSchema.optional(),
  include: PlanIncludeSchema.optional(),
  where: PlanWhereUniqueInputSchema,
  create: z.union([ PlanCreateInputSchema,PlanUncheckedCreateInputSchema ]),
  update: z.union([ PlanUpdateInputSchema,PlanUncheckedUpdateInputSchema ]),
}).strict() ;

export const PlanCreateManyArgsSchema: z.ZodType<Prisma.PlanCreateManyArgs> = z.object({
  data: z.union([ PlanCreateManyInputSchema,PlanCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const PlanCreateManyAndReturnArgsSchema: z.ZodType<Prisma.PlanCreateManyAndReturnArgs> = z.object({
  data: z.union([ PlanCreateManyInputSchema,PlanCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const PlanDeleteArgsSchema: z.ZodType<Prisma.PlanDeleteArgs> = z.object({
  select: PlanSelectSchema.optional(),
  include: PlanIncludeSchema.optional(),
  where: PlanWhereUniqueInputSchema,
}).strict() ;

export const PlanUpdateArgsSchema: z.ZodType<Prisma.PlanUpdateArgs> = z.object({
  select: PlanSelectSchema.optional(),
  include: PlanIncludeSchema.optional(),
  data: z.union([ PlanUpdateInputSchema,PlanUncheckedUpdateInputSchema ]),
  where: PlanWhereUniqueInputSchema,
}).strict() ;

export const PlanUpdateManyArgsSchema: z.ZodType<Prisma.PlanUpdateManyArgs> = z.object({
  data: z.union([ PlanUpdateManyMutationInputSchema,PlanUncheckedUpdateManyInputSchema ]),
  where: PlanWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const PlanUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.PlanUpdateManyAndReturnArgs> = z.object({
  data: z.union([ PlanUpdateManyMutationInputSchema,PlanUncheckedUpdateManyInputSchema ]),
  where: PlanWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const PlanDeleteManyArgsSchema: z.ZodType<Prisma.PlanDeleteManyArgs> = z.object({
  where: PlanWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const WebhookEventCreateArgsSchema: z.ZodType<Prisma.WebhookEventCreateArgs> = z.object({
  select: WebhookEventSelectSchema.optional(),
  data: z.union([ WebhookEventCreateInputSchema,WebhookEventUncheckedCreateInputSchema ]),
}).strict() ;

export const WebhookEventUpsertArgsSchema: z.ZodType<Prisma.WebhookEventUpsertArgs> = z.object({
  select: WebhookEventSelectSchema.optional(),
  where: WebhookEventWhereUniqueInputSchema,
  create: z.union([ WebhookEventCreateInputSchema,WebhookEventUncheckedCreateInputSchema ]),
  update: z.union([ WebhookEventUpdateInputSchema,WebhookEventUncheckedUpdateInputSchema ]),
}).strict() ;

export const WebhookEventCreateManyArgsSchema: z.ZodType<Prisma.WebhookEventCreateManyArgs> = z.object({
  data: z.union([ WebhookEventCreateManyInputSchema,WebhookEventCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const WebhookEventCreateManyAndReturnArgsSchema: z.ZodType<Prisma.WebhookEventCreateManyAndReturnArgs> = z.object({
  data: z.union([ WebhookEventCreateManyInputSchema,WebhookEventCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const WebhookEventDeleteArgsSchema: z.ZodType<Prisma.WebhookEventDeleteArgs> = z.object({
  select: WebhookEventSelectSchema.optional(),
  where: WebhookEventWhereUniqueInputSchema,
}).strict() ;

export const WebhookEventUpdateArgsSchema: z.ZodType<Prisma.WebhookEventUpdateArgs> = z.object({
  select: WebhookEventSelectSchema.optional(),
  data: z.union([ WebhookEventUpdateInputSchema,WebhookEventUncheckedUpdateInputSchema ]),
  where: WebhookEventWhereUniqueInputSchema,
}).strict() ;

export const WebhookEventUpdateManyArgsSchema: z.ZodType<Prisma.WebhookEventUpdateManyArgs> = z.object({
  data: z.union([ WebhookEventUpdateManyMutationInputSchema,WebhookEventUncheckedUpdateManyInputSchema ]),
  where: WebhookEventWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const WebhookEventUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.WebhookEventUpdateManyAndReturnArgs> = z.object({
  data: z.union([ WebhookEventUpdateManyMutationInputSchema,WebhookEventUncheckedUpdateManyInputSchema ]),
  where: WebhookEventWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const WebhookEventDeleteManyArgsSchema: z.ZodType<Prisma.WebhookEventDeleteManyArgs> = z.object({
  where: WebhookEventWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const PaymentHistoryCreateArgsSchema: z.ZodType<Prisma.PaymentHistoryCreateArgs> = z.object({
  select: PaymentHistorySelectSchema.optional(),
  include: PaymentHistoryIncludeSchema.optional(),
  data: z.union([ PaymentHistoryCreateInputSchema,PaymentHistoryUncheckedCreateInputSchema ]),
}).strict() ;

export const PaymentHistoryUpsertArgsSchema: z.ZodType<Prisma.PaymentHistoryUpsertArgs> = z.object({
  select: PaymentHistorySelectSchema.optional(),
  include: PaymentHistoryIncludeSchema.optional(),
  where: PaymentHistoryWhereUniqueInputSchema,
  create: z.union([ PaymentHistoryCreateInputSchema,PaymentHistoryUncheckedCreateInputSchema ]),
  update: z.union([ PaymentHistoryUpdateInputSchema,PaymentHistoryUncheckedUpdateInputSchema ]),
}).strict() ;

export const PaymentHistoryCreateManyArgsSchema: z.ZodType<Prisma.PaymentHistoryCreateManyArgs> = z.object({
  data: z.union([ PaymentHistoryCreateManyInputSchema,PaymentHistoryCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const PaymentHistoryCreateManyAndReturnArgsSchema: z.ZodType<Prisma.PaymentHistoryCreateManyAndReturnArgs> = z.object({
  data: z.union([ PaymentHistoryCreateManyInputSchema,PaymentHistoryCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const PaymentHistoryDeleteArgsSchema: z.ZodType<Prisma.PaymentHistoryDeleteArgs> = z.object({
  select: PaymentHistorySelectSchema.optional(),
  include: PaymentHistoryIncludeSchema.optional(),
  where: PaymentHistoryWhereUniqueInputSchema,
}).strict() ;

export const PaymentHistoryUpdateArgsSchema: z.ZodType<Prisma.PaymentHistoryUpdateArgs> = z.object({
  select: PaymentHistorySelectSchema.optional(),
  include: PaymentHistoryIncludeSchema.optional(),
  data: z.union([ PaymentHistoryUpdateInputSchema,PaymentHistoryUncheckedUpdateInputSchema ]),
  where: PaymentHistoryWhereUniqueInputSchema,
}).strict() ;

export const PaymentHistoryUpdateManyArgsSchema: z.ZodType<Prisma.PaymentHistoryUpdateManyArgs> = z.object({
  data: z.union([ PaymentHistoryUpdateManyMutationInputSchema,PaymentHistoryUncheckedUpdateManyInputSchema ]),
  where: PaymentHistoryWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const PaymentHistoryUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.PaymentHistoryUpdateManyAndReturnArgs> = z.object({
  data: z.union([ PaymentHistoryUpdateManyMutationInputSchema,PaymentHistoryUncheckedUpdateManyInputSchema ]),
  where: PaymentHistoryWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const PaymentHistoryDeleteManyArgsSchema: z.ZodType<Prisma.PaymentHistoryDeleteManyArgs> = z.object({
  where: PaymentHistoryWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const ProductCreateArgsSchema: z.ZodType<Prisma.ProductCreateArgs> = z.object({
  select: ProductSelectSchema.optional(),
  include: ProductIncludeSchema.optional(),
  data: z.union([ ProductCreateInputSchema,ProductUncheckedCreateInputSchema ]),
}).strict() ;

export const ProductUpsertArgsSchema: z.ZodType<Prisma.ProductUpsertArgs> = z.object({
  select: ProductSelectSchema.optional(),
  include: ProductIncludeSchema.optional(),
  where: ProductWhereUniqueInputSchema,
  create: z.union([ ProductCreateInputSchema,ProductUncheckedCreateInputSchema ]),
  update: z.union([ ProductUpdateInputSchema,ProductUncheckedUpdateInputSchema ]),
}).strict() ;

export const ProductCreateManyArgsSchema: z.ZodType<Prisma.ProductCreateManyArgs> = z.object({
  data: z.union([ ProductCreateManyInputSchema,ProductCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const ProductCreateManyAndReturnArgsSchema: z.ZodType<Prisma.ProductCreateManyAndReturnArgs> = z.object({
  data: z.union([ ProductCreateManyInputSchema,ProductCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const ProductDeleteArgsSchema: z.ZodType<Prisma.ProductDeleteArgs> = z.object({
  select: ProductSelectSchema.optional(),
  include: ProductIncludeSchema.optional(),
  where: ProductWhereUniqueInputSchema,
}).strict() ;

export const ProductUpdateArgsSchema: z.ZodType<Prisma.ProductUpdateArgs> = z.object({
  select: ProductSelectSchema.optional(),
  include: ProductIncludeSchema.optional(),
  data: z.union([ ProductUpdateInputSchema,ProductUncheckedUpdateInputSchema ]),
  where: ProductWhereUniqueInputSchema,
}).strict() ;

export const ProductUpdateManyArgsSchema: z.ZodType<Prisma.ProductUpdateManyArgs> = z.object({
  data: z.union([ ProductUpdateManyMutationInputSchema,ProductUncheckedUpdateManyInputSchema ]),
  where: ProductWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const ProductUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.ProductUpdateManyAndReturnArgs> = z.object({
  data: z.union([ ProductUpdateManyMutationInputSchema,ProductUncheckedUpdateManyInputSchema ]),
  where: ProductWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const ProductDeleteManyArgsSchema: z.ZodType<Prisma.ProductDeleteManyArgs> = z.object({
  where: ProductWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const RecommendationCreateArgsSchema: z.ZodType<Prisma.RecommendationCreateArgs> = z.object({
  select: RecommendationSelectSchema.optional(),
  include: RecommendationIncludeSchema.optional(),
  data: z.union([ RecommendationCreateInputSchema,RecommendationUncheckedCreateInputSchema ]),
}).strict() ;

export const RecommendationUpsertArgsSchema: z.ZodType<Prisma.RecommendationUpsertArgs> = z.object({
  select: RecommendationSelectSchema.optional(),
  include: RecommendationIncludeSchema.optional(),
  where: RecommendationWhereUniqueInputSchema,
  create: z.union([ RecommendationCreateInputSchema,RecommendationUncheckedCreateInputSchema ]),
  update: z.union([ RecommendationUpdateInputSchema,RecommendationUncheckedUpdateInputSchema ]),
}).strict() ;

export const RecommendationCreateManyArgsSchema: z.ZodType<Prisma.RecommendationCreateManyArgs> = z.object({
  data: z.union([ RecommendationCreateManyInputSchema,RecommendationCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const RecommendationCreateManyAndReturnArgsSchema: z.ZodType<Prisma.RecommendationCreateManyAndReturnArgs> = z.object({
  data: z.union([ RecommendationCreateManyInputSchema,RecommendationCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const RecommendationDeleteArgsSchema: z.ZodType<Prisma.RecommendationDeleteArgs> = z.object({
  select: RecommendationSelectSchema.optional(),
  include: RecommendationIncludeSchema.optional(),
  where: RecommendationWhereUniqueInputSchema,
}).strict() ;

export const RecommendationUpdateArgsSchema: z.ZodType<Prisma.RecommendationUpdateArgs> = z.object({
  select: RecommendationSelectSchema.optional(),
  include: RecommendationIncludeSchema.optional(),
  data: z.union([ RecommendationUpdateInputSchema,RecommendationUncheckedUpdateInputSchema ]),
  where: RecommendationWhereUniqueInputSchema,
}).strict() ;

export const RecommendationUpdateManyArgsSchema: z.ZodType<Prisma.RecommendationUpdateManyArgs> = z.object({
  data: z.union([ RecommendationUpdateManyMutationInputSchema,RecommendationUncheckedUpdateManyInputSchema ]),
  where: RecommendationWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const RecommendationUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.RecommendationUpdateManyAndReturnArgs> = z.object({
  data: z.union([ RecommendationUpdateManyMutationInputSchema,RecommendationUncheckedUpdateManyInputSchema ]),
  where: RecommendationWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const RecommendationDeleteManyArgsSchema: z.ZodType<Prisma.RecommendationDeleteManyArgs> = z.object({
  where: RecommendationWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const RecommendationItemCreateArgsSchema: z.ZodType<Prisma.RecommendationItemCreateArgs> = z.object({
  select: RecommendationItemSelectSchema.optional(),
  include: RecommendationItemIncludeSchema.optional(),
  data: z.union([ RecommendationItemCreateInputSchema,RecommendationItemUncheckedCreateInputSchema ]),
}).strict() ;

export const RecommendationItemUpsertArgsSchema: z.ZodType<Prisma.RecommendationItemUpsertArgs> = z.object({
  select: RecommendationItemSelectSchema.optional(),
  include: RecommendationItemIncludeSchema.optional(),
  where: RecommendationItemWhereUniqueInputSchema,
  create: z.union([ RecommendationItemCreateInputSchema,RecommendationItemUncheckedCreateInputSchema ]),
  update: z.union([ RecommendationItemUpdateInputSchema,RecommendationItemUncheckedUpdateInputSchema ]),
}).strict() ;

export const RecommendationItemCreateManyArgsSchema: z.ZodType<Prisma.RecommendationItemCreateManyArgs> = z.object({
  data: z.union([ RecommendationItemCreateManyInputSchema,RecommendationItemCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const RecommendationItemCreateManyAndReturnArgsSchema: z.ZodType<Prisma.RecommendationItemCreateManyAndReturnArgs> = z.object({
  data: z.union([ RecommendationItemCreateManyInputSchema,RecommendationItemCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const RecommendationItemDeleteArgsSchema: z.ZodType<Prisma.RecommendationItemDeleteArgs> = z.object({
  select: RecommendationItemSelectSchema.optional(),
  include: RecommendationItemIncludeSchema.optional(),
  where: RecommendationItemWhereUniqueInputSchema,
}).strict() ;

export const RecommendationItemUpdateArgsSchema: z.ZodType<Prisma.RecommendationItemUpdateArgs> = z.object({
  select: RecommendationItemSelectSchema.optional(),
  include: RecommendationItemIncludeSchema.optional(),
  data: z.union([ RecommendationItemUpdateInputSchema,RecommendationItemUncheckedUpdateInputSchema ]),
  where: RecommendationItemWhereUniqueInputSchema,
}).strict() ;

export const RecommendationItemUpdateManyArgsSchema: z.ZodType<Prisma.RecommendationItemUpdateManyArgs> = z.object({
  data: z.union([ RecommendationItemUpdateManyMutationInputSchema,RecommendationItemUncheckedUpdateManyInputSchema ]),
  where: RecommendationItemWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const RecommendationItemUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.RecommendationItemUpdateManyAndReturnArgs> = z.object({
  data: z.union([ RecommendationItemUpdateManyMutationInputSchema,RecommendationItemUncheckedUpdateManyInputSchema ]),
  where: RecommendationItemWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const RecommendationItemDeleteManyArgsSchema: z.ZodType<Prisma.RecommendationItemDeleteManyArgs> = z.object({
  where: RecommendationItemWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const WholesaleProductCreateArgsSchema: z.ZodType<Prisma.WholesaleProductCreateArgs> = z.object({
  select: WholesaleProductSelectSchema.optional(),
  include: WholesaleProductIncludeSchema.optional(),
  data: z.union([ WholesaleProductCreateInputSchema,WholesaleProductUncheckedCreateInputSchema ]),
}).strict() ;

export const WholesaleProductUpsertArgsSchema: z.ZodType<Prisma.WholesaleProductUpsertArgs> = z.object({
  select: WholesaleProductSelectSchema.optional(),
  include: WholesaleProductIncludeSchema.optional(),
  where: WholesaleProductWhereUniqueInputSchema,
  create: z.union([ WholesaleProductCreateInputSchema,WholesaleProductUncheckedCreateInputSchema ]),
  update: z.union([ WholesaleProductUpdateInputSchema,WholesaleProductUncheckedUpdateInputSchema ]),
}).strict() ;

export const WholesaleProductCreateManyArgsSchema: z.ZodType<Prisma.WholesaleProductCreateManyArgs> = z.object({
  data: z.union([ WholesaleProductCreateManyInputSchema,WholesaleProductCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const WholesaleProductCreateManyAndReturnArgsSchema: z.ZodType<Prisma.WholesaleProductCreateManyAndReturnArgs> = z.object({
  data: z.union([ WholesaleProductCreateManyInputSchema,WholesaleProductCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const WholesaleProductDeleteArgsSchema: z.ZodType<Prisma.WholesaleProductDeleteArgs> = z.object({
  select: WholesaleProductSelectSchema.optional(),
  include: WholesaleProductIncludeSchema.optional(),
  where: WholesaleProductWhereUniqueInputSchema,
}).strict() ;

export const WholesaleProductUpdateArgsSchema: z.ZodType<Prisma.WholesaleProductUpdateArgs> = z.object({
  select: WholesaleProductSelectSchema.optional(),
  include: WholesaleProductIncludeSchema.optional(),
  data: z.union([ WholesaleProductUpdateInputSchema,WholesaleProductUncheckedUpdateInputSchema ]),
  where: WholesaleProductWhereUniqueInputSchema,
}).strict() ;

export const WholesaleProductUpdateManyArgsSchema: z.ZodType<Prisma.WholesaleProductUpdateManyArgs> = z.object({
  data: z.union([ WholesaleProductUpdateManyMutationInputSchema,WholesaleProductUncheckedUpdateManyInputSchema ]),
  where: WholesaleProductWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const WholesaleProductUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.WholesaleProductUpdateManyAndReturnArgs> = z.object({
  data: z.union([ WholesaleProductUpdateManyMutationInputSchema,WholesaleProductUncheckedUpdateManyInputSchema ]),
  where: WholesaleProductWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const WholesaleProductDeleteManyArgsSchema: z.ZodType<Prisma.WholesaleProductDeleteManyArgs> = z.object({
  where: WholesaleProductWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const WholesaleGroupCreateArgsSchema: z.ZodType<Prisma.WholesaleGroupCreateArgs> = z.object({
  select: WholesaleGroupSelectSchema.optional(),
  include: WholesaleGroupIncludeSchema.optional(),
  data: z.union([ WholesaleGroupCreateInputSchema,WholesaleGroupUncheckedCreateInputSchema ]),
}).strict() ;

export const WholesaleGroupUpsertArgsSchema: z.ZodType<Prisma.WholesaleGroupUpsertArgs> = z.object({
  select: WholesaleGroupSelectSchema.optional(),
  include: WholesaleGroupIncludeSchema.optional(),
  where: WholesaleGroupWhereUniqueInputSchema,
  create: z.union([ WholesaleGroupCreateInputSchema,WholesaleGroupUncheckedCreateInputSchema ]),
  update: z.union([ WholesaleGroupUpdateInputSchema,WholesaleGroupUncheckedUpdateInputSchema ]),
}).strict() ;

export const WholesaleGroupCreateManyArgsSchema: z.ZodType<Prisma.WholesaleGroupCreateManyArgs> = z.object({
  data: z.union([ WholesaleGroupCreateManyInputSchema,WholesaleGroupCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const WholesaleGroupCreateManyAndReturnArgsSchema: z.ZodType<Prisma.WholesaleGroupCreateManyAndReturnArgs> = z.object({
  data: z.union([ WholesaleGroupCreateManyInputSchema,WholesaleGroupCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const WholesaleGroupDeleteArgsSchema: z.ZodType<Prisma.WholesaleGroupDeleteArgs> = z.object({
  select: WholesaleGroupSelectSchema.optional(),
  include: WholesaleGroupIncludeSchema.optional(),
  where: WholesaleGroupWhereUniqueInputSchema,
}).strict() ;

export const WholesaleGroupUpdateArgsSchema: z.ZodType<Prisma.WholesaleGroupUpdateArgs> = z.object({
  select: WholesaleGroupSelectSchema.optional(),
  include: WholesaleGroupIncludeSchema.optional(),
  data: z.union([ WholesaleGroupUpdateInputSchema,WholesaleGroupUncheckedUpdateInputSchema ]),
  where: WholesaleGroupWhereUniqueInputSchema,
}).strict() ;

export const WholesaleGroupUpdateManyArgsSchema: z.ZodType<Prisma.WholesaleGroupUpdateManyArgs> = z.object({
  data: z.union([ WholesaleGroupUpdateManyMutationInputSchema,WholesaleGroupUncheckedUpdateManyInputSchema ]),
  where: WholesaleGroupWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const WholesaleGroupUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.WholesaleGroupUpdateManyAndReturnArgs> = z.object({
  data: z.union([ WholesaleGroupUpdateManyMutationInputSchema,WholesaleGroupUncheckedUpdateManyInputSchema ]),
  where: WholesaleGroupWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const WholesaleGroupDeleteManyArgsSchema: z.ZodType<Prisma.WholesaleGroupDeleteManyArgs> = z.object({
  where: WholesaleGroupWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const MarginCreateArgsSchema: z.ZodType<Prisma.MarginCreateArgs> = z.object({
  select: MarginSelectSchema.optional(),
  include: MarginIncludeSchema.optional(),
  data: z.union([ MarginCreateInputSchema,MarginUncheckedCreateInputSchema ]),
}).strict() ;

export const MarginUpsertArgsSchema: z.ZodType<Prisma.MarginUpsertArgs> = z.object({
  select: MarginSelectSchema.optional(),
  include: MarginIncludeSchema.optional(),
  where: MarginWhereUniqueInputSchema,
  create: z.union([ MarginCreateInputSchema,MarginUncheckedCreateInputSchema ]),
  update: z.union([ MarginUpdateInputSchema,MarginUncheckedUpdateInputSchema ]),
}).strict() ;

export const MarginCreateManyArgsSchema: z.ZodType<Prisma.MarginCreateManyArgs> = z.object({
  data: z.union([ MarginCreateManyInputSchema,MarginCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const MarginCreateManyAndReturnArgsSchema: z.ZodType<Prisma.MarginCreateManyAndReturnArgs> = z.object({
  data: z.union([ MarginCreateManyInputSchema,MarginCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const MarginDeleteArgsSchema: z.ZodType<Prisma.MarginDeleteArgs> = z.object({
  select: MarginSelectSchema.optional(),
  include: MarginIncludeSchema.optional(),
  where: MarginWhereUniqueInputSchema,
}).strict() ;

export const MarginUpdateArgsSchema: z.ZodType<Prisma.MarginUpdateArgs> = z.object({
  select: MarginSelectSchema.optional(),
  include: MarginIncludeSchema.optional(),
  data: z.union([ MarginUpdateInputSchema,MarginUncheckedUpdateInputSchema ]),
  where: MarginWhereUniqueInputSchema,
}).strict() ;

export const MarginUpdateManyArgsSchema: z.ZodType<Prisma.MarginUpdateManyArgs> = z.object({
  data: z.union([ MarginUpdateManyMutationInputSchema,MarginUncheckedUpdateManyInputSchema ]),
  where: MarginWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const MarginUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.MarginUpdateManyAndReturnArgs> = z.object({
  data: z.union([ MarginUpdateManyMutationInputSchema,MarginUncheckedUpdateManyInputSchema ]),
  where: MarginWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const MarginDeleteManyArgsSchema: z.ZodType<Prisma.MarginDeleteManyArgs> = z.object({
  where: MarginWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const DetailPageCreateArgsSchema: z.ZodType<Prisma.DetailPageCreateArgs> = z.object({
  select: DetailPageSelectSchema.optional(),
  include: DetailPageIncludeSchema.optional(),
  data: z.union([ DetailPageCreateInputSchema,DetailPageUncheckedCreateInputSchema ]),
}).strict() ;

export const DetailPageUpsertArgsSchema: z.ZodType<Prisma.DetailPageUpsertArgs> = z.object({
  select: DetailPageSelectSchema.optional(),
  include: DetailPageIncludeSchema.optional(),
  where: DetailPageWhereUniqueInputSchema,
  create: z.union([ DetailPageCreateInputSchema,DetailPageUncheckedCreateInputSchema ]),
  update: z.union([ DetailPageUpdateInputSchema,DetailPageUncheckedUpdateInputSchema ]),
}).strict() ;

export const DetailPageCreateManyArgsSchema: z.ZodType<Prisma.DetailPageCreateManyArgs> = z.object({
  data: z.union([ DetailPageCreateManyInputSchema,DetailPageCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const DetailPageCreateManyAndReturnArgsSchema: z.ZodType<Prisma.DetailPageCreateManyAndReturnArgs> = z.object({
  data: z.union([ DetailPageCreateManyInputSchema,DetailPageCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const DetailPageDeleteArgsSchema: z.ZodType<Prisma.DetailPageDeleteArgs> = z.object({
  select: DetailPageSelectSchema.optional(),
  include: DetailPageIncludeSchema.optional(),
  where: DetailPageWhereUniqueInputSchema,
}).strict() ;

export const DetailPageUpdateArgsSchema: z.ZodType<Prisma.DetailPageUpdateArgs> = z.object({
  select: DetailPageSelectSchema.optional(),
  include: DetailPageIncludeSchema.optional(),
  data: z.union([ DetailPageUpdateInputSchema,DetailPageUncheckedUpdateInputSchema ]),
  where: DetailPageWhereUniqueInputSchema,
}).strict() ;

export const DetailPageUpdateManyArgsSchema: z.ZodType<Prisma.DetailPageUpdateManyArgs> = z.object({
  data: z.union([ DetailPageUpdateManyMutationInputSchema,DetailPageUncheckedUpdateManyInputSchema ]),
  where: DetailPageWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const DetailPageUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.DetailPageUpdateManyAndReturnArgs> = z.object({
  data: z.union([ DetailPageUpdateManyMutationInputSchema,DetailPageUncheckedUpdateManyInputSchema ]),
  where: DetailPageWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const DetailPageDeleteManyArgsSchema: z.ZodType<Prisma.DetailPageDeleteManyArgs> = z.object({
  where: DetailPageWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const RegistrationCreateArgsSchema: z.ZodType<Prisma.RegistrationCreateArgs> = z.object({
  select: RegistrationSelectSchema.optional(),
  include: RegistrationIncludeSchema.optional(),
  data: z.union([ RegistrationCreateInputSchema,RegistrationUncheckedCreateInputSchema ]),
}).strict() ;

export const RegistrationUpsertArgsSchema: z.ZodType<Prisma.RegistrationUpsertArgs> = z.object({
  select: RegistrationSelectSchema.optional(),
  include: RegistrationIncludeSchema.optional(),
  where: RegistrationWhereUniqueInputSchema,
  create: z.union([ RegistrationCreateInputSchema,RegistrationUncheckedCreateInputSchema ]),
  update: z.union([ RegistrationUpdateInputSchema,RegistrationUncheckedUpdateInputSchema ]),
}).strict() ;

export const RegistrationCreateManyArgsSchema: z.ZodType<Prisma.RegistrationCreateManyArgs> = z.object({
  data: z.union([ RegistrationCreateManyInputSchema,RegistrationCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const RegistrationCreateManyAndReturnArgsSchema: z.ZodType<Prisma.RegistrationCreateManyAndReturnArgs> = z.object({
  data: z.union([ RegistrationCreateManyInputSchema,RegistrationCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const RegistrationDeleteArgsSchema: z.ZodType<Prisma.RegistrationDeleteArgs> = z.object({
  select: RegistrationSelectSchema.optional(),
  include: RegistrationIncludeSchema.optional(),
  where: RegistrationWhereUniqueInputSchema,
}).strict() ;

export const RegistrationUpdateArgsSchema: z.ZodType<Prisma.RegistrationUpdateArgs> = z.object({
  select: RegistrationSelectSchema.optional(),
  include: RegistrationIncludeSchema.optional(),
  data: z.union([ RegistrationUpdateInputSchema,RegistrationUncheckedUpdateInputSchema ]),
  where: RegistrationWhereUniqueInputSchema,
}).strict() ;

export const RegistrationUpdateManyArgsSchema: z.ZodType<Prisma.RegistrationUpdateManyArgs> = z.object({
  data: z.union([ RegistrationUpdateManyMutationInputSchema,RegistrationUncheckedUpdateManyInputSchema ]),
  where: RegistrationWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const RegistrationUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.RegistrationUpdateManyAndReturnArgs> = z.object({
  data: z.union([ RegistrationUpdateManyMutationInputSchema,RegistrationUncheckedUpdateManyInputSchema ]),
  where: RegistrationWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const RegistrationDeleteManyArgsSchema: z.ZodType<Prisma.RegistrationDeleteManyArgs> = z.object({
  where: RegistrationWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const ActivityLogCreateArgsSchema: z.ZodType<Prisma.ActivityLogCreateArgs> = z.object({
  select: ActivityLogSelectSchema.optional(),
  data: z.union([ ActivityLogCreateInputSchema,ActivityLogUncheckedCreateInputSchema ]),
}).strict() ;

export const ActivityLogUpsertArgsSchema: z.ZodType<Prisma.ActivityLogUpsertArgs> = z.object({
  select: ActivityLogSelectSchema.optional(),
  where: ActivityLogWhereUniqueInputSchema,
  create: z.union([ ActivityLogCreateInputSchema,ActivityLogUncheckedCreateInputSchema ]),
  update: z.union([ ActivityLogUpdateInputSchema,ActivityLogUncheckedUpdateInputSchema ]),
}).strict() ;

export const ActivityLogCreateManyArgsSchema: z.ZodType<Prisma.ActivityLogCreateManyArgs> = z.object({
  data: z.union([ ActivityLogCreateManyInputSchema,ActivityLogCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const ActivityLogCreateManyAndReturnArgsSchema: z.ZodType<Prisma.ActivityLogCreateManyAndReturnArgs> = z.object({
  data: z.union([ ActivityLogCreateManyInputSchema,ActivityLogCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const ActivityLogDeleteArgsSchema: z.ZodType<Prisma.ActivityLogDeleteArgs> = z.object({
  select: ActivityLogSelectSchema.optional(),
  where: ActivityLogWhereUniqueInputSchema,
}).strict() ;

export const ActivityLogUpdateArgsSchema: z.ZodType<Prisma.ActivityLogUpdateArgs> = z.object({
  select: ActivityLogSelectSchema.optional(),
  data: z.union([ ActivityLogUpdateInputSchema,ActivityLogUncheckedUpdateInputSchema ]),
  where: ActivityLogWhereUniqueInputSchema,
}).strict() ;

export const ActivityLogUpdateManyArgsSchema: z.ZodType<Prisma.ActivityLogUpdateManyArgs> = z.object({
  data: z.union([ ActivityLogUpdateManyMutationInputSchema,ActivityLogUncheckedUpdateManyInputSchema ]),
  where: ActivityLogWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const ActivityLogUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.ActivityLogUpdateManyAndReturnArgs> = z.object({
  data: z.union([ ActivityLogUpdateManyMutationInputSchema,ActivityLogUncheckedUpdateManyInputSchema ]),
  where: ActivityLogWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const ActivityLogDeleteManyArgsSchema: z.ZodType<Prisma.ActivityLogDeleteManyArgs> = z.object({
  where: ActivityLogWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const DailyStatCreateArgsSchema: z.ZodType<Prisma.DailyStatCreateArgs> = z.object({
  select: DailyStatSelectSchema.optional(),
  data: z.union([ DailyStatCreateInputSchema,DailyStatUncheckedCreateInputSchema ]),
}).strict() ;

export const DailyStatUpsertArgsSchema: z.ZodType<Prisma.DailyStatUpsertArgs> = z.object({
  select: DailyStatSelectSchema.optional(),
  where: DailyStatWhereUniqueInputSchema,
  create: z.union([ DailyStatCreateInputSchema,DailyStatUncheckedCreateInputSchema ]),
  update: z.union([ DailyStatUpdateInputSchema,DailyStatUncheckedUpdateInputSchema ]),
}).strict() ;

export const DailyStatCreateManyArgsSchema: z.ZodType<Prisma.DailyStatCreateManyArgs> = z.object({
  data: z.union([ DailyStatCreateManyInputSchema,DailyStatCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const DailyStatCreateManyAndReturnArgsSchema: z.ZodType<Prisma.DailyStatCreateManyAndReturnArgs> = z.object({
  data: z.union([ DailyStatCreateManyInputSchema,DailyStatCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const DailyStatDeleteArgsSchema: z.ZodType<Prisma.DailyStatDeleteArgs> = z.object({
  select: DailyStatSelectSchema.optional(),
  where: DailyStatWhereUniqueInputSchema,
}).strict() ;

export const DailyStatUpdateArgsSchema: z.ZodType<Prisma.DailyStatUpdateArgs> = z.object({
  select: DailyStatSelectSchema.optional(),
  data: z.union([ DailyStatUpdateInputSchema,DailyStatUncheckedUpdateInputSchema ]),
  where: DailyStatWhereUniqueInputSchema,
}).strict() ;

export const DailyStatUpdateManyArgsSchema: z.ZodType<Prisma.DailyStatUpdateManyArgs> = z.object({
  data: z.union([ DailyStatUpdateManyMutationInputSchema,DailyStatUncheckedUpdateManyInputSchema ]),
  where: DailyStatWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const DailyStatUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.DailyStatUpdateManyAndReturnArgs> = z.object({
  data: z.union([ DailyStatUpdateManyMutationInputSchema,DailyStatUncheckedUpdateManyInputSchema ]),
  where: DailyStatWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const DailyStatDeleteManyArgsSchema: z.ZodType<Prisma.DailyStatDeleteManyArgs> = z.object({
  where: DailyStatWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;