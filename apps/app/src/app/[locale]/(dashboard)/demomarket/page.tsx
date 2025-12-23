import { DemoMarketLayout } from "@/features/demomarket/components/DemoMarketLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "데모마켓 소싱 | Selpix",
    description: "가상 마켓플레이스에서 소싱 실습을 진행합니다.",
};

export default function DemoMarketPage() {
    return <DemoMarketLayout />;
}
