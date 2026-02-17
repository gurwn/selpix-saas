'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import {
  Search,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Star,
  Loader2,
  BarChart3,
  Target,
  Zap,
  RefreshCw,
  ShoppingCart,
  ArrowRight
} from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { fetchWholesaleLive } from '@/lib/api'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'

interface RecommendedProduct {
  id: number
  name: string
  wholesalePrice: number
  recommendedPrice: number
  margin: number
  competition: '낮음' | '중' | '높음'
  searchVolume: number
  trend: 'up' | 'down' | 'stable'
  coupangLink: string
  score: number
  image: string
}

interface WholesaleProduct {
  id: number
  name: string
  price: number
  source: string
  rating: number
  minOrder: number
  image: string
  url: string
}

// 키워드별 추천 상품 Mock 데이터베이스
const keywordDatabase: Record<string, RecommendedProduct[]> = {
  '무선 이어폰': [
    { id: 1, name: '프리미엄 TWS 무선 이어폰', wholesalePrice: 15000, recommendedPrice: 39900, margin: 45.2, competition: '중', searchVolume: 12500, trend: 'up', coupangLink: 'https://www.coupang.com/np/search?q=무선이어폰', score: 92, image: 'https://via.placeholder.com/120x120?text=TWS' },
    { id: 2, name: '스포츠 블루투스 이어폰 방수', wholesalePrice: 12000, recommendedPrice: 32900, margin: 52.1, competition: '낮음', searchVolume: 8900, trend: 'up', coupangLink: 'https://www.coupang.com/np/search?q=스포츠이어폰', score: 88, image: 'https://via.placeholder.com/120x120?text=Sport' },
    { id: 3, name: '노이즈캔슬링 헤드폰', wholesalePrice: 25000, recommendedPrice: 59900, margin: 38.5, competition: '높음', searchVolume: 18000, trend: 'stable', coupangLink: 'https://www.coupang.com/np/search?q=노이즈캔슬링', score: 78, image: 'https://via.placeholder.com/120x120?text=ANC' },
    { id: 4, name: '충전케이스 포함 이어폰', wholesalePrice: 18000, recommendedPrice: 45900, margin: 48.3, competition: '중', searchVolume: 15200, trend: 'up', coupangLink: 'https://www.coupang.com/np/search?q=이어폰충전케이스', score: 85, image: 'https://via.placeholder.com/120x120?text=Case' },
    { id: 5, name: '게이밍 이어폰 저지연', wholesalePrice: 22000, recommendedPrice: 54900, margin: 42.8, competition: '낮음', searchVolume: 6500, trend: 'up', coupangLink: 'https://www.coupang.com/np/search?q=게이밍이어폰', score: 90, image: 'https://via.placeholder.com/120x120?text=Gaming' },
  ],
  'LED 조명': [
    { id: 1, name: '스마트 LED 무드등', wholesalePrice: 8500, recommendedPrice: 24900, margin: 58.2, competition: '낮음', searchVolume: 7200, trend: 'up', coupangLink: 'https://www.coupang.com/np/search?q=LED무드등', score: 95, image: 'https://via.placeholder.com/120x120?text=Mood' },
    { id: 2, name: 'USB LED 스트립', wholesalePrice: 4500, recommendedPrice: 14900, margin: 65.1, competition: '중', searchVolume: 9500, trend: 'up', coupangLink: 'https://www.coupang.com/np/search?q=LED스트립', score: 91, image: 'https://via.placeholder.com/120x120?text=Strip' },
    { id: 3, name: 'LED 책상 스탠드', wholesalePrice: 12000, recommendedPrice: 32900, margin: 52.3, competition: '높음', searchVolume: 15000, trend: 'stable', coupangLink: 'https://www.coupang.com/np/search?q=LED스탠드', score: 82, image: 'https://via.placeholder.com/120x120?text=Desk' },
    { id: 4, name: '감성 인테리어 조명', wholesalePrice: 6500, recommendedPrice: 19900, margin: 61.8, competition: '낮음', searchVolume: 5800, trend: 'up', coupangLink: 'https://www.coupang.com/np/search?q=인테리어조명', score: 89, image: 'https://via.placeholder.com/120x120?text=Interior' },
  ],
  '충전기': [
    { id: 1, name: '고속 무선 충전기', wholesalePrice: 9000, recommendedPrice: 25900, margin: 55.2, competition: '중', searchVolume: 18500, trend: 'up', coupangLink: 'https://www.coupang.com/np/search?q=무선충전기', score: 88, image: 'https://via.placeholder.com/120x120?text=Wireless' },
    { id: 2, name: 'PD 고속 충전기 65W', wholesalePrice: 15000, recommendedPrice: 39900, margin: 48.5, competition: '높음', searchVolume: 22000, trend: 'up', coupangLink: 'https://www.coupang.com/np/search?q=PD충전기', score: 85, image: 'https://via.placeholder.com/120x120?text=PD65W' },
    { id: 3, name: '멀티 충전 스테이션', wholesalePrice: 18000, recommendedPrice: 45900, margin: 51.2, competition: '낮음', searchVolume: 8200, trend: 'stable', coupangLink: 'https://www.coupang.com/np/search?q=충전스테이션', score: 92, image: 'https://via.placeholder.com/120x120?text=Station' },
  ],
}

// 도매 검색 Mock 데이터
const wholesaleDatabase: Record<string, WholesaleProduct[]> = {
  '무선 이어폰': [
    { id: 1, name: '무선 이어폰 OEM 버전', price: 8500, source: '도매꾹', rating: 4.2, minOrder: 10, image: 'https://via.placeholder.com/80x80?text=1', url: 'https://domeggook.com' },
    { id: 2, name: '블루투스 이어폰 프리미엄', price: 12000, source: '도매꾹', rating: 4.5, minOrder: 5, image: 'https://via.placeholder.com/80x80?text=2', url: 'https://domeggook.com' },
    { id: 3, name: 'TWS 이어폰 공장직배송', price: 6800, source: '1688', rating: 4.0, minOrder: 50, image: 'https://via.placeholder.com/80x80?text=3', url: 'https://1688.com' },
    { id: 4, name: '고급형 무선 이어폰', price: 15000, source: '도매꾹', rating: 4.8, minOrder: 3, image: 'https://via.placeholder.com/80x80?text=4', url: 'https://domeggook.com' },
  ],
  'LED 조명': [
    { id: 1, name: 'LED 무드등 도매', price: 3500, source: '도매꾹', rating: 4.3, minOrder: 20, image: 'https://via.placeholder.com/80x80?text=1', url: 'https://domeggook.com' },
    { id: 2, name: 'USB LED 스트립 5m', price: 2800, source: '1688', rating: 4.1, minOrder: 100, image: 'https://via.placeholder.com/80x80?text=2', url: 'https://1688.com' },
    { id: 3, name: '스마트 LED 전구', price: 4500, source: '도매꾹', rating: 4.6, minOrder: 10, image: 'https://via.placeholder.com/80x80?text=3', url: 'https://domeggook.com' },
  ],
  '충전기': [
    { id: 1, name: '무선 충전기 패드', price: 5500, source: '도매꾹', rating: 4.4, minOrder: 10, image: 'https://via.placeholder.com/80x80?text=1', url: 'https://domeggook.com' },
    { id: 2, name: 'PD 충전기 OEM', price: 8000, source: '1688', rating: 4.2, minOrder: 30, image: 'https://via.placeholder.com/80x80?text=2', url: 'https://1688.com' },
  ],
}

// 인기 검색어
const popularKeywords = ['무선 이어폰', 'LED 조명', '충전기', '보조배터리', '스마트워치', '블루투스 스피커']

function RecommendationPageInner() {
  const searchParams = useSearchParams()
  const [keyword, setKeyword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([])
  const [wholesaleResults, setWholesaleResults] = useState<WholesaleProduct[]>([])
  const [activeTab, setActiveTab] = useState<'ai' | 'wholesale'>('ai')
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [selectedProduct, setSelectedProduct] = useState<RecommendedProduct | null>(null)

  const handleSearch = async (searchKeyword?: string) => {
    const searchTerm = searchKeyword || keyword
    if (!searchTerm.trim()) return

    setIsLoading(true)
    try {
      // 실시간 도매 검색 시도 (도매꾹 크롤러)
      let liveWholesale: WholesaleProduct[] = []
      try {
        liveWholesale = await fetchWholesaleLive(searchTerm, { sites: ['domeggook'], minPrice: 0, maxPrice: 1000000 })
      } catch (error) {
        console.error('Live wholesale search failed, falling back to mock data', error)
      }

      // 키워드에 맞는 데이터 찾기
      const matchedKey = Object.keys(keywordDatabase).find(key =>
        searchTerm.includes(key) || key.includes(searchTerm)
      )

      if (matchedKey) {
        setRecommendations(keywordDatabase[matchedKey])
        setWholesaleResults(liveWholesale.length > 0 ? liveWholesale : wholesaleDatabase[matchedKey] || [])
      } else {
        // 기본 데이터 생성
        const defaultProducts: RecommendedProduct[] = [
          { id: 1, name: `${searchTerm} 프리미엄형`, wholesalePrice: Math.floor(Math.random() * 15000) + 5000, recommendedPrice: Math.floor(Math.random() * 30000) + 20000, margin: Math.floor(Math.random() * 30) + 35, competition: '중', searchVolume: Math.floor(Math.random() * 15000) + 5000, trend: 'up', coupangLink: `https://www.coupang.com/np/search?q=${encodeURIComponent(searchTerm)}`, score: Math.floor(Math.random() * 20) + 75, image: 'https://via.placeholder.com/120x120?text=1' },
          { id: 2, name: `${searchTerm} 베이직`, wholesalePrice: Math.floor(Math.random() * 10000) + 3000, recommendedPrice: Math.floor(Math.random() * 20000) + 15000, margin: Math.floor(Math.random() * 30) + 40, competition: '낮음', searchVolume: Math.floor(Math.random() * 10000) + 3000, trend: 'stable', coupangLink: `https://www.coupang.com/np/search?q=${encodeURIComponent(searchTerm)}`, score: Math.floor(Math.random() * 20) + 70, image: 'https://via.placeholder.com/120x120?text=2' },
          { id: 3, name: `${searchTerm} 고급형`, wholesalePrice: Math.floor(Math.random() * 20000) + 10000, recommendedPrice: Math.floor(Math.random() * 40000) + 30000, margin: Math.floor(Math.random() * 25) + 30, competition: '높음', searchVolume: Math.floor(Math.random() * 20000) + 8000, trend: 'up', coupangLink: `https://www.coupang.com/np/search?q=${encodeURIComponent(searchTerm)}`, score: Math.floor(Math.random() * 20) + 65, image: 'https://via.placeholder.com/120x120?text=3' },
        ]

        const fallbackWholesale = [
          { id: 1, name: `${searchTerm} 도매`, price: Math.floor(Math.random() * 10000) + 3000, source: '도매꾹', rating: 4.2, minOrder: 10, image: 'https://via.placeholder.com/80x80?text=1', url: 'https://domeggook.com' },
          { id: 2, name: `${searchTerm} 공장직배송`, price: Math.floor(Math.random() * 8000) + 2000, source: '1688', rating: 4.0, minOrder: 50, image: 'https://via.placeholder.com/80x80?text=2', url: 'https://1688.com' },
        ]

        setRecommendations(defaultProducts)
        setWholesaleResults(liveWholesale.length > 0 ? liveWholesale : fallbackWholesale)
      }

      // 검색 기록 추가
      if (!searchHistory.includes(searchTerm)) {
        setSearchHistory(prev => [searchTerm, ...prev.slice(0, 4)])
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleProductSelect = (product: RecommendedProduct) => {
    setSelectedProduct(product)
  }

  const handleRegister = (product: RecommendedProduct) => {
    // 로컬 스토리지에 저장하고 등록 페이지로 이동
    localStorage.setItem('selectedProduct', JSON.stringify({
      name: product.name,
      price: product.recommendedPrice,
      wholesalePrice: product.wholesalePrice
    }))
    window.location.href = '/registration'
  }

  // 차트 데이터
  const chartData = recommendations.map(p => ({
    name: p.name.length > 10 ? p.name.substring(0, 10) + '...' : p.name,
    마진율: p.margin,
    점수: p.score
  }))

  useEffect(() => {
    const paramKeyword = searchParams.get('keyword')
    if (paramKeyword) {
      setKeyword(paramKeyword)
      handleSearch(paramKeyword)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Lightbulb className="w-7 h-7 text-yellow-400" />
            AI 추천 상품
          </h1>
          <p className="text-slate-400 mt-1">키워드를 입력하면 AI가 최적의 상품을 추천해드립니다</p>
        </div>
        {recommendations.length > 0 && (
          <button
            onClick={() => handleSearch(keyword)}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            새로고침
          </button>
        )}
      </div>

      {/* Search Box */}
      <div className="card">
        <div className="flex gap-4">
          <div className="flex-1 input-icon-wrapper">
            <Search className="w-4 h-4" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="검색할 키워드를 입력하세요 (예: 무선 이어폰, LED 조명)"
              className="input w-full py-3 text-lg"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={isLoading}
            className="ai-search-btn"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Zap className="w-5 h-5" />
            )}
            AI 추천 받기
          </button>
        </div>

        {/* Popular Keywords */}
        <div className="mt-4">
          <p className="text-sm text-slate-400 mb-2">인기 검색어</p>
          <div className="flex flex-wrap gap-2">
            {popularKeywords.map((kw) => (
              <button
                key={kw}
                onClick={() => {
                  setKeyword(kw)
                  handleSearch(kw)
                }}
                className="tag-btn"
              >
                {kw}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Searches */}
        {searchHistory.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-sm text-slate-400 mb-2">최근 검색</p>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((term, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setKeyword(term)
                    handleSearch(term)
                  }}
                  className="tag-btn-primary"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      {recommendations.length > 0 && (
        <>
          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-700 pb-2">
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-6 py-2.5 rounded-t-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'ai'
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Target className="w-4 h-4" />
              AI 추천 상품 ({recommendations.length})
            </button>
            <button
              onClick={() => setActiveTab('wholesale')}
              className={`px-6 py-2.5 rounded-t-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'wholesale'
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              도매 검색 결과 ({wholesaleResults.length})
            </button>
          </div>

          {/* AI Recommendations Tab */}
          {activeTab === 'ai' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Product Cards */}
              <div className="xl:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductSelect(product)}
                      className={`card cursor-pointer transition-all hover:scale-[1.02] ${
                        selectedProduct?.id === product.id
                          ? 'ring-2 ring-primary-500 bg-primary-500/10'
                          : 'hover:border-primary-500/50'
                      }`}
                    >
                      <div className="flex gap-4">
                        <div className="w-20 h-20 bg-slate-700 rounded-lg overflow-hidden flex-shrink-0 relative">
                          <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-white truncate">{product.name}</h3>
                            <div className={`px-2 py-0.5 rounded text-xs flex-shrink-0 ${
                              product.score >= 90 ? 'bg-green-500/20 text-green-400' :
                              product.score >= 80 ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-slate-500/20 text-slate-400'
                            }`}>
                              점수 {product.score}
                            </div>
                          </div>

                          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-slate-400">도매가</span>
                              <p className="text-white font-medium">{formatCurrency(product.wholesalePrice)}</p>
                            </div>
                            <div>
                              <span className="text-slate-400">추천가</span>
                              <p className="text-primary-400 font-semibold">{formatCurrency(product.recommendedPrice)}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <span className={`flex items-center gap-1 ${
                            product.margin >= 50 ? 'text-green-400' : 'text-yellow-400'
                          }`}>
                            마진 {product.margin}%
                          </span>
                          <span className={`px-2 py-0.5 rounded ${
                            product.competition === '낮음' ? 'bg-green-500/20 text-green-400' :
                            product.competition === '중' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            경쟁 {product.competition}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-slate-400">
                          {product.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-400" />}
                          {product.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
                          {formatNumber(product.searchVolume)}/월
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <a
                          href={product.coupangLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="btn-secondary flex-1 text-center text-sm flex items-center justify-center gap-1"
                        >
                          쿠팡 검색 <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRegister(product)
                          }}
                          className="btn-primary flex-1 text-sm flex items-center justify-center gap-1"
                        >
                          등록 준비 <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart */}
              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary-400" />
                  상품 비교 분석
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" stroke="#94a3b8" />
                      <YAxis dataKey="name" type="category" width={80} stroke="#94a3b8" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                      <Bar dataKey="마진율" fill="#22c55e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {selectedProduct && (
                  <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
                    <h4 className="text-sm text-slate-400 mb-3">선택된 상품 상세</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">상품명</span>
                        <span className="text-white font-medium">{selectedProduct.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">예상 순이익</span>
                        <span className="text-green-400 font-semibold">
                          {formatCurrency(selectedProduct.recommendedPrice - selectedProduct.wholesalePrice)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">월간 검색량</span>
                        <span className="text-white">{formatNumber(selectedProduct.searchVolume)}회</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRegister(selectedProduct)}
                      className="btn-primary w-full mt-4"
                    >
                      이 상품으로 등록 준비
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Wholesale Search Tab */}
          {activeTab === 'wholesale' && (
            <div className="card">
              {wholesaleResults.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>해당 키워드의 도매 상품이 없습니다</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">상품</th>
                        <th className="text-right py-3 px-4 text-slate-400 font-medium">도매가</th>
                        <th className="text-center py-3 px-4 text-slate-400 font-medium">출처</th>
                        <th className="text-center py-3 px-4 text-slate-400 font-medium">평점</th>
                        <th className="text-center py-3 px-4 text-slate-400 font-medium">최소주문</th>
                        <th className="text-center py-3 px-4 text-slate-400 font-medium">액션</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wholesaleResults.map((product) => (
                        <tr key={product.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-slate-700 rounded-lg overflow-hidden relative">
                                <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
                              </div>
                              <span className="text-white font-medium">{product.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right text-primary-400 font-semibold">
                            {formatCurrency(product.price)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 rounded text-xs ${
                              product.source === '도매꾹' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
                            }`}>
                              {product.source}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="flex items-center justify-center gap-1 text-yellow-400">
                              <Star className="w-4 h-4 fill-current" />
                              {product.rating}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-slate-300">{product.minOrder}개</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex gap-2 justify-center">
                              <a
                                href={product.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-secondary text-sm py-1 px-3 flex items-center gap-1"
                              >
                                보기 <ExternalLink className="w-3 h-3" />
                              </a>
                              <button className="btn-primary text-sm py-1 px-3">
                                선택
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {recommendations.length === 0 && !isLoading && (
        <div className="card text-center py-16">
          <div className="w-20 h-20 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lightbulb className="w-10 h-10 text-primary-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">키워드를 검색해보세요</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            판매하고 싶은 상품의 키워드를 입력하면<br />
            AI가 최적의 상품과 예상 마진을 추천해드립니다
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="card text-center py-16">
          <Loader2 className="w-12 h-12 text-primary-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">AI가 최적의 상품을 분석하고 있습니다...</p>
        </div>
      )}
    </div>
  )
}

export default function RecommendationPage() {
  return (
    <Suspense fallback={<div className="page-content"><p>로딩중...</p></div>}>
      <RecommendationPageInner />
    </Suspense>
  )
}
