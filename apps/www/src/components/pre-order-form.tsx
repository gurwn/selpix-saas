"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@myapp/ui/components/button";
import { Input } from "@myapp/ui/components/input";
import { Label } from "@myapp/ui/components/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@myapp/ui/components/select";
import { Textarea } from "@myapp/ui/components/textarea";

interface PreOrderFormProps {
    onSuccess?: () => void;
}

export const PreOrderForm = ({ onSuccess }: PreOrderFormProps) => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Survey States
    const [referralSource, setReferralSource] = useState("");
    const [referralSourceDetail, setReferralSourceDetail] = useState("");
    const [reason, setReason] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/pre-order", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    referralSource,
                    referralSourceDetail: referralSource === "sns" ? referralSourceDetail : undefined,
                    reason,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Something went wrong");
            }

            setSuccess(true);
            toast.success("사전예약 신청이 완료되었습니다!", {
                description: "입력하신 이메일로 확인 메일을 발송했습니다.",
            });

            if (onSuccess) {
                setTimeout(() => {
                    onSuccess();
                }, 2000);
            }
        } catch (error: any) {
            toast.error(error.message || "오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setSuccess(false);
        setEmail("");
        setReferralSource("");
        setReferralSourceDetail("");
        setReason("");
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center animate-in fade-in slide-in-from-bottom-4">
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                    <svg
                        className="h-6 w-6 text-green-600 dark:text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-semibold">신청해주셔서 감사합니다!</h3>
                    <p className="text-muted-foreground text-sm">
                        서비스 출시 소식을 가장 먼저 알려드리겠습니다.
                    </p>
                </div>
                <Button variant="outline" onClick={handleReset} className="mt-4">
                    다른 이메일로 또 신청하기
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 py-4">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">이메일 주소 <span className="text-red-500">*</span></Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        className="h-11"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="source">이 서비스를 어떻게 알게 되셨나요? <span className="text-red-500">*</span></Label>
                    <Select value={referralSource} onValueChange={setReferralSource} required disabled={loading}>
                        <SelectTrigger className="h-11">
                            <SelectValue placeholder="선택해주세요" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="search">검색 (구글/네이버 등)</SelectItem>
                            <SelectItem value="sns">SNS (인스타그램/틱톡 등)</SelectItem>
                            <SelectItem value="community">커뮤니티 (카페/블로그 등)</SelectItem>
                            <SelectItem value="friend">지인 추천</SelectItem>
                            <SelectItem value="other">기타</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {referralSource === "sns" && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <Label htmlFor="sns-detail">어떤 SNS에서 보셨나요?</Label>
                        <Select value={referralSourceDetail} onValueChange={setReferralSourceDetail} disabled={loading}>
                            <SelectTrigger className="h-11">
                                <SelectValue placeholder="SNS를 선택해주세요" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="instagram">인스타그램 (Instagram)</SelectItem>
                                <SelectItem value="tiktok">틱톡 (TikTok)</SelectItem>
                                <SelectItem value="youtube">유튜브 (YouTube)</SelectItem>
                                <SelectItem value="threads">스레드 (Threads)</SelectItem>
                                <SelectItem value="twitter">트위터 (X)</SelectItem>
                                <SelectItem value="other_sns">기타</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="reason">이 서비스에 관심 갖게 된 이유가 무엇인가요?</Label>
                    <Textarea
                        id="reason"
                        placeholder="자유롭게 적어주시면 서비스 발전에 큰 도움이 됩니다."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        disabled={loading}
                        className="min-h-[100px] resize-none"
                    />
                </div>
            </div>

            <Button type="submit" size="lg" disabled={loading} className="w-full text-base font-semibold h-12">
                {loading ? (
                    <>
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        처리 중...
                    </>
                ) : (
                    "사전예약 신청하기"
                )}
            </Button>
        </form>
    );
};
