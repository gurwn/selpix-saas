import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'Selpix - AI Commerce Platform',
  description: 'AI 기반 커머스 자동화 플랫폼',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="overflow-x-hidden">
        <div className="layout-container">
          <Sidebar />
          <Header />
          <main className="main-content overflow-x-hidden">
            <div className="page-wrapper">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  )
}
