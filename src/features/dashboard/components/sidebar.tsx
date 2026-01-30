'use client'

import { useState, useEffect, useCallback } from 'react'
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
  { label: 'Chat AlexIA', icon: '✈', href: '/chat' },
  { label: 'Quiz Arena', icon: '◆', href: '/quiz' },
  { label: 'Bienestar', icon: '♡', href: '/bienestar' },
  { label: 'Salon de Estudio', icon: '▣', href: '/study' },
  { label: 'Dashboard', icon: '◻', href: '/dashboard', adminOnly: true },
  { label: 'Admin', icon: '⚡', href: '/admin', adminOnly: true },
  { label: 'Beta', icon: '★', href: '/beta', adminOnly: true },
  { label: 'Settings', icon: '⚙', href: '/settings' },
]

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    checkIsAdmin().then(setIsAdmin)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  const filteredItems = navItems.filter((item) => !item.adminOnly || isAdmin)

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
          A
        </div>
        <span className="text-white font-semibold text-lg tracking-tight">
          AlexIA
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={closeMobile}
              className={`
                flex items-center gap-3 px-3 py-3 rounded-xl
                text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-white/10 text-white shadow-lg shadow-purple-500/5'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <span className="text-lg shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-3 bg-gray-950/95 backdrop-blur-xl border-b border-white/5">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Abrir menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
          A
        </div>
        <span className="text-white font-semibold text-base tracking-tight">AlexIA</span>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={closeMobile}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`
          md:hidden fixed top-0 left-0 bottom-0 z-[60] w-72
          flex flex-col bg-gray-950 backdrop-blur-xl
          border-r border-white/5
          transition-transform duration-300 ease-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Close button */}
        <div className="absolute top-4 right-3 z-20">
          <button
            onClick={closeMobile}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Cerrar menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Gradient accent */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500 rounded-full blur-[80px] opacity-10 pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full">
          {navContent}
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 min-h-screen bg-gray-950/80 backdrop-blur-xl border-r border-white/5 relative shrink-0">
        {/* Gradient accents */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500 rounded-full blur-[80px] opacity-10 pointer-events-none" />
        <div className="absolute bottom-20 left-4 w-24 h-24 bg-cyan-500 rounded-full blur-[60px] opacity-10 pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full">
          {navContent}
        </div>
      </aside>
    </>
  )
}
