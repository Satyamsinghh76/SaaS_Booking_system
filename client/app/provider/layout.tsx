'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Calendar, LayoutDashboard, LogOut, Briefcase, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBookingStore } from '@/lib/store'

const navItems = [
  { name: 'Dashboard', href: '/provider', icon: LayoutDashboard },
  { name: 'Bookings', href: '/provider/bookings', icon: Calendar },
]

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser } = useBookingStore()

  // Redirect non-admin users
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [currentUser, router])

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Please log in to access the Provider Portal.</p>
        <Link href="/login" className="text-primary hover:underline text-sm font-medium">
          Go to Login
        </Link>
      </div>
    )
  }

  if (currentUser.role !== 'admin') {
    return null // redirecting
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav bar */}
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/provider" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
                <Briefcase className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground hidden sm:inline">
                Provider Portal
              </span>
            </Link>
            <nav className="flex items-center gap-1 ml-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {currentUser?.name || 'Provider'}
            </span>
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="p-4 sm:p-6 lg:p-8"
      >
        {children}
      </motion.main>
    </div>
  )
}
