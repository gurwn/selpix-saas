'use client'

import { useState, useEffect } from 'react'
import {
  History,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Calculator,
  FileText,
  Upload,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  RefreshCw,
  Calendar,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'

interface LogItem {
  id: number
  action: string
  productName: string
  status: 'success' | 'failed' | 'pending'
  timestamp: string
  details?: string
  price?: number
}

const actionIcons: Record<string, typeof Package> = {
  'AI 추천 검색': Lightbulb,
  '마진 계산': Calculator,
  '상세페이지 생성': FileText,
  '쿠팡 등록 완료': Upload,
  '쿠팡 등록 대기': Clock,
  '쿠팡 등록 실패': XCircle,
}

const actionColors: Record<string, { bg: string; text: string }> = {
  'AI 추천 검색': { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  '마진 계산': { bg: 'bg-green-500/20', text: 'text-green-400' },
  '상세페이지 생성': { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  '쿠팡 등록 완료': { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  '쿠팡 등록 대기': { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  '쿠팡 등록 실패': { bg: 'bg-red-500/20', text: 'text-red-400' },
}

const defaultLogs: LogItem[] = [
  { id: 1, action: '쿠팡 등록 완료', productName: '프리미엄 무선 이어폰', status: 'success', timestamp: '2024-01-15T12:00:00Z', price: 39900 },
  { id: 2, action: '상세페이지 생성', productName: '프리미엄 무선 이어폰', status: 'success', timestamp: '2024-01-15T11:30:00Z' },
  { id: 3, action: '마진 계산', productName: '프리미엄 무선 이어폰', status: 'success', timestamp: '2024-01-15T11:00:00Z' },
  { id: 4, action: 'AI 추천 검색', productName: '무선 이어폰', status: 'success', timestamp: '2024-01-15T10:30:00Z' },
  { id: 5, action: '쿠팡 등록 완료', productName: '스마트 LED 조명', status: 'success', timestamp: '2024-01-14T16:00:00Z', price: 24900 },
  { id: 6, action: '상세페이지 생성', productName: '스마트 LED 조명', status: 'success', timestamp: '2024-01-14T15:30:00Z' },
  { id: 7, action: '마진 계산', productName: '휴대용 충전기', status: 'failed', timestamp: '2024-01-14T14:00:00Z', details: '데이터 형식 오류' },
  { id: 8, action: 'AI 추천 검색', productName: 'LED 조명', status: 'success', timestamp: '2024-01-14T13:00:00Z' },
  { id: 9, action: '쿠팡 등록 대기', productName: '다용도 수납함', status: 'pending', timestamp: '2024-01-13T17:00:00Z' },
  { id: 10, action: '상세페이지 생성', productName: '다용도 수납함', status: 'success', timestamp: '2024-01-13T16:30:00Z' },
  { id: 11, action: '마진 계산', productName: '무선 마우스', status: 'success', timestamp: '2024-01-13T15:00:00Z' },
  { id: 12, action: 'AI 추천 검색', productName: '수납 정리함', status: 'success', timestamp: '2024-01-12T14:00:00Z' },
  { id: 13, action: '쿠팡 등록 실패', productName: 'USB 허브', status: 'failed', timestamp: '2024-01-12T12:00:00Z', details: 'API 연결 오류' },
  { id: 14, action: '상세페이지 생성', productName: 'USB 허브', status: 'success', timestamp: '2024-01-12T11:00:00Z' },
  { id: 15, action: '마진 계산', productName: 'USB 허브', status: 'success', timestamp: '2024-01-12T10:30:00Z' },
  { id: 16, action: 'AI 추천 검색', productName: '블루투스 스피커', status: 'success', timestamp: '2024-01-11T16:00:00Z' },
  { id: 17, action: '쿠팡 등록 완료', productName: '미니 선풍기', status: 'success', timestamp: '2024-01-11T14:00:00Z', price: 18900 },
  { id: 18, action: '상세페이지 생성', productName: '미니 선풍기', status: 'success', timestamp: '2024-01-11T13:00:00Z' },
  { id: 19, action: '마진 계산', productName: '미니 선풍기', status: 'success', timestamp: '2024-01-11T12:00:00Z' },
  { id: 20, action: 'AI 추천 검색', productName: '휴대용 선풍기', status: 'success', timestamp: '2024-01-10T11:00:00Z' },
]

const ITEMS_PER_PAGE = 10

export default function LogsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed' | 'pending'>('all')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [logs, setLogs] = useState<LogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load logs from localStorage or use defaults
  useEffect(() => {
    const savedLogs = localStorage.getItem('activityLogs')
    if (savedLogs) {
      const parsed = JSON.parse(savedLogs)
      // Merge with default logs if parsed is empty or small
      if (parsed.length < 5) {
        setLogs([...parsed, ...defaultLogs])
      } else {
        setLogs(parsed)
      }
    } else {
      setLogs(defaultLogs)
    }
    setIsLoading(false)
  }, [])

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.action.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter
    const matchesAction = actionFilter === 'all' || log.action === actionFilter
    return matchesSearch && matchesStatus && matchesAction
  })

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Stats
  const stats = {
    total: logs.length,
    success: logs.filter(l => l.status === 'success').length,
    failed: logs.filter(l => l.status === 'failed').length,
    pending: logs.filter(l => l.status === 'pending').length,
    today: logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length,
  }

  // Chart data - Daily activity
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dateStr = date.toISOString().split('T')[0]
    const dayLogs = logs.filter(log => log.timestamp.startsWith(dateStr))
    return {
      date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      작업수: dayLogs.length,
      성공: dayLogs.filter(l => l.status === 'success').length,
      실패: dayLogs.filter(l => l.status === 'failed').length,
    }
  })

  // Unique actions for filter
  const uniqueActions = Array.from(new Set(logs.map(l => l.action)))

  const clearLogs = () => {
    if (confirm('모든 로그를 삭제하시겠습니까?')) {
      setLogs([])
      localStorage.removeItem('activityLogs')
    }
  }

  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `selpix-logs-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const refreshLogs = () => {
    setIsLoading(true)
    setTimeout(() => {
      const savedLogs = localStorage.getItem('activityLogs')
      if (savedLogs) {
        setLogs(JSON.parse(savedLogs))
      }
      setIsLoading(false)
    }, 500)
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <History className="w-7 h-7 text-blue-400" />
            작업 이력
          </h1>
          <p className="text-slate-400 mt-1">최근 작업 기록을 확인하고 관리합니다</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={refreshLogs}
            className="action-btn-secondary"
            disabled={isLoading}
          >
            <RefreshCw className={`action-btn-icon ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
          <button
            onClick={exportLogs}
            className="action-btn-primary"
          >
            <Download className="action-btn-icon" />
            내보내기
          </button>
          <button
            onClick={clearLogs}
            className="action-btn-danger"
          >
            <Trash2 className="action-btn-icon" />
            전체 삭제
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card text-center hover:scale-[1.02] transition-transform">
          <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center mx-auto mb-2">
            <History className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-sm text-slate-400">전체</p>
        </div>
        <div className="card text-center hover:scale-[1.02] transition-transform">
          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-400">{stats.success}</p>
          <p className="text-sm text-slate-400">성공</p>
        </div>
        <div className="card text-center hover:scale-[1.02] transition-transform">
          <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
            <XCircle className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400">{stats.failed}</p>
          <p className="text-sm text-slate-400">실패</p>
        </div>
        <div className="card text-center hover:scale-[1.02] transition-transform">
          <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Clock className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
          <p className="text-sm text-slate-400">대기중</p>
        </div>
        <div className="card text-center hover:scale-[1.02] transition-transform">
          <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Calendar className="w-5 h-5 text-primary-400" />
          </div>
          <p className="text-2xl font-bold text-primary-400">{stats.today}</p>
          <p className="text-sm text-slate-400">오늘</p>
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-400" />
          주간 활동 현황
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Area type="monotone" dataKey="작업수" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTotal)" />
              <Area type="monotone" dataKey="성공" stroke="#22c55e" fillOpacity={1} fill="url(#colorSuccess)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 input-icon-wrapper">
            <Search className="w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="상품명 또는 작업 유형 검색..."
              className="input w-full"
            />
          </div>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="input min-w-[180px]"
          >
            <option value="all">모든 작업</option>
            {uniqueActions.map((action) => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>

          {/* Status Filter */}
          <div className="flex gap-2">
            {[
              { value: 'all', label: '전체' },
              { value: 'success', label: '성공' },
              { value: 'failed', label: '실패' },
              { value: 'pending', label: '대기' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => {
                  setStatusFilter(filter.value as typeof statusFilter)
                  setCurrentPage(1)
                }}
                className={statusFilter === filter.value ? 'filter-btn active' : 'filter-btn'}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-primary-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">로그를 불러오는 중...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">작업</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">상품명</th>
                    <th className="text-center py-3 px-4 text-slate-400 font-medium">상태</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium">가격</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium">시간</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>검색 결과가 없습니다</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedLogs.map((log) => {
                      const Icon = actionIcons[log.action] || History
                      const colors = actionColors[log.action] || { bg: 'bg-slate-500/20', text: 'text-slate-400' }
                      return (
                        <tr key={log.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 ${colors.bg} rounded-lg flex items-center justify-center`}>
                                <Icon className={`w-4 h-4 ${colors.text}`} />
                              </div>
                              <span className="text-white font-medium">{log.action}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-300">{log.productName}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                              log.status === 'success' ? 'bg-green-500/20 text-green-400' :
                              log.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {log.status === 'success' ? <CheckCircle className="w-3 h-3" /> :
                               log.status === 'failed' ? <XCircle className="w-3 h-3" /> :
                               <Clock className="w-3 h-3" />}
                              {log.status === 'success' ? '성공' :
                               log.status === 'failed' ? '실패' : '대기'}
                            </span>
                            {log.details && (
                              <p className="text-xs text-slate-500 mt-1">{log.details}</p>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {log.price ? (
                              <span className="text-primary-400 font-medium">{formatCurrency(log.price)}</span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right text-sm text-slate-400">
                            {formatDateTime(log.timestamp)}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
                <p className="text-sm text-slate-400">
                  {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, filteredLogs.length)} / {filteredLogs.length}개
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="pagination-btn"
                  >
                    처음
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="pagination-btn-icon"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="pagination-current">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="pagination-btn-icon"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="pagination-btn"
                  >
                    마지막
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
