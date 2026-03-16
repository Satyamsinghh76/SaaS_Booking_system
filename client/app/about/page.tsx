'use client'

import { motion } from 'framer-motion'
import { Sparkles, Target, Heart, Rocket } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { PageTransition } from '@/components/ui/motion'

const values = [
  { icon: Target, title: 'Mission-Driven', description: 'We exist to simplify scheduling for every business, from solo freelancers to enterprise teams.' },
  { icon: Heart, title: 'Customer First', description: 'Every feature is built from real customer feedback. Your needs drive our roadmap.' },
  { icon: Rocket, title: 'Always Improving', description: 'We ship weekly. New features, better performance, and tighter integrations every release.' },
]

const stats = [
  { value: '50K+', label: 'Active Users' },
  { value: '2M+', label: 'Bookings Processed' },
  { value: '98%', label: 'Customer Satisfaction' },
  { value: '150+', label: 'Countries Served' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-stone-950">
      <Navbar />
      <PageTransition>
        <main className="pt-24 pb-20">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="aurora-blob-1 aurora-grad-emerald absolute -top-20 left-[15%] w-[500px] h-[500px] rounded-full blur-3xl" />
              <div className="aurora-blob-2 aurora-grad-violet absolute top-10 right-[10%] w-[400px] h-[400px] rounded-full blur-3xl" />
              <div className="absolute inset-0 bg-background/30 dark:bg-stone-950/40" />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-16 pt-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 dark:bg-primary/15 border border-primary/20 px-5 py-2 rounded-full mb-8">
                  <Sparkles className="h-4 w-4" />
                  About Us
                </motion.div>
                <motion.h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  We&apos;re building the future of
                  <br />
                  <span className="bg-gradient-to-r from-primary via-violet-500 to-cyan-500 bg-clip-text text-transparent">online scheduling</span>
                </motion.h1>
                <motion.p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  BookFlow started with a simple idea: booking an appointment should be as easy as sending a text. Today, thousands of businesses trust us to manage their scheduling.
                </motion.p>
              </div>

              {/* Stats */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-20">
                {stats.map(s => (
                  <div key={s.label} className="text-center p-6 rounded-2xl bg-white dark:bg-stone-900/80 border border-stone-200/80 dark:border-white/10">
                    <div className="text-3xl font-extrabold text-foreground">{s.value}</div>
                    <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
                  </div>
                ))}
              </motion.div>

              {/* Values */}
              <div className="max-w-4xl mx-auto mb-16">
                <h2 className="text-2xl font-bold text-foreground text-center mb-10">Our Values</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {values.map((v, i) => (
                    <motion.div key={v.title} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="card-glow p-6 rounded-2xl border bg-white dark:bg-stone-900/80 border-stone-200/80 dark:border-white/10 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/15 mb-4">
                        <v.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-2">{v.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Story */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="max-w-3xl mx-auto text-center mb-16">
                <h2 className="text-2xl font-bold text-foreground mb-6">Our Story</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>BookFlow started as a personal project. While exploring how online booking systems work, I noticed that many scheduling tools were either too complicated, outdated, or overloaded with features that small businesses didn&apos;t actually need.</p>
                  <p>I wanted to build something simpler — a modern booking platform where businesses can manage appointments, payments, and reminders in one clean dashboard.</p>
                  <p>So I started building BookFlow from scratch as a full-stack project, focusing on usability, design, and real-world functionality. What began as a learning project quickly grew into a complete SaaS platform with authentication, booking management, payments, notifications, and analytics.</p>
                  <p>BookFlow is still evolving, and this is just the beginning.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </PageTransition>
      <Footer />
    </div>
  )
}
