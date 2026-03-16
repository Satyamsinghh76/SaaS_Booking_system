'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Calendar,
  LayoutDashboard,
  Clock,
  Settings,
  LogOut,
  Menu,
  CalendarDays,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBookingStore } from '@/lib/store'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Bookings', href: '/dashboard/bookings', icon: CalendarDays },
  { name: 'History', href: '/dashboard/history', icon: Clock },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { currentUser } = useBookingStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hovered, setHovered] = useState(false)

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  const isExpanded = hovered

  return (
    <>
      {/* ── Mobile toggle ──────────────────────────────────────── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2.5 bg-white border border-stone-200 rounded-xl shadow-sm text-stone-600"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* ── Mobile overlay ─────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-stone-900/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Mobile sidebar ─────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-stone-200 flex flex-col"
          >
            <SidebarInner expanded={true} pathname={pathname} initials={initials} currentUser={currentUser} onNavigate={() => setMobileOpen(false)} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Desktop sidebar (hover-expand) ─────────────────────── */}
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          'hidden lg:flex fixed inset-y-0 left-0 z-30 flex-col bg-white border-r border-stone-200 transition-all duration-300 ease-in-out overflow-hidden',
          isExpanded ? 'w-60 shadow-xl shadow-stone-900/5' : 'w-[76px]'
        )}
      >
        <SidebarInner expanded={isExpanded} pathname={pathname} initials={initials} currentUser={currentUser} />
      </aside>
    </>
  )
}

function SidebarInner({
  expanded,
  pathname,
  initials,
  currentUser,
  onNavigate,
}: {
  expanded: boolean
  pathname: string | null
  initials: string
  currentUser: { name: string; email?: string } | null
  onNavigate?: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      {/* ── Logo ───────────────────────────────────────────────── */}
      <div className={cn(
        'flex items-center h-16 border-b border-stone-100 shrink-0 transition-all duration-300',
        expanded ? 'px-5 gap-3' : 'px-0 justify-center'
      )}>
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-stone-900 shrink-0">
          <Calendar className="h-5 w-5 text-white" />
        </div>
        <div className={cn(
          'overflow-hidden transition-all duration-300 whitespace-nowrap',
          expanded ? 'w-32 opacity-100' : 'w-0 opacity-0'
        )}>
          <span className="text-lg font-bold text-stone-900 tracking-tight">BookFlow</span>
        </div>
      </div>

      {/* ── Navigation ─────────────────────────────────────────── */}
      <nav className={cn(
        'flex-1 py-4 space-y-1 transition-all duration-300',
        expanded ? 'px-3' : 'px-2'
      )}>
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname?.startsWith(item.href))

          return (
            <Link key={item.name} href={item.href} onClick={onNavigate}>
              <div
                className={cn(
                  'flex items-center gap-3 rounded-xl transition-all duration-200 relative group',
                  expanded ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center',
                  isActive
                    ? 'bg-lime-50 text-lime-700'
                    : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-lime-500 rounded-r-full" />
                )}

                <item.icon className={cn(
                  'h-5 w-5 shrink-0 transition-colors',
                  isActive ? 'text-lime-600' : 'text-stone-400 group-hover:text-stone-600'
                )} />

                <span className={cn(
                  'text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300',
                  expanded ? 'w-auto opacity-100' : 'w-0 opacity-0'
                )}>
                  {item.name}
                </span>

                {/* Tooltip when collapsed */}
                {!expanded && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-stone-900 text-white text-xs font-medium rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                    {item.name}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-stone-900 rotate-45" />
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* ── Bottom section ─────────────────────────────────────── */}
      <div className={cn(
        'border-t border-stone-100 py-3 space-y-1 transition-all duration-300',
        expanded ? 'px-3' : 'px-2'
      )}>
        {/* User profile */}
        <div className={cn(
          'flex items-center gap-3 rounded-xl transition-all duration-300',
          expanded ? 'px-3 py-2.5 bg-stone-50' : 'px-0 py-2.5 justify-center'
        )}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
            {initials}
          </div>
          <div className={cn(
            'overflow-hidden transition-all duration-300 min-w-0',
            expanded ? 'w-auto opacity-100' : 'w-0 opacity-0'
          )}>
            <p className="text-sm font-medium text-stone-800 truncate">
              {currentUser?.name || 'User'}
            </p>
            <p className="text-xs text-stone-400 truncate">
              {currentUser?.email || 'user@email.com'}
            </p>
          </div>
        </div>

        {/* Sign out */}
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') localStorage.removeItem('access_token')
            window.location.href = '/login'
          }}
          className="w-full"
        >
          <div className={cn(
            'flex items-center gap-3 rounded-xl transition-all duration-200 group',
            expanded ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center',
            'text-stone-400 hover:text-red-600 hover:bg-red-50'
          )}>
            <LogOut className="h-5 w-5 shrink-0" />
            <span className={cn(
              'text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300',
              expanded ? 'w-auto opacity-100' : 'w-0 opacity-0'
            )}>
              Sign out
            </span>
          </div>
        </button>
      </div>
    </div>
  )
}
