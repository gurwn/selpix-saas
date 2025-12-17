'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Bar,
  Line,
  Legend
} from 'recharts'
import { formatCurrency, formatNumber } from '@/lib/utils'

interface ChartDataItem {
  date: string
  revenue: number
  products: number
  margin: number
}

interface CategoryDataItem {
  name: string
  value: number
  color: string
}

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{label}</p>
        {payload.map((item: any, index: number) => (
          <p key={index} className="chart-tooltip-item" style={{ color: item.color }}>
            {item.name}: {item.name.includes('매출') || item.name.includes('마진')
              ? formatCurrency(item.value)
              : formatNumber(item.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function WeeklyRevenueChart({ data }: { data: ChartDataItem[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
        <YAxis
          yAxisId="left"
          stroke="#94a3b8"
          fontSize={12}
          tickFormatter={(value) => `${(value / 10000).toFixed(0)}만`}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#22c55e"
          fontSize={12}
          tickFormatter={(value) => `${value}개`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar yAxisId="left" dataKey="revenue" name="매출" fill="url(#colorRevenue)" radius={[4, 4, 0, 0]} />
        <Line yAxisId="right" type="monotone" dataKey="products" name="등록 상품" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

export function CategoryPieChart({ data }: { data: CategoryDataItem[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [`${value}%`, '비율']}
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#fff'
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function MarginTrendChart({ data }: { data: ChartDataItem[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
        <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `${(value / 10000).toFixed(0)}만`} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="margin"
          name="마진"
          stroke="#22c55e"
          fillOpacity={1}
          fill="url(#colorMargin)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
