'use client'

import { motion } from 'framer-motion'
import { Calendar, Bell, CreditCard, BarChart3, Shield, Globe, Zap, Users, Clock, Sparkles } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { PageTransition } from '@/components/ui/motion'

const features = [
  { icon: Calendar, title: 'Smart Scheduling', description: 'AI-powered slot recommendations based on booking patterns and availability.', gradient: 'from-violet-500 to-indigo-600' },
  { icon: Bell, title: 'Automated Reminders', description: 'Email and SMS notifications to reduce no-shows and keep clients informed.', gradient: 'from-amber-500 to-orange-600' },
  { icon: CreditCard, title: 'Integrated Payments', description: 'Accept payments at booking time with secure payment processing.', gradient: 'from-emerald-500 to-teal-600' },
  { icon: BarChart3, title: 'Analytics Dashboard', description: 'Track revenue, bookings, and customer trends with real-time insights.', gradient: 'from-cyan-500 to-blue-600' },
  { icon: Shield, title: 'Secure & Reliable', description: 'Enterprise-grade security with JWT auth, encrypted data, and GDPR compliance.', gradient: 'from-rose-500 to-pink-600' },
  { icon: Globe, title: 'Google Calendar Sync', description: 'Sync bookings directly to Google Calendar for seamless scheduling.', gradient: 'from-slate-500 to-slate-700' },
  { icon: Zap, title: 'Instant Booking', description: 'Clients book in seconds with a streamlined multi-step wizard.', gradient: 'from-yellow-500 to-amber-600' },
  { icon: Users, title: 'Multi-Role Access', description: 'Separate dashboards for admins, providers, and customers.', gradient: 'from-purple-500 to-violet-600' },
  { icon: Clock, title: 'Real-Time Availability', description: 'Live slot availability prevents double bookings automatically.', gradient: 'from-teal-500 to-cyan-600' },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-stone-950">
      <Navbar />
      <PageTransition>
        <main className="pt-24 pb-20">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="aurora-blob-1 aurora-grad-violet absolute -top-20 left-[5%] w-[500px] h-[500px] rounded-full blur-3xl" />
              <div className="aurora-blob-2 aurora-grad-cyan absolute top-0 right-[5%] w-[450px] h-[450px] rounded-full blur-3xl" />
              <div className="absolute inset-0 bg-background/30 dark:bg-stone-950/40" />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-16 pt-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 dark:bg-primary/15 border border-primary/20 px-5 py-2 rounded-full mb-8">
                  <Sparkles className="h-4 w-4" />
                  Features
                </motion.div>
                <motion.h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  Everything you need to
                  <br />
                  <span className="bg-gradient-to-r from-primary via-violet-500 to-cyan-500 bg-clip-text text-transparent">manage bookings</span>
                </motion.h1>
                <motion.p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  BookFlow provides a complete suite of tools to automate scheduling, payments, and client communication.
                </motion.p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {features.map((f, i) => (
                  <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }} className="card-glow group p-6 rounded-2xl border bg-white dark:bg-stone-900/80 border-stone-200/80 dark:border-white/10 hover:border-primary/30 dark:hover:border-primary/40 transition-all duration-300">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} shadow-lg mb-4`}>
                      <f.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </PageTransition>
      <Footer />
    </div>
  )
}
