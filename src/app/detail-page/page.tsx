'use client'

import { useState } from 'react'
import {
  FileText,
  Link as LinkIcon,
  Sparkles,
  Image as ImageIcon,
  CheckCircle,
  Loader2,
  Copy,
  Download,
  RefreshCw,
  Eye,
  Wand2,
  Layout,
  Type,
  List,
  ArrowRight,
  Check
} from 'lucide-react'

interface DetailPageResult {
  productName: string
  summary: string
  usps: string[]
  keywords: string[]
  template: string
  primaryImage: string
  detailImages: string[]
  detailHtml: string
  price?: number
  wholesalePrice?: number
  minOrder?: number
  shippingFee?: number
  imageUsage?: 'available' | 'unavailable' | 'review' | 'unknown'
}

interface Template {
  id: string
  name: string
  description: string
  color: string
  preview: string
}

const templates: Template[] = [
  { id: 'simple', name: '심플', description: '깔끔하고 미니멀한 디자인', color: 'from-gray-600 to-gray-800', preview: '기본형' },
  { id: 'premium', name: '프리미엄', description: '고급스러운 느낌의 디자인', color: 'from-amber-600 to-amber-800', preview: '고급형' },
  { id: 'modern', name: '모던', description: '현대적이고 세련된 디자인', color: 'from-blue-600 to-blue-800', preview: '트렌디' },
]

const buildDetailHtml = (payload: { productName: string; summary: string; usps: string[]; images: string[] }) => `
  <div style="font-family: 'Noto Sans KR', sans-serif; color: #0f172a; line-height: 1.8; background: #f8fafc; border-radius: 14px; padding: 16px;">
    <div style="margin-bottom: 18px;">
      <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 8px;">${payload.productName}</h2>
      <p style="color: #334155; font-size: 15px;">${payload.summary}</p>
    </div>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 18px;">
      ${payload.images.slice(0, 4).map(img => `
        <img src="${img}" alt="상세 이미지" style="width: 100%; border-radius: 12px; object-fit: cover; box-shadow: 0 6px 20px rgba(15, 23, 42, 0.1);" />
      `).join('')}
    </div>
    <div style="padding: 14px; border-radius: 12px; background: #f1f5f9;">
      <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 8px; color: #0f172a;">주요 특징</h3>
      <ol style="padding-left: 18px; color: #0f172a; margin: 0;">
        ${payload.usps.map(usp => `<li style="margin-bottom: 6px;">${usp}</li>`).join('')}
      </ol>
    </div>
  </div>
`

// Mock URL 분석 데이터베이스
const mockProductData: Record<string, DetailPageResult> = {
  '이어폰': {
    productName: '프리미엄 무선 블루투스 이어폰 5.3',
    summary: '최신 블루투스 5.3 기술을 적용한 고음질 무선 이어폰입니다. 액티브 노이즈 캔슬링과 30시간 연속 재생으로 언제 어디서나 최상의 음악 감상이 가능합니다.',
    usps: [
      '블루투스 5.3 최신 기술 적용',
      '액티브 노이즈 캔슬링 (ANC)',
      '30시간 연속 재생 가능',
      'IPX5 생활 방수 등급',
      '초경량 4g 인체공학 설계'
    ],
    keywords: ['무선이어폰', '블루투스이어폰', 'TWS', '노이즈캔슬링', '방수이어폰'],
    template: 'premium',
    primaryImage: 'https://images.unsplash.com/photo-1583391733956-6c7822ee33e8?auto=format&fit=crop&w=900&q=80',
    detailImages: [
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1582719478210-2b06f3d6b308?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=900&q=80'
    ],
    minOrder: 2,
    shippingFee: 3000,
    imageUsage: 'available',
    detailHtml: ''
  },
  'LED': {
    productName: '스마트 LED 무드등 RGB 조명',
    summary: '16만 가지 색상을 지원하는 스마트 LED 무드등입니다. 앱 연동으로 다양한 조명 모드를 설정할 수 있으며, 음악에 맞춰 색상이 변경됩니다.',
    usps: [
      '16만 컬러 RGB LED',
      '스마트폰 앱 연동',
      '음악 반응 모드 지원',
      '타이머 및 스케줄 기능',
      '저전력 USB 충전'
    ],
    keywords: ['LED조명', '무드등', 'RGB조명', '인테리어조명', '스마트조명'],
    template: 'modern',
    primaryImage: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80',
    detailImages: [
      'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=80'
    ],
    minOrder: 1,
    shippingFee: 2500,
    imageUsage: 'available',
    detailHtml: ''
  },
  '충전기': {
    productName: '고속 무선 충전기 15W PD',
    summary: '15W 고속 무선 충전과 PD 유선 충전을 동시에 지원하는 2in1 충전기입니다. 아이폰, 갤럭시, 에어팟 등 모든 Qi 호환 기기를 빠르게 충전합니다.',
    usps: [
      '15W 고속 무선 충전',
      'PD 유선 충전 지원',
      'Qi 표준 호환',
      '과충전 방지 보호회로',
      '슬림 디자인 & LED 인디케이터'
    ],
    keywords: ['무선충전기', '고속충전기', 'PD충전기', '아이폰충전기', '갤럭시충전기'],
    template: 'simple',
    primaryImage: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
    detailImages: [
      'https://images.unsplash.com/photo-1581291518861-8e8ce6c1dcdd?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1545239351-46b0a0cfdc24?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&w=900&q=80'
    ],
    minOrder: 3,
    shippingFee: 3200,
    imageUsage: 'review',
    detailHtml: ''
  }
}

export default function DetailPageGenerator() {
  const [productUrl, setProductUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<DetailPageResult | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState('premium')
  const [editableUsps, setEditableUsps] = useState<string[]>([])
  const [editableSummary, setEditableSummary] = useState('')
  const [editableKeywords, setEditableKeywords] = useState<string[]>([])
  const [editableDetailHtml, setEditableDetailHtml] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!productUrl.trim()) return

    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    // URL에서 키워드 추출하여 매칭
    const matchedKey = Object.keys(mockProductData).find(key =>
      productUrl.toLowerCase().includes(key.toLowerCase())
    )

    const generatedResult = matchedKey
      ? mockProductData[matchedKey]
      : {
          productName: 'AI 분석 상품',
          summary: 'AI가 분석한 상품 요약입니다. URL에서 상품 정보를 추출하여 최적의 상세페이지 콘텐츠를 생성합니다. 이 상품은 뛰어난 품질과 합리적인 가격으로 고객 만족도가 높습니다.',
          usps: [
            '프리미엄 품질 보장',
            '빠른 배송 가능',
            'A/S 1년 보장',
            '가성비 최고 제품',
            '고객 만족도 98%'
          ],
          keywords: ['상품명', '키워드1', '키워드2', '키워드3', '키워드4'],
          template: selectedTemplate,
          primaryImage: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
          detailImages: [
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
            'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80',
            'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=900&q=80',
            'https://images.unsplash.com/photo-1509395176047-4a66953fd231?auto=format&fit=crop&w=900&q=80'
          ],
          minOrder: 1,
          shippingFee: 3000,
          imageUsage: 'available',
          detailHtml: ''
        }

    const detailImages = generatedResult.detailImages?.length
      ? generatedResult.detailImages
      : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80']

    const finalizedResult: DetailPageResult = {
      ...generatedResult,
      primaryImage: generatedResult.primaryImage || detailImages[0],
      detailImages,
      detailHtml: generatedResult.detailHtml || buildDetailHtml({
        productName: generatedResult.productName,
        summary: generatedResult.summary,
        usps: generatedResult.usps,
        images: detailImages
      }),
      minOrder: generatedResult.minOrder ?? 1,
      shippingFee: generatedResult.shippingFee ?? 3000,
      imageUsage: (generatedResult.imageUsage ?? 'available') as 'unknown' | 'unavailable' | 'available' | 'review'
    }

    setResult(finalizedResult)
    setEditableUsps([...finalizedResult.usps])
    setEditableSummary(finalizedResult.summary)
    setEditableKeywords([...finalizedResult.keywords])
    setEditableDetailHtml(finalizedResult.detailHtml)
    setSelectedTemplate(finalizedResult.template)
    setIsLoading(false)
  }

  const handleRegenerate = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 새로운 USP 생성 (Mock)
    const newUsps = [
      '최신 기술 적용 제품',
      '국내 정품 / 정식 수입',
      '빠른 배송 서비스',
      '안심 구매 보증',
      '친환경 패키징'
    ]

    setEditableUsps(newUsps)
    setIsLoading(false)
  }

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const copyAllContent = async () => {
    if (!result) return

    const allContent = `
상품명: ${result.productName}

상품 설명:
${editableSummary}

USP (핵심 판매 포인트):
${editableUsps.map((usp, i) => `${i + 1}. ${usp}`).join('\n')}

키워드:
${editableKeywords.join(', ')}
    `.trim()

    await copyToClipboard(allContent, 'all')
  }

  const updateUsp = (index: number, value: string) => {
    const updated = [...editableUsps]
    updated[index] = value
    setEditableUsps(updated)
  }

  const addUsp = () => {
    if (editableUsps.length < 7) {
      setEditableUsps([...editableUsps, '새로운 USP를 입력하세요'])
    }
  }

  const removeUsp = (index: number) => {
    if (editableUsps.length > 3) {
      setEditableUsps(editableUsps.filter((_, i) => i !== index))
    }
  }

  const handleGoToRegistration = () => {
    if (result) {
      localStorage.setItem('detailPageData', JSON.stringify({
        productName: result.productName,
        summary: editableSummary,
        usps: editableUsps,
        keywords: editableKeywords,
        template: selectedTemplate,
        primaryImage: result.primaryImage,
        detailImages: result.detailImages,
        detailHtml: editableDetailHtml,
        minOrder: result.minOrder,
        shippingFee: result.shippingFee,
        imageUsage: result.imageUsage
      }))
      window.location.href = '/registration'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wand2 className="w-7 h-7 text-purple-400" />
            상세페이지 자동 생성
          </h1>
          <p className="text-slate-400 mt-1">상품 URL을 입력하면 AI가 상세페이지 콘텐츠를 자동으로 생성합니다</p>
        </div>
        {result && (
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn-secondary flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? '편집 모드' : '미리보기'}
          </button>
        )}
      </div>

      {/* URL Input */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-primary-400" />
          상품 URL 입력
        </h3>
        <div className="flex gap-4">
          <div className="flex-1 input-icon-wrapper">
            <LinkIcon className="w-4 h-4" />
            <input
              type="url"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="도매꾹 또는 상품 URL을 입력하세요 (예: https://domeggook.com/...)"
              className="input w-full py-3"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={isLoading || !productUrl.trim()}
            className="ai-generate-btn"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            AI 생성
          </button>
        </div>

        {/* Quick Test URLs */}
        <div className="mt-4">
          <p className="text-sm text-slate-400 mb-2">테스트 URL (클릭하여 자동 입력)</p>
          <div className="flex flex-wrap gap-2">
            {['이어폰 테스트', 'LED 조명 테스트', '충전기 테스트'].map((test) => (
              <button
                key={test}
                onClick={() => setProductUrl(`https://domeggook.com/main/item?itemNo=${test}`)}
                className="tag-btn"
              >
                {test}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Template Selection */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Layout className="w-5 h-5 text-purple-400" />
          이미지 프리셋 선택
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={selectedTemplate === template.id ? 'preset-card-active' : 'preset-card'}
            >
              {selectedTemplate === template.id && (
                <div className="preset-card-check">
                  <CheckCircle className="w-5 h-5" />
                </div>
              )}
              <div className={`preset-card-preview ${template.id}`}>
                <span>{template.preview}</span>
              </div>
              <h4 className="preset-card-title">{template.name}</h4>
              <p className="preset-card-desc">{template.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="card text-center py-16">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-primary-500/30 rounded-full animate-ping"></div>
            <div className="absolute inset-0 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <Wand2 className="absolute inset-0 m-auto w-8 h-8 text-primary-400" />
          </div>
          <p className="text-white font-medium">AI가 상품을 분석하고 있습니다...</p>
          <p className="text-slate-400 text-sm mt-2">상품 정보 추출 및 최적화된 콘텐츠 생성 중</p>
        </div>
      )}

      {/* Generated Result */}
      {result && !isLoading && (
        <>
          {showPreview ? (
            // Preview Mode
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-green-400" />
                  상세페이지 미리보기
                </h3>
                <button
                  onClick={copyAllContent}
                  className="btn-secondary flex items-center gap-2"
                >
                  {copiedField === 'all' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  전체 복사
                </button>
              </div>

              <div className="bg-white rounded-lg p-8 text-gray-900">
                <h1 className="text-2xl font-bold mb-4">{result.productName}</h1>
                <p className="text-gray-600 leading-relaxed mb-6">{editableSummary}</p>

                <h2 className="text-xl font-bold mb-4 border-b-2 border-gray-200 pb-2">주요 특징</h2>
                <ul className="space-y-3 mb-6">
                  {editableUsps.map((usp, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {index + 1}
                      </div>
                      <span>{usp}</span>
                    </li>
                  ))}
                </ul>

                <div className="bg-gray-100 rounded-lg p-4">
                  <p className="text-sm text-gray-500">검색 키워드</p>
                  <p className="text-gray-700">{editableKeywords.join(' | ')}</p>
                </div>
              </div>
            </div>
          ) : (
            // Edit Mode
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-400" />
                  생성된 상세페이지 콘텐츠
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleRegenerate}
                    disabled={isLoading}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    USP 재생성
                  </button>
                  <button
                    onClick={copyAllContent}
                    className="btn-secondary flex items-center gap-2"
                  >
                    {copiedField === 'all' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    전체 복사
                  </button>
                </div>
              </div>

              {/* Product Name */}
              <div className="mb-6">
                <div className="section-label-row">
                  <label className="section-label">
                    <Type className="w-4 h-4" />
                    상품명
                  </label>
                  <button
                    onClick={() => copyToClipboard(result.productName, 'name')}
                    className={`copy-btn-text ${copiedField === 'name' ? 'copied' : ''}`}
                  >
                    {copiedField === 'name' ? <Check /> : <Copy />}
                    {copiedField === 'name' ? '복사됨!' : '복사'}
                  </button>
                </div>
                <div className="content-display-box">
                  <p>{result.productName}</p>
                </div>
              </div>

              {/* Summary */}
              <div className="mb-6">
                <div className="section-label-row">
                  <label className="section-label">
                    <FileText className="w-4 h-4" />
                    상품 요약 텍스트 (편집 가능)
                  </label>
                  <button
                    onClick={() => copyToClipboard(editableSummary, 'summary')}
                    className={`copy-btn-text ${copiedField === 'summary' ? 'copied' : ''}`}
                  >
                    {copiedField === 'summary' ? <Check /> : <Copy />}
                    {copiedField === 'summary' ? '복사됨!' : '복사'}
                  </button>
                </div>
                <textarea
                  value={editableSummary}
                  onChange={(e) => setEditableSummary(e.target.value)}
                  className="editable-textarea"
                  placeholder="상품 요약을 입력하세요"
                />
              </div>

              {/* USPs */}
              <div className="mb-6">
                <div className="section-label-row">
                  <label className="section-label">
                    <List className="w-4 h-4" />
                    USP (핵심 판매 포인트) - 클릭하여 편집
                  </label>
                  <button
                    onClick={() => copyToClipboard(editableUsps.join('\n'), 'usps')}
                    className={`copy-btn-text ${copiedField === 'usps' ? 'copied' : ''}`}
                  >
                    {copiedField === 'usps' ? <Check /> : <Copy />}
                    {copiedField === 'usps' ? '복사됨!' : '전체 복사'}
                  </button>
                </div>
                <div className="space-y-2">
                  {editableUsps.map((usp, index) => (
                    <div key={index} className="usp-row">
                      <div className="usp-number">
                        {index + 1}
                      </div>
                      <input
                        type="text"
                        value={usp}
                        onChange={(e) => updateUsp(index, e.target.value)}
                        className="usp-text-input"
                        placeholder="USP를 입력하세요"
                      />
                      <div className="usp-action-group">
                        <button
                          onClick={() => copyToClipboard(usp, `usp-${index}`)}
                          className={`copy-btn-sm ${copiedField === `usp-${index}` ? 'copied' : ''}`}
                        >
                          {copiedField === `usp-${index}` ? <Check /> : <Copy />}
                        </button>
                        {editableUsps.length > 3 && (
                          <button
                            onClick={() => removeUsp(index)}
                            className="delete-btn-sm"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {editableUsps.length < 7 && (
                  <button onClick={addUsp} className="add-usp-btn">
                    + USP 추가
                  </button>
                )}
              </div>

              {/* Keywords */}
              <div className="mb-6">
                <div className="section-label-row">
                  <label className="section-label">추천 검색 키워드</label>
                  <button
                    onClick={() => copyToClipboard(editableKeywords.join(', '), 'keywords')}
                    className={`copy-btn-text ${copiedField === 'keywords' ? 'copied' : ''}`}
                  >
                    {copiedField === 'keywords' ? <Check /> : <Copy />}
                    {copiedField === 'keywords' ? '복사됨!' : '복사'}
                  </button>
                </div>
                <div className="keyword-tag-list">
                  {editableKeywords.map((keyword, index) => (
                    <span key={index} className="keyword-tag-item">
                      #{keyword}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-700">
                <button className="btn-secondary flex-1 flex items-center justify-center gap-2">
                  <Download className="w-5 h-5" />
                  이미지로 다운로드
                </button>
                <button
                  onClick={handleGoToRegistration}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  쿠팡 등록으로 이동 <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!result && !isLoading && (
        <div className="card text-center py-16">
          <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wand2 className="w-10 h-10 text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">상세페이지를 자동으로 생성하세요</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            도매꾹 또는 상품 URL을 입력하면<br />
            AI가 상품 정보를 분석하여 최적의 상세페이지 콘텐츠를 생성합니다
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Type className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-400">상품명 추출</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center mx-auto mb-2">
                <FileText className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-400">설명문 생성</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center mx-auto mb-2">
                <List className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-400">USP 5개</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center mx-auto mb-2">
                <ImageIcon className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-400">템플릿 적용</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
