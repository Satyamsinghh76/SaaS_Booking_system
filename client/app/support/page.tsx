'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Mail, User, MessageSquare, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageTransition } from '@/components/ui/motion'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api/client'

const supportSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
})

type SupportForm = z.infer<typeof supportSchema>

export default function SupportPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupportForm>({
    resolver: zodResolver(supportSchema),
  })

  const onSubmit = async (data: SupportForm) => {
    setIsSubmitting(true)
    setApiError(null)
    try {
      await apiClient.post('/api/support/email', data)
      setSubmitted(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setApiError(msg || 'Failed to send your message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background dark:bg-stone-950">
      <Navbar />
      <PageTransition>
        <main className="pt-24 pb-20">
          <div className="relative overflow-hidden">
            {/* Aurora background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="aurora-blob-1 aurora-grad-violet absolute -top-20 left-[10%] w-[500px] h-[500px] rounded-full blur-3xl" />
              <div className="aurora-blob-2 aurora-grad-emerald absolute top-20 right-[10%] w-[400px] h-[400px] rounded-full blur-3xl" />
              <div className="absolute inset-0 bg-background/30 dark:bg-stone-950/40" />
            </div>

            <div className="relative mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
              {/* Back button */}
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-8 pt-4">
                <Link href="/help">
                  <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Help Center
                  </Button>
                </Link>
              </motion.div>

              {/* Header */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg mb-6">
                  <Mail className="h-7 w-7 text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">Email Support</h1>
                <p className="mt-3 text-muted-foreground">Describe your issue and we&apos;ll get back to you within 24 hours.</p>
              </motion.div>

              <AnimatePresence mode="wait">
                {submitted ? (
                  /* ── Success state ────────────────────────────────── */
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center p-10 rounded-2xl border bg-white dark:bg-stone-900/80 border-stone-200/80 dark:border-white/10"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mb-6">
                      <CheckCircle className="h-8 w-8 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-3">Message Sent!</h2>
                    <p className="text-muted-foreground mb-8">Your request has been sent. We&apos;ll respond within 24 hours.</p>
                    <div className="flex items-center justify-center gap-4">
                      <Link href="/help">
                        <Button variant="outline" className="rounded-xl px-6">Back to Help</Button>
                      </Link>
                      <Link href="/services">
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6">Browse Services</Button>
                      </Link>
                    </div>
                  </motion.div>
                ) : (
                  /* ── Form ─────────────────────────────────────────── */
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <form
                      onSubmit={handleSubmit(onSubmit)}
                      className="p-8 rounded-2xl border bg-white dark:bg-stone-900/80 border-stone-200/80 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20 space-y-5"
                    >
                      {/* Name */}
                      <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="name"
                            placeholder="Your full name"
                            className={cn('pl-10 h-11 rounded-xl', errors.name && 'border-red-300 focus-visible:ring-red-400')}
                            {...register('name')}
                          />
                        </div>
                        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                      </div>

                      {/* Email */}
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            className={cn('pl-10 h-11 rounded-xl', errors.email && 'border-red-300 focus-visible:ring-red-400')}
                            {...register('email')}
                          />
                        </div>
                        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                      </div>

                      {/* Subject */}
                      <div className="space-y-1.5">
                        <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="subject"
                            placeholder="Brief description of your issue"
                            className={cn('pl-10 h-11 rounded-xl', errors.subject && 'border-red-300 focus-visible:ring-red-400')}
                            {...register('subject')}
                          />
                        </div>
                        {errors.subject && <p className="text-xs text-red-500">{errors.subject.message}</p>}
                      </div>

                      {/* Message */}
                      <div className="space-y-1.5">
                        <Label htmlFor="message" className="text-sm font-medium">Message</Label>
                        <div className="relative">
                          <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <textarea
                            id="message"
                            rows={6}
                            placeholder="Describe your issue in detail..."
                            className={cn(
                              'flex w-full rounded-xl border border-input bg-background pl-10 pr-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none',
                              errors.message && 'border-red-300 focus-visible:ring-red-400'
                            )}
                            {...register('message')}
                          />
                        </div>
                        {errors.message && <p className="text-xs text-red-500">{errors.message.message}</p>}
                      </div>

                      {/* API error */}
                      <AnimatePresence>
                        {apiError && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3"
                          >
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {apiError}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Submit */}
                      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full h-12 rounded-xl font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white shadow-lg transition-all"
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Message
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </PageTransition>
      <Footer />
    </div>
  )
}
