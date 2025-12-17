"use client";

import { motion } from "framer-motion";
import { UserPlus, Sparkles, UploadCloud, ArrowRight } from "lucide-react";
import { Button } from "@myapp/ui/components/button";
import { moveToGetStarted } from "@/lib/moveToApp";

const steps = [
    {
        icon: UserPlus,
        title: "가입 및 연동",
        description: "1분 만에 회원가입하고 쿠팡, 도매몰 계정을 안전하게 연결하세요.",
        color: "bg-blue-500/10 text-blue-500",
    },
    {
        icon: Sparkles,
        title: "AI 소싱 분석",
        description: "Selpix AI가 마진율과 판매 가능성이 높은 상품을 자동으로 찾아냅니다.",
        color: "bg-purple-500/10 text-purple-500",
    },
    {
        icon: UploadCloud,
        title: "원클릭 등록",
        description: "분석된 상품을 클릭 한 번으로 쿠팡에 등록하고 판매를 시작하세요.",
        color: "bg-green-500/10 text-green-500",
    },
];

export function HowItWorksSection() {
    return (
        <section className="py-24 bg-background relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute inset-0 bg-grid-slate-100/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />

            <div className="container px-4 md:px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
                            3단계로 시작하는 <span className="text-primary">자동화</span>
                        </h2>
                        <p className="text-xl text-muted-foreground">
                            복잡한 소싱 과정을 Selpix가 가장 단순하게 바꿨습니다.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-border to-transparent z-0" />

                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.2 }}
                            viewport={{ once: true }}
                            className="relative z-10 flex flex-col items-center text-center group"
                        >
                            <div
                                className={`w-24 h-24 rounded-2xl flex items-center justify-center mb-6 shadow-sm border bg-background transition-transform group-hover:scale-110 duration-300 relative`}
                            >
                                <div className={`absolute inset-0 opacity-20 rounded-2xl ${step.color.split(" ")[0]}`} />
                                <step.icon className={`w-10 h-10 ${step.color.split(" ")[1]}`} />

                                {/* Step Number Badge */}
                                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md border-4 border-background">
                                    {index + 1}
                                </div>
                            </div>

                            <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                            <p className="text-muted-foreground max-w-xs">{step.description}</p>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    viewport={{ once: true }}
                    className="mt-16 text-center"
                >
                    <Button size="lg" onClick={moveToGetStarted} className="group">
                        지금 무료로 시작하기
                        <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                </motion.div>
            </div>
        </section>
    );
}
