'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AxiosError } from 'axios'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Calendar, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import api from '@/lib/api'


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
    <div className="min-h-screen flex">
      {/* Left side - Visual */}
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
                Start your journey today
              </h3>
              <p className="mt-4 text-muted-foreground">
                Create your account and start managing bookings in minutes.
              </p>
            </div>

            {/* Features list */}
            <div className="mt-8 space-y-4">
              {[
                'Free 14-day trial',
                'No credit card required',
                'Cancel anytime',
                'Unlimited bookings',
              ].map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-success/10">
                    <Check className="w-4 h-4 text-success" />
                  </div>
                  <span className="text-foreground">{feature}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 20 }}
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
            <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
            <p className="mt-2 text-muted-foreground">
              Get started with your free trial today
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name field */}
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className={cn(
                    'pl-10 h-11',
                    errors.name && 'border-destructive focus-visible:ring-destructive'
                  )}
                  {...register('name')}
                />
              </div>
              <AnimatePresence>
                {errors.name && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-sm text-destructive"
                  >
                    {errors.name.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

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
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
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
              
              {/* Password requirements */}
              <div className="space-y-2 pt-2">
                {passwordRequirements.map((req) => {
                  const isMet = req.regex.test(password)
                  return (
                    <motion.div
                      key={req.label}
                      className="flex items-center gap-2"
                      animate={{ opacity: password ? 1 : 0.5 }}
                    >
                      <div className={cn(
                        'w-4 h-4 rounded-full flex items-center justify-center transition-colors',
                        isMet ? 'bg-success' : 'bg-muted'
                      )}>
                        {isMet && <Check className="w-3 h-3 text-success-foreground" />}
                      </div>
                      <span className={cn(
                        'text-xs transition-colors',
                        isMet ? 'text-success' : 'text-muted-foreground'
                      )}>
                        {req.label}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <Controller
                name="terms"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="terms"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-1"
                  />
                )}
              />
              <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground leading-relaxed">
                I agree to the{' '}
                <Link href="#" className="text-primary hover:text-primary/80 transition-colors">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="#" className="text-primary hover:text-primary/80 transition-colors">
                  Privacy Policy
                </Link>
              </Label>
            </div>
            <AnimatePresence>
              {errors.terms && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-destructive -mt-3"
                >
                  {errors.terms.message}
                </motion.p>
              )}
            </AnimatePresence>

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
                    Create account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
          </form>

          {/* Sign in link */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
