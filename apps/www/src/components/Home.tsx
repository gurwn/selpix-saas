"use client";

import { Header } from "@/components/layout";
import { Hero } from "@/components/Hero";
import { SolutionSection } from "@/components/sections/solution-section";
import { TargetUsersSection } from "@/components/sections/target-users-section";
import { RoadmapSection } from "@/components/sections/roadmap-section";
import { PricingSection } from "@/components/sections/pricing-section";
import { FAQSection } from "@/components/sections/faq-section";
import { FinalCTASection } from "@/components/sections/final-cta-section";
import { Footer } from "@/components/layout";

const Index = () => {
  return (
    <>
      <Header />
      <Hero />
      <SolutionSection />
      {/* <ProblemSection /> */}
      {/* <HowItWorksSection /> */}
      <TargetUsersSection />
      <RoadmapSection />
      <PricingSection />
      <FAQSection />
      <FinalCTASection />
      <Footer />
    </>
  );
};

export default Index;
