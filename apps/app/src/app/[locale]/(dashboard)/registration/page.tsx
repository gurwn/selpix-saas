"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Loader2, Search, Check, Sparkles, RefreshCw, Calculator, DollarSign } from "lucide-react";
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
    category: z.string().optional(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    sourceUrl: z.string().optional(),
    tags: z.string().optional(), // Comma separated tags
});

interface SearchResult {
    name: string;
    price: number;
    site: string;
    imageUrl?: string;
    sourceUrl?: string;
}

interface AIAnalysisResult {
    optimizedName: string;
    alternativeNames: string[];
    keywords: string[];
    categorySuggestion: string;
}

interface PricingResult {
    recommendedPrice: number;
    margin: number;
    marginRate: number;
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
    const [shippingCost, setShippingCost] = useState(3000);
    const [feeRate, setFeeRate] = useState(10.8);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. Define your form.
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            productName: "",
            price: 0,
            category: "",
            description: "",
            imageUrl: "",
            sourceUrl: "",
            tags: "",
        },
    });

    // 2. Define a submit handler.
    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const payload = {
                name: values.productName,
                wholesalePrice: values.price,
                recommendedPrice: pricingResult?.recommendedPrice || Math.floor(values.price * 1.5), // Fallback logic
                margin: pricingResult?.marginRate || 20, // Fallback
                category: values.category,
                imageUrl: values.imageUrl,
                sourceUrl: values.sourceUrl,
                tags: values.tags,
                description: values.description
            };

            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to register product");
            }

            const data = await response.json();

            toast.success("Product registered successfully!");

            // Redirect to products list or dashboard
            router.push('/');

        } catch (error) {
            console.error(error);
            toast.error("Failed to register product. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleSearch = async () => {
        if (!searchTerm) return;
        setIsSearching(true);
        setSearchResults([]);
        setSelectedProduct(null);
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
                if (data.products.length === 0) toast.info("No products found.");
            } else {
                toast.error("Failed to fetch products.");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred during search.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectProduct = (product: SearchResult) => {
        setSelectedProduct(product);
        form.setValue("productName", product.name);
        form.setValue("price", product.price);
        form.setValue("sourceUrl", product.sourceUrl || "");
        form.setValue("imageUrl", product.imageUrl || "");
        setAiResult(null);
        setPricingResult(null);
        toast.success("Product selected! Click 'Optimize' to improve metadata.");
    };

    const handleOptimize = async () => {
        const productName = form.getValues("productName");
        const category = form.getValues("category");

        if (!productName) {
            toast.error("Please enter specific product name or select a product before optimizing.");
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
                    }
                }),
            });
            if (!response.ok) throw new Error('Optimization failed');
            const data = await response.json();

            if (data.success && data.data) {
                setAiResult(data.data);
                toast.success("AI Analysis Complete!");
                if (!form.getValues("category")) {
                    form.setValue("category", data.data.categorySuggestion);
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to optimize product metadata.");
        } finally {
            setIsOptimizing(false);
        }
    };

    const handlePricingAnalysis = async () => {
        const costPrice = form.getValues("price");
        if (!costPrice || costPrice <= 0) {
            toast.error("Please enter a valid Wholesale Price.");
            return;
        }

        setIsPricing(true);
        try {
            const response = await fetch('/api/analysis/pricing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    totalCost: costPrice,
                    shippingCost,
                    feeRate
                }),
            });
            if (!response.ok) throw new Error('Pricing analysis failed');
            const data = await response.json();

            if (data.success && data.data) {
                setPricingResult(data.data);
                toast.success("Pricing Analysis Complete!");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to analyze pricing.");
        } finally {
            setIsPricing(false);
        }
    };

    const applyAiTitle = (title: string) => {
        form.setValue("productName", title);
        toast.success("Updated product name.");
    };

    const addKeyword = (keyword: string) => {
        const currentTags = form.getValues("tags") || "";
        const tagsArray = currentTags.split(',').map(t => t.trim()).filter(Boolean);
        if (!tagsArray.includes(keyword)) {
            const newTags = [...tagsArray, keyword].join(', ');
            form.setValue("tags", newTags);
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
                    <CardTitle>1. Product Sourcing</CardTitle>
                    <CardDescription>
                        Search for products from Domeggook to auto-fill details.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2 mb-6">
                        <Input
                            placeholder="Enter keyword (e.g. iPhone Case)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button onClick={handleSearch} disabled={isSearching}>
                            {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                            Search
                        </Button>
                    </div>

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
                                            <div className="flex items-center gap-1 mt-1">
                                                <Badge variant="secondary" className="text-[10px] h-5 px-1">{product.site}</Badge>
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
                                <CardTitle>2. Product Details & AI Optimization</CardTitle>
                                <CardDescription>
                                    Review details and use AI to create SEO-friendly content.
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
                                AI Optimize
                            </Button>
                        </CardHeader>
                        <CardContent>

                            {/* AI Results Section */}
                            {aiResult && (
                                <div className="mb-6 p-4 border border-purple-200 bg-purple-50 rounded-lg dark:bg-purple-900/20 dark:border-purple-800">
                                    <h4 className="flex items-center text-sm font-semibold text-purple-700 dark:text-purple-300 mb-3">
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        AI Suggestions
                                    </h4>

                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-xs text-muted-foreground font-medium uppercase">Recommneded Title</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-sm font-medium">{aiResult.optimizedName}</p>
                                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => applyAiTitle(aiResult.optimizedName)} title="Apply">
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {aiResult.alternativeNames.length > 0 && (
                                            <div>
                                                <span className="text-xs text-muted-foreground font-medium uppercase">Alternatives</span>
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
                                            <span className="text-xs text-muted-foreground font-medium uppercase">Keywords (Click to add)</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
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
                                                <FormLabel>Product Image URL</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://..." {...field} />
                                                </FormControl>
                                                <div className="mt-2 aspect-square w-full rounded-md border border-dashed bg-muted flex items-center justify-center overflow-hidden relative">
                                                    {field.value ? (
                                                        <img src={field.value} alt="Preview" className="w-full h-full object-contain" />
                                                    ) : (
                                                        <div className="text-muted-foreground flex flex-col items-center">
                                                            <span className="text-sm">Image Preview</span>
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
                                                <FormLabel>Product Name</FormLabel>
                                                <FormControl>
                                                    <div className="flex gap-2">
                                                        <Input placeholder="Enter product name" {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormDescription>
                                                    SEO optimized title acts as the item name.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="price"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Wholesale Price (KRW)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" {...field} />
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
                                                    <FormLabel>Category</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. Digital / Home" {...field} />
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
                                                <FormLabel>Source URL</FormLabel>
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
                                                <FormLabel>Keywords / Tags</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="summer, beach, vacation..." {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    Comma separated keywords.
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
                                            <FormLabel>Description</FormLabel>
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

                    {/* 3. Pricing Analysis */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>3. Pricing Strategy</CardTitle>
                                <CardDescription>
                                    Analyze margins and set optimal selling price.
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
                                Analyze Margin
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Shipping Cost (KRW)</label>
                                        <Input
                                            type="number"
                                            value={shippingCost}
                                            onChange={(e) => setShippingCost(Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Platform Fee (%)</label>
                                        <Input
                                            type="number"
                                            value={feeRate}
                                            onChange={(e) => setFeeRate(Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    {pricingResult ? (
                                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 h-full">
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Recommended Price</p>
                                                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                                                        {formatKRW(pricingResult.recommendedPrice)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Est. Margin</p>
                                                    <div className="flex items-baseline gap-2">
                                                        <p className="text-2xl font-bold">
                                                            {formatKRW(pricingResult.margin)}
                                                        </p>
                                                        <Badge variant={pricingResult.marginRate > 20 ? "default" : "destructive"}>
                                                            {pricingResult.marginRate}%
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-sm text-muted-foreground bg-white/50 dark:bg-black/20 p-2 rounded">
                                                <p className="font-medium mb-1">Analysis:</p>
                                                {pricingResult.reasoning || "Based on competitive analysis and desired margin."}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-full border border-dashed rounded-lg bg-muted/50 p-6 text-muted-foreground text-sm">
                                            Click 'Analyze Margin' to see profitability calculation.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-3 pt-6 border-t items-center bg-muted/20">
                            <span className="text-sm text-muted-foreground mr-auto">
                                * Ensure all details are correct before registering.
                            </span>
                            <Button type="button" variant="ghost" onClick={() => form.reset()}>Reset Form</Button>
                            <Button
                                type="submit"
                                size="lg"
                                className="bg-blue-600 hover:bg-blue-700"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Register Product"}
                            </Button>
                        </CardFooter>
                    </Card>

                </form>
            </Form>
        </div>
    );
}
