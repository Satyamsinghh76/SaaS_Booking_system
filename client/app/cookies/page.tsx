'use client'

import { motion } from 'framer-motion'
import { Cookie } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { PageTransition } from '@/components/ui/motion'

const cookies = [
  { name: 'Authentication Token', type: 'Essential', storage: 'localStorage', duration: 'Session / 30 days', description: 'JWT access token used to authenticate API requests. Stored when you log in and removed on sign out.' },
  { name: 'Refresh Token', type: 'Essential', storage: 'httpOnly cookie', duration: '7 days', description: 'Used to obtain new access tokens without re-entering credentials. Automatically managed by the browser.' },
  { name: 'Theme Preference', type: 'Preference', storage: 'localStorage', duration: 'Permanent', description: 'Stores your light/dark mode preference so it persists across visits.' },
  { name: 'Sidebar State', type: 'Preference', storage: 'localStorage', duration: 'Permanent', description: 'Remembers whether the dashboard sidebar is collapsed or expanded.' },
]

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-stone-950">
      <Navbar />
      <PageTransition>
        <main className="pt-24 pb-20">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="aurora-blob-3 aurora-grad-emerald absolute -top-20 left-[20%] w-[400px] h-[400px] rounded-full blur-3xl" />
              <div className="absolute inset-0 bg-background/40 dark:bg-stone-950/50" />
            </div>

            <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-12 pt-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/15 mb-6">
                  <Cookie className="h-7 w-7 text-primary" />
                </motion.div>
                <motion.h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  Cookie Policy
                </motion.h1>
                <motion.p className="mt-4 text-muted-foreground" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  Last updated: March 1, 2026
                </motion.p>
              </div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-8 mb-16">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-3">What Are Cookies?</h2>
                  <p className="text-muted-foreground leading-relaxed">Cookies and local storage are small pieces of data stored by your browser. BookFlow uses them to keep you logged in and remember your preferences. We do not use advertising or third-party tracking cookies.</p>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-foreground mb-6">Cookies We Use</h2>
                  <div className="space-y-4">
                    {cookies.map((c, i) => (
                      <div key={i} className="p-5 rounded-2xl border bg-white dark:bg-stone-900/80 border-stone-200/80 dark:border-white/10">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h3 className="font-bold text-foreground">{c.name}</h3>
                          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${c.type === 'Essential' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>{c.type}</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-2">{c.description}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Storage: <strong className="text-foreground">{c.storage}</strong></span>
                          <span>Duration: <strong className="text-foreground">{c.duration}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-foreground mb-3">Managing Cookies</h2>
                  <p className="text-muted-foreground leading-relaxed">You can clear cookies and local storage through your browser settings. Note that clearing essential cookies will log you out of BookFlow. Theme and sidebar preferences will reset to defaults.</p>
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
