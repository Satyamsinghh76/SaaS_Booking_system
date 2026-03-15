'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AxiosError } from 'axios'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Calendar, Loader2 } from 'lucide-react'
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

export default function LoginPage() {
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
    try {
      const user = await api.auth.login({ email: data.email, password: data.password })
      setCurrentUser(user)
      router.push(user.role === 'admin' ? '/admin' : '/dashboard')
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
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8">
            <motion.div 
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <Calendar className="h-5 w-5 text-primary-foreground" />
            </motion.div>
            <span className="text-xl font-semibold text-foreground">
              BookFlow
            </span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="mt-2 text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Verified banner */}
          {verified && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-md bg-success/10 px-4 py-3 text-sm text-success"
            >
              Email verified successfully! You can now sign in.
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className={cn(
                    'pl-10 h-11',
                    errors.email && 'border-destructive focus-visible:ring-destructive'
                  )}
                  {...register('email')}
                />
              </div>
              <AnimatePresence>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-sm text-destructive"
                  >
                    {errors.email.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link 
                  href="#" 
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className={cn(
                    'pl-10 pr-10 h-11',
                    errors.password && 'border-destructive focus-visible:ring-destructive'
                  )}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <AnimatePresence>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-sm text-destructive"
                  >
                    {errors.password.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <Checkbox id="remember" />
              <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
                Remember me for 30 days
              </Label>
            </div>

            {/* API error */}
            <AnimatePresence>
              {apiError && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-destructive text-center bg-destructive/10 rounded-md px-3 py-2"
                >
                  {apiError}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button 
                type="submit" 
                className="w-full h-11 bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social login */}
          <div className="flex flex-col items-center gap-4">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                if (!credentialResponse.credential) return
                setIsLoading(true)
                setApiError(null)
                try {
                  const user = await googleLogin(credentialResponse.credential)
                  setCurrentUser(user)
                  router.push(user.role === 'admin' ? '/admin' : '/dashboard')
                } catch {
                  setApiError('Google sign-in failed. Please try again.')
                } finally {
                  setIsLoading(false)
                }
              }}
              onError={() => setApiError('Google sign-in failed. Please try again.')}
              size="large"
              width="400"
              text="continue_with"
              shape="rectangular"
              theme="outline"
            />
          </div>

          {/* Sign up link */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex flex-1 bg-muted/30 items-center justify-center p-12">
        <motion.div 
          className="relative w-full max-w-lg"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Background glow */}
          <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 rounded-3xl blur-2xl" />
          
          {/* Content card */}
          <div className="relative bg-card border rounded-2xl p-8 shadow-2xl">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-foreground">
                Manage your bookings with ease
              </h3>
              <p className="mt-4 text-muted-foreground">
                Join thousands of businesses using BookFlow to streamline their scheduling and grow their client base.
              </p>
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { value: '50K+', label: 'Users' },
                { value: '2M+', label: 'Bookings' },
                { value: '98%', label: 'Satisfaction' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="text-center p-4 bg-muted/50 rounded-xl"
                >
                  <div className="text-xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
