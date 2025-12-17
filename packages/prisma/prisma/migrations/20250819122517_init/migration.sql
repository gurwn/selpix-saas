-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED', 'UNPAID', 'PAST_DUE');

-- CreateEnum
CREATE TYPE "public"."SubscriptionPaymentMethod" AS ENUM ('CARD', 'BANK_TRANSFER', 'PAYPAL');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('SUCCESS', 'FAILED', 'REFUNDED', 'PENDING');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "public"."SubscriptionStatus" NOT NULL,
    "lemonSqueezyId" TEXT NOT NULL,
    "lemonSubscriptionItemId" TEXT,
    "lemonCustomerId" TEXT NOT NULL,
    "lemonOrderId" TEXT NOT NULL,
    "lemonProductId" TEXT NOT NULL,
    "lemonVariantId" TEXT NOT NULL,
    "renewsAt" TIMESTAMPTZ(3),
    "endsAt" TIMESTAMPTZ(3),
    "paymentMethod" "public"."SubscriptionPaymentMethod" NOT NULL,
    "cardBrand" TEXT,
    "cardLast4" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Plan" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" JSONB,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "price" DECIMAL(12,2) NOT NULL,
    "lemonSqueezyProductId" TEXT NOT NULL,
    "lemonSqueezyVariantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WebhookEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "billingReason" TEXT NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL,
    "statusFormatted" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "currencyRate" TEXT NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "discountTotal" INTEGER NOT NULL,
    "tax" INTEGER NOT NULL,
    "taxInclusive" BOOLEAN NOT NULL,
    "total" INTEGER NOT NULL,
    "refundedAmount" INTEGER NOT NULL DEFAULT 0,
    "subtotalUsd" INTEGER NOT NULL,
    "discountTotalUsd" INTEGER NOT NULL,
    "taxUsd" INTEGER NOT NULL,
    "totalUsd" INTEGER NOT NULL,
    "refundedAmountUsd" INTEGER NOT NULL DEFAULT 0,
    "cardBrand" TEXT,
    "cardLastFour" TEXT,
    "invoiceUrl" TEXT,
    "testMode" BOOLEAN NOT NULL DEFAULT false,
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "public"."User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "public"."Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_lemonSqueezyId_key" ON "public"."Subscription"("lemonSqueezyId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_lemonOrderId_key" ON "public"."Subscription"("lemonOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_eventId_key" ON "public"."WebhookEvent"("eventId");

-- CreateIndex
CREATE INDEX "WebhookEvent_eventName_resourceId_idx" ON "public"."WebhookEvent"("eventName", "resourceId");

-- CreateIndex
CREATE INDEX "WebhookEvent_processedAt_idx" ON "public"."WebhookEvent"("processedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentHistory_invoiceId_key" ON "public"."PaymentHistory"("invoiceId");

-- CreateIndex
CREATE INDEX "PaymentHistory_userId_idx" ON "public"."PaymentHistory"("userId");

-- CreateIndex
CREATE INDEX "PaymentHistory_subscriptionId_idx" ON "public"."PaymentHistory"("subscriptionId");

-- CreateIndex
CREATE INDEX "PaymentHistory_status_idx" ON "public"."PaymentHistory"("status");

-- CreateIndex
CREATE INDEX "PaymentHistory_createdAt_idx" ON "public"."PaymentHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentHistory" ADD CONSTRAINT "PaymentHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed data for Plan table
INSERT INTO "public"."Plan" ("id","title","name","description","content","available","price","lemonSqueezyProductId","lemonSqueezyVariantId") VALUES
('pln_personal_pro','Personal Pro','PERSONAL_PRO','Best for individuals','[]'::jsonb, true, 9.99,'LS_PRODUCT_PRO','LS_VARIANT_PRO');

INSERT INTO "public"."Plan" ("id","title","name","description","content","available","price","lemonSqueezyProductId","lemonSqueezyVariantId") VALUES
('pln_personal_max_5','Personal Max x5','PERSONAL_MAX_5','For power users needing more capacity','[]'::jsonb, true, 19.99,'LS_PRODUCT_MAX_5','LS_VARIANT_MAX_5');

INSERT INTO "public"."Plan" ("id","title","name","description","content","available","price","lemonSqueezyProductId","lemonSqueezyVariantId") VALUES
('pln_personal_max_20','Personal Max x20','PERSONAL_MAX_20','For heavy usage scenarios','[]'::jsonb, true, 49.99,'LS_PRODUCT_MAX_20','LS_VARIANT_MAX_20');
