'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Search, Loader2, Heart, AlertTriangle } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { fetchWholesaleLive, WholesaleProduct } from '@/lib/api'

interface EnrichedProduct extends WholesaleProduct {
  imageUsageStatus?: 'available' | 'unavailable' | 'review' | 'unknown'
  imageUsageText?: string | null
  detailImages?: string[]
  shippingCost?: number
  minOrder?: number
  supplierName?: string | null
  supplierContact?: string | null
  supplierEmail?: string | null
  supplierAddress?: string | null
  supplierBizNo?: string | null
}

const fallbackData: EnrichedProduct[] = [
  {
    id: 1,
    name: '무선 이어폰 OEM 버전',
    price: 8500,
    source: '도매꾹',
    rating: 4.2,
    minOrder: 10,
    url: 'https://domeggook.com',
    image: 'https://via.placeholder.com/320x240?text=OEM',
    imageUsageStatus: 'unknown',
    imageUsageText: '상세설명 이미지 사용여부: 불명',
    detailImages: []
  }
]

const STATUS_LABEL: Record<string, string> = {
  available: '이미지 사용 가능',
  unavailable: '이미지 사용 불가',
  review: '확인 필요',
  unknown: '확인 중'
}

const STATUS_CLASS: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  unavailable: 'bg-red-100 text-red-700',
  review: 'bg-amber-100 text-amber-700',
  unknown: 'bg-slate-100 text-slate-600'
}

// 최대 몇 개까지 상세 크롤링(이미지 사용 여부 포함)을 수행할지 제한값
const ENRICH_LIMIT = 50

export default function WholesaleSearchPage() {
  const router = useRouter()
  const [keyword, setKeyword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<EnrichedProduct[]>([])
  const [usageFilter, setUsageFilter] = useState<'all' | 'available' | 'unavailable' | 'review' | 'unknown'>('all')
  const [duration, setDuration] = useState<number | null>(null)
  const [totalFound, setTotalFound] = useState<number | null>(null)
  const [wishlist, setWishlist] = useState<Set<number>>(new Set())
  const [enrichLoading, setEnrichLoading] = useState(false)

  const popularKeywords = ['무선 이어폰', 'LED 조명', '보조배터리', '스마트워치']

  const usageCounts = useMemo(() => {
    const counts: Record<string, number> = { available: 0, unavailable: 0, review: 0, unknown: 0 }
    results.forEach(r => {
      const st = r.imageUsageStatus || 'unknown'
      if (counts[st] !== undefined) counts[st]++
      else counts.unknown++
    })
    return counts
  }, [results])

  const handleSearch = async (searchTerm?: string) => {
    const term = (searchTerm ?? keyword).trim()
    if (!term) return

    setIsLoading(true)
    setError(null)
    setDuration(null)
    setTotalFound(null)

    const start = performance.now()
    try {
      let live: EnrichedProduct[] = []
      try {
        live = await fetchWholesaleLive(term, { sites: ['domeggook'], minPrice: 0, maxPrice: 1000000 }) as EnrichedProduct[]
      } catch (err) {
        console.error('live fetch failed', err)
      }

      const finalResults = live.length > 0 ? live : fallbackData.map(item => ({ ...item, name: `${term} 도매` }))
      setTotalFound(live.length || null)
      const enriched = await enrichAll(finalResults, live.length > 0)
      setResults(enriched)
      saveSearchState({
        keyword: term,
        results: enriched,
        usageFilter,
        duration: null,
        totalFound: live.length || null
      })
    } catch (err: any) {
      setError(err?.message || '검색 중 오류가 발생했습니다')
      setResults(fallbackData)
      saveSearchState({
        keyword: term,
        results: fallbackData,
        usageFilter,
        duration: null,
        totalFound: null
      })
    } finally {
      setDuration(Math.round(performance.now() - start))
      setIsLoading(false)
    }
  }

  const enrichAll = async (list: EnrichedProduct[], isLive: boolean) => {
    if (!isLive || list.length === 0) return list
    setEnrichLoading(true)
    try {
      const res = await fetch('/api/crawler/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: list, site: 'domeggook', limit: Math.min(list.length, ENRICH_LIMIT) })
      })
      if (!res.ok) throw new Error('merge failed')
      const json = await res.json()
      if (json?.success && Array.isArray(json.data)) {
        return json.data as EnrichedProduct[]
      }
    } catch (err) {
      console.warn('enrich failed, using raw list', err)
    } finally {
      setEnrichLoading(false)
    }
    return list
  }

  const saveSearchState = (payload: {
    keyword: string
    results: EnrichedProduct[]
    usageFilter: typeof usageFilter
    duration: number | null
    totalFound: number | null
  }) => {
    localStorage.setItem('wholesaleSearchState', JSON.stringify(payload))
  }

  const handleSelect = (product: EnrichedProduct) => {
    const detailImages = product.detailImages?.length ? product.detailImages : (product.image ? [product.image] : [])
    const primaryImage = detailImages[0] || product.image

    const summary = product.imageUsageText || '도매 상품에서 불러온 기본 정보입니다.'
    const usps = [
      product.imageUsageText || '상세설명 이미지 사용여부 확인 필요',
      product.source ? `${product.source} 공급처` : '공급처 확인',
      product.minOrder ? `최소 주문 ${product.minOrder}개` : '최소 주문 수량 확인',
      product.shippingCost !== undefined ? `배송비 ${formatCurrency(product.shippingCost || 0)}` : '배송비 확인',
      '쿠팡 등록 전에 가격/카테고리만 확인하세요'
    ]

    const detailHtml = product.detailHtml || `
      <div style="font-family: 'Noto Sans KR', sans-serif; line-height: 1.7; color: #0f172a; background: #f8fafc; border-radius: 14px; padding: 14px;">
        <h2 style="font-size: 18px; font-weight: 800; margin: 0 0 10px;">${product.name}</h2>
        <p style="margin: 0 0 10px; color: #334155;">${summary}</p>
        <ul style="padding-left: 18px; margin: 0;">
          ${usps.map(usp => `<li style="margin-bottom: 6px;">${usp}</li>`).join('')}
        </ul>
      </div>
    `

    localStorage.setItem('selectedProduct', JSON.stringify({
      name: product.name,
      price: product.price,
      wholesalePrice: product.price,
    }))

    localStorage.setItem('detailPageData', JSON.stringify({
      productName: product.name,
      summary,
      usps,
      keywords: keyword ? [keyword, product.name].filter(Boolean) : [product.name],
      template: 'simple',
      primaryImage,
      detailImages,
      detailHtml,
      price: product.price,
      wholesalePrice: product.price,
      minOrder: product.minOrder ?? 1,
      shippingFee: product.shippingCost ?? 0,
      imageUsage: product.imageUsageStatus || 'unknown',
      // 옵션/상품번호는 후속 자동발주 및 옵션 전송에 필요
      options: product.options || [],
      productNo: (product as any).productNo,
      optionPopupUrl: (product as any).optionPopupUrl,
      sourceUrl: product.url || (product as any).sourceUrl,
      supplierName: product.supplierName || undefined,
      supplierContact: product.supplierContact || undefined,
      supplierEmail: product.supplierEmail || undefined,
      supplierAddress: product.supplierAddress || undefined,
      supplierBizNo: product.supplierBizNo || undefined
    }))
    // keep search state so 돌아와도 유지
    saveSearchState({
      keyword,
      results,
      usageFilter,
      duration,
      totalFound
    })
    router.push('/registration')
  }

  useEffect(() => {
    const saved = localStorage.getItem('selectedWholesale')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setKeyword(parsed.keyword || '')
      } catch {
        // ignore
      }
    }

    const savedState = localStorage.getItem('wholesaleSearchState')
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        setKeyword(parsed.keyword || '')
        if (parsed.results) setResults(parsed.results)
        if (parsed.usageFilter) setUsageFilter(parsed.usageFilter)
        setDuration(parsed.duration ?? null)
        setTotalFound(parsed.totalFound ?? null)
      } catch {
        // ignore invalid state
      }
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Step 1 · 도매 검색 → Step 2 · AI 추천 → Step 3 · 쿠팡 등록 준비</p>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">도매 사이트 검색</h1>
        </div>
      </div>

      <div className="card space-y-4 bg-slate-900/70 border-slate-700">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-8 flex items-center gap-3 input-icon-wrapper">
            <Search className="w-4 h-4" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="검색 키워드 (예: 바지, 무선 이어폰)"
              className="input w-full py-3"
            />
          </div>
          <div className="lg:col-span-4 flex justify-end">
            <button onClick={() => handleSearch()} disabled={isLoading} className="btn-primary w-full lg:w-auto">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '검색하기'}
            </button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {popularKeywords.map(item => (
            <button
              key={item}
              onClick={() => {
                setKeyword(item)
                handleSearch(item)
              }}
              className="tag-btn"
            >
              {item}
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-amber-400 text-sm">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-slate-300 text-sm">
          <div className="flex items-center gap-3">
            <span>전체 {results.length}건</span>
            {totalFound !== null && <span className="text-slate-400">크롤링 결과 {formatNumber(totalFound)}건</span>}
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            {enrichLoading && (
              <span className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> 상세 수집중
              </span>
            )}
            {duration !== null && <span>검색 시간: {duration}ms</span>}
          </div>
        </div>

        {isLoading ? (
          <div className="card text-center py-12 bg-white text-slate-800">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
            <p>도매 상품을 불러오는 중...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="card text-center py-12 bg-white text-slate-800">
            <Search className="w-10 h-10 mx-auto mb-3" />
            <p>검색 결과가 없습니다. 키워드를 입력해 주세요.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-2">
              {[
                { key: 'all', label: `전체 ${results.length}` },
                { key: 'available', label: `사용 가능 ${usageCounts.available}` },
                { key: 'unavailable', label: `사용 불가 ${usageCounts.unavailable}` },
                { key: 'review', label: `확인 필요 ${usageCounts.review}` },
                { key: 'unknown', label: `확인 중 ${usageCounts.unknown}` }
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => setUsageFilter(item.key as any)}
                  className={`px-3 py-1 rounded-full text-sm border ${
                    usageFilter === item.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              {results
                .filter(product => {
                  if (usageFilter === 'all') return true
                  const status = product.imageUsageStatus || 'unknown'
                  return status === usageFilter
                })
                .map(product => {
                  const status = product.imageUsageStatus || 'unknown'
                  const usageText = product.imageUsageText
                  const detailThumbsBase = product.detailImages && product.detailImages.length > 0 ? product.detailImages : []
                  const detailThumbs = (detailThumbsBase.length ? detailThumbsBase : (product.image ? [product.image] : [])).slice(0, 6)
                  const minOrder = product.minOrder || 1
                  const shippingCost = product.shippingCost
                  const heroImage = detailThumbs[0] || 'https://via.placeholder.com/320x240?text=No+Image'

                  return (
                    <div key={product.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[560px]">
                      <div className="w-full bg-slate-100 flex items-center justify-center" style={{ height: 240, position: 'relative' }}>
                        <img
                          src={heroImage}
                          alt={product.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/320x240?text=No+Image' }}
                        />
                        <button
                          onClick={() => {
                            setWishlist(prev => {
                              const next = new Set(prev)
                              if (next.has(product.id)) next.delete(product.id)
                              else next.add(product.id)
                              return next
                            })
                          }}
                          className="absolute top-2 right-2 bg-white/80 rounded-full p-2 border border-slate-200"
                        >
                          <Heart className={`w-4 h-4 ${wishlist.has(product.id) ? 'fill-red-500 text-red-500' : 'text-slate-500'}`} />
                        </button>
                      </div>

                      <div className="p-4 space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-500 border border-blue-100">{product.site ? product.site.toUpperCase() : product.source}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-500">최소 {minOrder}개</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_CLASS[status] || STATUS_CLASS.unknown}`}>
                            {STATUS_LABEL[status] || '확인 중'}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-900 leading-snug line-clamp-2">{product.name}</p>
                        <p className="text-primary-600 font-bold">{formatCurrency(product.price)}</p>
                        {shippingCost !== undefined && (
                          <p className="text-xs text-slate-500">배송비: {formatCurrency(shippingCost || 0)}</p>
                        )}
                        {usageText && (
                          <p className="text-xs text-slate-600 line-clamp-2">{usageText}</p>
                        )}
                        {/* 상세 썸네일은 숨김 */}
                      </div>

                      <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => window.open(product.url || '#', '_blank')}
                          className="h-10 rounded-full bg-green-600 text-white font-medium"
                        >
                          상세보기
                        </button>
                        <button
                          onClick={() => handleSelect(product)}
                          className="h-10 rounded-full bg-blue-600 text-white font-medium"
                        >
                          상품 등록 준비
                        </button>
                      </div>
                    </div>
                  )
                })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
