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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@myapp/ui/components/table";
import { Button } from "@myapp/ui/components/button";
import { Badge } from "@myapp/ui/components/badge";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ProductListPage() {
    const t = useTranslations("ProductListPage");
    const utils = trpc.useUtils();

    const { data: products, isLoading } = trpc.product.getAll.useQuery();

    const createMutation = trpc.product.create.useMutation({
        onSuccess: () => {
            toast.success("Test product created!");
            utils.product.getAll.invalidate();
        },
        onError: (err) => {
            toast.error(`Failed to create product: ${err.message}`);
        },
    });

    const handleCreateTestProduct = () => {
        createMutation.mutate({
            name: `Test Product ${Math.floor(Math.random() * 1000)}`,
            wholesalePrice: 10000,
            recommendedPrice: 20000,
            margin: 50,
            competition: "Low",
            searchVolume: 5000,
            category: "Living",
            image: "https://placehold.co/100",
            source: "Domeme",
            trend: "Rising",
            score: 85,
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
                    <p className="text-muted-foreground">
                        {t("description")}
                    </p>
                </div>
                <Button onClick={handleCreateTestProduct} disabled={createMutation.isPending}>
                    {createMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Plus className="mr-2 h-4 w-4" />
                    )}
                    {t("addProduct")}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t("myProducts")}</CardTitle>
                    <CardDescription>
                        {t("totalProducts", { count: products?.length || 0 })}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("columns.image")}</TableHead>
                                <TableHead>{t("columns.name")}</TableHead>
                                <TableHead>{t("columns.category")}</TableHead>
                                <TableHead>{t("columns.price")}</TableHead>
                                <TableHead>{t("columns.margin")}</TableHead>
                                <TableHead>{t("columns.competition")}</TableHead>
                                <TableHead>{t("columns.score")}</TableHead>
                                <TableHead className="text-right">{t("columns.date")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : products && products.length > 0 ? (
                                products.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            <div className="h-10 w-10 overflow-hidden rounded-md bg-muted">
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell>{product.category}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-sm">
                                                <span>{product.wholesalePrice.toLocaleString()}원</span>
                                                <span className="text-muted-foreground">
                                                    {product.recommendedPrice.toLocaleString()}원
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={product.margin >= 30 ? "default" : "secondary"}>
                                                {product.margin}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{product.competition}</TableCell>
                                        <TableCell>
                                            <span className="font-bold text-primary">{product.score}점</span>
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            {new Date(product.createdAt).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                        {t("empty")}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
