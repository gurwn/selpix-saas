/**
 * Pricing Calculator Logic for Selpix
 * Handles standard e-commerce pricing formulas including platform fees, shipping, and target margins.
 */

export interface PricingInput {
    baseCost: number;       // 공급가 (원가)
    targetMarginRate: number; // 목표 마진율 (%)
    platformFeeRate: number;  // 오픈마켓 수수료 (%)
    shippingCost: number;     // 배송비
    extraCost: number;        // 기타 비용 (패키징 등)
}

export interface PricingResult {
    minPrice: number;       // 최소 판매가
    recPrice: number;       // 권장 판매가
    maxPrice: number;       // 최대 판매가 (옵션)
    expectedNetProfit: number; // 예상 순수익
    breakEvenPrice: number;    // 손익분기점
}

/**
 * Calculates the selling price based on cost and target margin.
 * Formula: Selling Price = (Cost + Shipping + Extra) / (1 - Margin% - Fee%)
 * Note: This formula ensures the margin is calculated on the *Selling Price* (Revenue), not Cost.
 */
export function calculateTargetPrice(input: PricingInput): number {
    const totalCost = input.baseCost + input.shippingCost + input.extraCost;
    const denominator = 1 - (input.targetMarginRate / 100) - (input.platformFeeRate / 100);

    if (denominator <= 0) return 0; // Invalid margin/fee combination

    const rawPrice = totalCost / denominator;
    return roundToNearest(rawPrice, 100); // Standard KRW rounding
}

/**
 * Calculates the actual margin and profit based on a specific selling price.
 */
export function calculateProfit(sellingPrice: number, input: Omit<PricingInput, "targetMarginRate">) {
    const feeAmount = sellingPrice * (input.platformFeeRate / 100);
    const totalCost = input.baseCost + input.shippingCost + input.extraCost;
    const netProfit = sellingPrice - totalCost - feeAmount;
    const marginRate = (netProfit / sellingPrice) * 100;

    return {
        netProfit: Math.floor(netProfit),
        marginRate: Number(marginRate.toFixed(2)),
        feeAmount: Math.floor(feeAmount),
    };
}

/**
 * rounds a number to the nearest unit (e.g., 100 KRW)
 */
function roundToNearest(value: number, unit: number): number {
    return Math.ceil(value / unit) * unit;
}

export function generatePricingScenarios(input: PricingInput): PricingResult {
    // 1. Recommended Price (Target Margin)
    const recPrice = calculateTargetPrice(input);

    // 2. Min Price (Lower Margin, e.g., Target - 10%, but not below 5% net)
    const minMarginInput = { ...input, targetMarginRate: Math.max(5, input.targetMarginRate - 10) };
    const minPrice = calculateTargetPrice(minMarginInput);

    // 3. Max Price (Higher Margin, e.g., Target + 10%)
    const maxMarginInput = { ...input, targetMarginRate: input.targetMarginRate + 15 };
    const maxPrice = calculateTargetPrice(maxMarginInput);

    // 4. Break Even (0% Margin)
    const breakEvenInput = { ...input, targetMarginRate: 0 };
    const breakEvenPrice = calculateTargetPrice(breakEvenInput);

    const { netProfit } = calculateProfit(recPrice, input);

    return {
        minPrice,
        recPrice,
        maxPrice,
        expectedNetProfit: netProfit,
        breakEvenPrice,
    };
}
