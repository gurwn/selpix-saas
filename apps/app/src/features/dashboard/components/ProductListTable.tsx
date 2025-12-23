"use client";

import { useEffect, useState } from "react";
import { MockCoupangService, CoupangRegistrationResult } from "../../publish/lib/coupang-service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@myapp/ui/components/table";
import { Badge } from "@myapp/ui/components/badge";
import { Button } from "@myapp/ui/components/button";
import { ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";

export function ProductListTable() {
    const [products, setProducts] = useState<CoupangRegistrationResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        MockCoupangService.getRegisteredProducts()
            .then(setProducts)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="text-center py-10 border-2 border-dashed rounded-lg bg-muted/20">
                <p className="text-muted-foreground mb-4">등록된 상품이 없습니다.</p>
                <Button asChild>
                    <Link href="/demomarket">상품 소싱하러 가기</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>등록 시간</TableHead>
                        <TableHead>상품 ID</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead className="text-right">링크</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map((product, i) => (
                        <TableRow key={i}>
                            <TableCell>{new Date(product.timestamp).toLocaleString()}</TableCell>
                            <TableCell className="font-mono">{product.productId}</TableCell>
                            <TableCell>
                                {product.success ? (
                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">등록 완료</Badge>
                                ) : (
                                    <Badge variant="destructive">실패</Badge>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                {product.productLink && (
                                    <Button variant="ghost" size="sm" asChild>
                                        <a href={product.productLink} target="_blank" rel="noreferrer" className="gap-1">
                                            보기 <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
