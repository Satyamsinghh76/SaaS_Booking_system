'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/lib/hooks/useTheme'
import {
  Menu,
  X,
  Calendar,
  Sun,
  Moon,
  LogOut,
  User,
  Settings,
  LayoutDashboard,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useBookingStore } from '@/lib/store'
import { getMe, logout } from '@/lib/api/auth'
import { NotificationBell } from '@/components/dashboard/notification-bell'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { resolvedTheme, toggleTheme, mounted } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const { isMobileMenuOpen, setMobileMenuOpen, currentUser, setCurrentUser, clearAuth } = useBookingStore()

  // Restore session if token exists but user is null
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)

    if (!currentUser) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
      if (token) {
        getMe().then(u => setCurrentUser(u)).catch(() => {})
      }
    }

    return () => window.removeEventListener('scroll', handleScroll)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    try { await logout() } catch {}
    clearAuth()
    router.push('/login')
  }

  const homeHref = currentUser
    ? currentUser.role === 'admin' ? '/admin' : '/dashboard'
    : '/'

  const dashboardHref = currentUser?.role === 'admin' ? '/admin' : '/dashboard'

  const isAdmin = currentUser?.role === 'admin'

  const adminNavDesktop = [
    { name: 'Dashboard', href: '/admin' },
    { name: 'Bookings', href: '/admin/bookings' },
    { name: 'Services', href: '/admin/services' },
  ]

  const adminNavMobile = [
    ...adminNavDesktop,
    { name: 'Analytics', href: '/admin/analytics' },
    { name: 'Customers', href: '/admin/users' },
    { name: 'Payments', href: '/admin/payments' },
  ]

  const navigation = isAdmin
    ? adminNavDesktop
    : [
        { name: 'Home', href: homeHref },
        { name: 'Services', href: '/services' },
        { name: 'Book Now', href: '/booking' },
        ...(currentUser ? [
          { name: 'My Bookings', href: '/dashboard/bookings' },
          { name: 'Dashboard', href: dashboardHref },
        ] : []),
      ]

  // Hide navbar on login/signup/verify pages (they have their own layout)
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/signup') || pathname?.startsWith('/verify-email')
  if (isAuthPage) return null

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300 pt-[env(safe-area-inset-top)]',
          scrolled
            ? 'bg-background/80 backdrop-blur-xl border-b shadow-sm'
            : 'bg-transparent'
        )}
      >
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href={homeHref} className="flex items-center gap-2">
              <motion.div
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-stone-900"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Calendar className="h-5 w-5 text-white" />
              </motion.div>
              <span className="text-xl font-bold text-foreground tracking-tight">
                BookFlow
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <div
                    className={cn(
                      'relative px-4 py-2 text-sm font-medium transition-colors',
                      pathname === item.href
                        ? 'text-stone-900 dark:text-white'
                        : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white'
                    )}
                  >
                    {item.name}
                  </div>
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Notification bell — logged-in users only */}
              {currentUser && currentUser.role !== 'admin' && <NotificationBell />}

              {/* Theme toggle */}
              {mounted && (
                <motion.button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Toggle theme"
                >
                  <AnimatePresence mode="wait">
                    {resolvedTheme === 'dark' ? (
                      <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                        <Sun className="h-5 w-5" />
                      </motion.div>
                    ) : (
                      <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                        <Moon className="h-5 w-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              )}

              {/* Auth buttons — change based on login state */}
              <div className="hidden md:flex items-center gap-2">
                {currentUser ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                          {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        {currentUser.name.split(' ')[0]}
                        <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={8} className="w-52 rounded-xl z-[60] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-2xl shadow-stone-900/20">
                      <div className="px-3 py-2.5">
                        <p className="text-sm font-semibold text-stone-900 dark:text-white">{currentUser.name}</p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{currentUser.email}</p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={dashboardHref} className="gap-2">
                          <LayoutDashboard className="h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/settings" className="gap-2">
                          <User className="h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/settings" className="gap-2">
                          <Settings className="h-4 w-4" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="gap-2 text-red-600 focus:text-red-700 focus:bg-red-50">
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="ghost" size="sm">Log in</Button>
                    </Link>
                    <Link href="/signup">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button size="sm" className="bg-stone-900 hover:bg-stone-800 text-white rounded-full px-5">
                          Get Started
                        </Button>
                      </motion.div>
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile menu button */}
              <motion.button
                onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Toggle menu"
              >
                <AnimatePresence mode="wait">
                  {isMobileMenuOpen ? (
                    <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <X className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <Menu className="h-5 w-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </nav>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <motion.div
              className="absolute inset-0 bg-background/80 backdrop-blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />

            <motion.nav
              className="absolute top-16 inset-x-0 bg-background border-b shadow-lg"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="px-4 py-6 space-y-1">
                {/* User profile in mobile menu */}
                {currentUser && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 px-4 py-3 mb-3 border-b border-stone-200 dark:border-stone-700"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{currentUser.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                    </div>
                  </motion.div>
                )}

                {(isAdmin ? adminNavMobile : navigation).map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'block px-4 py-3 rounded-lg text-base font-medium transition-colors',
                        pathname === item.href
                          ? 'bg-stone-100 dark:bg-stone-800 text-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (isAdmin ? adminNavMobile : navigation).length * 0.05 }}
                  className="pt-4 space-y-2"
                >
                  {currentUser ? (
                    <Button variant="outline" className="w-full justify-center gap-2" onClick={() => { setMobileMenuOpen(false); handleLogout() }}>
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </Button>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full justify-center">Log in</Button>
                      </Link>
                      <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full justify-center bg-stone-900 hover:bg-stone-800 text-white">
                          Get Started
                        </Button>
                      </Link>
                    </>
                  )}
                </motion.div>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
