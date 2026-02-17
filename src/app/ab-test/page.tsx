'use client'

import { useState } from 'react'
import {
  FlaskConical,
  Plus,
  Play,
  Pause,
  Trophy,
  Eye,
  MousePointerClick,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// ─── 더미 데이터 ──────────────────────────────────────────────

type TestStatus = 'running' | 'completed' | 'draft'

interface Variant {
  id: string
  name: string
  appealPoint: string
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  ctr: number
  cvr: number
}

interface AbTest {
  id: number
  name: string
  product: string
  status: TestStatus
  createdAt: string
  startedAt?: string
  endedAt?: string
  trafficSplit: number[]
  winner?: string
  variants: Variant[]
}

const DUMMY_TESTS: AbTest[] = [
  {
    id: 1,
    name: '무선 이어폰 소구점 테스트',
    product: '프리미엄 무선 이어폰 BT-500',
    status: 'running',
    createdAt: '2026-02-08',
    startedAt: '2026-02-09',
    trafficSplit: [50, 50],
    variants: [
      {
        id: 'A',
        name: '가성비 소구',
        appealPoint: '경쟁사 대비 40% 저렴! 동급 최고 음질',
        impressions: 12450,
        clicks: 1120,
        conversions: 89,
        revenue: 1779100,
        ctr: 9.0,
        cvr: 7.95,
      },
      {
        id: 'B',
        name: '감성 소구',
        appealPoint: '당신의 일상에 프리미엄 사운드를 더하다',
        impressions: 12380,
        clicks: 868,
        conversions: 64,
        revenue: 1279360,
        ctr: 7.01,
        cvr: 7.37,
      },
    ],
  },
  {
    id: 2,
    name: 'LED 조명 상세페이지 A/B',
    product: '스마트 LED 무드등 RGB',
    status: 'completed',
    createdAt: '2026-01-25',
    startedAt: '2026-01-26',
    endedAt: '2026-02-05',
    trafficSplit: [50, 50],
    winner: 'A',
    variants: [
      {
        id: 'A',
        name: '기능 강조',
        appealPoint: '1600만 색상 / 앱 연동 / 타이머 기능',
        impressions: 28300,
        clicks: 3113,
        conversions: 312,
        revenue: 7769880,
        ctr: 11.0,
        cvr: 10.02,
      },
      {
        id: 'B',
        name: '분위기 강조',
        appealPoint: '감성 인테리어의 완성, 나만의 무드등',
        impressions: 28150,
        clicks: 2533,
        conversions: 228,
        revenue: 5679720,
        ctr: 9.0,
        cvr: 9.0,
      },
    ],
  },
  {
    id: 3,
    name: '충전기 가격 소구 테스트',
    product: '고속 충전기 65W GaN',
    status: 'completed',
    createdAt: '2026-01-15',
    startedAt: '2026-01-16',
    endedAt: '2026-01-30',
    trafficSplit: [33, 33, 34],
    winner: 'C',
    variants: [
      {
        id: 'A',
        name: '스펙 강조',
        appealPoint: '65W GaN 초고속 / USB-C 3포트',
        impressions: 15200,
        clicks: 1368,
        conversions: 109,
        revenue: 2179891,
        ctr: 9.0,
        cvr: 7.97,
      },
      {
        id: 'B',
        name: '가격 강조',
        appealPoint: '브랜드급 성능, 반값에! 지금 특가',
        impressions: 15180,
        clicks: 1517,
        conversions: 136,
        revenue: 2719864,
        ctr: 9.99,
        cvr: 8.96,
      },
      {
        id: 'C',
        name: '편의성 강조',
        appealPoint: '노트북+폰+패드 동시충전, 이거 하나면 끝',
        impressions: 15350,
        clicks: 1689,
        conversions: 152,
        revenue: 3039848,
        ctr: 11.0,
        cvr: 9.0,
      },
    ],
  },
  {
    id: 4,
    name: '보조배터리 신규 테스트',
    product: '슬림 보조배터리 10000mAh',
    status: 'draft',
    createdAt: '2026-02-11',
    trafficSplit: [50, 50],
    variants: [
      {
        id: 'A',
        name: '휴대성 소구',
        appealPoint: '지갑보다 얇은 초슬림 디자인',
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        ctr: 0,
        cvr: 0,
      },
      {
        id: 'B',
        name: '용량 소구',
        appealPoint: '아이폰 3회 완충 가능한 대용량',
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        ctr: 0,
        cvr: 0,
      },
    ],
  },
]

// ─── 컴포넌트 ──────────────────────────────────────────────

const statusConfig: Record<TestStatus, { label: string; variant: string; icon: typeof Play }> = {
  running: { label: '진행 중', variant: 'success', icon: Play },
  completed: { label: '완료', variant: 'default', icon: CheckCircle },
  draft: { label: '준비 중', variant: 'warning', icon: Clock },
}

function formatNum(n: number) {
  return n.toLocaleString('ko-KR')
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(n)
}

export default function AbTestPage() {
  const [tests] = useState<AbTest[]>(DUMMY_TESTS)
  const [selectedTest, setSelectedTest] = useState<AbTest | null>(null)
  const [filter, setFilter] = useState<TestStatus | 'all'>('all')

  const filtered = filter === 'all' ? tests : tests.filter((t) => t.status === filter)

  const summary = {
    total: tests.length,
    running: tests.filter((t) => t.status === 'running').length,
    completed: tests.filter((t) => t.status === 'completed').length,
    avgLift: 18.4,
  }

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FlaskConical style={{ width: '28px', height: '28px', color: 'var(--primary-400)' }} />
            A/B 테스트
          </h1>
          <p className="page-subtitle">소구점별 성과를 비교하고 최적의 상세페이지를 찾으세요</p>
        </div>
        <button
          onClick={() => setSelectedTest(null)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: 'none',
            background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
            color: 'white',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          <Plus style={{ width: '16px', height: '16px' }} />
          새 테스트
        </button>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: '전체 테스트', value: summary.total, icon: FlaskConical, color: 'var(--primary-400)' },
          { label: '진행 중', value: summary.running, icon: Play, color: '#22c55e' },
          { label: '완료', value: summary.completed, icon: CheckCircle, color: '#8b5cf6' },
          { label: '평균 전환 향상', value: `+${summary.avgLift}%`, icon: TrendingUp, color: '#f59e0b' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: `${stat.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <stat.icon style={{ width: '18px', height: '18px', color: stat.color }} />
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{stat.label}</p>
                <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--gray-100)' }}>{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {(['all', 'running', 'completed', 'draft'] as const).map((f) => {
          const labels: Record<string, string> = { all: '전체', running: '진행 중', completed: '완료', draft: '준비 중' }
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                border: filter === f ? '1px solid var(--primary-500)' : '1px solid var(--gray-600)',
                background: filter === f ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                color: filter === f ? 'var(--primary-400)' : 'var(--gray-400)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {labels[f]}
            </button>
          )
        })}
      </div>

      {/* Detail View */}
      {selectedTest ? (
        <TestDetail test={selectedTest} onBack={() => setSelectedTest(null)} />
      ) : (
        /* Test List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((test) => (
            <TestRow key={test.id} test={test} onClick={() => setSelectedTest(test)} />
          ))}
          {filtered.length === 0 && (
            <Card>
              <CardContent style={{ padding: '48px', textAlign: 'center' }}>
                <FlaskConical style={{ width: '40px', height: '40px', color: 'var(--gray-600)', margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--gray-400)', fontSize: '14px' }}>해당 상태의 테스트가 없습니다</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

// ─── 테스트 행 ───────────────────────────────

function TestRow({ test, onClick }: { test: AbTest; onClick: () => void }) {
  const cfg = statusConfig[test.status]
  const totalImpressions = test.variants.reduce((s, v) => s + v.impressions, 0)
  const totalConversions = test.variants.reduce((s, v) => s + v.conversions, 0)
  const totalRevenue = test.variants.reduce((s, v) => s + v.revenue, 0)

  return (
    <Card
      style={{ cursor: 'pointer', transition: 'border-color 0.2s', border: '1px solid transparent' }}
      onClick={onClick}
    >
      <CardContent style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--gray-100)' }}>{test.name}</h3>
            <Badge variant={cfg.variant as any}>{cfg.label}</Badge>
            {test.winner && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#f59e0b', fontWeight: 600 }}>
                <Trophy style={{ width: '12px', height: '12px' }} />
                승자: {test.winner}
              </span>
            )}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{test.createdAt}</span>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--gray-400)', marginBottom: '14px' }}>
          상품: {test.product} &middot; {test.variants.length}개 변형 &middot; 트래픽 {test.trafficSplit.join('/')}
        </p>

        {test.status !== 'draft' && (
          <div style={{ display: 'flex', gap: '24px' }}>
            <MiniStat icon={Eye} label="노출" value={formatNum(totalImpressions)} />
            <MiniStat icon={ShoppingCart} label="전환" value={formatNum(totalConversions)} />
            <MiniStat icon={BarChart3} label="매출" value={formatCurrency(totalRevenue)} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <Icon style={{ width: '14px', height: '14px', color: 'var(--gray-500)' }} />
      <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-200)' }}>{value}</span>
    </div>
  )
}

// ─── 상세 뷰 ────────────────────────────────

function TestDetail({ test, onBack }: { test: AbTest; onBack: () => void }) {
  const best = [...test.variants].sort((a, b) => b.cvr - a.cvr)[0]

  return (
    <div>
      {/* Back + Title */}
      <button
        onClick={onBack}
        style={{
          marginBottom: '16px',
          padding: '6px 14px',
          borderRadius: '8px',
          border: '1px solid var(--gray-600)',
          background: 'transparent',
          color: 'var(--gray-300)',
          fontSize: '13px',
          cursor: 'pointer',
        }}
      >
        &larr; 목록으로
      </button>

      <Card style={{ marginBottom: '20px' }}>
        <CardContent style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gray-100)' }}>{test.name}</h2>
            <Badge variant={statusConfig[test.status].variant as any}>{statusConfig[test.status].label}</Badge>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--gray-400)' }}>
            상품: {test.product} &middot; 시작: {test.startedAt || '-'} &middot; 종료: {test.endedAt || '-'}
          </p>
        </CardContent>
      </Card>

      {/* Variant Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${test.variants.length}, 1fr)`,
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {test.variants.map((v) => {
          const isBest = v.id === best.id && test.status !== 'draft'
          return (
            <Card
              key={v.id}
              style={{
                border: isBest ? '2px solid var(--primary-500)' : '1px solid var(--gray-700)',
                position: 'relative',
              }}
            >
              {isBest && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '12px',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Trophy style={{ width: '11px', height: '11px' }} />
                  {test.winner === v.id ? '승자' : '선두'}
                </div>
              )}
              <CardContent style={{ padding: '20px' }}>
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: isBest ? 'var(--primary-500)' : 'var(--gray-700)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {v.id}
                    </span>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--gray-100)' }}>{v.name}</h3>
                  </div>
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--gray-300)',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'var(--gray-800)',
                      borderLeft: `3px solid ${isBest ? 'var(--primary-500)' : 'var(--gray-600)'}`,
                    }}
                  >
                    &ldquo;{v.appealPoint}&rdquo;
                  </p>
                </div>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <MetricBox label="노출수" value={formatNum(v.impressions)} icon={Eye} />
                  <MetricBox label="클릭수" value={formatNum(v.clicks)} icon={MousePointerClick} />
                  <MetricBox label="CTR" value={`${v.ctr.toFixed(1)}%`} icon={MousePointerClick} highlight={isBest} />
                  <MetricBox label="전환율" value={`${v.cvr.toFixed(2)}%`} icon={ShoppingCart} highlight={isBest} />
                  <MetricBox label="전환수" value={formatNum(v.conversions)} icon={ShoppingCart} />
                  <MetricBox label="매출" value={formatCurrency(v.revenue)} icon={BarChart3} />
                </div>

                {/* CTR/CVR bar */}
                {test.status !== 'draft' && (
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--gray-500)', marginBottom: '4px' }}>
                      <span>전환율</span>
                      <span>{v.cvr.toFixed(2)}%</span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '3px', background: 'var(--gray-700)', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(v.cvr * 8, 100)}%`,
                          borderRadius: '3px',
                          background: isBest
                            ? 'linear-gradient(90deg, var(--primary-500), var(--primary-400))'
                            : 'var(--gray-500)',
                          transition: 'width 0.6s ease',
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Insight */}
      {test.status !== 'draft' && (
        <Card>
          <CardHeader>
            <CardTitle style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle style={{ width: '16px', height: '16px', color: 'var(--primary-400)' }} />
              인사이트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'var(--gray-300)' }}>
              <p>
                변형 <strong style={{ color: 'var(--primary-300)' }}>{best.name} ({best.id})</strong>이
                전환율 <strong style={{ color: 'var(--primary-300)' }}>{best.cvr.toFixed(2)}%</strong>로 가장 높은 성과를 보이고 있습니다.
              </p>
              {test.variants.length >= 2 && (
                <p>
                  &ldquo;{best.appealPoint}&rdquo; 소구점이 타겟 고객에게 더 효과적입니다.
                  이 소구점을 기본 상세페이지에 반영하는 것을 권장합니다.
                </p>
              )}
              {test.status === 'running' && (
                <p style={{ color: 'var(--gray-500)', fontSize: '13px', marginTop: '4px' }}>
                  * 테스트가 진행 중입니다. 충분한 데이터가 모인 후 최종 판단을 권장합니다.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function MetricBox({ label, value, icon: Icon, highlight }: { label: string; value: string; icon: typeof Eye; highlight?: boolean }) {
  return (
    <div
      style={{
        padding: '10px',
        borderRadius: '8px',
        background: highlight ? 'rgba(59, 130, 246, 0.08)' : 'var(--gray-800)',
        border: highlight ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
        <Icon style={{ width: '12px', height: '12px', color: 'var(--gray-500)' }} />
        <span style={{ fontSize: '11px', color: 'var(--gray-500)' }}>{label}</span>
      </div>
      <span style={{ fontSize: '14px', fontWeight: 600, color: highlight ? 'var(--primary-300)' : 'var(--gray-200)' }}>
        {value}
      </span>
    </div>
  )
}
