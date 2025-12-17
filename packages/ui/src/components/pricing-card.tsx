"use client";

import * as React from "react";
import { BadgeCheck, ArrowRight } from "lucide-react";
import NumberFlow from "@number-flow/react";

import { cn } from "../lib/utils";
import { Badge } from "./badge";
import { Button } from "./button";
import { Card } from "./card";

export interface PricingTier {
  name: string;
  title: string;
  price: Record<string, number | string>;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  popular?: boolean;
}

interface PricingCardProps {
  tier: PricingTier;
  paymentFrequency: string;
  onSelect?: () => void;
  disabled?: boolean;
  loading?: boolean;
  ctaText?: string;
}

export function PricingCard({
  tier,
  paymentFrequency,
  onSelect,
  disabled = false,
  loading = false,
  ctaText,
}: PricingCardProps) {
  const price = tier.price[paymentFrequency];
  const isHighlighted = tier.highlighted;
  const isPopular = tier.popular;

  return (
    <Card
      className={cn(
        "relative flex flex-col gap-8 overflow-hidden p-6",
        isHighlighted
          ? "bg-foreground text-background"
          : "bg-background text-foreground",
        isPopular && "ring-2 ring-primary"
      )}
    >
      {isHighlighted && <HighlightedBackground />}
      {isPopular && <PopularBackground />}

      <h2 className="flex gap-3 items-center text-xl font-medium capitalize">
        {tier.title}
        {isPopular && (
          <Badge variant="secondary" className="z-10 mt-1">
            🔥 Most Popular
          </Badge>
        )}
      </h2>

      <div className="relative h-12">
        {typeof price === "number" ? (
          <>
            <NumberFlow
              format={{
                style: "currency",
                currency: "USD",
                // trailingZeroDisplay 속성은 지원되지 않으므로 제거합니다.
              }}
              value={price}
              className="text-4xl font-medium"
            />
            <p className="-mt-2 text-xs text-muted-foreground">
              Per month/user
            </p>
          </>
        ) : (
          <h1 className="text-4xl font-medium">{price}</h1>
        )}
      </div>

      <div className="flex-1 space-y-2">
        <h3 className="text-sm font-medium">{tier.description}</h3>
        <ul className="space-y-2">
          {tier.features.map((feature, index) => (
            <li
              key={index}
              className={cn(
                "flex gap-2 items-center text-sm font-medium",
                isHighlighted ? "text-background" : "text-muted-foreground"
              )}
            >
              <BadgeCheck className="w-4 h-4" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <Button
        onClick={onSelect}
        disabled={disabled || loading}
        variant={isHighlighted ? "secondary" : "default"}
        className="w-full"
      >
        {ctaText ?? tier.cta}
        <ArrowRight className="ml-2 w-4 h-4" />
      </Button>
    </Card>
  );
}

const HighlightedBackground = () => (
  <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:45px_45px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
);

const PopularBackground = () => (
  <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
);
