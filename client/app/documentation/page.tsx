'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Sparkles, Book, Code, Webhook, Key, Database, Zap, ArrowRight } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { PageTransition } from '@/components/ui/motion'

const sections = [
  { icon: Zap, title: 'Quick Start', href: '/documentation/quick-start', description: 'Get up and running with BookFlow in under 5 minutes. Create your first service and accept bookings.' },
  { icon: Book, title: 'User Guide', href: '/documentation/user-guide', description: 'Complete guide to managing services, bookings, payments, and customer notifications.' },
  { icon: Code, title: 'API Reference', href: '/documentation/api-reference', description: 'RESTful API documentation for integrating BookFlow into your existing applications.' },
  { icon: Webhook, title: 'Webhooks', href: '/documentation/webhooks', description: 'Real-time event notifications for booking creation, updates, and payment status changes.' },
  { icon: Key, title: 'Authentication', href: '/documentation/authentication', description: 'JWT-based auth, Google OAuth integration, and API key management.' },
  { icon: Database, title: 'Data Model', href: '/documentation/data-model', description: 'Understanding the BookFlow data model: users, services, bookings, and payments.' },
]

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-stone-950">
      <Navbar />
      <PageTransition>
        <main className="pt-24 pb-20">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="aurora-blob-1 aurora-grad-cyan absolute -top-20 left-[5%] w-[500px] h-[500px] rounded-full blur-3xl" />
              <div className="aurora-blob-2 aurora-grad-violet absolute top-20 right-[10%] w-[400px] h-[400px] rounded-full blur-3xl" />
              <div className="absolute inset-0 aurora-grid aurora-grid-pattern" />
              <div className="absolute inset-0 bg-background/30 dark:bg-stone-950/40" />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-16 pt-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 dark:bg-primary/15 border border-primary/20 px-5 py-2 rounded-full mb-8">
                  <Sparkles className="h-4 w-4" />
                  Documentation
                </motion.div>
                <motion.h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  Learn how to use
                  <br />
                  <span className="bg-gradient-to-r from-primary via-violet-500 to-cyan-500 bg-clip-text text-transparent">BookFlow</span>
                </motion.h1>
                <motion.p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  Guides, tutorials, and API documentation to help you get the most out of BookFlow.
                </motion.p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
                {sections.map((s, i) => (
                  <Link key={s.title} href={s.href}>
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.06 }}
                      whileHover={{ y: -4 }}
                      className="card-glow group p-6 rounded-2xl border bg-white dark:bg-stone-900/80 border-stone-200/80 dark:border-white/10 hover:border-primary/30 dark:hover:border-primary/40 transition-all duration-300 cursor-pointer h-full"
                    >
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/15 mb-4 group-hover:bg-primary/20 transition-colors">
                        <s.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{s.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{s.description}</p>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Read more
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </motion.div>
                  </Link>
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
