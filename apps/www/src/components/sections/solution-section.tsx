"use client";

import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "motion/react";
import { FeatureCard } from "@/components/ui/grid-feature-cards";

export const SolutionSection = () => {
  const t = useTranslations();

  const features = [
    {
      title: t("solution.features.prd.title"),
      description: (
        <span className="tracking-tighter">
          {t("solution.features.prd.description")
            .split("\n")
            .map((line, index) => (
              <span key={index}>
                {line}
                {index <
                  t("solution.features.prd.description").split("\n").length -
                    1 && (
                  <>
                    <br />
                  </>
                )}
              </span>
            ))}
        </span>
      ),
    },
    {
      title: t("solution.features.plan.title"),
      description: (
        <span className="tracking-tighter">
          {t("solution.features.plan.description")
            .split("\n")
            .map((line, index) => (
              <span key={index}>
                {line}
                {index <
                  t("solution.features.plan.description").split("\n").length -
                    1 && (
                  <>
                    <br />
                  </>
                )}
              </span>
            ))}
        </span>
      ),
    },
    {
      title: t("solution.features.mcp.title"),
      description: (
        <span className="tracking-tighter">
          {t("solution.features.mcp.description")
            .split("\n")
            .map((line, index) => (
              <span key={index}>
                {line}
                {index <
                  t("solution.features.mcp.description").split("\n").length -
                    1 && (
                  <>
                    <br />
                  </>
                )}
              </span>
            ))}
        </span>
      ),
    },
  ];

  return (
    <section id="features" className="px-4 py-24 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto ">
        <div className="flex flex-col items-center text-center">
          <AnimatedContainer className="max-w-3xl mb-16">
            <p className="mb-2 font-medium text-gray-600">
              {t("solution.sectionTitle")}
            </p>
            <h2 className="mb-4 text-4xl font-medium tracking-tight md:text-5xl text-gray-950">
              {t("solution.title")
                .split("\n")
                .map((line, index) => (
                  <span key={index}>
                    {line}
                    {index < t("solution.title").split("\n").length - 1 && (
                      <br />
                    )}
                  </span>
                ))}
            </h2>
            <p className="text-lg font-light text-gray-600">
              {t("solution.description")
                .split("\n")
                .map((line, index) => (
                  <span key={index}>
                    {line}
                    {index <
                      t("solution.description").split("\n").length - 1 && (
                      <br />
                    )}
                  </span>
                ))}
            </p>
          </AnimatedContainer>
        </div>

        <AnimatedContainer
          delay={0.4}
          className="grid grid-cols-1 gap-4 border border-dashed divide-x divide-y divide-dashed sm:grid-cols-2 md:grid-cols-3"
        >
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} />
          ))}
        </AnimatedContainer>
      </div>
    </section>
  );
};

type ViewAnimationProps = {
  delay?: number;
  className?: React.ComponentProps<typeof motion.div>["className"];
  children: React.ReactNode;
};

function AnimatedContainer({
  className,
  delay = 0.1,
  children,
}: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ filter: "blur(4px)", translateY: -8, opacity: 0 }}
      whileInView={{ filter: "blur(0px)", translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
