'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { useBookingStore } from '@/lib/store'
import { getMe } from '@/lib/api/auth'

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { currentUser, setCurrentUser } = useBookingStore()

  useEffect(() => {
    if (currentUser) return
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (!token) { router.push('/login'); return }
    getMe().then(u => setCurrentUser(u)).catch(() => { localStorage.removeItem('access_token'); router.push('/login') })
  }, [currentUser, setCurrentUser, router])

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [currentUser, router])

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#fafaf9] dark:bg-stone-950">
        <ShieldAlert className="h-12 w-12 text-stone-400" />
        <p className="text-stone-500">Please log in to access the Provider Portal.</p>
        <Link href="/login" className="text-lime-600 hover:underline text-sm font-medium">Go to Login</Link>
      </div>
    )
  }

  if (currentUser.role !== 'admin') return null

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
