'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Lightbulb,
  Calculator,
  FileText,
  Upload,
  History,
  ShoppingCart
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, description: '대시보드' },
  { href: '/wholesale-search', label: '도매 검색', icon: ShoppingCart, description: '도매 상품' },
  { href: '/recommendation', label: 'AI 추천', icon: Lightbulb, description: '추천 상품' },
  { href: '/margin', label: '마진 계산기', icon: Calculator, description: '마진 계산' },
  { href: '/detail-page', label: '상세페이지', icon: FileText, description: '자동 생성' },
  { href: '/registration', label: '쿠팡 등록', icon: Upload, description: '등록 준비' },
  { href: '/logs', label: '작업 이력', icon: History, description: 'Log' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  // 앱 시작 시 모든 페이지 프리페치 (초기 로딩 후 백그라운드에서)
  useEffect(() => {
    // 약간의 딜레이 후 모든 페이지 프리페치
    const timer = setTimeout(() => {
      navItems.forEach((item) => {
        if (item.href !== pathname) {
          router.prefetch(item.href)
        }
      })
    }, 1000) // 1초 후 프리페치 시작

    return () => clearTimeout(timer)
  }, [pathname, router])

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">S</div>
          <div className="sidebar-logo-text">
            <h1>Selpix</h1>
            <p>AI Commerce Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon className="nav-link-icon" />
              <div className="nav-link-text">
                <div className="title">{item.description}</div>
                <div className="subtitle">{item.label}</div>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <p>Selpix MVP v1.0</p>
        <p style={{ marginTop: '4px' }}>Mock API Mode</p>
      </div>
    </aside>
  )
}
