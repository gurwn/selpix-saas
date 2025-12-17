import { useTranslations } from "next-intl";
import { Button } from "@myapp/ui/components/button";
import { ArrowRight, Clock, Shield } from "lucide-react";
import { Glow } from "../ui/glow";
import { moveToGetStarted } from "@/lib/moveToApp";

export const FinalCTASection = () => {
  const t = useTranslations();

  const handleGetStartedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    moveToGetStarted();
  };

  return (
    <section
      id="community"
      className="relative px-4 py-24 overflow-hidden text-white bg-gray-900"
    >
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <div className="mb-12">
          <h2 className="mb-6 text-4xl font-medium !leading-[1.4] tracking-tight md:text-5xl">
            {t("finalCTA.title")}
          </h2>
          <p className="max-w-2xl mx-auto text-lg font-light leading-relaxed opacity-80">
            {t("finalCTA.description")}
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid gap-8 mb-12 md:grid-cols-3">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-800 rounded-2xl">
              <ArrowRight className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>
            <h3 className="font-medium">
              {t("finalCTA.benefits.freeAccess.title")}
            </h3>
            <p className="text-sm font-light text-center opacity-70">
              {t("finalCTA.benefits.freeAccess.description")}
            </p>
          </div>
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-800 rounded-2xl">
              <Clock className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>
            <h3 className="font-medium">
              {t("finalCTA.benefits.limitedSpots.title")}
            </h3>
            <p className="text-sm font-light text-center opacity-70">
              {t("finalCTA.benefits.limitedSpots.description")}
            </p>
          </div>
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-800 rounded-2xl">
              <Shield className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>
            <h3 className="font-medium">
              {t("finalCTA.benefits.earlyAdopter.title")}
            </h3>
            <p className="text-sm font-light text-center opacity-70">
              {t("finalCTA.benefits.earlyAdopter.description")}
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="mb-8">
          <Button
            size="lg"
            className="px-12 py-4 text-lg font-medium text-white transition-all duration-300 rounded-full bg-brand hover:bg-brand-foreground"
            onClick={(e) => {
              handleGetStartedClick(e);
            }}
          >
            {t("finalCTA.cta")}
          </Button>
        </div>
      </div>

      <Glow
        variant="bottom"
        className="delay-1000 opacity-0 animate-appear-zoom"
      />
    </section>
  );
};
