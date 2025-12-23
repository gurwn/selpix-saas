import { AnalysisLayout } from "@/features/analysis/components/AnalysisLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "AI 상품 분석 | Selpix",
    description: "소싱한 상품의 마진율 분석 및 판매가 설정을 진행합니다.",
};

export default function AnalysisPage() {
    return <AnalysisLayout />;
}
