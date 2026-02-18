'use client'

import { useState, useEffect } from 'react'
import {
  Upload,
  X,
  TrendingUp,
  Search,
  Package,
  Tag,
  DollarSign,
  CheckCircle,
  Loader2,
  Search as SearchIcon,
  ExternalLink,
  ChevronDown,
  Rocket,
  Truck,
  Store,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  FileText,
  Info
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import ProductInfoCard from '@/components/ProductInfoCard'

interface RecentRegistration {
  id: number
  name: string
  platform: string
  status: string
  price: number
  date: string
}

interface DetailPageData {
  productName: string
  summary: string
  usps: string[]
  keywords: string[]
  template: string
  primaryImage?: string
  detailImages?: string[]
  detailHtml?: string
  price?: number
  wholesalePrice?: number
  minOrder?: number
  shippingFee?: number
  imageUsage?: 'available' | 'unavailable' | 'review' | 'unknown'
  category?: string
  categoryCode?: string
  displayCategoryCode?: string
  minOrderQty?: number // 최소주문수량
  supplierInfo?: string
  supplier?: {
    supplierName?: string
    supplierContact?: string
    supplierEmail?: string
    supplierAddress?: string
    supplierBizNo?: string
  }
  supplierName?: string
  supplierContact?: string
  supplierEmail?: string
  supplierAddress?: string
  supplierBizNo?: string
}

const categories = [
  { value: 'electronics-earphone', label: '전자기기 > 이어폰/헤드폰 > 블루투스이어폰' },
  { value: 'electronics-charger', label: '전자기기 > 충전기/케이블 > 보조배터리' },
  { value: 'home-lighting', label: '생활용품 > 조명 > LED조명' },
  { value: 'home-storage', label: '생활용품 > 수납/정리 > 수납함' },
  { value: 'fashion-bag', label: '패션잡화 > 가방 > 크로스백' },
  { value: 'kitchen', label: '주방용품 > 조리도구 > 냄비/프라이팬' },
  { value: 'beauty', label: '뷰티 > 스킨케어 > 에센스/세럼' },
]

const platforms = [
  { id: 'rocket', name: '로켓배송', desc: '쿠팡 물류센터 입고', icon: Rocket },
  { id: 'wing', name: '윙배송', desc: '직접 배송', icon: Truck },
  { id: 'consignment', name: '위탁판매', desc: '업체 배송', icon: Store },
]

const titleTemplates = [
  '[당일발송] {name} 무료배송',
  '[쿠팡추천] {name} 특가',
  '[인기상품] {name} 빠른배송',
  '[BEST] {name} 최저가',
]

const imageUsageLabel: Record<string, string> = {
  available: '이미지 사용 가능',
  unavailable: '이미지 사용 불가',
  review: '확인 필요',
  unknown: '확인 중'
}

const imageUsageStyle: Record<string, string> = {
  available: 'bg-green-500/15 text-green-300',
  unavailable: 'bg-red-500/15 text-red-300',
  review: 'bg-amber-500/15 text-amber-200',
  unknown: 'bg-slate-500/15 text-slate-200'
}

const getCategoryLabel = (value: string) =>
  categories.find((c) => c.value === value)?.label || '카테고리 미지정'

const parseSupplierInfo = (html?: string) => {
  if (!html) return {}
  const info: Record<string, string | undefined> = {}

  // HTML 엔티티(&lt; 등)로 들어온 경우를 먼저 복원
  const decodeEntities = (raw: string) => {
    if (typeof window === 'undefined') return raw
    const textarea = document.createElement('textarea')
    textarea.innerHTML = raw
    return textarea.value
  }
  const source = html.includes('&lt;') ? decodeEntities(html) : html

  // 1) DOMParser가 되면 테이블/버튼에서 추출
  if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(source, 'text/html')

      // 테이블 th/td 전체 스캔
      doc.querySelectorAll('table.lTbl tr').forEach((row) => {
        const th = row.querySelector('th')
        const tds = row.querySelectorAll('td')
        if (!th || tds.length === 0) return
        const key = th.textContent?.trim() || ''
        const val = Array.from(tds).map(td => td.textContent?.trim() || '').join(' ').trim()
        if (!key || !val) return
        if (key.includes('공급사')) info.supplierName = val
        if (key.includes('문의번호') || key.includes('전화')) info.supplierContact = val
        if (key.includes('이메일')) info.supplierEmail = val
        if (key.includes('주소') || key.includes('사업장소재지')) info.supplierAddress = val
        if (key.includes('사업자등록번호')) info.supplierBizNo = val
      })

      // 버튼 안에만 공급사명이 있을 때
      if (!info.supplierName) {
        const btnName = doc.querySelector('#lBtnShowSellerInfo b')?.textContent?.trim()
        if (btnName) info.supplierName = btnName
      }

      return info
    } catch {
      // fallthrough to regex
    }
  }

  // 2) 정규식 fallback: th/td 쌍을 전부 긁어 파싱
  const clean = source.replace(/\s+/g, ' ')
  const pairRegex = /<th[^>]*>([^<]+)<\/th>\s*<td[^>]*>(.*?)<\/td>/gi
  let match: RegExpExecArray | null
  while ((match = pairRegex.exec(clean)) !== null) {
    const key = match[1].trim()
    const val = match[2].trim()
    if (key.includes('공급사')) info.supplierName = val
    if (key.includes('문의번호') || key.includes('전화')) info.supplierContact = val
    if (key.includes('이메일')) info.supplierEmail = val
    if (key.includes('주소') || key.includes('사업장소재지')) info.supplierAddress = val
    if (key.includes('사업자등록번호')) info.supplierBizNo = val
  }

  if (!info.supplierName) {
    const btnMatch = clean.match(/id=["']lBtnShowSellerInfo["'][^>]*>\s*<b>([^<]+)<\/b>/i)
    if (btnMatch) info.supplierName = btnMatch[1]?.trim()
  }

  // 3) 순수 텍스트에서 "공급사명:" 패턴 추출 (HTML 태그 제거 후)
  if (!info.supplierName) {
    const textOnly = clean.replace(/<[^>]+>/g, ' ')
    const m = textOnly.match(/공급사명:\s*([^:\n\r]+?)(?:문의번호|이메일|사업자등록번호|주소|사업장소재지|$)/)
    if (m && m[1]) {
      info.supplierName = m[1].trim()
    }
  }

  return info
}

export default function RegistrationPage() {
  const [productName, setProductName] = useState('')
  const [sellerProductName, setSellerProductName] = useState('') // 내부 관리용 (도매꾹 원래 이름)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [price, setPrice] = useState<number | string>('')
  const [wholesalePrice, setWholesalePrice] = useState<number>(0)
  const [platform, setPlatform] = useState<'rocket' | 'wing' | 'consignment'>('rocket')
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [selectedTitleTemplate, setSelectedTitleTemplate] = useState(0)
  const [customTitle, setCustomTitle] = useState('')
  const [recentRegistrations, setRecentRegistrations] = useState<RecentRegistration[]>([])
  const [detailPageData, setDetailPageData] = useState<DetailPageData | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [displayCategoryCode, setDisplayCategoryCode] = useState('')
  const [outboundCode, setOutboundCode] = useState('')
  const [returnCenterCode, setReturnCenterCode] = useState('')
  const [returnChargeName, setReturnChargeName] = useState('')
  const [returnContact, setReturnContact] = useState('')
  const [returnZip, setReturnZip] = useState('')
  const [returnAddress, setReturnAddress] = useState('')
  const [returnAddressDetail, setReturnAddressDetail] = useState('')
  const [returnCharge, setReturnCharge] = useState<number | string>('')
  const [categoryQuery, setCategoryQuery] = useState('')
  const [categoryResults, setCategoryResults] = useState<{ code: string; path: string; file: string }[]>([])
  const [categoryMessage, setCategoryMessage] = useState('')
  const [isCategorySearching, setIsCategorySearching] = useState(false)
  const [categoryFiles, setCategoryFiles] = useState<string[]>([])
  const [selectedCategoryFile, setSelectedCategoryFile] = useState('')
  const [isPredictingCategory, setIsPredictingCategory] = useState(false)
  const [predictedCategory, setPredictedCategory] = useState<{ id?: string; name?: string } | null>(null)
  const [autoCategoryMatch, setAutoCategoryMatch] = useState(false)

  useEffect(() => {
    const selectedProduct = localStorage.getItem('selectedProduct')
    if (selectedProduct) {
      const product = JSON.parse(selectedProduct)
      setProductName(product.name || '')
      setSellerProductName(product.name || '') // 초기값 설정
      setPrice(product.price || 0)
      setWholesalePrice(product.wholesalePrice || 0)
      if (product.sourcingKeyword) setSourcingKeyword(product.sourcingKeyword)
    }

    const detailData = localStorage.getItem('detailPageData')
    if (detailData) {
      const data: DetailPageData = JSON.parse(detailData)
      setDetailPageData(data)
      setDetailPageData(data)
      setProductName(data.productName || '')
      setSellerProductName(data.productName || '') // 초기값 설정
      if (data.price) setPrice(data.price)
      if (data.wholesalePrice) setWholesalePrice(data.wholesalePrice)
      if (!selectedCategory && data.category) setSelectedCategory(data.category)

      // 서버 콘솔에서 크롤링 결과를 확인할 수 있도록 로그 전송
      try {
        const supplierInfo = parseSupplierInfo(data.detailHtml)
        // 브라우저 콘솔에서도 확인
        console.info('[supplier-debug-client]', {
          supplierInfo,
          hasDetailHtml: Boolean(data.detailHtml),
          detailHtmlLength: data.detailHtml?.length || 0,
          options: data.options || [],
          productNo: data.productNo
        })
        fetch('/api/debug-supplier', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supplierInfo,
            hasDetailHtml: Boolean(data.detailHtml),
            detailHtmlLength: data.detailHtml?.length || 0,
            options: data.options || [],
            productNo: data.productNo
          })
        }).catch(() => { })
      } catch {
        // ignore
      }
    }

    const saved = localStorage.getItem('recentRegistrations')
    if (saved) {
      setRecentRegistrations(JSON.parse(saved))
    } else {
      setRecentRegistrations([
        { id: 1, name: '프리미엄 무선 이어폰', platform: 'rocket', status: 'completed', price: 39900, date: '2024-01-15' },
        { id: 2, name: '스마트 LED 조명', platform: 'wing', status: 'completed', price: 24900, date: '2024-01-14' },
        { id: 3, name: '휴대용 충전기', platform: 'rocket', status: 'pending', price: 35900, date: '2024-01-13' },
        { id: 4, name: '다용도 수납함', platform: 'consignment', status: 'failed', price: 12900, date: '2024-01-12' },
      ])
    }
  }, [selectedCategory])

  // --- AI SEO Optimization ---
  const [seoLoading, setSeoLoading] = useState(false)
  const [seoResult, setSeoResult] = useState<{
    optimizedName: string; suggestedPrice: number; priceReasoning: string; searchTags: string[]; confidence: number
  } | null>(null)
  const [seoApplied, setSeoApplied] = useState(false)
  const [sourcingKeyword, setSourcingKeyword] = useState('')

  // --- AI Recommendation Logic ---
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiData, setAiData] = useState<{ bestName: string; alternatives: string[]; keywords: string[] } | null>(null)
  const [selectedAiName, setSelectedAiName] = useState('')
  const [selectedAiKeywords, setSelectedAiKeywords] = useState<string[]>([])

  // State for AI Price Optimization
  const [isPriceAiLoading, setIsPriceAiLoading] = useState(false)
  const [priceAiModalOpen, setPriceAiModalOpen] = useState(false)
  const [priceAiData, setPriceAiData] = useState<{ recommendedPrice: number; alternatives: number[]; margins: { price: number; marginRate: number }[]; reasoning?: string } | null>(null)
  const [adOnOff, setAdOnOff] = useState(false) // 광고비 적용 여부 

  const handleAiRecommend = async () => {
    setIsAiLoading(true)
    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productName,
          productDescription: detailPageData?.summary || detailPageData?.detailHtml || '',
          brand: detailPageData?.brand,
          attributes: detailPageData?.options,
          minOrderQty: detailPageData?.minOrderQty || 1
        })
      })
      const json = await res.json()
      if (json.ok && json.data) {
        setAiData(json.data)
        setSelectedAiName(json.data.bestName)
        // 키워드는 전체 선택이 기본
        setSelectedAiKeywords(json.data.keywords || [])
        setAiModalOpen(true)
      } else {
        alert('AI 추천에 실패했습니다: ' + (json.error || 'Unknown error'))
      }
    } catch (err) {
      console.error(err)
      alert('AI 요청 중 오류가 발생했습니다.')
    } finally {
      setIsAiLoading(false)
    }
  }

  const handleAiPriceAnalysis = async () => {
    if (!productName || !wholesalePrice) {
      alert('상품명과 도매가가 필요합니다.')
      return
    }
    // 최소주문수량 (MOQ) 처리
    const moq = detailPageData?.minOrderQty || 1
    const finalWholesalePrice = wholesalePrice * moq
    const shippingFee = (productCardData as any)?.shippingFee || 3000

    setIsPriceAiLoading(true)
    try {
      const res = await fetch('/api/ai/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: productName,
          cost: finalWholesalePrice,
          shippingFee: shippingFee,
          adOnOff: adOnOff
        })
      })
      const json = await res.json()
      if (json.ok) {
        setPriceAiData(json.data)
        setPriceAiModalOpen(true)
      } else {
        alert('AI 분석 실패: ' + json.error)
      }
    } catch (e) {
      console.error(e)
      alert('AI 분석 중 오류가 발생했습니다.')
    } finally {
      setIsPriceAiLoading(false)
    }
  }

  // --- AI SEO Optimization Logic ---
  const handleSeoOptimize = async (nameOverride?: string, priceOverride?: number) => {
    const name = nameOverride || productName
    const wp = priceOverride || wholesalePrice
    if (!name || !wp) return

    setSeoLoading(true)
    setSeoApplied(false)
    try {
      const res = await fetch('/api/ai/optimize-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalName: name,
          wholesalePrice: wp,
          category: selectedCategory || undefined,
          sourcingKeyword: sourcingKeyword || undefined,
          currentSalePrice: price ? Number(price) : undefined,
          currentTags: detailPageData?.keywords || [],
        })
      })
      const json = await res.json()
      if (json.ok && json.data) {
        setSeoResult(json.data)
      } else {
        console.error('SEO optimize failed:', json.error)
      }
    } catch (err) {
      console.error('SEO optimize error:', err)
    } finally {
      setSeoLoading(false)
    }
  }

  const applySeoResult = () => {
    if (!seoResult) return
    setProductName(seoResult.optimizedName)
    setPrice(seoResult.suggestedPrice)
    if (detailPageData) {
      const newData = { ...detailPageData, keywords: seoResult.searchTags }
      setDetailPageData(newData)
      localStorage.setItem('detailPageData', JSON.stringify(newData))
    }
    setSeoApplied(true)
  }

  // Auto-trigger SEO when product data is loaded
  useEffect(() => {
    if (productName && wholesalePrice > 0 && !seoResult && !seoLoading) {
      handleSeoOptimize(productName, wholesalePrice)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productName, wholesalePrice])

  const applyPrice = (newPrice: number) => {
    setPrice(newPrice)
    setPriceAiModalOpen(false)
  }

  const applyAiData = () => {
    if (selectedAiName) setProductName(selectedAiName)
    // 키워드는 detailPageData에 업데이트 (배열로 저장한다고 가정)
    if (detailPageData) {
      const newData = { ...detailPageData, keywords: selectedAiKeywords }
      setDetailPageData(newData)
      localStorage.setItem('detailPageData', JSON.stringify(newData))
    }
    setAiModalOpen(false)
  }


  // 출고지/반품지 정보 로드
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('coupangLogistics')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setOutboundCode(parsed.outboundCode || '')
        setReturnCenterCode(parsed.returnCenterCode || '')
        setReturnChargeName(parsed.returnChargeName || '')
        setReturnContact(parsed.returnContact || '')
        setReturnZip(parsed.returnZip || '')
        setReturnAddress(parsed.returnAddress || '')
        setReturnAddressDetail(parsed.returnAddressDetail || '')
        setReturnCharge(parsed.returnCharge ?? '')
      } catch {
        // ignore
      }
    }
  }, [])

  // 출고지/반품지 정보 저장
  useEffect(() => {
    if (typeof window === 'undefined') return
    const data = {
      outboundCode,
      returnCenterCode,
      returnChargeName,
      returnContact,
      returnZip,
      returnAddress,
      returnAddressDetail,
      returnCharge,
    }
    localStorage.setItem('coupangLogistics', JSON.stringify(data))
  }, [outboundCode, returnCenterCode, returnChargeName, returnContact, returnZip, returnAddress, returnAddressDetail, returnCharge])

  const getRecommendedTitle = () => {
    if (!productName) return ''
    return titleTemplates[selectedTitleTemplate].replace('{name}', productName)
  }

  const handleRegister = async () => {
    if (!productName.trim() || !selectedCategory || price <= 0) {
      alert('모든 필수 항목을 입력해주세요.')
      return
    }

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const newRegistration: RecentRegistration = {
      id: Date.now(),
      name: productName,
      platform,
      status: 'completed',
      price,
      date: new Date().toISOString().split('T')[0],
    }

    const updated = [newRegistration, ...recentRegistrations.slice(0, 9)]
    setRecentRegistrations(updated)
    localStorage.setItem('recentRegistrations', JSON.stringify(updated))

    const logs = JSON.parse(localStorage.getItem('activityLogs') || '[]')
    logs.unshift({
      id: Date.now(),
      action: '쿠팡 등록 완료',
      productName,
      status: 'success',
      timestamp: new Date().toISOString(),
    })
    localStorage.setItem('activityLogs', JSON.stringify(logs.slice(0, 50)))

    setIsLoading(false)
    setShowSuccess(true)

    setTimeout(() => {
      setShowSuccess(false)
      setProductName('')
      setSelectedCategory('')
      setPrice(0)
      setWholesalePrice(0)
      setDetailPageData(null)
    }, 3000)
  }

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const calculateMargin = () => {
    if (!price || !wholesalePrice) return null
    const margin = price - wholesalePrice
    const marginRate = (margin / price) * 100
    return { margin, marginRate }
  }

  const marginInfo = calculateMargin()

  const displayProductName = detailPageData?.productName || productName
  const previewPrice = price || detailPageData?.price || 0
  const previewWholesale = wholesalePrice || detailPageData?.wholesalePrice || 0
  const previewMinOrder = detailPageData?.minOrder ?? 2
  const previewShipping = detailPageData?.shippingFee ?? 3000
  const previewImageUsage = detailPageData?.imageUsage || 'available'
  const previewSellPrice = price || detailPageData?.price || previewWholesale
  const previewPrimaryImage =
    detailPageData?.primaryImage ||
    detailPageData?.detailImages?.[0] ||
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80'
  const previewDetailImages = detailPageData?.detailImages || []
  const previewCategory = getCategoryLabel(selectedCategory || detailPageData?.category || '')
  const previewImageUsageLabel = imageUsageLabel[previewImageUsage]
  const previewImageUsageStyle = imageUsageStyle[previewImageUsage]
  const supplierInfo = (() => {
    if (!detailPageData) return {}
    const parsed = parseSupplierInfo(detailPageData.detailHtml)
    const merged = { ...parsed }
    if (detailPageData.supplierName) merged.supplierName = detailPageData.supplierName
    if (detailPageData.supplierContact) merged.supplierContact = detailPageData.supplierContact
    if (detailPageData.supplierEmail) merged.supplierEmail = detailPageData.supplierEmail
    if (detailPageData.supplierAddress) merged.supplierAddress = detailPageData.supplierAddress
    if (detailPageData.supplierBizNo) merged.supplierBizNo = detailPageData.supplierBizNo
    return merged
  })()

  const productCardData = displayProductName
    ? {
      productName: displayProductName,
      price: previewWholesale,
      category: previewCategory,
      minOrder: previewMinOrder,
      shippingFee: previewShipping,
      imageUse: previewImageUsage === 'available',
      mainImage: previewPrimaryImage,
      subImages: previewDetailImages,
      summary: detailPageData?.summary || '',
      detailImages: detailPageData?.detailImages?.length
        ? detailPageData.detailImages
        : previewDetailImages,
      detailHtml: detailPageData?.detailHtml || '',
      options: detailPageData?.options || [],
      productNo: detailPageData?.productNo,
      ...supplierInfo
    }
    : null

  const handleDownloadExcel = async () => {
    if (!productCardData) {
      alert('다운로드할 상품 정보가 없습니다.')
      return
    }
    try {
      const res = await fetch('/api/export-sellertool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productCardData.productName,
          category: productCardData.category,
          sellPrice: previewSellPrice,
          wholesalePrice: productCardData.price,
          minOrder: productCardData.minOrder,
          shippingFee: productCardData.shippingFee,
          imageUse: productCardData.imageUse,
          mainImage: productCardData.mainImage,
          detailImages: productCardData.detailImages,
          summary: productCardData.summary,
          detailHtml: detailPageData?.detailHtml || productCardData.summary,
          supplierName: (productCardData as any).supplierName,
          supplierContact: (productCardData as any).supplierContact,
          supplierEmail: (productCardData as any).supplierEmail,
          supplierAddress: (productCardData as any).supplierAddress,
          supplierBizNo: (productCardData as any).supplierBizNo
        })
      })
      if (!res.ok) throw new Error('엑셀 생성 실패')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `coupang_upload_${Date.now()}.xlsm`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('엑셀 다운로드 오류', err)
      alert('엑셀 파일을 생성하지 못했습니다.')
    }
  }

  const searchCategoryFromExcel = async () => {
    const q = categoryQuery.trim()
    if (!q) {
      setCategoryResults([])
      setCategoryMessage('검색어를 입력하세요. 예) 이어폰, 566')
      return
    }
    setIsCategorySearching(true)
    setCategoryMessage('')
    try {
      const res = await fetch(
        `/api/coupang/categories?q=${encodeURIComponent(q)}&limit=80${selectedCategoryFile ? `&file=${encodeURIComponent(selectedCategoryFile)}` : ''
        }`
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.ok) {
        setCategoryMessage('카테고리 검색 실패')
        return
      }
      setCategoryResults(data.items || [])
      const total = data.total ?? (data.items?.length || 0)
      setCategoryMessage(`검색 결과 ${data.items?.length || 0}건 (총 ${total}건 중 상위)`)
    } catch (err) {
      console.error('카테고리 검색 오류', err)
      setCategoryMessage('카테고리 검색 중 오류')
    } finally {
      setIsCategorySearching(false)
    }
  }

  const handleSelectCategory = (code: string, path: string) => {
    setDisplayCategoryCode(code)
    setSelectedCategory(path)
    setCategoryMessage(`[${code}] ${path} 선택됨`)
    setPredictedCategory({ id: code, name: path })
  }

  useEffect(() => {
    // (주석 처리 요청) 엑셀 기반 카테고리 파일 목록 미리 로드 기능 비활성화
    if (false) {
      fetch('/api/coupang/categories?files=1')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data?.files)) setCategoryFiles(data.files)
        })
        .catch(() => { })
    }
  }, [])

  const handlePredictCategory = async () => {
    const name = productCardData?.productName || productName
    if (!name) {
      alert('상품명을 먼저 입력해주세요.')
      return
    }
    setIsPredictingCategory(true)
    setCategoryMessage('')
    try {
      const res = await fetch('/api/coupang/category-predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: name,
          productDescription:
            detailPageData?.summary ||
            detailPageData?.detailText ||
            detailPageData?.detailHtml ||
            '',
          brand: detailPageData?.brand || '',
          attributes: detailPageData?.attributes || {}
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.ok || !data?.data?.predictedCategoryId) {
        setCategoryMessage('카테고리 추천 실패')
        return
      }
      const id = data.data.predictedCategoryId
      const namePath = data.data.predictedCategoryName || ''
      setPredictedCategory({ id, name: namePath })
      setDisplayCategoryCode(id)
      setSelectedCategory(namePath || '')
      setCategoryMessage(`추천 카테고리: [${id}] ${namePath || ''}`)
    } catch (err) {
      console.error('카테고리 추천 오류', err)
      setCategoryMessage('카테고리 추천 중 오류')
    } finally {
      setIsPredictingCategory(false)
    }
  }

  const handleRegisterCoupang = async () => {
    if (!productCardData) {
      alert('상품 정보가 없습니다.')
      return
    }
    try {
      const supplierPayload =
        detailPageData?.supplier ||
        {
          supplierName: (supplierInfo as any).supplierName || (productCardData as any).supplierName,
          supplierContact: (supplierInfo as any).supplierContact || (productCardData as any).supplierContact,
          supplierEmail: (supplierInfo as any).supplierEmail || (productCardData as any).supplierEmail,
          supplierAddress: (supplierInfo as any).supplierAddress || (productCardData as any).supplierAddress,
          supplierBizNo: (supplierInfo as any).supplierBizNo || (productCardData as any).supplierBizNo,
        }
      console.log('[register-coupang-supplier-payload]', supplierPayload)

      const res = await fetch('/api/coupang/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productName, // state 직접 사용
          categoryCode: autoCategoryMatch
            ? undefined
            : displayCategoryCode || detailPageData?.categoryCode || detailPageData?.displayCategoryCode,
          sellPrice: previewSellPrice,
          wholesalePrice: productCardData.price,
          minOrder: productCardData.minOrder,
          shippingFee: productCardData.shippingFee,
          imageUse: productCardData.imageUse,
          mainImage: productCardData.mainImage,
          detailImages: productCardData.detailImages,
          summary: productCardData.summary,
          detailHtml: detailPageData?.detailHtml || productCardData.summary,
          keywords: detailPageData?.keywords || [],
          brand: detailPageData?.brand,
          productNo: detailPageData?.productNo,
          outboundShippingPlaceCode: outboundCode,
          returnCenterCode,
          returnChargeName,
          companyContactNumber: returnContact,
          returnZipCode: returnZip,
          returnAddress,
          returnAddressDetail,
          returnCharge,
          supplier: supplierPayload,
          supplierInfo: detailPageData?.supplierInfo,
          options: detailPageData?.options || [],
          sellerProductName: sellerProductName || productName, // 추가
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        console.error('쿠팡 등록 실패', json)
        alert(`쿠팡 등록 실패: ${json?.error || json?.coupang?.message || res.status}`)
        return
      }
      alert('쿠팡 API 등록 요청 완료')
      console.info('쿠팡 응답', json.coupang)
    } catch (err) {
      console.error('쿠팡 등록 오류', err)
      alert('쿠팡 등록 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-8 overflow-y-hidden">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Upload className="w-7 h-7 text-orange-400" />
            쿠팡 등록 준비
          </h1>
          <p className="text-slate-400 mt-1">상품 정보를 입력하고 쿠팡에 등록 준비를 완료하세요</p>
        </div>
        <button
          onClick={handleDownloadExcel}
          className="btn-secondary text-sm"
        >
          엑셀로 다운로드
        </button>
        <button
          onClick={handleRegisterCoupang}
          className="btn-primary text-sm ml-2"
        >
          쿠팡 API로 등록
        </button>
      </header>

      {/* 상품명 & AI 최적화 섹션 (상단 이동) */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-primary-400" />
            상품명 설정
          </h3>
          <span className="text-xs text-slate-500">도매꾹 원본 상품명과 쿠팡 노출 상품명을 분리하여 관리합니다.</span>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 왼쪽: 입력 및 AI 조작 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">쿠팡 노출 상품명 (AI 최적화) *</label>
              <div className="flex gap-2">
                <div className="input-icon-wrapper flex-1">
                  <Package className="w-4 h-4" />
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="input flex-1 pl-10 w-full"
                    placeholder="쿠팡에 노출될 상품명"
                  />
                </div>
                <button
                  onClick={handleAiRecommend}
                  disabled={isAiLoading || !productName}
                  className="btn-secondary whitespace-nowrap flex items-center gap-2"
                >
                  {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-purple-400" />}
                  AI 최적화
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">이 이름은 쿠팡 고객에게 노출되고 검색에 사용됩니다.</p>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">판매자 관리용 상품명 (도매꾹 원본)</label>
              <input
                type="text"
                value={sellerProductName}
                onChange={(e) => setSellerProductName(e.target.value)}
                className="input w-full bg-slate-800/50 text-slate-400"
                placeholder="관리용 상품명 (내부용)"
              />
              <p className="text-xs text-slate-500 mt-1">셀픽스/쿠팡윙 관리자 페이지에서만 보이는 이름입니다.</p>
            </div>
          </div>

          {/* 오른쪽: AI 결과 프리뷰 (AI 추천 시에만 보임) */}
          <div className="space-y-3">
            {productName && (
              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 h-full">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-slate-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    AI 추천 상품명 & 키워드
                  </p>
                </div>
                {aiData ? (
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-slate-500 block mb-1">추천 상품명</span>
                      <div className="text-sm text-white font-medium break-all">{aiData.bestName}</div>
                    </div>
                    <div>
                      <span className="text-xs text-white block mb-1">추천 검색어 ({selectedAiKeywords.length})</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedAiKeywords.slice(0, 5).map((k, i) => (
                          <span key={i} className="px-2 py-0.5 bg-primary-500/20 text-primary-300 text-[10px] rounded">{k}</span>
                        ))}
                        {selectedAiKeywords.length > 5 && <span className="text-[10px] text-slate-500">+{selectedAiKeywords.length - 5} 더보기</span>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[100px] flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                    <Sparkles className="w-6 h-6 opacity-20" />
                    <p>AI 최적화 버튼을 눌러보세요!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI SEO 최적화 패널 */}
      {(seoLoading || seoResult) && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              AI SEO 최적화
            </h3>
            {seoResult && !seoApplied && (
              <button
                onClick={() => handleSeoOptimize()}
                className="text-xs text-slate-400 hover:text-white"
              >
                다시 분석
              </button>
            )}
          </div>

          {seoLoading && (
            <div className="flex items-center gap-3 p-4 bg-purple-500/5 rounded-lg border border-purple-500/20">
              <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
              <span className="text-sm text-slate-300">AI 최적화 분석 중...</span>
            </div>
          )}

          {seoResult && !seoLoading && (
            <div className="space-y-4">
              {seoApplied ? (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-green-300">AI 최적화가 적용되었습니다</span>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* 최적화 상품명 */}
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <p className="text-xs text-slate-400 mb-2">최적화 상품명</p>
                      <p className="text-sm text-white font-medium leading-snug">{seoResult.optimizedName}</p>
                    </div>

                    {/* 추천 가격 */}
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <p className="text-xs text-slate-400 mb-2">추천 판매가</p>
                      <p className="text-xl font-bold text-white">{formatCurrency(seoResult.suggestedPrice)}</p>
                      <p className="text-xs text-slate-500 mt-1">{seoResult.priceReasoning}</p>
                    </div>
                  </div>

                  {/* 태그 미리보기 */}
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-400">추천 검색 태그 ({seoResult.searchTags.length}개)</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        seoResult.confidence >= 70
                          ? 'bg-green-500/15 text-green-300'
                          : seoResult.confidence >= 40
                          ? 'bg-yellow-500/15 text-yellow-300'
                          : 'bg-red-500/15 text-red-300'
                      }`}>
                        신뢰도 {seoResult.confidence}%
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {seoResult.searchTags.slice(0, 5).map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-primary-500/20 text-primary-300 text-xs rounded">{tag}</span>
                      ))}
                      {seoResult.searchTags.length > 5 && (
                        <span className="text-xs text-slate-500">+{seoResult.searchTags.length - 5}개</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={applySeoResult}
                    className="btn-primary w-full py-3 bg-purple-600 hover:bg-purple-700 border-transparent flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    AI 제안 적용
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* 판매가 & AI 가격 제안 섹션 (상품명 바로 아래로 이동) */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary-400" />
            판매가 설정
          </h3>
          <span className="text-xs text-slate-500">도매가와 배송비를 입력하고 AI 가격 제안을 받아보세요.</span>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">도매가 (선택)</label>
              <div className="input-icon-wrapper">
                <DollarSign className="w-4 h-4" />
                <input
                  type="number"
                  value={wholesalePrice || ''}
                  onChange={(e) => setWholesalePrice(Number(e.target.value))}
                  placeholder="도매가"
                  className="input w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">판매가 *</label>
              <div className="flex gap-2">
                <div className="input-icon-wrapper flex-1">
                  <DollarSign className="w-4 h-4" />
                  <input
                    type="number"
                    value={price || ''}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    placeholder="판매 가격을 입력하세요"
                    className="input w-full"
                  />
                </div>
                <button
                  onClick={handleAiPriceAnalysis}
                  disabled={isPriceAiLoading || !wholesalePrice}
                  className="btn-secondary whitespace-nowrap flex items-center gap-2"
                >
                  {isPriceAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4 text-green-400" />}
                  AI 가격제안
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="adOnOff" checked={adOnOff} onChange={e => setAdOnOff(e.target.checked)} className="checkbox" />
                <label htmlFor="adOnOff" className="text-xs text-slate-400 cursor-pointer">광고비 고려 (ON/OFF)</label>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {/* AI Price Preview or Placeholder */}
            {!priceAiModalOpen && !priceAiData && (
              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 h-full flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                <TrendingUp className="w-6 h-6 opacity-20" />
                <p>도매가를 입력하고 AI 가격제안을 받아보세요!</p>
              </div>
            )}
            {priceAiData && !priceAiModalOpen && (
              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 h-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white">AI 분석 완료</span>
                  <button onClick={() => setPriceAiModalOpen(true)} className="text-xs text-primary-400 hover:text-primary-300">
                    다시 보기
                  </button>
                </div>
                <p className="text-2xl font-bold text-white mb-1">{formatCurrency(priceAiData.recommendedPrice)}</p>
                <p className="text-xs text-green-400">추천 마진율 {priceAiData.margins.find(m => m.price === priceAiData.recommendedPrice)?.marginRate.toFixed(1)}%</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm text-slate-300">
            노출 카테고리 코드 <span className="text-orange-400">(필수)</span>
          </label>
          <div className="flex gap-2 items-start">
            <input
              type="text"
              value={displayCategoryCode}
              onChange={(e) => setDisplayCategoryCode(e.target.value.trim())}
              placeholder="예: 56137 (엑셀/카테고리 API에서 확인)"
              className="input w-full"
              disabled={autoCategoryMatch}
            />
            <button
              onClick={handlePredictCategory}
              disabled={isPredictingCategory || !productName}
              className="btn-secondary whitespace-nowrap flex items-center gap-2"
            >
              {isPredictingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              쿠팡 추천
            </button>
          </div>
          <p className="text-xs text-slate-500">
            값이 비어 있으면 쿠팡 자동매칭을 시도하지만 반려될 수 있습니다. 엑셀 카테고리 코드를 입력하거나 쿠팡 추천을 사용하세요.
          </p>
          {predictedCategory?.id && (
            <p className="text-xs text-green-400">
              추천: [{predictedCategory.id}] {predictedCategory.name || ''} (입력란에 적용됨)
            </p>
          )}
          {categoryMessage && <p className="text-xs text-slate-400">{categoryMessage}</p>}
          <label className="inline-flex items-center gap-2 text-sm text-slate-300 mt-1">
            <input
              type="checkbox"
              checked={autoCategoryMatch}
              onChange={(e) => setAutoCategoryMatch(e.target.checked)}
            />
            카테고리 자동매칭 사용 (코드를 비워서 전송)
          </label>
        </div>
      </div>

      {false && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-3">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-sm text-slate-300">카테고리 검색 (엑셀 데이터)</label>
              <input
                className="input w-full"
                placeholder="예: 이어폰, 뷰티, 566xx"
                value={categoryQuery}
                onChange={(e) => setCategoryQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') searchCategoryFromExcel()
                }}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">엑셀 파일 선택</label>
              <select
                className="input"
                value={selectedCategoryFile}
                onChange={(e) => setSelectedCategoryFile(e.target.value)}
              >
                <option value="">전체</option>
                {categoryFiles.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={searchCategoryFromExcel}
              disabled={isCategorySearching}
              className="btn-secondary whitespace-nowrap flex items-center gap-2"
            >
              {isCategorySearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <SearchIcon />}
              검색
            </button>
          </div>
          <p className="text-xs text-slate-500">
            {categoryMessage ||
              '엑셀데이터/Coupang_Category_20250811_1412/*.xlsx에서 노출카테고리 코드를 검색하거나 쿠팡 카테고리 추천을 이용하세요.'}
          </p>
          <div className="max-h-56 overflow-y-auto space-y-2">
            {categoryResults.map((cat) => (
              <button
                key={`${cat.file}-${cat.code}-${cat.path}`}
                onClick={() => handleSelectCategory(cat.code, cat.path)}
                className="w-full text-left border border-slate-700/70 rounded-lg p-3 hover:border-orange-500/50 hover:bg-slate-700/40 transition"
              >
                <div className="text-sm text-white font-medium">[{cat.code}] {cat.path}</div>
                <div className="text-xs text-slate-500">{cat.file}</div>
              </button>
            ))}
            {!isCategorySearching && categoryResults.length === 0 && (
              <div className="text-xs text-slate-500">검색 결과가 없습니다.</div>
            )}
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-md mx-4 text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">등록 준비 완료!</h3>
            <p className="text-slate-400 mb-4">상품이 쿠팡 등록 대기열에 추가되었습니다.</p>
            <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
              <p className="text-sm text-slate-400">등록된 상품</p>
              <p className="text-white font-medium">{productName}</p>
              <p className="text-primary-400 font-semibold">{formatCurrency(price)}</p>
            </div>
            <p className="text-sm text-slate-500">잠시 후 자동으로 닫힙니다...</p>
          </div>
        </div>
      )}

      {productCardData && (
        <section className="card space-y-4 w-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-400" />
              <div>
                <p className="text-sm font-semibold text-white">상세페이지 + 상품정보 미리보기</p>
                <p className="text-xs text-slate-400">2컬럼 정보 · 원문은 아래 스크롤 박스에 정리됩니다.</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${previewImageUsageStyle}`}>
              {previewImageUsageLabel}
            </span>
          </div>
          <div className="w-full">
            <ProductInfoCard data={productCardData} />
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6">
        <div className="card space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              {/* Product Name moved to top */}
            </div>

            <div className="md:col-span-2 space-y-3">
              {productName && (
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-slate-400 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                      AI 추천 상품명
                    </p>
                    <button
                      onClick={() => copyToClipboard(customTitle || getRecommendedTitle(), 'title')}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedField === 'title' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      복사
                    </button>
                  </div>

                  <div className="space-y-2 mb-3">
                    {titleTemplates.map((template, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedTitleTemplate(idx)
                          setCustomTitle('')
                        }}
                        className={selectedTitleTemplate === idx && !customTitle ? 'template-btn-active' : 'template-btn'}
                      >
                        {template.replace('{name}', productName)}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="또는 직접 입력..."
                    className="input w-full text-sm"
                  />
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-slate-400 mb-2">카테고리 *</label>
              <div className="input-icon-wrapper relative">
                <Tag className="w-4 h-4" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input w-full pr-10 appearance-none cursor-pointer"
                  style={{ paddingLeft: '40px' }}
                >
                  <option value="">카테고리를 선택하세요</option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>


          </div>

          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 space-y-3">
            <h3 className="text-sm font-semibold text-white">출고지 / 반품지 설정</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">출고지 코드</label>
                <input
                  value={outboundCode}
                  onChange={(e) => setOutboundCode(e.target.value)}
                  className="input w-full"
                  placeholder="outboundShippingPlaceCode"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">반품지 센터코드</label>
                <input
                  value={returnCenterCode}
                  onChange={(e) => setReturnCenterCode(e.target.value)}
                  className="input w-full"
                  placeholder="returnCenterCode"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">반품지명</label>
                <input
                  value={returnChargeName}
                  onChange={(e) => setReturnChargeName(e.target.value)}
                  className="input w-full"
                  placeholder="returnChargeName"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">반품 연락처</label>
                <input
                  value={returnContact}
                  onChange={(e) => setReturnContact(e.target.value)}
                  className="input w-full"
                  placeholder="companyContactNumber"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">반품 우편번호</label>
                <input
                  value={returnZip}
                  onChange={(e) => setReturnZip(e.target.value)}
                  className="input w-full"
                  placeholder="returnZipCode"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">반품 주소</label>
                <input
                  value={returnAddress}
                  onChange={(e) => setReturnAddress(e.target.value)}
                  className="input w-full"
                  placeholder="returnAddress"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">반품 주소 상세</label>
                <input
                  value={returnAddressDetail}
                  onChange={(e) => setReturnAddressDetail(e.target.value)}
                  className="input w-full"
                  placeholder="returnAddressDetail"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">반품 배송비</label>
                <input
                  type="number"
                  value={returnCharge}
                  onChange={(e) => setReturnCharge(e.target.value)}
                  className="input w-full"
                  placeholder="returnCharge"
                />
              </div>
            </div>
            <p className="text-xs text-slate-500">입력 값은 브라우저에 저장되어 다음에도 자동 복원됩니다.</p>
          </div>

          {
            marginInfo && (
              <div className={`p-4 rounded-lg ${marginInfo.marginRate >= 20 ? 'bg-green-500/10 border border-green-500/30' : 'bg-yellow-500/10 border border-yellow-500/30'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">예상 마진</span>
                  <div className="text-right">
                    <span className={`font-bold ${marginInfo.marginRate >= 20 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {formatCurrency(marginInfo.margin)}
                    </span>
                    <span className="text-slate-400 text-sm ml-2">
                      ({marginInfo.marginRate.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            )
          }

          <div className="space-y-2">
            <label className="block text-sm text-slate-400 mb-1">등록 방식 *</label>
            <div className="grid grid-cols-3 gap-3">
              {platforms.map((p) => {
                const Icon = p.icon
                const isActive = platform === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id as typeof platform)}
                    className={isActive ? 'registration-method-card-active' : 'registration-method-card'}
                  >
                    {isActive && (
                      <div className="registration-method-check">
                        <Check />
                      </div>
                    )}
                    <div className={`registration-method-icon ${p.id === 'rocket' ? 'blue' : p.id === 'wing' ? 'green' : 'orange'}`}>
                      <Icon />
                    </div>
                    <p className="registration-method-title">{p.name}</p>
                    <p className="registration-method-desc">{p.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          <button
            onClick={handleRegister}
            disabled={isLoading || !productName || !selectedCategory || !price}
            className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                등록 준비 중...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                쿠팡 등록 준비 완료
              </>
            )}
          </button>
        </div >

        <div className="card space-y-4">
          <h3 className="text-lg font-semibold text-white">최근 등록 현황</h3>
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
            {recentRegistrations.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-medium text-white truncate flex-1 pr-2">
                    {item.name}
                  </p>
                  <span className={`px-2 py-0.5 rounded text-xs flex-shrink-0 ${item.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    item.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                    {item.status === 'completed' ? '완료' :
                      item.status === 'pending' ? '대기' : '실패'}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    {item.platform === 'rocket' && <Rocket className="w-3 h-3" />}
                    {item.platform === 'wing' && <Truck className="w-3 h-3" />}
                    {item.platform === 'consignment' && <Store className="w-3 h-3" />}
                    {item.platform === 'rocket' ? '로켓' : item.platform === 'wing' ? '윙' : '위탁'}
                  </span>
                  <span>{formatCurrency(item.price)}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{item.date}</p>
              </div>
            ))}
          </div>

          <a
            href="/logs"
            className="block text-center text-sm text-primary-400 hover:text-primary-300 transition-colors"
          >
            전체 이력 보기 <ArrowRight className="w-4 h-4 inline" />
          </a>

          <div className="pt-4 border-t border-slate-700 space-y-2">
            <h4 className="text-sm font-medium text-slate-400">바로가기</h4>
            <div className="grid grid-cols-2 gap-2">
              <a href="/recommendation" className="p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-center transition-colors">
                <Sparkles className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                <p className="text-xs text-slate-300">AI 추천</p>
              </a>
              <a href="/margin" className="p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-center transition-colors">
                <DollarSign className="w-5 h-5 text-green-400 mx-auto mb-1" />
                <p className="text-xs text-slate-300">마진 계산</p>
              </a>
              <a href="/detail-page" className="p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-center transition-colors">
                <FileText className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                <p className="text-xs text-slate-300">상세페이지</p>
              </a>
              <a href="/logs" className="p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-center transition-colors">
                <ExternalLink className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <p className="text-xs text-slate-300">작업 이력</p>
              </a>
            </div>
          </div>
        </div>
      </div >

      <div className="card bg-slate-800/30">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-400 space-y-1">
            <p className="font-medium text-slate-300 mb-1">등록 방식 안내</p>
            <p><span className="text-blue-400">로켓배송</span>: 쿠팡 물류센터 입고 후 빠른 배송 (수수료 10.8%)</p>
            <p><span className="text-green-400">윙배송</span>: 직접 배송, 낮은 수수료 (수수료 6.5%)</p>
            <p><span className="text-orange-400">위탁판매</span>: 업체에서 직접 배송 (수수료 8.0%)</p>
          </div>
        </div>
      </div>

      {/* AI Recommendation Modal */}
      {
        aiModalOpen && aiData && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-slate-700 shadow-2xl">
              <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  AI 추천 결과
                </h3>
                <button onClick={() => setAiModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div className="p-6 space-y-6">
                {/* Name Selection */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-3 block">상품명 선택</h4>
                  <div className="space-y-2">
                    {[aiData.bestName, ...aiData.alternatives].map((name, idx) => (
                      <label
                        key={idx}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedAiName === name
                          ? 'bg-purple-500/10 border-purple-500/50'
                          : 'bg-slate-700/30 border-slate-700 hover:bg-slate-700/50'
                          }`}
                      >
                        <input
                          type="radio"
                          name="aiName"
                          checked={selectedAiName === name}
                          onChange={() => setSelectedAiName(name)}
                          className="mt-1"
                        />
                        <div>
                          <span className={`text-sm ${idx === 0 ? 'font-bold text-purple-300' : 'text-slate-200'}`}>
                            {name}
                          </span>
                          {idx === 0 && <span className="ml-2 text-[10px] bg-purple-500 text-white px-1.5 py-0.5 rounded-full">BEST</span>}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Keywords Selection */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-semibold text-slate-300">추천 검색어 (20개)</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedAiKeywords(aiData.keywords)}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        전체선택
                      </button>
                      <button
                        onClick={() => setSelectedAiKeywords([])}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        해제
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {aiData.keywords.map((kw, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (selectedAiKeywords.includes(kw)) {
                            setSelectedAiKeywords(prev => prev.filter(k => k !== kw))
                          } else {
                            setSelectedAiKeywords(prev => [...prev, kw])
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs transition-colors ${selectedAiKeywords.includes(kw)
                          ? 'bg-blue-600 text-white border border-blue-500'
                          : 'bg-slate-700 text-slate-400 border border-slate-600 hover:bg-slate-600'
                          }`}
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-700 bg-slate-800/50 flex justify-end gap-3 sticky bottom-0">
                <button
                  onClick={() => setAiModalOpen(false)}
                  className="btn-secondary"
                >
                  취소
                </button>
                <button
                  onClick={applyAiData}
                  className="btn-primary bg-purple-600 hover:bg-purple-700 border-transparent"
                >
                  적용하기
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* AI Price Modal */}
      {
        priceAiModalOpen && priceAiData && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
            <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  AI 최적 판매가 제안
                </h3>
                <button onClick={() => setPriceAiModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  {/* Recommended */}
                  <button
                    onClick={() => applyPrice(priceAiData.recommendedPrice)}
                    className="bg-primary-500/10 border border-primary-500 hover:bg-primary-500/20 rounded-lg p-4 text-center transition group relative overflow-hidden ring-2 ring-primary-500"
                  >
                    <div className="absolute top-0 left-0 w-full bg-primary-500 text-[10px] text-white py-0.5">추천 정가</div>
                    <div className="mt-2 text-xl font-bold text-white">{formatCurrency(priceAiData.recommendedPrice)}</div>
                    <div className="text-xs text-green-400 font-medium">마진 {priceAiData.margins.find(m => m.price === priceAiData.recommendedPrice)?.marginRate.toFixed(1)}%</div>
                  </button>
                  {/* Alt 1 (Min) */}
                  {priceAiData.alternatives[0] && (
                    <button
                      onClick={() => applyPrice(priceAiData.alternatives[0])}
                      className="bg-slate-700/30 border border-slate-600 hover:bg-slate-700/50 rounded-lg p-4 text-center transition"
                    >
                      <div className="text-xs text-slate-400 mb-1">최소 제안</div>
                      <div className="text-lg font-bold text-slate-200">{formatCurrency(priceAiData.alternatives[0])}</div>
                      <div className="text-xs text-slate-400">마진 {priceAiData.margins.find(m => m.price === priceAiData.alternatives[0])?.marginRate.toFixed(1)}%</div>
                    </button>
                  )}
                  {/* Alt 2 (Max) */}
                  {priceAiData.alternatives[1] && (
                    <button
                      onClick={() => applyPrice(priceAiData.alternatives[1])}
                      className="bg-slate-700/30 border border-slate-600 hover:bg-slate-700/50 rounded-lg p-4 text-center transition"
                    >
                      <div className="text-xs text-slate-400 mb-1">최대 제안</div>
                      <div className="text-lg font-bold text-slate-200">{formatCurrency(priceAiData.alternatives[1])}</div>
                      <div className="text-xs text-slate-400">마진 {priceAiData.margins.find(m => m.price === priceAiData.alternatives[1])?.marginRate.toFixed(1)}%</div>
                    </button>
                  )}
                </div>
                {priceAiData.reasoning && (
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                    <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1">
                      <Search className="w-3 h-3" /> 분석 리포트
                    </h4>
                    <p className="text-sm text-slate-300 leading-relaxed text-left">
                      {priceAiData.reasoning}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }
    </div >
  )
}
