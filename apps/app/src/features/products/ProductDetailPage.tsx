"use client";

import { useTranslations } from "next-intl";
import { trpc } from "@/utils/trpc/client";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@myapp/ui/components/card";
import { Button } from "@myapp/ui/components/button";
import { Badge } from "@myapp/ui/components/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@myapp/ui/components/tabs";
import { Loader2, ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";

interface ProductDetailPageProps {
    productId: string;
}

export function ProductDetailPage({ productId }: ProductDetailPageProps) {
    const t = useTranslations("ProductDetailPage"); // Need to add ProductDetailPage translations later
    const router = useRouter();
    const utils = trpc.useUtils();

    const id = parseInt(productId);
    const { data: product, isLoading, error } = trpc.product.getById.useQuery(
        { id },
        { enabled: !isNaN(id) }
    );

    if (isNaN(id)) {
        return <div>Invalid Product ID</div>;
    }

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 py-12">
                <h2 className="text-xl font-semibold">{t("productNotFound")}</h2>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("goBack")}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold tracking-tight">{product.name}</h2>
                            <Badge variant="outline">{product.category}</Badge>
                        </div>
                        <p className="text-muted-foreground">
                            {t("source")}: {product.source} • {t("score")}: {product.score}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {t("reAnalyze")}
                    </Button>
                    <Button>{t("startRegistration")}</Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{t("wholesalePrice")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{product.wholesalePrice.toLocaleString()}원</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{t("recommendedPrice")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{product.recommendedPrice.toLocaleString()}원</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{t("expectedMargin")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{product.margin}%</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{t("competition")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{product.competition}</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
                    <TabsTrigger value="analysis">{t("tabs.analysis")}</TabsTrigger>
                    <TabsTrigger value="margins">{t("tabs.margins")}</TabsTrigger>
                    <TabsTrigger value="registrations">{t("tabs.registrations")}</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("productImage")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="aspect-video w-full max-w-md overflow-hidden rounded-lg border bg-muted">
                                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="analysis">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("analysisScope")}</CardTitle>
                            <CardDescription>{t("analysisDesc")}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>{t("trend")}: {product.trend}</p>
                            <p>{t("searchVolume")}: {product.searchVolume.toLocaleString()}</p>
                            {/* Add more analysis data here */}
                        </CardContent>
                    </Card>
                </TabsContent>
                {/* Placeholder contents for other tabs */}
                <TabsContent value="margins">
                    <Card>
                        <CardHeader><CardTitle>Margin Breakdown</CardTitle></CardHeader>
                        <CardContent>Coming soon...</CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="registrations">
                    <Card>
                        <CardHeader><CardTitle>Registration History</CardTitle></CardHeader>
                        <CardContent>Coming soon...</CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
