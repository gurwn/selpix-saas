import type { ProfitabilityData } from './types'

interface WholesaleItem {
  price: number
  name: string
}

const CONSIGNMENT_COMMISSION_RATE = 0.08
const DEFAULT_SHIPPING = 3000
const DEFAULT_PACKAGING = 500
const PRICE_MULTIPLIER = 2.5

export function analyzeProfitability(
  keyword: string,
  wholesaleProducts: WholesaleItem[]
): ProfitabilityData {
  if (wholesaleProducts.length === 0) {
    return {
      keyword,
      avgWholesalePrice: 0,
      avgMarginRate: 0,
      recommendedPriceRange: { min: 0, max: 0 },
      score: 0,
      sampleCount: 0,
    }
  }

  // Take top N products by price (lower is better for margin)
  const sorted = [...wholesaleProducts]
    .filter((p) => p.price > 0)
    .sort((a, b) => a.price - b.price)
    .slice(0, 10)

  if (sorted.length === 0) {
    return {
      keyword,
      avgWholesalePrice: 0,
      avgMarginRate: 0,
      recommendedPriceRange: { min: 0, max: 0 },
      score: 0,
      sampleCount: 0,
    }
  }

  const margins = sorted.map((p) => {
    const sellingPrice = p.price * PRICE_MULTIPLIER
    const commission = sellingPrice * CONSIGNMENT_COMMISSION_RATE
    const netMargin = sellingPrice - p.price - DEFAULT_SHIPPING - DEFAULT_PACKAGING - commission
    const marginRate = sellingPrice > 0 ? (netMargin / sellingPrice) * 100 : 0
    return { wholesalePrice: p.price, sellingPrice, marginRate }
  })

  const avgWholesalePrice = Math.round(
    sorted.reduce((s, p) => s + p.price, 0) / sorted.length
  )
  const avgMarginRate =
    margins.reduce((s, m) => s + m.marginRate, 0) / margins.length

  const prices = margins.map((m) => m.sellingPrice)
  const recommendedPriceRange = {
    min: Math.round(Math.min(...prices)),
    max: Math.round(Math.max(...prices)),
  }

  let score: number
  if (avgMarginRate >= 40) score = 100
  else if (avgMarginRate >= 30) score = 80
  else if (avgMarginRate >= 20) score = 60
  else if (avgMarginRate >= 10) score = 40
  else score = 20

  return {
    keyword,
    avgWholesalePrice,
    avgMarginRate: Math.round(avgMarginRate * 10) / 10,
    recommendedPriceRange,
    score,
    sampleCount: sorted.length,
  }
}
