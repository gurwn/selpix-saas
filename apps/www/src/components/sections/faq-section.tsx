"use client";

import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@myapp/ui/components/accordion";
import { AnimationGeneratorType, Easing, motion } from "framer-motion";

export const FAQSection = () => {
  const t = useTranslations();
  const faqs = [
    {
      question: t("faq.item1.question"),
      answer: t("faq.item1.answer"),
    },
    {
      question: t("faq.item2.question"),
      answer: t("faq.item2.answer"),
    },
    {
      question: t("faq.item3.question"),
      answer: t("faq.item3.answer"),
    },
    {
      question: t("faq.item4.question"),
      answer: t("faq.item4.answer"),
    },
    {
      question: t("faq.item5.question"),
      answer: t("faq.item5.answer"),
    },
    {
      question: t("faq.item6.question"),
      answer: t("faq.item6.answer"),
    },
  ];

  const fadeInVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.25, 0.46, 0.45, 0.94] as Easing, // easeOutQuart
      },
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94] as Easing,
        type: "spring" as AnimationGeneratorType,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const contentVariants = {
    hidden: {
      opacity: 0,
      height: 0,
      y: -10,
    },
    visible: {
      opacity: 1,
      height: "auto",
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94] as Easing,
        opacity: { delay: 0.1 },
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      y: -10,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94] as Easing,
      },
    },
  };

  return (
    <section id="faq" className="px-4 py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="mb-16 text-center"
          variants={fadeInVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <h2 className="mb-6 font-sans text-4xl font-medium tracking-tight md:text-5xl text-gray-950">
            {t("faq.title")}
          </h2>
          <p className="max-w-2xl mx-auto text-lg font-light text-gray-600">
            {t("faq.description")}
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div key={index} variants={cardVariants} className="group">
                <AccordionItem
                  value={`item-${index}`}
                  className="overflow-hidden transition-all duration-500 bg-white border border-gray-200 shadow-sm rounded-xl hover:shadow-lg hover:border-gray-300 hover:-translate-y-1"
                >
                  <AccordionTrigger className="px-6 py-5 text-base font-medium text-left text-gray-950 hover:no-underline group-hover:text-gray-700 transition-all duration-300 [&[data-state=open]>div>svg]:rotate-180">
                    <div className="flex items-center w-full gap-4">
                      <motion.div
                        className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg"
                        whileHover={{
                          scale: 1.1,
                          backgroundColor: "#f3f4f6",
                          transition: { duration: 0.2 },
                        }}
                      >
                        {(index + 1).toString().padStart(2, "0")}
                      </motion.div>
                      <span className="flex-1">{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-5 overflow-hidden">
                    <motion.div
                      className="pl-12"
                      variants={contentVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <p className="font-light leading-relaxed text-gray-600">
                        {faq.answer}
                      </p>
                    </motion.div>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};
