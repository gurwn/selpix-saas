'use client'

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { formatNumber, formatCurrency } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: number
  icon: LucideIcon
  trend?: number
  isCurrency?: boolean
  suffix?: string
  iconColor?: 'primary' | 'green' | 'yellow' | 'purple' | 'orange'
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  isCurrency = false,
  suffix = '',
  iconColor = 'primary'
}: StatCardProps) {
  const displayValue = isCurrency
    ? formatCurrency(value)
    : `${formatNumber(value)}${suffix}`

  return (
    <div className="stat-card">
      <div className="stat-card-content">
        <div className="stat-card-info">
          <p className="title">{title}</p>
          <p className="value">{displayValue}</p>
          {trend !== undefined && (
            <div className={`trend ${trend >= 0 ? 'up' : 'down'}`}>
              {trend >= 0 ? (
                <TrendingUp style={{ width: '16px', height: '16px' }} />
              ) : (
                <TrendingDown style={{ width: '16px', height: '16px' }} />
              )}
              <span>{Math.abs(trend)}% 전주 대비</span>
            </div>
          )}
        </div>
        <div className={`stat-card-icon ${iconColor}`}>
          <Icon />
        </div>
      </div>
    </div>
  )
}
