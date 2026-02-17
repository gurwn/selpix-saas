export interface TrendAnalysis {
  keyword: string
  demandScore: number           // 0-100 (DataLab trend-based)
  competitionScore: number      // 0-100 (supply count inverse)
  profitabilityScore: number    // 0-100 (margin rate-based)
  seasonalityScore: number      // 0-100 (CV-based, higher = more stable)
  totalScore: number            // weighted composite
  grade: Grade
  trendDirection: TrendDirection
  peakMonths: number[]
  avgMarginRate: number
  supplyCount: number
  relatedKeywords: string[]
  searchVolume?: {
    pc: number
    mobile: number
    total: number
  }
  naverCompIdx?: string         // "높음" | "중간" | "낮음"
  competitionRatio?: number     // 상품수/검색수 (아이템스카우트 경쟁강도)
}

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D'
export type TrendDirection = 'rising' | 'stable' | 'declining'

export interface CompetitionData {
  keyword: string
  supplyCount: number
  score: number     // 0-100
  level: '블루오션' | '틈새시장' | '보통' | '경쟁심화' | '레드오션'
}

export interface ProfitabilityData {
  keyword: string
  avgWholesalePrice: number
  avgMarginRate: number
  recommendedPriceRange: { min: number; max: number }
  score: number     // 0-100
  sampleCount: number
}

export interface SeasonalityData {
  keyword: string
  cv: number                    // coefficient of variation
  score: number                 // 0-100 (higher = more stable)
  peakMonths: number[]
  label: '연중 안정' | '약한 시즌성' | '시즌성 있음' | '강한 시즌성'
}

export interface DataLabPoint {
  period: string
  ratio: number
}

export interface SurgeResult {
  keyword: string
  recentAvg: number
  previousAvg: number
  changeRate: number            // percentage change
  direction: TrendDirection
}

export interface CategoryTrendResult {
  categoryCode: string
  categoryName: string
  trend: DataLabPoint[]
  summary: {
    avgRatio: number
    maxRatio: number
    minRatio: number
    direction: TrendDirection
  }
}

export interface AnalyzeRequest {
  keywords: string[]
}

export interface AnalyzeResponse {
  analyses: TrendAnalysis[]
}
