"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Loader2, Search, Check, Sparkles, RefreshCw, Calculator, DollarSign, Truck } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@myapp/ui/components/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@myapp/ui/components/form";
import { Input } from "@myapp/ui/components/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@myapp/ui/components/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@myapp/ui/components/dialog";
import { ScrollArea } from "@myapp/ui/components/scroll-area";
import { Textarea } from "@myapp/ui/components/textarea";
import { toast } from "@myapp/ui/sonner";
import { Badge } from "@myapp/ui/components/badge";
import { Checkbox } from "@myapp/ui/components/checkbox";

const formSchema = z.object({
    productName: z.string().min(2, {
        message: "Product name must be at least 2 characters.",
    }),
    price: z.coerce.number().min(0, {
        message: "Price must be a positive number.",
    }),
    supplyPrice: z.coerce.number().min(0).optional(), // Added for Cost Price
    category: z.string().optional(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    sourceUrl: z.string().optional(),
    tags: z.string().optional(), // Comma separated tags
    supplierName: z.string().optional(),
    supplierAddress: z.string().optional(),
    supplierContact: z.string().optional(),
    supplierZip: z.string().optional(),
    shippingCost: z.coerce.number().optional(),
    originalPrice: z.coerce.number().min(0).optional(),
    discountPercent: z.coerce.number().min(0).max(99).optional(), // Added
});



interface SearchResult {
    name: string;
    price: number;
    site: string;
    imageUrl?: string;
    sourceUrl?: string;
    productNo?: string;
    shippingCost?: number;
    shippingText?: string | null;
    minOrderQuantity?: number;
    supplierName?: string;
    supplierAddress?: string;
    supplierContact?: string;
    supplierBizNo?: string;
    tags?: string[];
    options?: { name: string, values: string[] }[];
    detailHtml?: string;
    detailImages?: string[];
    imageUsageText?: string | null;
}

interface AIAnalysisResult {
    optimizedName: string;
    alternativeNames: string[];
    keywords: string[];
    categorySuggestion: string;
}

interface PricingResult {
    recommendedPrice: number;
    alternatives: number[];
    margins: { price: number; marginRate: number, margin: number }[];
    originalPrice?: number; // MSRP
    discountRate?: number; // Discount %
    reasoning: string;
}

export default function RegistrationPage() {
    const t = useTranslations("RegistrationPage");
    const router = useRouter();

    const [searchTerm, setSearchTerm] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<SearchResult | null>(null);

    const [isOptimizing, setIsOptimizing] = useState(false);
    const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);

    // Pricing States
    const [isPricing, setIsPricing] = useState(false);
    const [pricingResult, setPricingResult] = useState<PricingResult | null>(null);
    const [feeRate, setFeeRate] = useState(10.8);
    // Shipping Centers State
    const [outboundCenters, setOutboundCenters] = useState<any[]>([]);
    const [returnCenters, setReturnCenters] = useState<any[]>([]);
    const [selectedOutbound, setSelectedOutbound] = useState<string>("");
    const [selectedReturn, setSelectedReturn] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. Define your form.
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            productName: "",
            price: 0,
            supplyPrice: 0, // Added
            category: "",
            description: "",
            imageUrl: "",
            sourceUrl: "",
            tags: "",
            supplierName: "",
            shippingCost: 3000,
            originalPrice: 0,
            discountPercent: 0, // Added
        },
    });

    // Fetch Shipping Centers on Mount
    useState(() => {
        const fetchCenters = async () => {
            try {
                const res = await fetch('/api/coupang/centers');
                const json = await res.json();
                if (json.success && json.data) {
                    setReturnCenters(json.data.return);

                    // Auto-select "K-Space" or "케이스페이스" for return
                    const kspace = json.data.return.find((c: any) =>
                        c.shippingPlaceName.includes('K-Space') ||
                        c.shippingPlaceName.includes('케이스페이스')
                    );
                    if (kspace) setSelectedReturn(kspace.returnCenterCode);
                    else if (json.data.return.length > 0) setSelectedReturn(json.data.return[0].returnCenterCode);
                }
            } catch (e) {
                console.error("Failed to load shipping centers", e);
            }
        };
        fetchCenters();
    });

    // 2. Define a submit handler.
    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            if (!values.sourceUrl) {
                toast.error("스마트 등록을 위해 도매꾹 URL이 필요합니다.");
                setIsSubmitting(false);
                return;
            }

            if (!selectedReturn) {
                toast.error("반품지를 선택해주세요.");
                setIsSubmitting(false);
                return;
            }

            toast.info("스마트 등록을 시작합니다... (약 10-20초 소요)");

            const payload = {
                productLink: values.sourceUrl,
                keywords: values.tags ? values.tags.split(',').map(t => t.trim()) : [],
                margin: (() => {
                    if (!pricingResult) return 30; // Default fallback
                    const currentPrice = values.price || pricingResult.recommendedPrice;
                    const mInfo = pricingResult.margins.find(m => m.price === currentPrice);
                    return mInfo?.marginRate ?? 30;
                })(),
                // Pass full supplier info to backend
                supplierName: values.supplierName,
                supplierAddress: values.supplierAddress,
                supplierContact: values.supplierContact,
                supplierZip: values.supplierZip,
                options: selectedProduct?.options || [], // Pass extracted options
                sourceProductId: selectedProduct?.productNo, // Pass Domeggook ID
                originalProductName: selectedProduct?.name, // Pass original name for Admin use
                detailHtml: selectedProduct?.detailHtml, // Pass crawled detail HTML
                detailImages: selectedProduct?.detailImages || [], // Pass extracted detail images
                // Pass manual edits as overrides (Backend can be updated to use these later)
                overrides: {
                    productName: values.productName,
                    price: values.price,
                    category: values.category,
                    originalPrice: values.originalPrice,
                    supplyPrice: values.supplyPrice
                },
                shipping: {
                    returnCode: selectedReturn
                }
            };

            // Call the new Smart Registration API
            const response = await fetch('/api/coupang/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "쿠팡 상품 등록에 실패했습니다.");
            }

            toast.success("쿠팡 상품 등록 성공! 🎉");
            console.log('Registration Result:', data);

            // Optional: Also save to local DB if needed (can be done in parallel or separate call)
            // For now, we focus on the Coupang Registration goal.

            // router.push('/dashboard/products'); // Uncomment to redirect

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "상품 등록에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleSearch = async () => {
        if (!searchTerm) return;
        setIsSearching(true);
        setSearchResults([]);
        setSelectedProduct(null);

        // URL 감지 시 크롤링 미리보기 호출
        if (searchTerm.startsWith('http')) {
            try {
                toast.info("상품 정보를 가져오는 중입니다... (약 5-10초 소요)");
                const response = await fetch('/api/crawler/preview', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productLink: searchTerm }),
                });

                if (!response.ok) throw new Error('Preview failed');
                const data = await response.json();

                if (data.success && data.data) {
                    const product = data.data;
                    // 폼 자동 채우기
                    form.setValue("productName", product.name);
                    form.setValue("price", product.price);
                    form.setValue("sourceUrl", product.sourceUrl || searchTerm);
                    form.setValue("imageUrl", product.imageUrl || "");
                    if (product.tags) {
                        form.setValue("tags", product.tags.slice(0, 10).join(', '));
                    }
                    form.setValue("supplierName", product.supplierName || "");
                    form.setValue("supplierAddress", product.supplierAddress || "");
                    form.setValue("supplierContact", product.supplierContact || "");
                    if (product.shippingCost !== undefined) {
                        form.setValue("shippingCost", product.shippingCost);
                    }

                    // Save extra info to state if needed for display, or just rely on form/search result
                    // For now, we use a trick to display it: update selectedProduct to show the card
                    setSelectedProduct(product);

                    toast.success("상품 정보를 성공적으로 불러왔습니다!");
                    // 가격/마진 정보 초기화
                    setPricingResult(null);
                    setAiResult(null);
                } else {
                    toast.error("상품 정보를 가져오지 못했습니다.");
                }
            } catch (error) {
                console.error(error);
                toast.error("크롤링 중 오류가 발생했습니다.");
            } finally {
                setIsSearching(false);
            }
            return;
        }

        // 기존 키워드 검색 로직
        try {
            const response = await fetch('/api/analysis/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyword: searchTerm }),
            });
            if (!response.ok) throw new Error('Search failed');
            const data = await response.json();
            if (data.success && data.products) {
                setSearchResults(data.products);
                if (data.products.length === 0) toast.info("검색 결과가 없습니다.");
            } else {
                toast.error("상품 목록을 불러오지 못했습니다.");
            }
        } catch (error) {
            console.error(error);
            toast.error("검색 중 오류가 발생했습니다.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectProduct = async (product: SearchResult) => {
        // 1. Set basic info immediately for UI feedback
        setSelectedProduct(product);
        form.setValue("productName", product.name);
        form.setValue("price", product.price);
        form.setValue("sourceUrl", product.sourceUrl || "");
        form.setValue("imageUrl", product.imageUrl || "");
        form.setValue("tags", product.tags?.join(", ") || "");
        form.setValue("supplierName", product.supplierName || "");
        if (product.shippingCost !== undefined) {
            form.setValue("shippingCost", product.shippingCost);
        }
        setAiResult(null);
        setPricingResult(null);

        // 2. Fetch detailed info (Enrichment)
        if (product.sourceUrl) {
            try {
                toast.info("상세 정보를 가져오는 중입니다... (배송지, 옵션 등)");
                const response = await fetch('/api/crawler/preview', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        productLink: product.sourceUrl,
                        baseData: product
                    }),
                });

                if (!response.ok) throw new Error('Enrichment failed');
                const data = await response.json();

                if (data.success && data.data) {
                    const enriched = data.data;

                    // Smart Merge: Only overwrite if enriched data is valid/better
                    // 1. Maintain Price if enriched price is 0 (crawler sometimes fails on price)
                    const finalPrice = (enriched.price && enriched.price > 0) ? enriched.price : product.price;

                    // 2. Maintain Shipping Cost logic
                    // If enriched returns 0 but initial search had a cost, it might be a crawl error or "Free" detection.
                    // However, Domeggook search result (initial) is usually accurate for shipping cost summary.
                    // We will trust enriched ONLY if it's explicitly valid or if initial was undefined.
                    // If enriched says 0 (Free), we accept it. But if enriched is undefined, we keep initial.
                    let finalShippingCost = product.shippingCost;
                    if (enriched.shippingCost !== undefined) {
                        // Only accept 0 (Free) if original was also free/undefined.
                        // If original was > 0, and enriched is 0, we assume flawed crawl and keep original.
                        if (enriched.shippingCost === 0 && (product.shippingCost || 0) > 0) {
                            console.warn("Enrichment returned 0 shipping cost but initial was", product.shippingCost, "- keeping initial.");
                            finalShippingCost = product.shippingCost;
                        } else {
                            finalShippingCost = enriched.shippingCost;
                        }
                    }

                    // 3. Maintain Shipping Text
                    let finalShippingText = product.shippingText;
                    if (enriched.shippingText) {
                        finalShippingText = enriched.shippingText;
                    }

                    // Update State with full merged details
                    const mergedProduct = {
                        ...product,
                        ...enriched,
                        price: finalPrice,
                        shippingCost: finalShippingCost,
                        shippingText: finalShippingText,
                        // Ensure we keep initial info if enrichment misses it
                        supplierName: enriched.supplierName || product.supplierName,
                        minOrderQuantity: enriched.minOrderQuantity || product.minOrderQuantity
                    };

                    setSelectedProduct(mergedProduct);

                    // Update Form with enriched details
                    form.setValue("supplierName", mergedProduct.supplierName || "");

                    // Bundle Price Calculation: If MOQ > 1, Supply Price = Unit Price * MOQ
                    const moq = mergedProduct.minOrderQuantity || 1;
                    const totalSupplyPrice = finalPrice * moq;

                    form.setValue("supplyPrice", totalSupplyPrice); // Set Supply Price (Wholesale * MOQ)
                    form.setValue("price", totalSupplyPrice); // Init Selling Price to Cost initially
                    form.setValue("originalPrice", finalPrice); // Init Original Price
                    if (mergedProduct.shippingCost !== undefined) {
                        form.setValue("shippingCost", mergedProduct.shippingCost);
                    }
                    if (mergedProduct.tags && mergedProduct.tags.length > 0) {
                        form.setValue("tags", mergedProduct.tags.join(', '));
                    }

                    toast.success("상세 옵션을 성공적으로 불러왔습니다!");
                }
            } catch (error) {
                console.error("Enrichment error:", error);
                toast.error("상세 정보를 가져오는 데 실패했습니다. (기본 정보만 사용됩니다)");
            }
        } else {
            toast.success("상품이 선택되었습니다. 'AI 최적화'를 클릭하여 정보를 개선하세요.");
        }
    };

    const handleOptimize = async () => {
        const productName = form.getValues("productName");
        const category = form.getValues("category");

        if (!productName) {
            toast.error("상품 이름을 입력하거나 상품을 선택한 후 최적화를 진행해주세요.");
            return;
        }

        setIsOptimizing(true);
        try {
            const response = await fetch('/api/analysis/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productContext: {
                        name: productName,
                        category: category,
                        price: form.getValues("price"),
                        description: form.getValues("description"),
                        brand: form.getValues("supplierName"), // Use supplier name as brand hint
                        moq: selectedProduct?.minOrderQuantity || 1 // Pass MOQ for Bundling Strategy
                    }
                }),
            });
            if (!response.ok) throw new Error('Optimization failed');
            const data = await response.json();

            if (data.success && data.data) {
                setAiResult(data.data);

                // Replace tags with AI keywords (remove crawled junk)
                const newKeywords = data.data.keywords || [];
                if (newKeywords.length > 0) {
                    form.setValue("tags", newKeywords.join(', '));
                    toast.success("AI 분석 완료! 추천 키워드로 교체되었습니다.");
                } else {
                    toast.success("AI 분석 완료! (추천된 키워드가 없습니다)");
                }

                if (!form.getValues("category")) {
                    form.setValue("category", data.data.categorySuggestion);
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("상품 정보 최적화에 실패했습니다.");
        } finally {
            setIsOptimizing(false);
        }
    };

    const handlePricingAnalysis = async () => {
        // Use Supply Price for Cost Analysis
        const costPrice = form.getValues("supplyPrice") || selectedProduct?.price;

        if (!costPrice || costPrice <= 0) {
            toast.error("도매가 정보가 없습니다.");
            return;
        }

        setIsPricing(true);
        try {
            const response = await fetch('/api/analysis/pricing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    totalCost: costPrice,
                    shippingCost: form.getValues("shippingCost") || 3000,
                    feeRate,
                    unitCount: selectedProduct?.minOrderQuantity || 1 // Pass Unit Count
                }),
            });
            if (!response.ok) throw new Error('Pricing analysis failed');
            const data = await response.json();

            if (data.success && data.data) {
                setPricingResult(data.data);

                // Auto-apply Discount Strategy if available
                if (data.data.discountStrategy?.originalPrice) {
                    form.setValue("originalPrice", data.data.discountStrategy.originalPrice);
                } else {
                    // Default to recommended price if no strategy
                    form.setValue("originalPrice", data.data.recommendedPrice);
                }

                // Auto-fill Selling Price with Recommendation
                form.setValue("price", data.data.recommendedPrice);

                // Auto-calc Discount Percent
                const recommended = data.data.recommendedPrice;
                const original = data.data.discountStrategy?.originalPrice || recommended;
                if (original > recommended) {
                    const percent = Math.round((1 - recommended / original) * 100);
                    form.setValue("discountPercent", percent);
                } else {
                    form.setValue("discountPercent", 0);
                }

                toast.success("마진 분석이 완료되었습니다!");
            }
        } catch (error) {
            console.error(error);
            toast.error("가격 분석에 실패했습니다.");
        } finally {
            setIsPricing(false);
        }
    };

    // --- Center Check Logic ---
    const [isCheckingCenters, setIsCheckingCenters] = useState(false);
    const [centerList, setCenterList] = useState<{ outbound: any[], return: any[] } | null>(null);

    const handleCheckCenters = async () => {
        setIsCheckingCenters(true);
        try {
            const [outboundRes, returnRes] = await Promise.all([
                fetch('/api/coupang/shipping-places'),
                fetch('/api/coupang/return-centers')
            ]);

            const outboundJson = await outboundRes.json();
            const returnJson = await returnRes.json();

            if (outboundJson.ok && returnJson.ok) {
                // The new endpoints return { ok: true, coupang: { content: [...] } }
                // Need to map this to the structure expected by the UI or update UI access
                const outContent = outboundJson.coupang?.content || outboundJson.coupang?.data?.content || [];
                const retContent = returnJson.coupang?.content || returnJson.coupang?.data?.content || [];

                setCenterList({
                    outbound: outContent,
                    return: retContent
                });

                // Populate Dropdowns
                setOutboundCenters(outContent);
                setReturnCenters(retContent);

                // Auto-select first return center if available and not selected
                if (retContent.length > 0 && !selectedReturn) {
                    setSelectedReturn(retContent[0].returnCenterCode);
                }
                toast.success("배송지 정보를 성공적으로 불러왔습니다!");
            } else {
                toast.error("Some API calls failed. Check console.");
                console.error("Fetch failed", { outbound: outboundJson, return: returnJson });
            }
        } catch (error) {
            console.error(error);
            toast.error("Error fetching centers.");
        } finally {
            setIsCheckingCenters(false);
        }
    };

    const applyAiTitle = (title: string) => {
        form.setValue("productName", title);
        toast.success("상품명이 업데이트되었습니다.");
    };

    const addKeyword = (keyword: string) => {
        const currentTags = form.getValues("tags") || "";
        const tagsArray = currentTags.split(',').map(t => t.trim()).filter(Boolean);
        if (!tagsArray.includes(keyword)) {
            const newTags = [...tagsArray, keyword].join(', ');
            form.setValue("tags", newTags);
            toast.success("키워드가 추가되었습니다.");
        }
    };

    const formatKRW = (price: number) => {
        return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(price);
    };

    return (
        <div className="flex flex-col items-center py-10 gap-6">

            {/* 1. Search Section */}
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <CardTitle>1. 상품 소싱 (도매꾹)</CardTitle>
                    <CardDescription>
                        도매꾹 상품 링크를 입력하여 정보를 자동으로 채우거나, 키워드로 검색하세요.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2 mb-6">
                        <Input
                            placeholder="도매꾹 URL 붙여넣기 또는 키워드 입력 (예: 아이폰 케이스)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button onClick={handleSearch} disabled={isSearching} className="min-w-[100px]">
                            {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                            불러오기 / 검색
                        </Button>
                    </div>

                    {selectedProduct && (
                        <div className="p-4 border rounded-lg bg-muted/20 mb-4">
                            <h4 className="text-sm font-semibold mb-2">선택된 상품 및 공급사 정보</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">상품명:</span> <span className="font-medium">{selectedProduct.name}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">판매가:</span> <span className="font-medium text-red-500">{formatKRW(selectedProduct.price)}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">판매자:</span> <span className="font-medium">{selectedProduct.supplierName || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">배송비:</span>
                                    <span className="font-medium mr-2">{selectedProduct.shippingText || '-'}</span>
                                    {selectedProduct.minOrderQuantity && selectedProduct.minOrderQuantity > 1 && (
                                        <Badge variant="outline" className="text-yellow-600 bg-yellow-50 border-yellow-200">
                                            최소 {selectedProduct.minOrderQuantity}개
                                        </Badge>
                                    )}
                                </div>
                                <div className="col-span-2">
                                    <span className="text-muted-foreground">사업장 소재지:</span> <span className="font-medium">{selectedProduct.supplierAddress || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">사업자 번호:</span> <span className="font-medium">{selectedProduct.supplierBizNo || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">이미지 사용:</span>
                                    {selectedProduct.imageUsageText ? (
                                        <Badge
                                            variant="outline"
                                            className={`ml-2 ${selectedProduct.imageUsageText.includes("허용")
                                                ? "bg-green-50 text-green-700 border-green-200"
                                                : "bg-red-50 text-red-700 border-red-200"
                                                }`}
                                        >
                                            {selectedProduct.imageUsageText}
                                        </Badge>
                                    ) : (
                                        <span className="ml-2 font-medium text-muted-foreground">확인 필요</span>
                                    )}
                                </div>
                                {selectedProduct.options && selectedProduct.options.length > 0 && (
                                    <div className="col-span-2 mt-2 pt-2 border-t">
                                        <span className="text-muted-foreground block mb-1">옵션 정보:</span>
                                        <div className="flex flex-wrap gap-1">
                                            {selectedProduct.options.map((opt, i) => (
                                                <div key={i} className="text-xs">
                                                    <span className="font-semibold">{opt.name}:</span> {opt.values.slice(0, 5).join(', ')}{opt.values.length > 5 ? '...' : ''}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {searchResults.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-1">
                            {searchResults.map((product, idx) => (
                                <div
                                    key={idx}
                                    className={`relative border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${selectedProduct === product ? 'ring-2 ring-primary bg-primary/5' : 'bg-card'}`}
                                    onClick={() => handleSelectProduct(product)}
                                >
                                    {selectedProduct === product && (
                                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                                            <Check className="h-3 w-3" />
                                        </div>
                                    )}
                                    <div className="flex gap-3">
                                        {product.imageUrl ? (
                                            <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-md bg-muted" />
                                        ) : (
                                            <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">No Img</div>
                                        )}
                                        <div className="flex-1 overflow-hidden">
                                            <p className="font-medium text-sm truncate" title={product.name}>{product.name}</p>
                                            <p className="text-sm font-bold text-primary mt-1">{formatKRW(product.price)}</p>
                                            <div className="flex flex-col gap-1 mt-1">
                                                <Badge variant="secondary" className="text-[10px] h-5 px-1 w-fit">{product.site}</Badge>
                                                <div className="flex items-center text-xs text-muted-foreground gap-2">
                                                    <span>배송: {product.shippingText || `${product.shippingCost?.toLocaleString()}원`}</span>
                                                    {product.minOrderQuantity && product.minOrderQuantity > 1 && (
                                                        <span className="text-yellow-600 font-medium">
                                                            (최소 {product.minOrderQuantity}개)
                                                        </span>
                                                    )}
                                                </div>
                                                {product.supplierName && <span className="text-xs text-muted-foreground">판매자: {product.supplierName}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Form */}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-4xl space-y-6">

                    {/* 2. Product Details & Optimization */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>2. 상품 상세 정보 및 AI 최적화</CardTitle>
                                <CardDescription>
                                    정보를 수정하고 AI를 사용하여 SEO 최적화된 콘텐츠를 생성하세요.
                                </CardDescription>
                            </div>
                            <Button
                                type="button"
                                variant="default"
                                size="sm"
                                onClick={handleOptimize}
                                disabled={isOptimizing}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                {isOptimizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                AI 최적화
                            </Button>
                        </CardHeader>
                        <CardContent>

                            {/* AI Results Section */}
                            {aiResult && (
                                <div className="mb-6 p-4 border border-purple-200 bg-purple-50 rounded-lg dark:bg-purple-900/20 dark:border-purple-800">
                                    <h4 className="flex items-center text-sm font-semibold text-purple-700 dark:text-purple-300 mb-3">
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        AI 분석 결과 (클릭하여 적용)
                                    </h4>

                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-xs text-muted-foreground font-medium uppercase">추천 상품명 (클릭하여 적용)</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-sm font-medium">{aiResult.optimizedName}</p>
                                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => applyAiTitle(aiResult.optimizedName)} title="Apply">
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {aiResult.alternativeNames.length > 0 && (
                                            <div>
                                                <span className="text-xs text-muted-foreground font-medium uppercase">대체 상품명 (클릭하여 적용)</span>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {aiResult.alternativeNames.map((name, i) => (
                                                        <Badge
                                                            key={i}
                                                            variant="outline"
                                                            className="cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900"
                                                            onClick={() => applyAiTitle(name)}
                                                        >
                                                            {name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-muted-foreground font-medium uppercase">추천 키워드 (클릭하여 추가)</span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 text-xs px-2 text-purple-600 hover:text-purple-700 hover:bg-purple-100"
                                                    onClick={() => {
                                                        const currentTags = form.getValues("tags") || "";
                                                        const currentTagArray = currentTags.split(',').map(t => t.trim()).filter(Boolean);
                                                        const newKeywords = aiResult.keywords.filter(kw => !currentTagArray.includes(kw));

                                                        if (newKeywords.length === 0) {
                                                            toast.info("All keywords are already added.");
                                                            return;
                                                        }

                                                        const updatedTags = [...currentTagArray, ...newKeywords].join(', ');
                                                        form.setValue("tags", updatedTags);
                                                        toast.success(`Added ${newKeywords.length} keywords.`);
                                                    }}
                                                >
                                                    + 전체 추가
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {aiResult.keywords.map((kw, i) => (
                                                    <Badge
                                                        key={i}
                                                        variant="secondary"
                                                        className="cursor-pointer hover:bg-muted-foreground/20"
                                                        onClick={() => addKeyword(kw)}
                                                    >
                                                        + {kw}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column: Image Preview */}
                                <div>
                                    <FormField
                                        control={form.control}
                                        name="imageUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>상품 이미지 URL (대표 이미지)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://..." {...field} />
                                                </FormControl>
                                                <div className="mt-2 aspect-square w-full rounded-md border border-dashed bg-muted flex items-center justify-center overflow-hidden relative">
                                                    {field.value ? (
                                                        <img src={field.value} alt="Preview" className="w-full h-full object-contain" />
                                                    ) : (
                                                        <div className="text-muted-foreground flex flex-col items-center">
                                                            <span className="text-sm">이미지 미리보기</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Right Column: Details */}
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="productName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>상품명 (쿠팡 등록용)</FormLabel>
                                                <FormControl>
                                                    <div className="flex gap-2">
                                                        <Input placeholder="Enter product name" {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormDescription>
                                                    SEO 최적화된 상품명이 자동으로 입력됩니다.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {/* Original Price is hidden but calculated */}
                                        <FormField
                                            control={form.control}
                                            name="originalPrice"
                                            render={({ field }) => (
                                                <FormItem className="hidden">
                                                    <FormControl>
                                                        <Input type="number" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="discountPercent"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>할인율 (%)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            placeholder="직접 입력"
                                                            {...field}
                                                            onChange={(e) => {
                                                                const rate = Number(e.target.value);
                                                                field.onChange(rate);
                                                                // Sync Original Price
                                                                const sellPrice = form.getValues("price");
                                                                if (sellPrice && rate > 0) {
                                                                    const orig = Math.round(sellPrice / (1 - rate / 100));
                                                                    form.setValue("originalPrice", orig);
                                                                }
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="supplyPrice"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>도매가 (공급가)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            readOnly
                                                            className="bg-gray-100"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="category"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>카테고리</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. Digital / Home" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between mb-2 mt-4">
                                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                                            <Truck className="h-5 w-5 text-purple-600" />
                                            Shipping Information
                                        </CardTitle>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" onClick={handleCheckCenters}>
                                                    {isCheckingCenters ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Search className="h-3 w-3 mr-1" />}
                                                    Check Centers
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl">
                                                <DialogHeader>
                                                    <DialogTitle>My Coupang Shipping Centers</DialogTitle>
                                                    <DialogDescription>
                                                        Use these codes in your .env.local file.
                                                    </DialogDescription>
                                                </DialogHeader>

                                                <div className="grid grid-cols-2 gap-4 mt-4 h-[400px]">
                                                    <div className="border rounded-md p-3">
                                                        <h4 className="font-semibold mb-2 flex items-center text-blue-600">
                                                            Outbound Centers (출고지)
                                                        </h4>
                                                        <ScrollArea className="h-[340px]">
                                                            {centerList?.outbound?.length ? (
                                                                <div className="space-y-2">
                                                                    {centerList.outbound.map((center: any) => (
                                                                        <div key={center.outboundShippingPlaceCode} className="text-sm p-2 bg-muted rounded">
                                                                            <div className="font-bold">{center.shippingPlaceName}</div>
                                                                            <div className="font-mono text-xs text-muted-foreground mt-1">Code: {center.outboundShippingPlaceCode}</div>
                                                                            <div className="text-xs mt-1">{center.placeAddresses?.[0]?.returnAddress}</div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-muted-foreground">No outbound centers found.</p>
                                                            )}
                                                        </ScrollArea>
                                                    </div>

                                                    <div className="border rounded-md p-3">
                                                        <h4 className="font-semibold mb-2 flex items-center text-red-600">
                                                            Return Centers (반품지)
                                                        </h4>
                                                        <ScrollArea className="h-[340px]">
                                                            {centerList?.return?.length ? (
                                                                <div className="space-y-2">
                                                                    {centerList.return.map((center: any) => (
                                                                        <div key={center.returnCenterCode} className="text-sm p-2 bg-muted rounded">
                                                                            <div className="font-bold">{center.shippingPlaceName}</div>
                                                                            <div className="font-mono text-xs text-muted-foreground mt-1">Code: {center.returnCenterCode}</div>
                                                                            <div className="text-xs mt-1">{center.placeAddresses?.[0]?.returnAddress}</div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-muted-foreground">No return centers found.</p>
                                                            )}
                                                        </ScrollArea>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="supplierName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>공급사명</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Seller Name" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="shippingCost"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>배송비 (원)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="sourceUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>도매꾹 상품 URL (필수)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://domeggook.com/..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="tags"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>검색어 / 태그 (콤마로 구분)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="summer, beach, vacation..." {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    입력된 태그는 쿠팡 검색어에 등록됩니다.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>상세 설명 (HTML)</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Product description..."
                                                    className="resize-none min-h-[100px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* 3. Shipping Configuration */}
                    <Card>
                        <CardHeader>
                            <CardTitle>3. 배송 및 반품 설정 (Coupang)</CardTitle>
                            <CardDescription>
                                쿠팡에 등록된 출고지 및 반품지 정보를 선택하세요.
                                <br />
                                <span className="text-xs text-muted-foreground">* 반품지는 'K-Space'가 기본 선택됩니다.</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Disabled/Auto Outbound Info */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium">출고지 (Outbound Center)</label>
                                <div className="p-2 bg-gray-100 rounded text-sm text-gray-600">
                                    공급사 정보에 맞춰 자동으로 생성/선택됩니다.
                                    <br />
                                    (Auto-generated based on Supplier Info)
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium">반품지 (Return Center)</label>
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={selectedReturn}
                                    onChange={(e) => setSelectedReturn(e.target.value)}
                                >
                                    <option value="" disabled>반품지를 선택하세요</option>
                                    {returnCenters.map((center: any) => (
                                        <option key={center.returnCenterCode} value={center.returnCenterCode}>
                                            {center.shippingPlaceName} ({center.shippingPlaceAddress || ''})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-muted-foreground">
                                    반품 수령 주소지입니다. (3PL/케이스페이스 권장)
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 4. Pricing Analysis */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>4. 마진 분석 및 가격 설정</CardTitle>
                                <CardDescription>
                                    마일을 분석하고 최적의 판매 가격을 설정하세요.
                                </CardDescription>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handlePricingAnalysis}
                                disabled={isPricing}
                            >
                                {isPricing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
                                export "마진 분석"
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <FormField
                                            control={form.control}
                                            name="shippingCost"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>배송비 (원)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">플랫폼 수수료 (%)</label>
                                        <Input
                                            type="number"
                                            value={feeRate}
                                            onChange={(e) => setFeeRate(Number(e.target.value))}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 mt-2 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border">
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="originalPrice"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>정상가 (MSRP)</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                placeholder="0"
                                                                {...field}
                                                                onChange={(e) => {
                                                                    const val = Number(e.target.value);
                                                                    field.onChange(val);
                                                                    // Sync: Change Rate, Keep Selling Fixed
                                                                    const sell = form.getValues("price");
                                                                    if (sell && val > 0) {
                                                                        const rate = Math.max(0, Math.min(99, Math.round(((val - sell) / val) * 100)));
                                                                        form.setValue("discountPercent", rate);
                                                                    }
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="discountPercent"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>할인율 (%)</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                placeholder="0"
                                                                {...field}
                                                                onChange={(e) => {
                                                                    const rate = Number(e.target.value);
                                                                    field.onChange(rate);
                                                                    // Sync: Change Original, Keep Selling Fixed (Reverse Markup Logic)
                                                                    const sellPrice = form.getValues("price");
                                                                    if (sellPrice && rate >= 0 && rate < 100) {
                                                                        const newOrig = Math.round(sellPrice / (1 - rate / 100));
                                                                        form.setValue("originalPrice", newOrig);
                                                                    }
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="price"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-blue-600 font-bold text-lg">판매가 (최종 가격)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            className="text-lg font-bold"
                                                            placeholder="0"
                                                            {...field}
                                                            onChange={(e) => {
                                                                const val = Number(e.target.value);
                                                                field.onChange(val);
                                                                // Sync: Change Original, Keep Rate Fixed (Reverse Markup)
                                                                const rate = form.getValues("discountPercent");
                                                                if (rate && rate >= 0 && rate < 100) {
                                                                    const newOrig = Math.round(val / (1 - rate / 100));
                                                                    form.setValue("originalPrice", newOrig);
                                                                } else {
                                                                    // If no rate, Original follows Price
                                                                    form.setValue("originalPrice", val);
                                                                }
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                </div>

                                <div className="md:col-span-2">
                                    {pricingResult ? (
                                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 h-full">
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">추천 판매가</p>
                                                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                                                        {formatKRW(form.getValues("price") || pricingResult.recommendedPrice)}
                                                    </p>
                                                    {pricingResult.alternatives && pricingResult.alternatives.length > 0 && (
                                                        <div className="flex gap-2 mt-2 flex-wrap">
                                                            {pricingResult.alternatives.map((altPrice) => (
                                                                <Button
                                                                    key={altPrice}
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-6 text-xs px-2"
                                                                    onClick={() => form.setValue("price", altPrice)}
                                                                >
                                                                    {formatKRW(altPrice)}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Discount Info */}
                                                    {(form.getValues("originalPrice") || pricingResult.originalPrice) && (
                                                        <div className="mt-3 text-xs text-muted-foreground">
                                                            <div className="flex items-center gap-1">
                                                                <span>정상가:</span>
                                                                <span className="line-through">{formatKRW(form.getValues("originalPrice") || pricingResult.originalPrice || 0)}</span>
                                                                <span className="text-red-500 font-bold">
                                                                    ({Math.round((1 - ((form.getValues("price") || pricingResult.recommendedPrice) / (form.getValues("originalPrice") || pricingResult.originalPrice || 1))) * 100)}% OFF)
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <div className="mb-2">
                                                        <p className="text-xs text-muted-foreground">매입 원가 (도매+배송)</p>
                                                        <p className="text-sm font-medium text-muted-foreground">
                                                            {(() => {
                                                                const cost = (form.watch("supplyPrice") || selectedProduct?.price || 0) + (form.watch("shippingCost") || 0);
                                                                return formatKRW(cost);
                                                            })()}
                                                        </p>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">예상 마진</p>
                                                    <div className="flex items-baseline gap-2">
                                                        <p className="text-2xl font-bold">
                                                            {(() => {
                                                                const currentPrice = form.watch("price") || 0;
                                                                const cost = (form.watch("supplyPrice") || selectedProduct?.price || 0) + (form.watch("shippingCost") || 0);
                                                                const fee = currentPrice * (feeRate / 100);
                                                                const profit = currentPrice - cost - fee;
                                                                return formatKRW(Math.round(profit));
                                                            })()}
                                                        </p>
                                                        <Badge variant={(() => {
                                                            const currentPrice = form.watch("price") || 0;
                                                            const cost = (form.watch("supplyPrice") || selectedProduct?.price || 0) + (form.watch("shippingCost") || 0);
                                                            const fee = currentPrice * (feeRate / 100);
                                                            const profit = currentPrice - cost - fee;
                                                            const marginRate = currentPrice > 0 ? ((profit / currentPrice) * 100) : 0;
                                                            return marginRate > 20 ? "default" : "destructive";
                                                        })()}>
                                                            {(() => {
                                                                const currentPrice = form.watch("price") || 0;
                                                                const cost = (form.watch("supplyPrice") || selectedProduct?.price || 0) + (form.watch("shippingCost") || 0);
                                                                const fee = currentPrice * (feeRate / 100);
                                                                const profit = currentPrice - cost - fee;
                                                                const marginRate = currentPrice > 0 ? ((profit / currentPrice) * 100).toFixed(1) : "0";
                                                                return `${marginRate}%`;
                                                            })()}
                                                        </Badge>
                                                    </div>

                                                </div>
                                            </div>

                                            <div className="text-sm text-muted-foreground bg-white/50 dark:bg-black/20 p-2 rounded">
                                                <p className="font-medium mb-1">분석 결과:</p>
                                                {pricingResult.reasoning || "Based on competitive analysis and desired margin."}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-full border border-dashed rounded-lg bg-muted/50 p-6 text-muted-foreground text-sm">
                                            '마진 분석' 버튼을 눌러 수익성을 확인하세요.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-3 pt-6 border-t items-center bg-muted/20">
                            <span className="text-sm text-muted-foreground mr-auto">
                                * 등록 전 모든 정보가 정확한지 확인해주세요.
                            </span>
                            <Button type="button" variant="ghost" onClick={() => form.reset()}>폼 초기화</Button>
                            <Button
                                type="submit"
                                size="lg"
                                className="bg-blue-600 hover:bg-blue-700"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "상품 등록 (Coupang)"}
                            </Button>
                        </CardFooter>
                    </Card>

                </form >
            </Form >
        </div >
    );
}
