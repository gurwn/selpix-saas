"use client";

import * as React from "react";
import { PricingSection as UIPricingSection } from "@/components/ui/pricing-section";
import type { PricingTier } from "@/components/ui/pricing-card";
import { useTranslations } from "next-intl";

import { GET_STARTED_LINK } from "@/constants/links";

export const PAYMENT_FREQUENCIES: string[] = ["monthly", "yearly"];

export const TIERS: PricingTier[] = [];

export const PricingSection = () => {
  const t = useTranslations("pricing");

  const tiers: PricingTier[] = [
    {
      name: t("plans.free.title"),
      price: { monthly: t("beta.price"), yearly: t("beta.price") },
      description: t("plans.free.description"),
      features: [
        t("plans.free.credits"),
        t("plans.free.projects"),
        t("plans.free.ai"),
        t("plans.free.support"),
      ],
      cta: t("plans.free.buttonText"),
      priceNote: t("plans.free.unit"),
    },
    {
      name: t("plans.pro.title"),
      price: { monthly: "19,900원", yearly: "19,900원" },
      description: t("plans.pro.description"),
      features: [
        t("plans.pro.credits"),
        t("plans.pro.projects"),
        t("plans.pro.ai"),
        t("plans.pro.designer"),
      ],
      cta: t("plans.pro.buttonText"),
      popular: true,
      priceNote: t("plans.pro.unit"), // Ensure this is "원/월" or "/월"
      href: GET_STARTED_LINK,
    },
  ];

  return (
    <div className="relative flex justify-center items-center w-full mt-20 scale-90">
      <div className="absolute inset-0 -z-10">
        <div className="h-full w-full bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:35px_35px] opacity-30 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>
      <UIPricingSection
        title={t("title")}
        subtitle={t("description")}
        frequencies={PAYMENT_FREQUENCIES}
        tiers={tiers}
      />
    </div>
  );
};
