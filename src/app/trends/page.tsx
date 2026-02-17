'use client'

import { useState } from 'react'
import {
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  ShoppingCart,
  Loader2,
  ArrowRight,
  AlertTriangle,
  Star,
  Award,
  Zap,
  Activity,
  Package,
} from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import type { TrendAnalysis, SurgeResult, DataLabPoint } from '@/lib/trends/types'

type TabId = 'keyword' | 'market' | 'sourcing'

const GRADE_COLORS: Record<string, string> = {
  S: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  A: 'text-green-400 bg-green-400/10 border-green-400/30',
  B: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  C: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  D: 'text-red-400 bg-red-400/10 border-red-400/30',
}

const DIRECTION_ICON = {
  rising: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
}

const DIRECTION_COLOR = {
  rising: 'text-green-400',
  stable: 'text-slate-400',
  declining: 'text-red-400',
}

const DIRECTION_LABEL = {
  rising: '상승',
  stable: '보합',
  declining: '하락',
}

// Category options for market overview
const CATEGORIES = [
  { code: '50000000', name: '패션의류' },
  { code: '50000001', name: '패션잡화' },
  { code: '50000002', name: '화장품/미용' },
  { code: '50000003', name: '디지털/가전' },
  { code: '50000004', name: '가구/인테리어' },
  { code: '50000005', name: '출산/육아' },
  { code: '50000006', name: '식품' },
  { code: '50000007', name: '스포츠/레저' },
  { code: '50000008', name: '생활/건강' },
  { code: '50000009', name: '여가/생활편의' },
]

export default function TrendsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('keyword')

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Activity className="w-7 h-7 text-primary-400" />
          트렌드 분석
        </h1>
        <p className="text-slate-400 mt-1">
          키워드 경쟁도, 수익성, 시즌성을 종합 분석합니다
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-slate-800/50 rounded-lg w-fit">
        {([
          { id: 'keyword' as TabId, label: '키워드 분석', icon: Search },
          { id: 'market' as TabId, label: '시장 개요', icon: BarChart3 },
          { id: 'sourcing' as TabId, label: '소싱 추천', icon: ShoppingCart },
        ]).map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'keyword' && <KeywordAnalysisTab />}
      {activeTab === 'market' && <MarketOverviewTab />}
      {activeTab === 'sourcing' && <SourcingTab />}
    </div>
  )
}

// ────────────────────────────────────────────
// Tab 1: Keyword Analysis
// ────────────────────────────────────────────
function KeywordAnalysisTab() {
  const [keywords, setKeywords] = useState('')
  const [analyses, setAnalyses] = useState<TrendAnalysis[]>([])
  const [trendChartData, setTrendChartData] = useState<{ keyword: string; data: DataLabPoint[] }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    const kws = keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
    if (kws.length === 0) return

    setLoading(true)
    setError('')
    setAnalyses([])
    setTrendChartData([])

    try {
      // Fetch analysis and trend chart data in parallel
      const [analyzeRes, trendRes] = await Promise.all([
        fetch('/api/trends/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keywords: kws }),
        }),
        // Also fetch surge data for the trend chart
        fetch(`/api/trends/surge?keywords=${encodeURIComponent(kws.join(','))}`),
      ])

      if (analyzeRes.ok) {
        const data = await analyzeRes.json()
        setAnalyses(data.analyses || [])
      } else {
        setError('분석에 실패했습니다')
      }

      // Trend chart data is already included in analysis
      // We'll build chart data from keyword comparison
      if (trendRes.ok) {
        const surgeData = await trendRes.json()
        // We use surge data for supplementary info
        void surgeData
      }
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const selectedAnalysis = analyses[0]

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="card">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="키워드를 입력하세요 (쉼표로 구분, 최대 5개)"
              className="input w-full pl-10"
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading || !keywords.trim()}
            className="btn-primary px-6 flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            분석
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          예: 무선이어폰, 텀블러, 폰케이스
        </p>
      </div>

      {error && (
        <div className="card bg-red-900/20 border border-red-500/30">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Analysis Results */}
      {analyses.length > 0 && (
        <>
          {/* Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {analyses.map((analysis) => (
              <ScoreCard key={analysis.keyword} analysis={analysis} />
            ))}
          </div>

          {/* Detail View for first keyword */}
          {selectedAnalysis && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar Chart */}
              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">
                  종합 분석 — {selectedAnalysis.keyword}
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={[
                        { subject: '수요', value: selectedAnalysis.demandScore },
                        { subject: '경쟁 (니치)', value: selectedAnalysis.competitionScore },
                        { subject: '수익성', value: selectedAnalysis.profitabilityScore },
                        { subject: '안정성', value: selectedAnalysis.seasonalityScore },
                      ]}
                    >
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={{ fill: '#64748b', fontSize: 10 }}
                      />
                      <Radar
                        dataKey="value"
                        stroke="#6366f1"
                        fill="#6366f1"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Detail Stats */}
              <div className="card space-y-4">
                <h3 className="text-lg font-semibold text-white">상세 지표</h3>

                {/* Search Volume Card (if available) */}
                {selectedAnalysis.searchVolume && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-700/30 rounded-lg text-center">
                      <p className="text-xs text-slate-400 mb-1">PC 검색수</p>
                      <p className="text-lg font-bold text-white">
                        {formatNumber(selectedAnalysis.searchVolume.pc)}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-700/30 rounded-lg text-center">
                      <p className="text-xs text-slate-400 mb-1">모바일 검색수</p>
                      <p className="text-lg font-bold text-white">
                        {formatNumber(selectedAnalysis.searchVolume.mobile)}
                      </p>
                    </div>
                    <div className="p-3 bg-primary-900/30 border border-primary-500/30 rounded-lg text-center">
                      <p className="text-xs text-primary-300 mb-1">월간 총검색수</p>
                      <p className="text-lg font-bold text-primary-300">
                        {formatNumber(selectedAnalysis.searchVolume.total)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Competition Badge (if available) */}
                {(selectedAnalysis.naverCompIdx || selectedAnalysis.competitionRatio != null) && (
                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                    <Award className="w-5 h-5 text-slate-400" />
                    <div className="flex-1">
                      <span className="text-sm text-slate-300">경쟁강도</span>
                    </div>
                    {selectedAnalysis.naverCompIdx && (
                      <CompIdxBadge value={selectedAnalysis.naverCompIdx} />
                    )}
                    {selectedAnalysis.competitionRatio != null && (
                      <span className="text-xs text-slate-400">
                        상품/검색 비율: {selectedAnalysis.competitionRatio}
                      </span>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  <StatRow
                    label="수요 점수"
                    value={selectedAnalysis.demandScore}
                    icon={TrendingUp}
                  />
                  <StatRow
                    label="경쟁도 점수 (니치)"
                    value={selectedAnalysis.competitionScore}
                    icon={Award}
                    sub={`공급자 ${selectedAnalysis.supplyCount}개`}
                  />
                  <StatRow
                    label="수익성 점수"
                    value={selectedAnalysis.profitabilityScore}
                    icon={Star}
                    sub={`평균 마진율 ${selectedAnalysis.avgMarginRate}%`}
                  />
                  <StatRow
                    label="안정성 점수"
                    value={selectedAnalysis.seasonalityScore}
                    icon={Activity}
                    sub={
                      selectedAnalysis.peakMonths.length > 0
                        ? `피크: ${selectedAnalysis.peakMonths.map((m) => `${m}월`).join(', ')}`
                        : '연중 안정'
                    }
                  />
                </div>

                {/* Seasonality Warning */}
                {selectedAnalysis.seasonalityScore <= 40 && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-yellow-400 text-sm font-medium">시즌성 주의</p>
                      <p className="text-yellow-400/70 text-xs mt-0.5">
                        이 키워드는 시즌에 따라 수요 변동이 큽니다. 재고 관리에 주의가 필요합니다.
                      </p>
                    </div>
                  </div>
                )}

                {/* Trend Direction */}
                <div className="flex items-center gap-2 p-3 bg-slate-700/30 rounded-lg">
                  {(() => {
                    const DirIcon = DIRECTION_ICON[selectedAnalysis.trendDirection]
                    return (
                      <>
                        <DirIcon className={`w-5 h-5 ${DIRECTION_COLOR[selectedAnalysis.trendDirection]}`} />
                        <span className="text-slate-300 text-sm">
                          트렌드 방향:{' '}
                          <span className={DIRECTION_COLOR[selectedAnalysis.trendDirection]}>
                            {DIRECTION_LABEL[selectedAnalysis.trendDirection]}
                          </span>
                        </span>
                      </>
                    )
                  })()}
                </div>

                {/* Related Keywords */}
                {selectedAnalysis.relatedKeywords.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-400 mb-2">연관 키워드</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedAnalysis.relatedKeywords.slice(0, 8).map((kw) => (
                        <span
                          key={kw}
                          className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-md"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA */}
                <a
                  href={`/wholesale-search?q=${encodeURIComponent(selectedAnalysis.keyword)}`}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                >
                  소싱 추천 보기 <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!loading && analyses.length === 0 && !error && (
        <div className="card text-center py-16">
          <Search className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400">키워드를 입력하면 경쟁도, 수익성, 시즌성을 종합 분석합니다</p>
          <p className="text-slate-500 text-sm mt-2">
            도매꾹 공급량, 네이버 트렌드 데이터를 기반으로 분석합니다
          </p>
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────
// Tab 2: Market Overview
// ────────────────────────────────────────────
function MarketOverviewTab() {
  const [categoryCode, setCategoryCode] = useState('50000000')
  const [trendData, setTrendData] = useState<DataLabPoint[]>([])
  const [surges, setSurges] = useState<SurgeResult[]>([])
  const [surgeKeywords, setSurgeKeywords] = useState('무선이어폰,텀블러,폰케이스,LED조명,마사지건')
  const [loading, setLoading] = useState(false)
  const [surgeLoading, setSurgeLoading] = useState(false)

  const fetchCategoryTrend = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/trends/category?categoryCode=${categoryCode}&period=month`
      )
      if (res.ok) {
        const data = await res.json()
        setTrendData(data.trend || [])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  const fetchSurges = async () => {
    const kws = surgeKeywords.split(',').map((k) => k.trim()).filter(Boolean)
    if (kws.length === 0) return
    setSurgeLoading(true)
    try {
      const res = await fetch(
        `/api/trends/surge?keywords=${encodeURIComponent(kws.join(','))}`
      )
      if (res.ok) {
        const data = await res.json()
        setSurges(data.surges || [])
      }
    } catch {
      // silently fail
    } finally {
      setSurgeLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Category Trend */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-400" />
            카테고리 트렌드
          </h3>
          <div className="flex gap-2">
            <select
              value={categoryCode}
              onChange={(e) => setCategoryCode(e.target.value)}
              className="input text-sm"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.code} value={cat.code}>
                  {cat.name}
                </option>
              ))}
            </select>
            <button
              onClick={fetchCategoryTrend}
              disabled={loading}
              className="btn-primary px-4 text-sm flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              조회
            </button>
          </div>
        </div>

        {trendData.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="period"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Line
                  type="monotone"
                  dataKey="ratio"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: '#6366f1', r: 3 }}
                  name="검색 비율"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>카테고리를 선택하고 조회 버튼을 눌러주세요</p>
          </div>
        )}
      </div>

      {/* Surge Detection */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            급상승 키워드 감지
          </h3>
        </div>
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={surgeKeywords}
            onChange={(e) => setSurgeKeywords(e.target.value)}
            placeholder="감시할 키워드 (쉼표 구분, 최대 10개)"
            className="input flex-1"
          />
          <button
            onClick={fetchSurges}
            disabled={surgeLoading}
            className="btn-primary px-4 text-sm flex items-center gap-2"
          >
            {surgeLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            감지
          </button>
        </div>

        {surges.length > 0 ? (
          <div className="space-y-2">
            {surges.map((surge) => {
              const DirIcon = DIRECTION_ICON[surge.direction]
              return (
                <div
                  key={surge.keyword}
                  className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <DirIcon
                      className={`w-5 h-5 ${DIRECTION_COLOR[surge.direction]}`}
                    />
                    <span className="text-white font-medium">{surge.keyword}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-slate-400">
                      {surge.previousAvg.toFixed(1)} → {surge.recentAvg.toFixed(1)}
                    </span>
                    <span
                      className={`font-semibold ${
                        surge.changeRate > 0 ? 'text-green-400' : surge.changeRate < 0 ? 'text-red-400' : 'text-slate-400'
                      }`}
                    >
                      {surge.changeRate > 0 ? '+' : ''}
                      {surge.changeRate}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          !surgeLoading && (
            <p className="text-center text-slate-400 py-8">
              키워드를 입력하고 감지 버튼을 눌러주세요
            </p>
          )
        )}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────
// Tab 3: Sourcing Recommendations
// ────────────────────────────────────────────
function SourcingTab() {
  const [keywords, setKeywords] = useState('')
  const [analyses, setAnalyses] = useState<TrendAnalysis[]>([])
  const [loading, setLoading] = useState(false)

  const handleAnalyze = async () => {
    const kws = keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
    if (kws.length === 0) return

    setLoading(true)
    try {
      const res = await fetch('/api/trends/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: kws }),
      })
      if (res.ok) {
        const data = await res.json()
        const sorted = (data.analyses || []).sort(
          (a: TrendAnalysis, b: TrendAnalysis) => b.totalScore - a.totalScore
        )
        setAnalyses(sorted)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-primary-400" />
          소싱 키워드 분석
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="분석할 키워드 입력 (쉼표 구분, 최대 5개)"
            className="input flex-1"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !keywords.trim()}
            className="btn-primary px-6 flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            분석
          </button>
        </div>
      </div>

      {/* Results */}
      {analyses.length > 0 ? (
        <div className="space-y-4">
          {analyses.map((analysis, idx) => (
            <SourcingCard key={analysis.keyword} analysis={analysis} rank={idx + 1} />
          ))}
        </div>
      ) : (
        !loading && (
          <div className="card text-center py-16">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400">
              키워드를 입력하면 소싱 적합도를 분석합니다
            </p>
            <p className="text-slate-500 text-sm mt-2">
              종합 점수가 높은 순서로 추천합니다
            </p>
          </div>
        )
      )}
    </div>
  )
}

// ────────────────────────────────────────────
// Shared Components
// ────────────────────────────────────────────

function ScoreCard({ analysis }: { analysis: TrendAnalysis }) {
  const DirIcon = DIRECTION_ICON[analysis.trendDirection]
  return (
    <div className="card hover:border-slate-600 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white font-semibold truncate">{analysis.keyword}</h4>
        <span
          className={`px-2 py-0.5 rounded-md border text-sm font-bold ${GRADE_COLORS[analysis.grade]}`}
        >
          {analysis.grade}
        </span>
      </div>
      <div className="text-3xl font-bold text-white mb-2">{analysis.totalScore}</div>
      <div className="flex items-center gap-1 text-sm">
        <DirIcon className={`w-4 h-4 ${DIRECTION_COLOR[analysis.trendDirection]}`} />
        <span className={DIRECTION_COLOR[analysis.trendDirection]}>
          {DIRECTION_LABEL[analysis.trendDirection]}
        </span>
      </div>
      <div className="mt-3 space-y-1">
        <ProgressBar label="수요" value={analysis.demandScore} color="bg-blue-500" />
        <ProgressBar label="니치" value={analysis.competitionScore} color="bg-green-500" />
        <ProgressBar label="수익" value={analysis.profitabilityScore} color="bg-yellow-500" />
      </div>
      {analysis.searchVolume && (
        <p className="mt-2 text-xs text-slate-400">
          월검색 {formatNumber(analysis.searchVolume.total)}
          {analysis.naverCompIdx && (
            <span className="ml-2">
              <CompIdxBadge value={analysis.naverCompIdx} />
            </span>
          )}
        </p>
      )}
    </div>
  )
}

function ProgressBar({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-slate-400 w-6">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-slate-300 w-6 text-right">{value}</span>
    </div>
  )
}

function StatRow({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  sub?: string
}) {
  const barColor =
    value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="flex items-center gap-3">
      <Icon className="w-5 h-5 text-slate-400 flex-shrink-0" />
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-300">{label}</span>
          <span className="text-white font-semibold">{value}/100</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${barColor} transition-all`}
            style={{ width: `${value}%` }}
          />
        </div>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function SourcingCard({
  analysis,
  rank,
}: {
  analysis: TrendAnalysis
  rank: number
}) {
  const DirIcon = DIRECTION_ICON[analysis.trendDirection]
  return (
    <div className="card hover:border-slate-600 transition-colors">
      <div className="flex items-start gap-4">
        {/* Rank */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-lg font-bold text-white">
          {rank}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <h4 className="text-white font-semibold text-lg">{analysis.keyword}</h4>
            <span
              className={`px-2 py-0.5 rounded-md border text-sm font-bold ${GRADE_COLORS[analysis.grade]}`}
            >
              {analysis.grade}등급
            </span>
            <div className="flex items-center gap-1 text-sm">
              <DirIcon className={`w-4 h-4 ${DIRECTION_COLOR[analysis.trendDirection]}`} />
              <span className={DIRECTION_COLOR[analysis.trendDirection]}>
                {DIRECTION_LABEL[analysis.trendDirection]}
              </span>
            </div>
          </div>

          {/* Score Bars */}
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">수요</span>
                <span className="text-white">{analysis.demandScore}</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${analysis.demandScore}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">경쟁 (니치)</span>
                <span className="text-white">{analysis.competitionScore}</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${analysis.competitionScore}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">수익성</span>
                <span className="text-white">{analysis.profitabilityScore}</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500 rounded-full"
                  style={{ width: `${analysis.profitabilityScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex items-center gap-4 text-sm text-slate-400 flex-wrap">
            <span>공급자 {analysis.supplyCount}개</span>
            <span>마진율 {analysis.avgMarginRate}%</span>
            <span>종합 {analysis.totalScore}점</span>
            {analysis.searchVolume && (
              <span className="text-primary-300">
                월검색 {formatNumber(analysis.searchVolume.total)}
              </span>
            )}
            {analysis.competitionRatio != null && (
              <span className="text-slate-300">
                경쟁비 {analysis.competitionRatio}
              </span>
            )}
            {analysis.naverCompIdx && (
              <CompIdxBadge value={analysis.naverCompIdx} />
            )}
            {analysis.seasonalityScore <= 40 && (
              <span className="flex items-center gap-1 text-yellow-400">
                <AlertTriangle className="w-3 h-3" />
                시즌성 주의
              </span>
            )}
          </div>
        </div>

        {/* Action */}
        <div className="flex-shrink-0">
          <a
            href={`/wholesale-search?q=${encodeURIComponent(analysis.keyword)}`}
            className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
          >
            소싱하기
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  )
}

const COMP_IDX_STYLE: Record<string, string> = {
  '낮음': 'text-green-400 bg-green-400/10 border-green-400/30',
  '중간': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  '높음': 'text-red-400 bg-red-400/10 border-red-400/30',
}

function CompIdxBadge({ value }: { value: string }) {
  const style = COMP_IDX_STYLE[value] || 'text-slate-400 bg-slate-400/10 border-slate-400/30'
  return (
    <span className={`px-2 py-0.5 rounded-md border text-xs font-medium ${style}`}>
      경쟁 {value}
    </span>
  )
}
