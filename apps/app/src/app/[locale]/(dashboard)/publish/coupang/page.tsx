import { CoupangPublishLayout } from "@/features/publish/components/CoupangPublishLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "쿠팡 상품 등록 | Selpix",
    description: "분석된 상품을 쿠팡 마켓에 등록합니다.",
};

export default function PublishCoupangPage() {
    return <CoupangPublishLayout />;
}
