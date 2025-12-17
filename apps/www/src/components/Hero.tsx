"use client";

import { useTranslations } from "next-intl";
import { HeroSection } from "@/components/ui/hero-section";
import { ArrowRight } from "lucide-react";
import { SiDiscord } from "@icons-pack/react-simple-icons";
import { DISCORD_LINK, GET_STARTED_LINK } from "@/constants/links";
import { moveToGetStarted } from "@/lib/moveToApp";

export const Hero = () => {
  const t = useTranslations();

  const handleGetStartedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    moveToGetStarted();
  };

  return (
    <div className="relative min-h-screen">
      <HeroSection
        badge={{
          text: t("hero.badge"),
        }}
        title={t("hero.title")}
        description={t("hero.description")}
        tutorial={t("hero.tutorial")}
        actions={[
          {
            text: t("common.getStarted"),
            href: GET_STARTED_LINK,
            icon: <ArrowRight className="size-4" />,
            variant: "default",
            onClick: handleGetStartedClick,
          },
          {
            text: t("common.community"),
            href: DISCORD_LINK,
            icon: <SiDiscord className="size-4" />,
            variant: "discord",
          },
        ]}
        image={{
          light: "/images/preview.png",
          dark: "/images/preview.png",
          alt: t("hero.imageAlt"),
        }}
        className="!bg-transparent relative z-10"
      />
    </div>
  );
};
