import { API_BASE_URL } from './utils'

const CRAWLER_BASE_URL = process.env.NEXT_PUBLIC_CRAWLER_URL || ''

interface CrawlerProduct {
  name: string
  price: number
  imageUrl?: string
  sourceUrl?: string
  site?: string
  minOrderQuantity?: number
  shippingCost?: number
  shippingText?: string
}

// Type definitions
export interface Product {
  id: number
  name: string
  wholesalePrice: number
  recommendedPrice: number
  margin: number
  competition: '낮음' | '중' | '높음'
  searchVolume: number
  category: string
  image: string
  source: string
  trend: 'up' | 'down' | 'stable'
  score: number
  createdAt: string
}

export interface Recommendation {
  id: number
  keyword: string
  products: RecommendedProduct[]
}

export interface RecommendedProduct {
  id: number
  name: string
  wholesalePrice: number
  recommendedPrice: number
  margin: number
  competition: '낮음' | '중' | '높음'
  searchVolume: number
  trend: 'up' | 'down' | 'stable'
  score: number
}

export interface WholesaleProduct {
  id: number
  name: string
  price: number
  source: string
  rating: number
  minOrder: number
  url: string
  image?: string
  site?: string
}

export interface MarginData {
  id?: number
  productName: string
  wholesalePrice: number
  sellingPrice: number
  shippingCost: number
  commission: number
  adCost: number
  packagingCost: number
  netMargin: number
  marginRate: number
  platform: 'rocket' | 'wing' | 'consignment'
  calculatedAt?: string
}

export interface DetailPage {
  id: number
  productName: string
  summary: string
  usps: string[]
  keywords: string[]
  template: string
  createdAt: string
}

export interface Registration {
  id: number
  productName: string
  category: string
  recommendedTitle: string
  price: number
  wholesalePrice: number
  status: 'ready' | 'pending' | 'completed' | 'failed'
  platform: 'rocket' | 'wing' | 'consignment'
  createdAt: string
}

export interface LogItem {
  id: number
  action: string
  productName: string
  status: 'success' | 'failed' | 'pending'
  price?: number
  details?: string
  timestamp: string
}

export interface Stats {
  totalProducts: number
  registeredToday: number
  totalMargin: number
  avgMarginRate: number
  weeklyGrowth: number
  monthlyRevenue: number
  successRate: number
  categories: Record<string, number>
  weeklyData: { date: string; revenue: number; products: number; margin: number }[]
}

// API Helper with error handling
async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
    if (!res.ok) {
      throw new Error(`API Error: ${res.status}`)
    }
    return res.json()
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

// Products API
export async function fetchProducts(): Promise<Product[]> {
  return apiRequest<Product[]>(`${API_BASE_URL}/products`)
}

export async function fetchProductById(id: number): Promise<Product> {
  return apiRequest<Product>(`${API_BASE_URL}/products/${id}`)
}

// Recommendations API
export async function fetchRecommendations(keyword?: string): Promise<Recommendation[]> {
  const url = keyword
    ? `${API_BASE_URL}/recommendations?keyword_like=${encodeURIComponent(keyword)}`
    : `${API_BASE_URL}/recommendations`
  return apiRequest<Recommendation[]>(url)
}

export async function searchRecommendations(keyword: string): Promise<RecommendedProduct[]> {
  try {
    const recommendations = await fetchRecommendations(keyword)
    if (recommendations.length > 0) {
      return recommendations[0].products
    }
    // Generate fallback products
    return generateMockProducts(keyword)
  } catch {
    return generateMockProducts(keyword)
  }
}

// Wholesale API
export async function fetchWholesale(keyword?: string): Promise<WholesaleProduct[]> {
  try {
    const url = keyword
      ? `${API_BASE_URL}/wholesale?keyword_like=${encodeURIComponent(keyword)}`
      : `${API_BASE_URL}/wholesale`
    const result = await apiRequest<{ id: number; keyword: string; products: WholesaleProduct[] }[]>(url)
    if (result.length > 0) {
      return result[0].products
    }
    return generateMockWholesale(keyword || '')
  } catch {
    return generateMockWholesale(keyword || '')
  }
}

export async function fetchWholesaleLive(
  keyword: string,
  options?: { minPrice?: number; maxPrice?: number; sites?: string[] }
): Promise<WholesaleProduct[]> {
  if (!keyword.trim()) return []

  const { minPrice = 0, maxPrice = 1000000, sites = ['domeggook'] } = options || {}

  try {
    const base = (CRAWLER_BASE_URL || '').replace(/\/$/, '')
    const endpoint = base
      ? `${base}/api/v1/crawler/search`
      : '/api/crawler/search'

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword, minPrice, maxPrice, sites })
    })

    if (!res.ok) {
      throw new Error(`Crawler API error: ${res.status}`)
    }

    const json = await res.json()
    const products: CrawlerProduct[] = json?.data?.products || []

    return products.map((product, index) => ({
      id: index + 1,
      name: product.name || '도매 상품',
      price: Math.max(0, product.price || 0),
      source: product.site === 'domeggook' ? '도매꾹' : product.site || '도매',
      rating: 4.3,
      minOrder: (product as any).minOrderQuantity || (product as any).minOrder || 1,
      url: product.sourceUrl || (product as any).url || '#',
      image: product.imageUrl || (product as any).image || 'https://via.placeholder.com/320x240?text=WH',
      site: product.site,
      shippingCost: (product as any).shippingCost,
      imageUsageStatus: (product as any).imageUsageStatus,
      imageUsageText: (product as any).imageUsageText,
      detailImages: (product as any).detailImages
    }))
  } catch (error) {
    console.error('fetchWholesaleLive error', error)
    return [] // 서버가 없을 때도 앱이 동작하도록 빈 배열 반환
  }
}

// Stats API
export async function fetchStats(): Promise<Stats> {
  return apiRequest<Stats>(`${API_BASE_URL}/stats`)
}

// Logs API
export async function fetchLogs(): Promise<LogItem[]> {
  return apiRequest<LogItem[]>(`${API_BASE_URL}/logs?_sort=timestamp&_order=desc`)
}

export async function createLog(log: Omit<LogItem, 'id'>): Promise<LogItem> {
  return apiRequest<LogItem>(`${API_BASE_URL}/logs`, {
    method: 'POST',
    body: JSON.stringify({ ...log, id: Date.now() }),
  })
}

// Registrations API
export async function fetchRegistrations(): Promise<Registration[]> {
  return apiRequest<Registration[]>(`${API_BASE_URL}/registrations?_sort=createdAt&_order=desc`)
}

export async function createRegistration(data: Omit<Registration, 'id' | 'createdAt'>): Promise<Registration> {
  return apiRequest<Registration>(`${API_BASE_URL}/registrations`, {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    }),
  })
}

// Margins API
export async function fetchMargins(): Promise<MarginData[]> {
  return apiRequest<MarginData[]>(`${API_BASE_URL}/margins`)
}

export async function saveMargin(data: Omit<MarginData, 'id' | 'calculatedAt'>): Promise<MarginData> {
  return apiRequest<MarginData>(`${API_BASE_URL}/margins`, {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      id: Date.now(),
      calculatedAt: new Date().toISOString(),
    }),
  })
}

// Detail Pages API
export async function fetchDetailPages(): Promise<DetailPage[]> {
  return apiRequest<DetailPage[]>(`${API_BASE_URL}/detailPages`)
}

export async function createDetailPage(data: Omit<DetailPage, 'id' | 'createdAt'>): Promise<DetailPage> {
  return apiRequest<DetailPage>(`${API_BASE_URL}/detailPages`, {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    }),
  })
}

// Margin Calculator (local calculation)
export function calculateMargin(data: {
  wholesalePrice: number
  sellingPrice: number
  shippingCost: number
  commissionRate: number
  adCost: number
  packagingCost: number
}): {
  netMargin: number
  marginRate: number
  roas: number
  breakEven: number
} {
  const { wholesalePrice, sellingPrice, shippingCost, commissionRate, adCost, packagingCost } = data
  const commission = sellingPrice * (commissionRate / 100)
  const netMargin = sellingPrice - wholesalePrice - shippingCost - commission - adCost - packagingCost
  const marginRate = (netMargin / sellingPrice) * 100
  const roas = adCost > 0 ? (sellingPrice / adCost) * 100 : 0
  const fixedCosts = wholesalePrice + shippingCost + packagingCost + adCost
  const breakEven = fixedCosts / (1 - commissionRate / 100)

  return {
    netMargin,
    marginRate,
    roas,
    breakEven,
  }
}

// Mock data generators for fallback
function generateMockProducts(keyword: string): RecommendedProduct[] {
  return [
    {
      id: Date.now() + 1,
      name: `${keyword} 프리미엄형`,
      wholesalePrice: Math.floor(Math.random() * 15000) + 5000,
      recommendedPrice: Math.floor(Math.random() * 30000) + 20000,
      margin: Math.floor(Math.random() * 30) + 35,
      competition: '중',
      searchVolume: Math.floor(Math.random() * 15000) + 5000,
      trend: 'up',
      score: Math.floor(Math.random() * 20) + 75,
    },
    {
      id: Date.now() + 2,
      name: `${keyword} 베이직`,
      wholesalePrice: Math.floor(Math.random() * 10000) + 3000,
      recommendedPrice: Math.floor(Math.random() * 20000) + 15000,
      margin: Math.floor(Math.random() * 30) + 40,
      competition: '낮음',
      searchVolume: Math.floor(Math.random() * 10000) + 3000,
      trend: 'stable',
      score: Math.floor(Math.random() * 20) + 70,
    },
    {
      id: Date.now() + 3,
      name: `${keyword} 고급형`,
      wholesalePrice: Math.floor(Math.random() * 20000) + 10000,
      recommendedPrice: Math.floor(Math.random() * 40000) + 30000,
      margin: Math.floor(Math.random() * 25) + 30,
      competition: '높음',
      searchVolume: Math.floor(Math.random() * 20000) + 8000,
      trend: 'up',
      score: Math.floor(Math.random() * 20) + 65,
    },
  ]
}

function generateMockWholesale(keyword: string): WholesaleProduct[] {
  return [
    {
      id: Date.now() + 1,
      name: `${keyword} 도매`,
      price: Math.floor(Math.random() * 10000) + 3000,
      source: '도매꾹',
      rating: 4.2,
      minOrder: 10,
      url: 'https://domeggook.com',
    },
    {
      id: Date.now() + 2,
      name: `${keyword} 공장직배송`,
      price: Math.floor(Math.random() * 8000) + 2000,
      source: '1688',
      rating: 4.0,
      minOrder: 50,
      url: 'https://1688.com',
    },
  ]
}

// Detail page generation (mock AI)
export function generateDetailPage(productUrl: string): DetailPage {
  const keyword = extractKeywordFromUrl(productUrl)

  return {
    id: Date.now(),
    productName: `${keyword} 프리미엄`,
    summary: `최고 품질의 ${keyword}입니다. 고객 만족도 98%를 자랑하며, 빠른 배송과 철저한 A/S를 제공합니다. 합리적인 가격에 프리미엄 품질을 경험해보세요.`,
    usps: [
      '프리미엄 품질 보장',
      '빠른 배송 (당일출고)',
      'A/S 1년 보장',
      '가성비 최고 제품',
      '고객 만족도 98%',
    ],
    keywords: [keyword, `${keyword}추천`, `인기${keyword}`, `${keyword}베스트`, `${keyword}판매`],
    template: 'premium',
    createdAt: new Date().toISOString(),
  }
}

function extractKeywordFromUrl(url: string): string {
  // Extract keyword from URL or generate default
  const keywords = ['이어폰', 'LED', '충전기', '상품']
  const matched = keywords.find(k => url.toLowerCase().includes(k.toLowerCase()))
  return matched || '상품'
}

// Registration title generator
export function generateRegistrationTitle(productName: string, template: number = 0): string {
  const templates = [
    `[당일발송] ${productName} 무료배송`,
    `[쿠팡추천] ${productName} 특가`,
    `[인기상품] ${productName} 빠른배송`,
    `[BEST] ${productName} 최저가`,
  ]
  return templates[template % templates.length]
}
