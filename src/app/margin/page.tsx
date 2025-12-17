'use client'

import { useState, useEffect } from 'react'
import {
  Calculator,
  DollarSign,
  Percent,
  TrendingUp,
  Package,
  Truck,
  Megaphone,
  RotateCcw,
  Save,
  History,
  Info,
  AlertTriangle,
  CheckCircle,
  ArrowRight
} from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts'

interface MarginResult {
  wholesalePrice: number
  sellingPrice: number
  shippingCost: number
  commission: number
  adCost: number
  packagingCost: number
  netMargin: number
  marginRate: number
  roas: number
  breakEven: number
}

interface SavedCalculation {
  id: number
  productName: string
  wholesalePrice: number
  sellingPrice: number
  netMargin: number
  marginRate: number
  platform: string
  date: string
}

const platformCommissions: Record<string, { rate: number; description: string }> = {
  rocket: { rate: 10.8, description: '쿠팡 물류센터 입고' },
  wing: { rate: 6.5, description: '직접 배송' },
  consignment: { rate: 8.0, description: '업체 배송' }
}

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6']

export default function MarginPage() {
  const [productName, setProductName] = useState('')
  const [wholesalePrice, setWholesalePrice] = useState<number>(15000)
  const [priceMultiplier, setPriceMultiplier] = useState<number>(2.5)
  const [platform, setPlatform] = useState<'rocket' | 'wing' | 'consignment'>('rocket')
  const [shippingCost, setShippingCost] = useState<number>(3000)
  const [adCost, setAdCost] = useState<number>(0)
  const [includeAd, setIncludeAd] = useState<boolean>(false)
  const [packagingCost, setPackagingCost] = useState<number>(500)
  const [result, setResult] = useState<MarginResult | null>(null)
  const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // Load saved calculations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('marginCalculations')
    if (saved) {
      setSavedCalculations(JSON.parse(saved))
    }

    // Load selected product from AI recommendation
    const selectedProduct = localStorage.getItem('selectedProduct')
    if (selectedProduct) {
      const product = JSON.parse(selectedProduct)
      setProductName(product.name)
      setWholesalePrice(product.wholesalePrice || 15000)
      if (product.price && product.wholesalePrice) {
        setPriceMultiplier(Math.round((product.price / product.wholesalePrice) * 10) / 10)
      }
      localStorage.removeItem('selectedProduct')
    }
  }, [])

  const calculateMargin = () => {
    const sellingPrice = wholesalePrice * priceMultiplier
    const commissionRate = platformCommissions[platform].rate
    const commission = sellingPrice * (commissionRate / 100)
    const actualAdCost = includeAd ? adCost : 0
    const netMargin = sellingPrice - wholesalePrice - shippingCost - commission - actualAdCost - packagingCost
    const marginRate = (netMargin / sellingPrice) * 100
    const roas = actualAdCost > 0 ? (sellingPrice / actualAdCost) * 100 : 0

    // Break-even price calculation
    const fixedCosts = wholesalePrice + shippingCost + packagingCost + actualAdCost
    const breakEven = fixedCosts / (1 - commissionRate / 100)

    setResult({
      wholesalePrice,
      sellingPrice,
      shippingCost,
      commission,
      adCost: actualAdCost,
      packagingCost,
      netMargin,
      marginRate,
      roas,
      breakEven
    })
  }

  const resetForm = () => {
    setProductName('')
    setWholesalePrice(15000)
    setPriceMultiplier(2.5)
    setPlatform('rocket')
    setShippingCost(3000)
    setAdCost(0)
    setIncludeAd(false)
    setPackagingCost(500)
    setResult(null)
  }

  const saveCalculation = () => {
    if (!result || !productName) {
      alert('상품명을 입력하고 마진을 계산해주세요.')
      return
    }

    const newCalc: SavedCalculation = {
      id: Date.now(),
      productName,
      wholesalePrice: result.wholesalePrice,
      sellingPrice: result.sellingPrice,
      netMargin: result.netMargin,
      marginRate: result.marginRate,
      platform,
      date: new Date().toISOString()
    }

    const updated = [newCalc, ...savedCalculations.slice(0, 9)]
    setSavedCalculations(updated)
    localStorage.setItem('marginCalculations', JSON.stringify(updated))
    alert('저장되었습니다!')
  }

  const loadCalculation = (calc: SavedCalculation) => {
    setProductName(calc.productName)
    setWholesalePrice(calc.wholesalePrice)
    setPriceMultiplier(calc.sellingPrice / calc.wholesalePrice)
    setPlatform(calc.platform as typeof platform)
    setShowHistory(false)
    calculateMargin()
  }

  // Pie chart data
  const pieData = result ? [
    { name: '도매가', value: result.wholesalePrice },
    { name: '수수료', value: result.commission },
    { name: '배송비', value: result.shippingCost },
    { name: '포장비', value: result.packagingCost },
    ...(result.adCost > 0 ? [{ name: '광고비', value: result.adCost }] : []),
    { name: '순이익', value: Math.max(0, result.netMargin) }
  ] : []

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calculator className="w-7 h-7 text-green-400" />
            마진 계산기
          </h1>
          <p className="text-slate-400 mt-1">도매가 기준으로 예상 마진을 계산합니다</p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="btn-secondary flex items-center gap-2"
        >
          <History className="w-4 h-4" />
          계산 기록 ({savedCalculations.length})
        </button>
      </div>

      {/* History Sidebar */}
      {showHistory && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">최근 계산 기록</h3>
            <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-white">
              닫기
            </button>
          </div>
          {savedCalculations.length === 0 ? (
            <p className="text-slate-400 text-center py-4">저장된 계산 기록이 없습니다</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {savedCalculations.map((calc) => (
                <button
                  key={calc.id}
                  onClick={() => loadCalculation(calc)}
                  className="w-full p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-left transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">{calc.productName}</p>
                      <p className="text-sm text-slate-400">
                        {formatCurrency(calc.sellingPrice)} · 마진 {calc.marginRate.toFixed(1)}%
                      </p>
                    </div>
                    <span className={`text-sm font-medium ${
                      calc.marginRate >= 20 ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {formatCurrency(calc.netMargin)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="card space-y-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-primary-400" />
            마진 계산 입력
          </h3>

          {/* Product Name */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">상품명 (선택)</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="상품명을 입력하세요 (저장용)"
              className="input w-full"
            />
          </div>

          {/* Wholesale Price */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">도매가 (원)</label>
            <div className="input-icon-wrapper">
              <DollarSign className="w-4 h-4" />
              <input
                type="number"
                value={wholesalePrice}
                onChange={(e) => setWholesalePrice(Number(e.target.value))}
                className="input w-full"
              />
            </div>
            {/* Quick Price Buttons */}
            <div className="flex gap-2 mt-2">
              {[5000, 10000, 15000, 20000, 30000].map((price) => (
                <button
                  key={price}
                  onClick={() => setWholesalePrice(price)}
                  className={wholesalePrice === price ? 'chip-btn-active' : 'chip-btn'}
                >
                  {formatNumber(price)}
                </button>
              ))}
            </div>
          </div>

          {/* Price Multiplier */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              판매가 배율: <span className="text-primary-400 font-semibold">{priceMultiplier}배</span>
              <span className="text-white ml-2 font-medium">
                = {formatCurrency(wholesalePrice * priceMultiplier)}
              </span>
            </label>
            <input
              type="range"
              min="1.0"
              max="5"
              step="0.1"
              value={priceMultiplier}
              onChange={(e) => setPriceMultiplier(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>1.0배</span>
              <span>2.0배</span>
              <span>3.0배</span>
              <span>4.0배</span>
              <span>5.0배</span>
            </div>
            {/* Quick Multiplier Buttons */}
            <div className="flex gap-2 mt-2">
              {[1.5, 1.7, 2.0, 2.5, 3.0].map((mult) => (
                <button
                  key={mult}
                  onClick={() => setPriceMultiplier(mult)}
                  className={priceMultiplier === mult ? 'chip-btn-active' : 'chip-btn'}
                >
                  {mult}배
                </button>
              ))}
            </div>
          </div>

          {/* Platform Selection */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">판매 방식</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(platformCommissions).map(([key, { rate, description }]) => (
                <button
                  key={key}
                  onClick={() => setPlatform(key as 'rocket' | 'wing' | 'consignment')}
                  className={platform === key ? 'platform-btn-active' : 'platform-btn'}
                >
                  <div className="platform-btn-title">
                    {key === 'rocket' ? '로켓배송' : key === 'wing' ? '윙배송' : '위탁'}
                  </div>
                  <div className="platform-btn-subtitle">수수료 {rate}%</div>
                </button>
              ))}
            </div>
          </div>

          {/* Shipping & Packaging */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">배송비 (원)</label>
              <div className="input-icon-wrapper">
                <Truck className="w-4 h-4" />
                <input
                  type="number"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(Number(e.target.value))}
                  className="input w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">포장비 (원)</label>
              <div className="input-icon-wrapper">
                <Package className="w-4 h-4" />
                <input
                  type="number"
                  value={packagingCost}
                  onChange={(e) => setPackagingCost(Number(e.target.value))}
                  className="input w-full"
                />
              </div>
            </div>
          </div>

          {/* Ad Cost Toggle */}
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAd}
                onChange={(e) => setIncludeAd(e.target.checked)}
                className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-primary-600 cursor-pointer"
              />
              <div>
                <span className="text-white font-medium">광고비 포함</span>
                <p className="text-xs text-slate-400 mt-0.5">광고 집행 시 비용 반영</p>
              </div>
            </label>
            {includeAd && (
              <div className="mt-3 input-icon-wrapper">
                <Megaphone className="w-4 h-4" />
                <input
                  type="number"
                  value={adCost}
                  onChange={(e) => setAdCost(Number(e.target.value))}
                  placeholder="광고비 (원)"
                  className="input w-full"
                />
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button onClick={calculateMargin} className="btn-primary flex-1 py-3">
              <Calculator className="w-5 h-5 inline mr-2" />
              마진 계산
            </button>
            <button onClick={saveCalculation} className="btn-secondary py-3 px-4" disabled={!result}>
              <Save className="w-5 h-5" />
            </button>
            <button onClick={resetForm} className="btn-secondary py-3 px-4">
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-green-400" />
              계산 결과
            </h3>

            {result ? (
              <div className="space-y-4">
                {/* Main Result */}
                <div className={`rounded-xl p-6 text-center ${
                  result.netMargin >= 0
                    ? 'bg-gradient-to-r from-green-900/50 to-green-800/30'
                    : 'bg-gradient-to-r from-red-900/50 to-red-800/30'
                }`}>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {result.netMargin >= 0 ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    )}
                    <p className="text-slate-400 text-sm">순수익</p>
                  </div>
                  <p className={`text-4xl font-bold ${
                    result.netMargin >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatCurrency(result.netMargin)}
                  </p>
                  <p className="text-slate-400 text-sm mt-2">
                    마진율 <span className={`font-semibold ${
                      result.marginRate >= 20 ? 'text-green-400' :
                      result.marginRate >= 10 ? 'text-yellow-400' : 'text-red-400'
                    }`}>{result.marginRate.toFixed(1)}%</span>
                  </p>
                  {result.netMargin < 0 && (
                    <p className="text-red-400 text-sm mt-2">
                      손익분기점: {formatCurrency(result.breakEven)} 이상 필요
                    </p>
                  )}
                </div>

                {/* Breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-slate-700">
                    <span className="text-slate-400">판매가</span>
                    <span className="text-white font-medium">{formatCurrency(result.sellingPrice)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700">
                    <span className="text-slate-400">도매가</span>
                    <span className="text-red-400">-{formatCurrency(result.wholesalePrice)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700">
                    <span className="text-slate-400">배송비</span>
                    <span className="text-red-400">-{formatCurrency(result.shippingCost)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700">
                    <span className="text-slate-400">포장비</span>
                    <span className="text-red-400">-{formatCurrency(result.packagingCost)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700">
                    <span className="text-slate-400">수수료 ({platformCommissions[platform].rate}%)</span>
                    <span className="text-red-400">-{formatCurrency(result.commission)}</span>
                  </div>
                  {result.adCost > 0 && (
                    <div className="flex justify-between py-2 border-b border-slate-700">
                      <span className="text-slate-400">광고비</span>
                      <span className="text-red-400">-{formatCurrency(result.adCost)}</span>
                    </div>
                  )}
                </div>

                {/* ROAS */}
                {result.roas > 0 && (
                  <div className="bg-slate-800 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-slate-400">ROAS (광고 수익률)</span>
                        <p className="text-xs text-slate-500 mt-0.5">300% 이상 권장</p>
                      </div>
                      <span className={`text-xl font-bold ${
                        result.roas >= 300 ? 'text-green-400' :
                        result.roas >= 200 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {result.roas.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Price Suggestions */}
                <div className="bg-slate-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-slate-400 mb-3">추천 판매가</h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-slate-700 rounded">
                      <p className="text-xs text-slate-400">할인가 (-5%)</p>
                      <p className="text-sm font-semibold text-white">
                        {formatCurrency(result.sellingPrice * 0.95)}
                      </p>
                    </div>
                    <div className="p-2 bg-primary-600/30 rounded border border-primary-500">
                      <p className="text-xs text-slate-400">추천가</p>
                      <p className="text-sm font-semibold text-primary-400">
                        {formatCurrency(result.sellingPrice)}
                      </p>
                    </div>
                    <div className="p-2 bg-slate-700 rounded">
                      <p className="text-xs text-slate-400">프리미엄 (+5%)</p>
                      <p className="text-sm font-semibold text-white">
                        {formatCurrency(result.sellingPrice * 1.05)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <a
                  href="/registration"
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                >
                  쿠팡 등록으로 이동 <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Calculator className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>도매가와 판매가를 입력하고</p>
                <p>마진 계산 버튼을 클릭하세요</p>
              </div>
            )}
          </div>

          {/* Pie Chart */}
          {result && result.netMargin > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">비용 구조 분석</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="card bg-slate-800/30">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-400">
            <p className="font-medium text-slate-300 mb-1">마진 계산 안내</p>
            <ul className="list-disc list-inside space-y-1">
              <li>로켓배송: 쿠팡 물류센터 입고, 수수료 10.8%</li>
              <li>윙배송: 직접 배송, 수수료 6.5%</li>
              <li>위탁판매: 업체 배송, 수수료 8.0%</li>
              <li>ROAS 300% 이상 시 광고 효율 우수</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
