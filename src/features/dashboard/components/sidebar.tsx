'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { checkIsAdmin } from '@/features/admin/services/admin-actions'

interface NavItem {
  label: string
  icon: string
  href: string
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: '◻', href: '/dashboard' },
  { label: 'Chat AlexIA', icon: '✈', href: '/chat' },
  { label: 'Quiz Arena', icon: '◆', href: '/quiz' },
  { label: 'Bienestar', icon: '♡', href: '/bienestar' },
  { label: 'Salon de Estudio', icon: '▣', href: '/study' },
  { label: 'Admin', icon: '⚡', href: '/admin', adminOnly: true },
  { label: 'Settings', icon: '⚙', href: '/settings' },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    checkIsAdmin().then(setIsAdmin)
  }, [])

  return (
    <aside
      className={`
        relative flex flex-col
        ${collapsed ? 'w-20' : 'w-64'}
        min-h-screen bg-gray-950/80 backdrop-blur-xl
        border-r border-white/5
        transition-all duration-300
      `}
    >
      {/* Mini gradient mesh accent */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500 rounded-full blur-[80px] opacity-10" />
      <div className="absolute bottom-20 left-4 w-24 h-24 bg-cyan-500 rounded-full blur-[60px] opacity-10" />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-3 px-6 py-6 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
          A
        </div>
        {!collapsed && (
          <span className="text-white font-semibold text-lg tracking-tight">
            AlexIA
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex-1 px-3 py-4 space-y-1">
        {navItems
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl
                text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-white/10 text-white shadow-lg shadow-purple-500/5'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <span className="text-lg shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="relative z-10 px-3 py-4 border-t border-white/5">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all w-full"
        >
          <span className="text-lg shrink-0">{collapsed ? '→' : '←'}</span>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
