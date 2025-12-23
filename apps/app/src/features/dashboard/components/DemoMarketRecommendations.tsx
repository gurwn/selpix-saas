"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@myapp/ui/components/card";
import { Button } from "@myapp/ui/components/button";
import { Badge } from "@myapp/ui/components/badge";
import { BadgeCheck, Sparkles, TrendingUp, ThumbsUp } from "lucide-react";
import Image from "next/image";
import { cn } from "@myapp/ui/lib/utils";
import { useRouter } from "next/navigation";

// Mocking single top recommendation for the square widget
const TOP_PICK = {
    id: 1,
    title: "프리미엄 무선 이어버드",
    image: "/placeholder-1.jpg",
    reason: "상위 10% 전환율",
    badge: "추천",
    stats: { conversion: "8.4%", feedback: "1.2k+" },
};

export function DemoMarketRecommendations({ className, size = "medium" }: { className?: string, size?: "small" | "medium" | "large" }) {
    const router = useRouter();
    const handleNavigation = () => router.push("/demomarket");

    if (size === "small") {
        return (
            <Card
                className={cn("col-span-full border-primary/20 bg-gradient-to-br from-primary/5 to-transparent h-full w-full flex flex-col justify-center items-center overflow-hidden p-2 cursor-pointer hover:bg-primary/5 transition-colors", className)}
                onClick={handleNavigation}
            >
                <Sparkles className="h-6 w-6 text-primary mb-2" />
                <p className="text-xs font-bold text-center truncate w-full">{TOP_PICK.title}</p>
                <Badge variant="secondary" className="text-[10px] h-5 mt-1">UP</Badge>
            </Card>
        );
    }

    return (
        <Card className={cn("col-span-full border-primary/20 bg-gradient-to-br from-primary/5 to-transparent h-full w-full flex flex-col overflow-hidden", className)}>
            <CardHeader className="pb-2 shrink-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                        <Sparkles className="h-4 w-4 text-primary" />
                        데모마켓 추천
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs font-normal">UP</Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-3 min-h-0">
                <div
                    className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center text-muted-foreground flex-1 cursor-pointer group"
                    onClick={handleNavigation}
                >
                    {/* Placeholder for Image */}
                    <Image
                        src={`https://placehold.co/600x600?text=${encodeURIComponent(TOP_PICK.title)}`}
                        alt={TOP_PICK.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                    />
                    <div className="absolute top-2 right-2">
                        <Badge className="bg-white/90 text-primary hover:bg-white border-none shadow-sm">{TOP_PICK.badge}</Badge>
                    </div>
                    {(size === "medium" || size === "large") && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 text-white">
                            <h3 className="font-semibold leading-tight truncate">{TOP_PICK.title}</h3>
                            <p className="text-xs text-white/80 flex items-center gap-1 mt-1">
                                <TrendingUp className="h-3 w-3 text-green-400" /> {TOP_PICK.reason}
                            </p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-background/80 p-2 rounded border flex flex-col items-center justify-center">
                        <span className="text-muted-foreground">전환율</span>
                        <span className="font-bold text-blue-600">{TOP_PICK.stats.conversion}</span>
                    </div>
                    <div className="bg-background/80 p-2 rounded border flex flex-col items-center justify-center">
                        <span className="text-muted-foreground">피드백</span>
                        <span className="font-bold text-orange-600">{TOP_PICK.stats.feedback}</span>
                    </div>
                </div>

                {size === "large" && (
                    <Button className="w-full mt-auto" size="sm" onClick={handleNavigation}>
                        파이프라인 추가
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
