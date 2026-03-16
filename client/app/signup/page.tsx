'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AxiosError } from 'axios'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Calendar, Loader2, Check, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { GoogleLogin } from '@react-oauth/google'
import { googleLogin } from '@/lib/api/auth'
import { useBookingStore } from '@/lib/store'

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  terms: z.boolean().refine(val => val === true, 'You must accept the terms'),
})

type SignupForm = z.infer<typeof signupSchema>

const passwordRequirements = [
  { regex: /.{8,}/, label: 'At least 8 characters' },
  { regex: /[A-Z]/, label: 'One uppercase letter' },
  { regex: /[a-z]/, label: 'One lowercase letter' },
  { regex: /[0-9]/, label: 'One number' },
  { regex: /[!@#$%^&*(),.?":{}|<>]/, label: 'One special character (!@#$%^&*)' },
]

export default function SignupPage() {
  const router = useRouter()
  const { setCurrentUser } = useBookingStore()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      terms: false,
    },
  })

  const password = watch('password', '')

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true)
    setApiError(null)
    try {
      await api.auth.signup({ name: data.name, email: data.email, password: data.password })
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`)
    } catch (err: unknown) {
      const axiosErr = err instanceof AxiosError ? err : null
      const status = axiosErr?.response?.status
      const serverMessage = axiosErr?.response?.data?.message as string | undefined
      if (status === 409) {
        setApiError('An account with this email already exists.')
      } else if (status === 422 && serverMessage) {
        setApiError(serverMessage)
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

        <Link href="/login">
          <Button variant="outline" className="rounded-full border-stone-300 text-stone-700 hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all duration-300 px-5 h-9 text-sm font-medium">
            Sign in
          </Button>
        </Link>
      </motion.nav>

      {/* ── Main split layout ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row">

        {/* ── LEFT: Image + marketing ──────────────────────────── */}
        <div className="hidden lg:flex flex-1 relative overflow-hidden">
          {/* Background image */}
          <img
            src="/saas-bg.jpg"
            alt="SaaS Platform"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/50 to-stone-900/30" />

          {/* Content overlay */}
          <div className="relative flex flex-col justify-end w-full p-12 pb-14">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              {/* Tagline */}
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-lime-400 mb-4">
                Smart Booking Platform
              </p>

              {/* Headline */}
              <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight max-w-lg">
                Grow your business with{' '}
                <span className="text-lime-400">BookFlow</span>
              </h2>

              {/* Description */}
              <p className="mt-5 text-white/70 text-base leading-relaxed max-w-md">
                BookFlow helps businesses manage services, appointments, payments, reminders, and analytics in one powerful booking platform.
              </p>

              {/* Trust line */}
              <div className="mt-8 flex items-center gap-3 text-white/50 text-sm">
                <Shield className="h-4 w-4 text-lime-400" />
                <span>Trusted by thousands of businesses to automate scheduling and manage bookings.</span>
              </div>

              {/* Feature pills */}
              <div className="mt-6 flex flex-wrap gap-2">
                {['Instant Booking', 'SMS Reminders', 'Payment Tracking', 'Analytics'].map((f, i) => (
                  <motion.span
                    key={f}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.08 }}
                    className="text-xs font-medium text-white/80 bg-white/10 border border-white/15 px-3 py-1.5 rounded-full backdrop-blur-sm"
                  >
                    {f}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── RIGHT: Signup form ───────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 overflow-y-auto">
          <motion.div
            className="w-full max-w-[440px] py-4"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Header */}
            <div className="mb-7">
              <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
                Create your BookFlow account
              </h1>
              <p className="mt-1.5 text-stone-500 text-sm">
                Start managing bookings in minutes
              </p>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xl shadow-stone-200/50 p-7">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-medium text-stone-500 uppercase tracking-wider">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Satyam Singh"
                      className={cn(
                        'pl-10 h-12 rounded-xl border-stone-200 bg-stone-50/60 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-400 transition-all',
                        errors.name && 'border-red-300 focus-visible:ring-red-400'
                      )}
                      {...register('name')}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.name && (
                      <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-xs text-red-500">
                        {errors.name.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium text-stone-500 uppercase tracking-wider">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@gmail.com"
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
                      placeholder="Create a strong password"
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

                  {/* Password requirements */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-2">
                    {passwordRequirements.map((req) => {
                      const isMet = req.regex.test(password)
                      return (
                        <motion.div
                          key={req.label}
                          className="flex items-center gap-1.5"
                          animate={{ opacity: password ? 1 : 0.4 }}
                        >
                          <div className={cn(
                            'w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors shrink-0',
                            isMet ? 'bg-lime-500' : 'bg-stone-200'
                          )}>
                            {isMet && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className={cn(
                            'text-[11px] transition-colors',
                            isMet ? 'text-lime-700' : 'text-stone-400'
                          )}>
                            {req.label}
                          </span>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>

                {/* Terms */}
                <div className="flex items-start gap-2.5 pt-1">
                  <Controller
                    name="terms"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="terms"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-0.5 rounded border-stone-900/40 h-4.5 w-4.5 data-[state=checked]:bg-stone-900 data-[state=checked]:border-stone-900"
                      />
                    )}
                  />
                  <Label htmlFor="terms" className="text-xs font-normal text-stone-500 leading-relaxed cursor-pointer">
                    I agree to the{' '}
                    <Link href="#" className="text-stone-800 hover:text-stone-900 underline underline-offset-2 transition-colors">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="#" className="text-stone-800 hover:text-stone-900 underline underline-offset-2 transition-colors">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
                <AnimatePresence>
                  {errors.terms && (
                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-xs text-red-500 -mt-2">
                      {errors.terms.message}
                    </motion.p>
                  )}
                </AnimatePresence>

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

                {/* Submit */}
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl font-semibold text-white bg-stone-900 hover:bg-stone-800 transition-all duration-300 shadow-lg shadow-stone-900/20"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Create account
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
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

              {/* Google signup */}
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
                      setApiError('Google sign-up failed. Please try again.')
                    } finally {
                      setIsLoading(false)
                    }
                  }}
                  onError={() => setApiError('Google sign-up failed. Please try again.')}
                  size="large"
                  width="340"
                  text="signup_with"
                  shape="pill"
                  theme="outline"
                />
              </div>
            </div>

            {/* Sign in link */}
            <p className="mt-6 text-center text-sm text-stone-500">
              Already have an account?{' '}
              <Link href="/login" className="text-stone-900 font-semibold hover:underline transition-colors">
                Sign in
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
