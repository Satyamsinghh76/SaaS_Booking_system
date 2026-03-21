'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AxiosError } from 'axios'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Calendar, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { googleLogin } from '@/lib/api/auth'
import { useBookingStore } from '@/lib/store'
import { GoogleLogin } from '@react-oauth/google'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const verified = searchParams.get('verified') === 'true'
  const { setCurrentUser } = useBookingStore()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setApiError(null)
    // Clear any stale token so the interceptor doesn't attach it / trigger refresh
    localStorage.removeItem('access_token')
    try {
      const user = await api.auth.login({ email: data.email, password: data.password })
      setCurrentUser(user)
      router.push(user.role === 'admin' ? '/admin' : '/services')
    } catch (err: unknown) {
      const axiosErr = err instanceof AxiosError ? err : null
      const status = axiosErr?.response?.status
      const serverMessage = axiosErr?.response?.data?.message as string | undefined
      const errorCode = axiosErr?.response?.data?.code
      if (status === 403 && errorCode === 'EMAIL_NOT_VERIFIED') {
        setApiError('Please verify your email before logging in. Check your inbox for the verification link.')
      } else if (status === 401 || status === 400) {
        setApiError('Invalid email or password. Please try again.')
      } else if (serverMessage) {
        setApiError(serverMessage)
      } else {
        setApiError('Something went wrong. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6] flex flex-col">
      {/* ── Navbar ─────────────────────────────────────────────── */}
      <motion.nav
        className="flex items-center justify-between px-6 sm:px-10 lg:px-14 h-16 border-b border-stone-200/60 bg-[#f8f8f6]"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-stone-900">
            <Calendar className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-stone-900 tracking-tight">BookFlow</span>
        </Link>

        <div className="hidden sm:flex items-center gap-8 text-sm text-stone-500">
          <Link href="/" className="hover:text-stone-900 transition-colors">Home</Link>
          <Link href="/services" className="hover:text-stone-900 transition-colors">Services</Link>
          <Link href="/booking" className="hover:text-stone-900 transition-colors">Book Now</Link>
        </div>

        <Link href="/signup">
          <Button variant="outline" className="rounded-full border-stone-300 text-stone-700 hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all duration-300 px-5 h-9 text-sm font-medium">
            Sign up
          </Button>
        </Link>
      </motion.nav>

      {/* ── Main split layout ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row">

        {/* ── LEFT: Marketing section ──────────────────────────── */}
        <motion.div
          className="flex-1 flex flex-col justify-center px-8 sm:px-14 lg:px-20 py-12 lg:py-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-lg">
            {/* Tagline */}
            <motion.p
              className="text-sm font-semibold tracking-[0.2em] uppercase text-stone-400 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              SMART SAAS BOOKING PLATFORM
            </motion.p>

            {/* Hero headline */}
            <motion.h1
              className="text-[clamp(2.5rem,5vw,4.5rem)] font-extrabold leading-[0.95] tracking-tight text-stone-900"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
            >
              MANAGE
              <br />
              BOOKINGS
              <br />
              <span className="inline-flex items-center gap-3">
                EFFORTLESSLY
                <span className="inline-flex gap-1 translate-y-1">
                  <span className="w-4 h-4 rounded-full bg-lime-300" />
                  <span className="w-4 h-4 rounded-full bg-lime-400" />
                  <span className="w-4 h-4 rounded-full bg-emerald-500" />
                </span>
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              className="mt-6 text-stone-500 text-base leading-relaxed max-w-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
             BookFlow helps businesses manage appointments, services, payments, reminders, and analytics in one powerful booking platform.
            </motion.p>

            {/* CTA */}
            <motion.div
              className="mt-8 flex items-center gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Link href="/signup" className="group inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors border-b border-stone-400 pb-0.5">
                Start using BookFlow →
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

          </div>

          {/* Bottom image strip with About text */}
          <motion.div
            className="relative mt-auto overflow-hidden rounded-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <img
              src="/saas-bg.jpg"
              alt="SaaS Platform"
              className="w-full h-44 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-900/85 via-stone-900/70 to-stone-900/40" />
            <div className="absolute inset-0 flex items-center px-7 py-5">
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase text-lime-400 mb-2">About us</p>
                <p className="text-sm text-white/90 leading-relaxed max-w-md">
                 Hundreds of businesses use <strong className="text-white">BookFlow</strong> to automate scheduling, manage services, handle payments, send reminders, and grow their customer base — all from one powerful platform.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ── RIGHT: Image + floating login card ───────────────── */}
        <div className="flex-1 relative min-h-[500px] lg:min-h-0">
          {/* Background image */}
          <div className="absolute inset-0 overflow-hidden rounded-tl-[2rem] lg:rounded-tl-[3rem]">
            {/* SaaS background image — replace /saas-bg.jpg with your own image */}
            <img
              src="/saas-bg.jpg"
              alt="SaaS Platform"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Dark overlay for contrast with the login card */}
            <div className="absolute inset-0 bg-stone-900/40" />
          </div>

          {/* ── Floating Login Card ────────────────────────────── */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center p-6"
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="w-full max-w-[380px] bg-white/60 backdrop-blur-md rounded-3xl shadow-2xl shadow-stone-900/15 p-8 border border-white/50">
              {/* Card header */}
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-stone-900">Login to your account</h2>
              </div>

              {/* Verified banner */}
              {verified && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-3 text-sm text-emerald-700 flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  Email verified! You can now sign in.
                </motion.div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium text-stone-500 uppercase tracking-wider">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="satyamsingh@gmail.com"
                      className={cn(
                        'pl-10 h-12 rounded-xl border-stone-200 bg-stone-50/60 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-400 transition-all',
                        errors.email && 'border-red-300 focus-visible:ring-red-400'
                      )}
                      {...register('email')}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.email && (
                      <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-xs text-red-500">
                        {errors.email.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-medium text-stone-500 uppercase tracking-wider">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className={cn(
                        'pl-10 pr-10 h-12 rounded-xl border-stone-200 bg-stone-50/60 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-400 transition-all',
                        errors.password && 'border-red-300 focus-visible:ring-red-400'
                      )}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <AnimatePresence>
                    {errors.password && (
                      <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-xs text-red-500">
                        {errors.password.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Remember me + Forgot */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox id="remember" className="rounded border-stone-900/40 h-4.5 w-4.5 data-[state=checked]:bg-stone-900 data-[state=checked]:border-stone-900" />
                    <Label htmlFor="remember" className="text-sm font-normal text-stone-500 cursor-pointer">
                      Remember me
                    </Label>
                  </div>
                  <Link href="#" className="text-sm text-stone-500 hover:text-stone-800 transition-colors">
                    Forgot your password?
                  </Link>
                </div>

                {/* API error */}
                <AnimatePresence>
                  {apiError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5"
                    >
                      {apiError}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Login button */}
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl font-semibold text-white bg-stone-900 hover:bg-stone-800 transition-all duration-300 shadow-lg shadow-stone-900/20"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      'Login'
                    )}
                  </Button>
                </motion.div>
              </form>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-stone-400">or</span>
                </div>
              </div>

              {/* Google login */}
              <div className="flex flex-col items-center">
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    if (!credentialResponse.credential) return
                    setIsLoading(true)
                    setApiError(null)
                    try {
                      const user = await googleLogin(credentialResponse.credential)
                      setCurrentUser(user)
                      router.push(user.role === 'admin' ? '/admin' : '/services')
                    } catch {
                      setApiError('Google sign-in failed. Please try again.')
                    } finally {
                      setIsLoading(false)
                    }
                  }}
                  onError={() => setApiError('Google sign-in failed. Please try again.')}
                  size="large"
                  width="340"
                  text="continue_with"
                  shape="pill"
                  theme="outline"
                />
              </div>

              {/* Sign up link */}
              <p className="mt-5 text-center text-sm text-stone-500">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-stone-900 font-semibold hover:underline transition-colors">
                  Sign up
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  )
}
