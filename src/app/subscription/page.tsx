'use client'

import { useState } from 'react'
import { Crown, Check, X, Sparkles } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PLANS, ALL_FEATURES, type PlanKey } from '@/lib/constants'

const CURRENT_PLAN: PlanKey = 'free'

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(CURRENT_PLAN)

  const currentPlan = PLANS.find((p) => p.key === CURRENT_PLAN)!

  return (
    <div className="page-content">
      {/* Page Title */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Crown style={{ width: '28px', height: '28px', color: 'var(--primary-400)' }} />
            구독 관리
          </h1>
          <p className="page-subtitle">플랜을 비교하고 업그레이드하세요</p>
        </div>
      </div>

      {/* Current Plan Card */}
      <Card style={{ marginBottom: '24px' }}>
        <CardContent style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '18px',
                }}
              >
                {currentPlan.name[0]}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '16px', color: 'var(--gray-100)' }}>
                  현재 플랜: {currentPlan.name}
                </p>
                <p style={{ fontSize: '14px', color: 'var(--gray-400)', marginTop: '2px' }}>
                  {currentPlan.description}
                </p>
              </div>
            </div>
            <Badge variant="default">{currentPlan.priceLabel}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Plan Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.key
          const isCurrent = CURRENT_PLAN === plan.key

          return (
            <div
              key={plan.key}
              onClick={() => setSelectedPlan(plan.key)}
              style={{
                position: 'relative',
                padding: '24px',
                borderRadius: '16px',
                background: 'var(--gray-800)',
                border: isSelected
                  ? '2px solid var(--primary-500)'
                  : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 0 20px rgba(59, 130, 246, 0.15)' : 'none',
              }}
            >
              {plan.popular && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '16px',
                    background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Sparkles style={{ width: '12px', height: '12px' }} />
                  인기
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontWeight: 700, fontSize: '18px', color: 'var(--gray-100)' }}>
                  {plan.name}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--gray-400)', marginTop: '4px' }}>
                  {plan.description}
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--gray-100)' }}>
                  {plan.price === 0 ? '무료' : `₩${plan.price.toLocaleString()}`}
                </span>
                {plan.price > 0 && (
                  <span style={{ fontSize: '14px', color: 'var(--gray-400)', marginLeft: '4px' }}>
                    /월
                  </span>
                )}
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {plan.features.map((feature, idx) => (
                  <li
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      color: 'var(--gray-300)',
                    }}
                  >
                    <Check style={{ width: '14px', height: '14px', color: 'var(--primary-400)', flexShrink: 0 }} />
                    {feature}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div
                  style={{
                    marginTop: '20px',
                    padding: '10px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--gray-400)',
                    background: 'var(--gray-700)',
                  }}
                >
                  현재 플랜
                </div>
              ) : (
                <button
                  style={{
                    marginTop: '20px',
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: 'white',
                    background:
                      plan.tierLevel > (PLANS.find((p) => p.key === CURRENT_PLAN)?.tierLevel ?? 0)
                        ? 'linear-gradient(135deg, var(--primary-500), var(--primary-600))'
                        : 'var(--gray-600)',
                  }}
                >
                  {plan.tierLevel > (PLANS.find((p) => p.key === CURRENT_PLAN)?.tierLevel ?? 0)
                    ? '업그레이드'
                    : '다운그레이드'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Feature Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
            기능 비교표
          </CardTitle>
        </CardHeader>
        <CardContent style={{ padding: '0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--gray-400)',
                    borderBottom: '1px solid var(--gray-700)',
                    width: '180px',
                  }}
                >
                  기능
                </th>
                {PLANS.map((plan) => {
                  const isSelected = selectedPlan === plan.key
                  return (
                    <th
                      key={plan.key}
                      onClick={() => setSelectedPlan(plan.key)}
                      style={{
                        textAlign: 'center',
                        padding: '12px 16px',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: isSelected ? 'var(--primary-400)' : 'var(--gray-300)',
                        borderBottom: isSelected
                          ? '3px solid var(--primary-500)'
                          : '1px solid var(--gray-700)',
                        background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {plan.name}
                      {CURRENT_PLAN === plan.key && (
                        <span
                          style={{
                            display: 'block',
                            fontSize: '10px',
                            color: 'var(--gray-500)',
                            fontWeight: 400,
                            marginTop: '2px',
                          }}
                        >
                          현재
                        </span>
                      )}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {ALL_FEATURES.map((feature) => (
                <tr key={feature.key}>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'var(--gray-300)',
                      borderBottom: '1px solid var(--gray-800)',
                    }}
                  >
                    {feature.label}
                  </td>
                  {PLANS.map((plan) => {
                    const value = feature[plan.key]
                    const isSelected = selectedPlan === plan.key

                    return (
                      <td
                        key={plan.key}
                        style={{
                          textAlign: 'center',
                          padding: '12px 16px',
                          fontSize: '13px',
                          borderBottom: '1px solid var(--gray-800)',
                          background: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                          transition: 'background 0.2s ease',
                        }}
                      >
                        {value === false ? (
                          <X
                            style={{
                              width: '16px',
                              height: '16px',
                              color: 'var(--gray-600)',
                              display: 'inline-block',
                            }}
                          />
                        ) : value === true ? (
                          <Check
                            style={{
                              width: '16px',
                              height: '16px',
                              color: 'var(--primary-400)',
                              display: 'inline-block',
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              color: isSelected ? 'var(--primary-300)' : 'var(--gray-300)',
                              fontWeight: isSelected ? 600 : 400,
                            }}
                          >
                            {value}
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
