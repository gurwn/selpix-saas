import { ProductListTable } from "@/features/dashboard/components/ProductListTable";

export default function ProductsPage() {
    return (
        <div className="container py-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">상품 관리</h1>
                    <p className="text-muted-foreground">등록된 쿠팡 상품 내역을 관리합니다.</p>
                </div>
            </div>
            <ProductListTable />
        </div>
    );
}
