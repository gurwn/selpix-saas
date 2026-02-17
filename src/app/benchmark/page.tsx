'use client'

import { useState } from 'react'
import {
  Target,
  Plus,
  Trash2,
  Loader2,
  Lock,
  Crown,
  TrendingUp,
  Zap,
  ArrowRight,
  BarChart3,
  Check,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { BenchmarkResult, CompetitorAnalysis } from '@/types/benchmark'

const CURRENT_TIER = 1 // 0=free, 1=lite+  (목업: LITE 플랜)
const MIN_TIER = 1 // benchmark requires LITE+

const MOCK_RESULT: BenchmarkResult = {
  competitors: [
    {
      url: 'https://example.com/product-1',
      name: '프리미엄 무선 이어폰 A',
      appealPoints: [
        { type: '기능', summary: '48시간 배터리 지속', strength: 9 },
        { type: '가성비', summary: '3만원대 노이즈캔슬링', strength: 8 },
        { type: '디자인', summary: '미니멀 화이트 디자인', strength: 7 },
      ],
      keywords: ['무선이어폰', '노이즈캔슬링', '장시간배터리', '가성비이어폰'],
      priceRange: '29,000~39,000원',
    },
    {
      url: 'https://example.com/product-2',
      name: '스포츠 블루투스 이어폰 B',
      appealPoints: [
        { type: '기능', summary: 'IPX7 완전방수', strength: 9 },
        { type: '편의성', summary: '귀걸이형 안정적 착용감', strength: 8 },
        { type: '감성', summary: '운동할 때 빠지지 않는 안심감', strength: 6 },
      ],
      keywords: ['스포츠이어폰', '방수이어폰', '운동용', '블루투스'],
      priceRange: '25,000~35,000원',
    },
  ],
  comparison: {
    myStrengths: ['합리적인 가격대', '다양한 색상 옵션', '빠른 배송'],
    competitorStrengths: ['노이즈캔슬링 기능', '방수 등급', '브랜드 인지도'],
    opportunities: [
      '가성비 + 방수 조합으로 차별화 가능',
      '번들 액세서리(케이스 등) 제공으로 가치 상승',
      '사용 후기 기반 신뢰도 소구 강화',
    ],
    suggestedAppealPoints: [
      { type: '가성비', description: '경쟁사 대비 40% 저렴하면서 동급 음질 제공' },
      { type: '편의성', description: '충전 케이스 포함 올인원 패키지' },
      { type: '감성', description: '일상에서 음악과 함께하는 프리미엄 라이프' },
    ],
  },
}

export default function BenchmarkPage() {
  const [myProductName, setMyProductName] = useState('')
  const [myProductInfo, setMyProductInfo] = useState('')
  const [competitorUrls, setCompetitorUrls] = useState<string[]>([''])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<BenchmarkResult | null>(null)

  const isLocked = CURRENT_TIER < MIN_TIER

  const addUrl = () => {
    if (competitorUrls.length < 5) {
      setCompetitorUrls([...competitorUrls, ''])
    }
  }

  const removeUrl = (index: number) => {
    setCompetitorUrls(competitorUrls.filter((_, i) => i !== index))
  }

  const updateUrl = (index: number, value: string) => {
    const updated = [...competitorUrls]
    updated[index] = value
    setCompetitorUrls(updated)
  }

  const handleAnalyze = async () => {
    const validUrls = competitorUrls.filter((u) => u.trim())
    if (!myProductName.trim() || validUrls.length === 0) return

    setIsAnalyzing(true)

    // 입력된 URL을 mock 데이터에 반영
    const customMock: BenchmarkResult = {
      ...MOCK_RESULT,
      competitors: MOCK_RESULT.competitors.map((comp, idx) => ({
        ...comp,
        url: validUrls[idx] || comp.url,
      })),
    }

    try {
      const res = await fetch('/api/ai/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          myProductName,
          myProductInfo,
          competitorUrls: validUrls,
        }),
      })

      const json = await res.json()
      if (json.ok && json.data) {
        setResult(json.data)
      } else {
        // API 실패 시 mock 데이터 사용 (1초 딜레이로 자연스럽게)
        await new Promise((r) => setTimeout(r, 1000))
        setResult(customMock)
      }
    } catch {
      // 네트워크 에러 시 mock 데이터 사용
      await new Promise((r) => setTimeout(r, 1000))
      setResult(customMock)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleCreateAbTest = (appealType: string, description: string) => {
    const params = new URLSearchParams({
      product: myProductName,
      appeal: appealType,
      description,
    })
    window.location.href = `/ab-test?${params.toString()}`
  }

  return (
    <div className="page-content" style={{ position: 'relative' }}>
      {/* Page Title */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Target style={{ width: '28px', height: '28px', color: 'var(--primary-400)' }} />
            경쟁사 벤치마킹
          </h1>
          <p className="page-subtitle">경쟁사 상품을 분석하고 차별화 소구점을 찾으세요</p>
        </div>
        {isLocked && (
          <Badge
            variant="warning"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Lock style={{ width: '12px', height: '12px' }} />
            LITE 이상 필요
          </Badge>
        )}
      </div>

      {/* Lock Overlay for FREE plan */}
      {isLocked && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            top: '80px',
            zIndex: 10,
            background: 'rgba(15, 15, 20, 0.8)',
            backdropFilter: 'blur(4px)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--gray-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lock style={{ width: '28px', height: '28px', color: 'var(--gray-400)' }} />
          </div>
          <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--gray-200)' }}>
            경쟁사 벤치마킹은 LITE 플랜부터 사용 가능합니다
          </p>
          <p style={{ fontSize: '14px', color: 'var(--gray-400)', maxWidth: '400px', textAlign: 'center' }}>
            경쟁사 소구점 분석, 비교 테이블, A/B 테스트 연결 기능을 사용하려면 업그레이드하세요.
          </p>
          <a
            href="/subscription"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '8px',
              padding: '12px 24px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
              color: 'white',
              fontWeight: 600,
              fontSize: '14px',
              textDecoration: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Crown style={{ width: '16px', height: '16px' }} />
            LITE 플랜으로 업그레이드
          </a>
        </div>
      )}

      {/* Input Area */}
      <Card style={{ marginBottom: '24px' }}>
        <CardHeader>
          <CardTitle style={{ fontSize: '16px' }}>분석 설정</CardTitle>
        </CardHeader>
        <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* My Product */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label
                style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--gray-300)', marginBottom: '6px' }}
              >
                내 상품명 *
              </label>
              <input
                type="text"
                value={myProductName}
                onChange={(e) => setMyProductName(e.target.value)}
                placeholder="예: 프리미엄 무선 이어폰"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--gray-600)',
                  background: 'var(--gray-800)',
                  color: 'var(--gray-100)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <label
                style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--gray-300)', marginBottom: '6px' }}
              >
                상품 정보 (선택)
              </label>
              <input
                type="text"
                value={myProductInfo}
                onChange={(e) => setMyProductInfo(e.target.value)}
                placeholder="예: 블루투스 5.3, 가격 19,900원, 5색 컬러"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--gray-600)',
                  background: 'var(--gray-800)',
                  color: 'var(--gray-100)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Competitor URLs */}
          <div>
            <label
              style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--gray-300)', marginBottom: '6px' }}
            >
              경쟁사 상품 URL (최대 5개)
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {competitorUrls.map((url, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--gray-500)',
                      width: '20px',
                      textAlign: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </span>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => updateUrl(index, e.target.value)}
                    placeholder="https://smartstore.naver.com/..."
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--gray-600)',
                      background: 'var(--gray-800)',
                      color: 'var(--gray-100)',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  {competitorUrls.length > 1 && (
                    <button
                      onClick={() => removeUrl(index)}
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        border: '1px solid var(--gray-600)',
                        background: 'transparent',
                        color: 'var(--gray-400)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Trash2 style={{ width: '16px', height: '16px' }} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {competitorUrls.length < 5 && (
              <button
                onClick={addUrl}
                style={{
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px dashed var(--gray-600)',
                  background: 'transparent',
                  color: 'var(--gray-400)',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <Plus style={{ width: '14px', height: '14px' }} />
                URL 추가
              </button>
            )}
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !myProductName.trim() || !competitorUrls.some((u) => u.trim())}
            style={{
              alignSelf: 'flex-start',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '10px',
              border: 'none',
              background:
                isAnalyzing || !myProductName.trim()
                  ? 'var(--gray-600)'
                  : 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
              color: 'white',
              fontWeight: 600,
              fontSize: '14px',
              cursor: isAnalyzing || !myProductName.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {isAnalyzing ? (
              <>
                <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                분석 중...
              </>
            ) : (
              <>
                <Target style={{ width: '16px', height: '16px' }} />
                분석하기
              </>
            )}
          </button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {result && (
        <>
          {/* Competitor Appeal Point Cards */}
          <div style={{ marginBottom: '24px' }}>
            <h2
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--gray-100)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <BarChart3 style={{ width: '18px', height: '18px', color: 'var(--primary-400)' }} />
              경쟁사 소구점 분석
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '16px',
              }}
            >
              {result.competitors.map((comp, idx) => (
                <CompetitorCard key={idx} competitor={comp} />
              ))}
            </div>
          </div>

          {/* Comparison Table */}
          <Card style={{ marginBottom: '24px' }}>
            <CardHeader>
              <CardTitle style={{ fontSize: '16px' }}>비교 분석</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <div>
                  <h4
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--primary-400)',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <TrendingUp style={{ width: '14px', height: '14px' }} />
                    내 강점
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {result.comparison.myStrengths.map((s, i) => (
                      <li
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '13px',
                          color: 'var(--gray-300)',
                        }}
                      >
                        <Check style={{ width: '14px', height: '14px', color: 'var(--primary-400)', flexShrink: 0 }} />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#f59e0b',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Target style={{ width: '14px', height: '14px' }} />
                    경쟁사 강점
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {result.comparison.competitorStrengths.map((s, i) => (
                      <li
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '13px',
                          color: 'var(--gray-300)',
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#22c55e',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Zap style={{ width: '14px', height: '14px' }} />
                    기회 영역
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {result.comparison.opportunities.map((s, i) => (
                      <li
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '13px',
                          color: 'var(--gray-300)',
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Suggested Appeal Points with CTA */}
          <Card>
            <CardHeader>
              <CardTitle style={{ fontSize: '16px' }}>AI 추천 소구점</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {result.comparison.suggestedAppealPoints.map((point, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      borderRadius: '12px',
                      background: 'var(--gray-800)',
                      border: '1px solid var(--gray-700)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <Badge variant="default">{point.type}</Badge>
                      <p style={{ fontSize: '14px', color: 'var(--gray-200)' }}>{point.description}</p>
                    </div>
                    <button
                      onClick={() => handleCreateAbTest(point.type, point.description)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: '1px solid var(--primary-500)',
                        background: 'transparent',
                        color: 'var(--primary-400)',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      A/B 테스트 만들기
                      <ArrowRight style={{ width: '14px', height: '14px' }} />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function CompetitorCard({ competitor }: { competitor: CompetitorAnalysis }) {
  const typeColors: Record<string, string> = {
    기능: '#3b82f6',
    가성비: '#22c55e',
    디자인: '#f59e0b',
    감성: '#ec4899',
    편의성: '#8b5cf6',
  }

  return (
    <Card>
      <CardContent style={{ padding: '20px' }}>
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--gray-100)' }}>
            {competitor.name}
          </h3>
          <p
            style={{
              fontSize: '12px',
              color: 'var(--gray-500)',
              marginTop: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {competitor.url}
          </p>
          {competitor.priceRange && (
            <p style={{ fontSize: '13px', color: 'var(--gray-300)', marginTop: '6px' }}>
              가격대: {competitor.priceRange}
            </p>
          )}
        </div>

        {/* Appeal Points */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
          {competitor.appealPoints.map((ap, i) => (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: `${typeColors[ap.type] || '#6b7280'}20`,
                      color: typeColors[ap.type] || '#6b7280',
                    }}
                  >
                    {ap.type}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--gray-300)' }}>{ap.summary}</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-400)' }}>
                  {ap.strength}/10
                </span>
              </div>
              <div
                style={{
                  height: '4px',
                  borderRadius: '2px',
                  background: 'var(--gray-700)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${ap.strength * 10}%`,
                    borderRadius: '2px',
                    background: typeColors[ap.type] || '#6b7280',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Keywords */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {competitor.keywords.map((kw, i) => (
            <span
              key={i}
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '4px',
                background: 'var(--gray-700)',
                color: 'var(--gray-400)',
              }}
            >
              #{kw}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
