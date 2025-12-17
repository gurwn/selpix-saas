import { useTranslations } from "next-intl";
import { Button } from "@myapp/ui/components/button";
import { SiDiscord } from "@icons-pack/react-simple-icons";
import { DISCORD_LINK, FEEDBACK_LINK } from "@/constants/links";
import { BentoCard, BentoGrid } from "../ui/bento-grid";

export const RoadmapSection = () => {
  const t = useTranslations();

  const features = [
    {
      name: t("roadmap.features.contextIntegration.name"),
      description: (
        <span className="tracking-tighter text-sm">
          {t("roadmap.features.contextIntegration.description")
            .split("\n")
            .map((line, index) => (
              <span key={index}>
                {line}
                {index <
                  t("roadmap.features.contextIntegration.description").split(
                    "\n"
                  ).length -
                    1 && (
                  <>
                    <span className="hidden sm:inline md:hidden"> </span>
                    <br className="block sm:hidden md:block" />
                  </>
                )}
              </span>
            ))}
        </span>
      ),
      href: FEEDBACK_LINK,
      cta: t("roadmap.features.contextIntegration.cta"),
      className:
        "col-span-1 md:col-span-1 lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-2",
    },
    {
      name: t("roadmap.features.teamCollaboration.name"),
      description: (
        <span className="tracking-tighter text-sm">
          {t("roadmap.features.teamCollaboration.description")
            .split("\n")
            .map((line, index) => (
              <span key={index}>
                {line}
                {index <
                  t("roadmap.features.teamCollaboration.description").split(
                    "\n"
                  ).length -
                    1 && (
                  <>
                    <span className="hidden sm:inline md:hidden"> </span>
                    <br className="block sm:hidden md:block" />
                  </>
                )}
              </span>
            ))}
        </span>
      ),
      href: FEEDBACK_LINK,
      cta: t("roadmap.features.teamCollaboration.cta"),
      className:
        "col-span-1 md:col-span-1 lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-2",
    },
    {
      name: t("roadmap.features.milestoneRoadmap.name"),
      description: (
        <span className="tracking-tighter text-sm">
          {t("roadmap.features.milestoneRoadmap.description")
            .split("\n")
            .map((line, index) => (
              <span key={index}>
                {line}
                {index <
                  t("roadmap.features.milestoneRoadmap.description").split("\n")
                    .length -
                    1 && (
                  <>
                    <span className="hidden sm:inline md:hidden"> </span>
                    <br className="block sm:hidden md:block" />
                  </>
                )}
              </span>
            ))}
        </span>
      ),
      href: FEEDBACK_LINK,
      cta: t("roadmap.features.milestoneRoadmap.cta"),
      className:
        "col-span-1 md:col-span-1 lg:col-start-1 lg:col-end-2 lg:row-start-2 lg:row-end-3",
    },
    {
      name: t("roadmap.features.insights.name"),
      description: (
        <span className="tracking-tighter text-sm">
          {t("roadmap.features.insights.description")
            .split("\n")
            .map((line, index) => (
              <span key={index}>
                {line}
                {index <
                  t("roadmap.features.insights.description").split("\n")
                    .length -
                    1 && (
                  <>
                    <span className="hidden sm:inline md:hidden"> </span>
                    <br className="block sm:hidden md:block" />
                  </>
                )}
              </span>
            ))}
        </span>
      ),
      href: FEEDBACK_LINK,
      cta: t("roadmap.features.insights.cta"),
      className:
        "col-span-1 md:col-span-1 lg:col-start-2 lg:col-end-3 lg:row-start-2 lg:row-end-3",
    },
    {
      name: t("roadmap.features.whatsNext.name"),
      description: (
        <span className="tracking-tighter text-sm">
          {t("roadmap.features.whatsNext.description")
            .split("\n")
            .map((line, index) => (
              <span key={index}>
                {line}
                {index <
                  t("roadmap.features.whatsNext.description").split("\n")
                    .length -
                    1 && (
                  <>
                    <span className="hidden sm:inline md:hidden"> </span>
                    <br className="block sm:hidden md:block" />
                  </>
                )}
              </span>
            ))}
        </span>
      ),
      href: DISCORD_LINK,
      cta: t("roadmap.features.whatsNext.cta"),
      className:
        "col-span-1 md:col-span-1 lg:col-start-3 lg:col-end-4 lg:row-start-1 lg:row-end-3",
    },
  ];

  return (
    <section className="px-4 py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16 text-center">
          <p className="mb-3 font-medium text-gray-600">
            {t("roadmap.sectionTitle")}
          </p>
          <h2 className="mb-6 text-4xl font-medium tracking-tight md:text-5xl text-gray-950">
            {t("roadmap.title")}
          </h2>
          <p className="max-w-2xl mx-auto text-lg font-light leading-relaxed text-gray-600">
            {t("roadmap.description")}
          </p>
        </div>

        <BentoGrid className="mb-16 lg:grid-rows-2 !auto-rows-[10rem] lg:auto-rows-[22rem]">
          {features.map((feature) => (
            <BentoCard key={feature.name} {...feature} />
          ))}
        </BentoGrid>

        {/* Community Section */}
        <div className="p-12 text-center text-white bg-gray-900 rounded-3xl">
          <h3 className="mb-4 text-2xl font-medium md:text-4xl text-brand">
            {t("roadmap.community.title")}
          </h3>
          <p className="max-w-2xl mx-auto mb-4 text-lg font-light leading-relaxed opacity-80">
            {t("roadmap.community.description")
              .split("\n")
              .map((line, index) => (
                <span key={index}>
                  {line}
                  {index <
                    t("roadmap.community.description").split("\n").length -
                      1 && (
                    <>
                      <span className="hidden sm:inline"> </span>
                      <br className="block sm:hidden" />
                    </>
                  )}
                </span>
              ))}
          </p>

          <p className="max-w-2xl mx-auto mb-8 font-light leading-relaxed opacity-60">
            {t("roadmap.community.hashtags")}
          </p>

          <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="px-8 py-3 font-medium text-gray-900 bg-white rounded-full hover:bg-gray-100 text-[#5865F2] hover:text-white hover:bg-[#5865F2] transition-all duration-300"
            >
              <a href={DISCORD_LINK} target="_blank" rel="noreferrer">
                <SiDiscord />
                {t("roadmap.community.cta")}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
