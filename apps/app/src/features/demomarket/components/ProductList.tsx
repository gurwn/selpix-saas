"use client";

import { Product } from "../lib/types";
import { Card, CardContent, CardFooter, CardHeader } from "@myapp/ui/components/card";
import { Badge } from "@myapp/ui/components/badge";
import { Button } from "@myapp/ui/components/button";
import { ShoppingCart, TrendingUp, AlertCircle } from "lucide-react";
import Image from "next/image";
import { t } from "@/lib/i18n";

interface ProductListProps {
    products: Product[];
    isLoading: boolean;
    onSelect: (product: Product) => void;
}

export function ProductList({ products, isLoading, onSelect }: ProductListProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-[300px] bg-muted/20 animate-pulse rounded-lg" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">{t("demomarket_list_title", { count: products.length })}</h2>
                <div className="flex gap-2">
                    <Badge variant="secondary" className="gap-1">
                        <TrendingUp className="h-3 w-3" /> 인기순
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                    <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow border-muted flex flex-col">
                        <div className="relative aspect-square bg-muted">
                            <Image
                                src={product.image}
                                alt={product.title}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                            <div className="absolute top-2 right-2">
                                <Badge className="bg-orange-500 hover:bg-orange-600">
                                    마진 {product.margin}%
                                </Badge>
                            </div>
                        </div>
                        <CardHeader className="p-4 pb-2 space-y-1">
                            <div className="flex justify-between items-start">
                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-5">
                                    {product.market_code}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{product.category}</span>
                            </div>
                            <h3 className="font-semibold leading-tight line-clamp-2 min-h-[3rem]">
                                {product.title}
                            </h3>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-lg font-bold">
                                {product.price.toLocaleString()}원
                            </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0 mt-auto">
                            <Button
                                className="w-full gap-2"
                                onClick={() => onSelect(product)}
                            >
                                <ShoppingCart className="h-4 w-4" />
                                {t("demomarket_action_analyze")}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
