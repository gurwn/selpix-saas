
import { useState } from "react";
import { useTranslations } from "next-intl";
import { HeroSection } from "@/components/ui/hero-section";
import { ArrowRight } from "lucide-react";
import { SiDiscord } from "@icons-pack/react-simple-icons";
import { DISCORD_LINK } from "@/constants/links";
import { PreOrderDialog } from "@/components/ui/pre-order-dialog";

export const Hero = () => {
  const t = useTranslations();

  const [showPreOrder, setShowPreOrder] = useState(false);

  const handlePreOrderClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowPreOrder(true);
  };

  return (
    <div className="relative min-h-screen">
      <HeroSection
        badge={{
          text: t("hero.badge"),
        }}
        title={t("hero.title")}
        description={t("hero.description")}
        // tutorial={t("hero.tutorial")}
        actions={[
          {
            text: "사전예약 신청하기",
            href: "#",
            icon: <ArrowRight className="size-4" />,
            variant: "default",
            onClick: handlePreOrderClick,
          },
          {
            text: t("common.community"),
            href: DISCORD_LINK,
            icon: <SiDiscord className="size-4" />,
            variant: "discord",
          },
        ]}

        className="!bg-transparent relative z-10"
      >
        <PreOrderDialog open={showPreOrder} onOpenChange={setShowPreOrder} />
      </HeroSection>
    </div>
  );
};
