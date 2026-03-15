'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || 'your email'

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        className="max-w-md w-full text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Mail className="h-10 w-10 text-primary" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-3">
          Check your email
        </h1>

        <p className="text-muted-foreground mb-2">
          We sent a verification link to
        </p>
        <p className="font-medium text-foreground mb-6">
          {email}
        </p>

        <div className="bg-muted/50 rounded-xl p-5 text-sm text-muted-foreground mb-8 text-left space-y-2">
          <p>1. Open the email from BookFlow</p>
          <p>2. Click the &quot;Verify Email Address&quot; button</p>
          <p>3. Come back and sign in</p>
        </div>

        <Link href="/login">
          <Button className="w-full">
            Go to Sign In
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>

        <p className="mt-6 text-xs text-muted-foreground">
          Didn&apos;t receive the email? Check your spam folder.
        </p>
      </motion.div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Mail className="h-8 w-8 animate-pulse text-primary" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
