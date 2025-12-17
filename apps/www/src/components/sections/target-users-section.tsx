/* eslint-disable @next/next/no-img-element */
import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger } from "@myapp/ui/components/tabs";
import { Code2, Lightbulb, Users } from "lucide-react";
import { Badge } from "@myapp/ui/components/badge";
import { Button } from "@myapp/ui/components/button";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { GET_STARTED_LINK } from "@/constants/links";
import { moveToGetStarted } from "@/lib/moveToApp";

interface TabContentData {
  badge: string;
  title: React.ReactNode;
  description: React.ReactNode;
  buttonText: string;
  imageSrc: string;
  imageAlt: string;
  personas: string[];
  buttonLink: string;
}

interface TabContentProps {
  content: TabContentData;
  index?: number;
}

const TabContent = ({ content, index = 0 }: TabContentProps) => {
  const handleButtonClick = (e: React.MouseEvent) => {
    if (content.buttonLink === GET_STARTED_LINK) {
      e.preventDefault();
      moveToGetStarted();
    } else {
      window.open(content.buttonLink, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
        delay: index * 0.1,
      }}
      className="grid gap-12 place-items-center lg:grid-cols-2 lg:gap-16"
    >
      <div className="flex flex-col gap-6">
        <h3 className="text-3xl font-medium leading-tight text-gray-950 lg:text-4xl">
          {content.title}
        </h3>
        <p className="text-lg leading-relaxed text-gray-600 whitespace-pre-line lg:text-xl">
          {content.description}
        </p>

        <div className="hidden mt-4 space-y-3 lg:block">
          {content.personas.map((persona, personaIndex) => (
            <div key={personaIndex} className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-1 h-1 mt-3 bg-gray-400 rounded-full"></div>
              <span className="font-light text-gray-600">{persona}</span>
            </div>
          ))}
        </div>

        <Button className="mt-6 w-fit" size="lg" onClick={handleButtonClick}>
          {content.buttonText}
        </Button>
      </div>
      <img
        src={content.imageSrc}
        alt={content.imageAlt}
        className="w-full max-w-md row-start-1 shadow-lg rounded-xl lg:max-w-full"
      />
    </motion.div>
  );
};

export const TargetUsersSection = () => {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState("vibecoder");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

  const tabs = [
    {
      value: "vibecoder",
      icon: <Users className="w-4 h-auto shrink-0" />,
      label: t("targetUsers.users.vibecoder.label"),
      content: {
        badge: "vibecoder",
        title: t("targetUsers.users.vibecoder.title"),
        description: t("targetUsers.users.vibecoder.description"),
        buttonText: t("common.getStarted"),
        buttonLink: GET_STARTED_LINK,
        imageSrc: "/images/target-user/vibecoder.png",
        imageAlt: t("targetUsers.users.vibecoder.title"),
        personas: [
          t("targetUsers.users.vibecoder.persona1"),
          t("targetUsers.users.vibecoder.persona2"),
          t("targetUsers.users.vibecoder.persona3"),
        ],
      },
    },
    {
      value: "solo",
      icon: <Code2 className="w-4 h-auto shrink-0" />,
      label: t("targetUsers.users.solo.label"),
      content: {
        badge: "Solo Developer",
        title: t("targetUsers.users.solo.title"),
        description: t("targetUsers.users.solo.description"),
        buttonText: t("common.getStarted"),
        buttonLink: GET_STARTED_LINK,
        imageSrc: "/images/target-user/solo-developer.png",
        imageAlt: t("targetUsers.users.solo.title"),
        personas: [
          t("targetUsers.users.solo.persona1"),
          t("targetUsers.users.solo.persona2"),
          t("targetUsers.users.solo.persona3"),
        ],
      },
    },
    {
      value: "startup",
      icon: <Lightbulb className="w-4 h-auto shrink-0" />,
      label: t("targetUsers.users.startup.label"),
      content: {
        badge: "Startup Founder",
        title: t("targetUsers.users.startup.title"),
        description: t("targetUsers.users.startup.description"),
        buttonText: t("common.getStarted"),
        buttonLink: GET_STARTED_LINK,
        imageSrc: "/images/target-user/startup.png",
        imageAlt: t("targetUsers.users.startup.title"),
        personas: [
          t("targetUsers.users.startup.persona1"),
          t("targetUsers.users.startup.persona2"),
          t("targetUsers.users.startup.persona3"),
        ],
      },
    },
  ];

  const currentTab = tabs.find((user) => user.value === activeTab);

  return (
    <section className="px-4 py-24 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="mb-20 text-center">
          <Badge variant="outline" className="mb-4 scale-150">
            {t("targetUsers.sectionTitle")}
          </Badge>
          <h2 className="mb-6 text-4xl font-medium tracking-tight md:text-5xl text-gray-950 whitespace-pre-line">
            {t("targetUsers.title")}
          </h2>
          <p className="max-w-2xl mx-auto text-lg font-light leading-relaxed text-gray-600">
            {t("targetUsers.description")}
          </p>
        </div>

        {isMobile ? (
          // 모바일: 모든 카드를 세로로 나열
          <div className="space-y-8">
            {tabs.map((tab, index) => (
              <div key={tab.value} className="p-4 rounded-2xl bg-gray-50">
                <TabContent content={tab.content} index={index} />
              </div>
            ))}
          </div>
        ) : (
          // 데스크톱: 기존 탭 방식 유지
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
            <TabsList className="flex flex-col items-center justify-center !gap-0 !p-[2px] mx-auto w-fit sm:flex-row md:gap-10 h-fit !rounded-lg !bg-gray-100">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-2 px-8 py-2 text-lg font-semibold text-muted-foreground data-[state=active]:bg-white data-[state=active]:text-black h-fit !rounded-[10px]"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="p-8 mx-auto mt-12 rounded-2xl bg-gray-50 lg:p-16">
              <AnimatePresence mode="wait">
                {currentTab && (
                  <TabContent key={activeTab} content={currentTab.content} />
                )}
              </AnimatePresence>
            </div>
          </Tabs>
        )}
      </div>
    </section>
  );
};
