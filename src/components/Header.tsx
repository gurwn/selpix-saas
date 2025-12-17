'use client'

import { Bell, Search, User } from 'lucide-react'

export default function Header() {
  return (
    <header className="header">
      <div className="header-content">
        {/* Search */}
        <div className="header-search">
          <div className="header-search-input">
            <Search />
            <input
              type="text"
              placeholder="상품 검색..."
              className="input"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="header-right">
          <button className="header-notification">
            <Bell style={{ width: '20px', height: '20px' }} />
            <span className="header-notification-badge" />
          </button>

          <div className="header-user">
            <div className="header-user-avatar">
              <User />
            </div>
            <div className="header-user-info">
              <p className="name">Demo User</p>
              <p className="role">관리자</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
