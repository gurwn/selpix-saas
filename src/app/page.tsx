'use client'

import { useState, useEffect, Suspense } from 'react'
import dynamic from 'next/dynamic'
import {
  Package,
  TrendingUp,
  DollarSign,
  BarChart3,
  Activity,
  ShoppingCart,
  Zap,
  FileText,
  Upload,
  RefreshCw
} from 'lucide-react'
import StatCard from '@/components/StatCard'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, API_BASE_URL } from '@/lib/utils'

// 차트 컴포넌트 동적 임포트 (SSR 비활성화)
const WeeklyRevenueChart = dynamic(
  () => import('@/components/charts/DashboardCharts').then(mod => mod.WeeklyRevenueChart),
  {
    ssr: false,
    loading: () => <div className="chart-loading">차트 로딩중...</div>
  }
)

const CategoryPieChart = dynamic(
  () => import('@/components/charts/DashboardCharts').then(mod => mod.CategoryPieChart),
  {
    ssr: false,
    loading: () => <div className="chart-loading">차트 로딩중...</div>
  }
)

const MarginTrendChart = dynamic(
  () => import('@/components/charts/DashboardCharts').then(mod => mod.MarginTrendChart),
  {
    ssr: false,
    loading: () => <div className="chart-loading">차트 로딩중...</div>
  }
)

// Mock data
const mockStats = {
  totalProducts: 152,
  registeredToday: 8,
  totalMargin: 2450000,
  avgMarginRate: 42.5,
  weeklyGrowth: 12.3
}

const mockRecentProducts = [
  { id: 1, name: '프리미엄 무선 이어폰', margin: 45.2, status: 'registered', price: 39900 },
  { id: 2, name: '스마트 LED 조명', margin: 52.1, status: 'pending', price: 24900 },
  { id: 3, name: '휴대용 충전기 20000mAh', margin: 48.3, status: 'registered', price: 35900 },
  { id: 4, name: '다용도 수납 정리함', margin: 62.5, status: 'analyzing', price: 12900 },
  { id: 5, name: '무선 마우스 슬림형', margin: 55.8, status: 'registered', price: 18900 },
]

const mockChartData = [
  { date: '월', revenue: 850000, products: 12, margin: 380000 },
  { date: '화', revenue: 920000, products: 15, margin: 420000 },
  { date: '수', revenue: 780000, products: 10, margin: 350000 },
  { date: '목', revenue: 1100000, products: 18, margin: 520000 },
  { date: '금', revenue: 950000, products: 14, margin: 430000 },
  { date: '토', revenue: 1250000, products: 22, margin: 580000 },
  { date: '일', revenue: 680000, products: 8, margin: 290000 },
]

const categoryData = [
  { name: '전자기기', value: 45, color: '#3b82f6' },
  { name: '생활용품', value: 25, color: '#22c55e' },
  { name: '패션잡화', value: 15, color: '#f59e0b' },
  { name: '뷰티', value: 10, color: '#ec4899' },
  { name: '기타', value: 5, color: '#8b5cf6' },
]

export default function Dashboard() {
  const [stats, setStats] = useState(mockStats)
  const [recentProducts, setRecentProducts] = useState(mockRecentProducts)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch stats from json-server (optional - falls back to mock data)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/stats`)
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (error) {
        // Use mock data on error
        console.log('Using mock data')
      }
    }
    fetchStats()
  }, [])

  const refreshData = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 800))
    setIsLoading(false)
  }

  return (
    <div className="page-content">
      {/* Page Title */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Activity style={{ width: '28px', height: '28px', color: 'var(--primary-400)' }} />
            대시보드
          </h1>
          <p className="page-subtitle">AI 커머스 자동화 현황을 한눈에 확인하세요</p>
        </div>
        <button
          onClick={refreshData}
          disabled={isLoading}
          className="action-btn-secondary"
        >
          <RefreshCw className={`action-btn-icon ${isLoading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="총 상품 수"
          value={stats.totalProducts}
          icon={Package}
          trend={stats.weeklyGrowth}
        />
        <StatCard
          title="오늘 등록"
          value={stats.registeredToday}
          icon={TrendingUp}
          trend={15}
        />
        <StatCard
          title="총 마진"
          value={stats.totalMargin}
          icon={DollarSign}
          isCurrency
          trend={8.5}
        />
        <StatCard
          title="평균 마진율"
          value={stats.avgMarginRate}
          icon={BarChart3}
          trend={2.1}
          suffix="%"
        />
      </div>

      {/* Charts Row */}
      <div className="charts-grid-3">
        {/* Weekly Revenue Chart - ComposedChart (Bar + Line) */}
        <Card className="chart-card-wide">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-5 h-5 text-primary-400" />
              주간 매출 및 마진 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="chart-container-lg">
              <WeeklyRevenueChart data={mockChartData} />
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution - Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="w-5 h-5 text-green-400" />
              카테고리별 분포
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="chart-container-lg">
              <CategoryPieChart data={categoryData} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Charts Row - Area Chart */}
      <div className="charts-grid-2">
        {/* Margin Trend - Area Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
              주간 마진 추이
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="chart-container-md">
              <MarginTrendChart data={mockChartData} />
            </div>
          </CardContent>
        </Card>

        {/* Recent Products */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="w-5 h-5 text-purple-400" />
              최근 등록 상품
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="product-list">
              {recentProducts.map((product) => (
                <div key={product.id} className="product-item">
                  <div className="product-info">
                    <p className="product-name">{product.name}</p>
                    <p className="product-price">{formatCurrency(product.price)}</p>
                  </div>
                  <div className="product-meta">
                    <span className={`margin-value ${product.margin >= 50 ? 'high' : 'medium'}`}>
                      {product.margin}%
                    </span>
                    <Badge variant={
                      product.status === 'registered' ? 'success' :
                      product.status === 'pending' ? 'warning' : 'default'
                    }>
                      {product.status === 'registered' ? '등록완료' :
                       product.status === 'pending' ? '대기중' : '분석중'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="w-5 h-5 text-orange-400" />
            빠른 작업
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="quick-actions-grid">
            <a href="/recommendation" className="quick-action-card">
              <div className="quick-action-icon primary">
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="quick-action-title">AI 추천</p>
              <p className="quick-action-subtitle">상품 찾기</p>
            </a>
            <a href="/margin" className="quick-action-card">
              <div className="quick-action-icon green">
                <DollarSign className="w-6 h-6" />
              </div>
              <p className="quick-action-title">마진 계산</p>
              <p className="quick-action-subtitle">수익 분석</p>
            </a>
            <a href="/detail-page" className="quick-action-card">
              <div className="quick-action-icon purple">
                <FileText className="w-6 h-6" />
              </div>
              <p className="quick-action-title">상세페이지</p>
              <p className="quick-action-subtitle">자동 생성</p>
            </a>
            <a href="/registration" className="quick-action-card">
              <div className="quick-action-icon orange">
                <Upload className="w-6 h-6" />
              </div>
              <p className="quick-action-title">쿠팡 등록</p>
              <p className="quick-action-subtitle">바로 등록</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
