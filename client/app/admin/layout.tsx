'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/navbar'
import { useBookingStore } from '@/lib/store'
import { getMe } from '@/lib/api/auth'

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { currentUser, setCurrentUser } = useBookingStore()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Pick up access_token from URL (redirected from email verification)
    const urlToken = searchParams.get('access_token')
    if (urlToken) {
      localStorage.setItem('access_token', urlToken)
      // Clean the URL to remove the token
      window.history.replaceState({}, '', '/admin')
    }

    if (currentUser) {
      // Redirect non-admin users away from admin pages
      if (currentUser.role !== 'admin') {
        router.push('/dashboard')
      }
      return
    }
    const token = urlToken || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null)
    if (!token) {
      router.push('/login')
      return
    }
    getMe()
      .then((user) => {
        if (user.role !== 'admin') {
          router.push('/dashboard')
          return
        }
        setCurrentUser(user)
      })
      .catch(() => {
        localStorage.removeItem('access_token')
        router.push('/login')
      })
  }, [currentUser, setCurrentUser, router, searchParams])

  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-stone-950">
      <Navbar />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen pt-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </motion.main>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  )
}
