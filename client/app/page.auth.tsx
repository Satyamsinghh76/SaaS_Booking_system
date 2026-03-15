'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useBookingStore } from '@/lib/store'
import { motion } from 'framer-motion'

export default function HomePage() {
  const router = useRouter()
  const { currentUser } = useBookingStore()

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (!currentUser) {
      router.push('/login')
    } else {
      // If user is authenticated, redirect to dashboard
      router.push(currentUser.role === 'admin' ? '/admin' : '/dashboard')
    }
  }, [currentUser, router])

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#f8fafc'}}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-lg bg-blue-600 text-white"
          >
            📅
          </motion.div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          BookFlow SaaS Platform
        </h1>
        
        <p className="text-xl text-gray-600 mb-8">
          Redirecting to your workspace...
        </p>
        
        <div className="flex items-center justify-center">
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-8 h-8 bg-blue-600 rounded-full"
          />
        </div>
        
        <div className="mt-8 space-y-2">
          <p className="text-sm text-gray-500">
            {currentUser ? `Welcome back, ${currentUser.name}!` : 'Please wait...'}
          </p>
          <p className="text-xs text-gray-400">
            Taking you to your personalized dashboard
          </p>
        </div>
      </motion.div>
    </div>
  )
}
