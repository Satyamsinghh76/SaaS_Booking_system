'use client'

import { motion } from 'framer-motion'
import { Sparkles, MessageCircle, Mail, FileText, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { PageTransition } from '@/components/ui/motion'
import { openTawkChat } from '@/components/tawk-chat'

const faqs = [
  { q: 'How do I create my first booking?', a: 'Navigate to "Book Now" from the navbar, select a service, pick a date and time, fill in your details, and confirm. You will receive an email confirmation.' },
  { q: 'Can I reschedule or cancel a booking?', a: 'Yes. Go to Dashboard > Bookings, find the booking, and click "Reschedule" or "Cancel". Rescheduling checks real-time availability.' },
  { q: 'How do payments work?', a: 'After booking, you can pay online through our demo payment gateway. Once paid, the booking shows a "Paid" badge and the provider is notified.' },
  { q: 'Do I get email and SMS notifications?', a: 'Yes. BookFlow sends confirmation emails automatically and SMS reminders before your appointment (if you provide a phone number).' },
  { q: 'How do I sync with Google Calendar?', a: 'After a booking is confirmed, click the "Add to Google Calendar" button to create a calendar event with all booking details.' },
  { q: 'Is my data secure?', a: 'Absolutely. We use JWT authentication, bcrypt password hashing, and PostgreSQL with encrypted connections. Your data is never shared.' },
]

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-stone-950">
      <Navbar />
      <PageTransition>
        <main className="pt-24 pb-20">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="aurora-blob-1 aurora-grad-emerald absolute -top-20 left-[10%] w-[500px] h-[500px] rounded-full blur-3xl" />
              <div className="aurora-blob-2 aurora-grad-cyan absolute top-20 right-[5%] w-[400px] h-[400px] rounded-full blur-3xl" />
              <div className="absolute inset-0 bg-background/30 dark:bg-stone-950/40" />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-16 pt-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 dark:bg-primary/15 border border-primary/20 px-5 py-2 rounded-full mb-8">
                  <Sparkles className="h-4 w-4" />
                  Help Center
                </motion.div>
                <motion.h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  How can we
                  <br />
                  <span className="bg-gradient-to-r from-primary via-violet-500 to-cyan-500 bg-clip-text text-transparent">help you?</span>
                </motion.h1>
                <motion.p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  Find answers to common questions or reach out to our support team.
                </motion.p>
              </div>

              {/* Contact options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
                {[
                  { icon: MessageCircle, title: 'Live Chat', desc: 'Chat with our team in real-time during business hours.', gradient: 'from-violet-500 to-indigo-600', action: 'chat' as const },
                  { icon: Mail, title: 'Email Support', desc: 'Send us an email and we\'ll respond within 24 hours.', gradient: 'from-emerald-500 to-teal-600', action: 'email' as const },
                  { icon: FileText, title: 'Documentation', desc: 'Browse our guides and API docs for self-service help.', gradient: 'from-cyan-500 to-blue-600', action: 'docs' as const },
                ].map((c, i) => (
                  <motion.div
                    key={c.title}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="card-glow text-center p-6 rounded-2xl border bg-white dark:bg-stone-900/80 border-stone-200/80 dark:border-white/10 cursor-pointer hover:border-primary/30 dark:hover:border-primary/40 transition-all duration-300"
                    onClick={() => {
                      if (c.action === 'chat') openTawkChat()
                      else if (c.action === 'email') window.location.href = '/support'
                      else if (c.action === 'docs') window.location.href = '/documentation'
                    }}
                  >
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${c.gradient} shadow-lg mb-4`}>
                      <c.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{c.title}</h3>
                    <p className="text-sm text-muted-foreground">{c.desc}</p>
                  </motion.div>
                ))}
              </div>

              {/* FAQ */}
              <div className="max-w-3xl mx-auto mb-16">
                <h2 className="text-2xl font-bold text-foreground text-center mb-10 flex items-center justify-center gap-2">
                  <HelpCircle className="h-6 w-6 text-primary" />
                  Frequently Asked Questions
                </h2>
                <div className="space-y-4">
                  {faqs.map((faq, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }} className="p-5 rounded-2xl border bg-white dark:bg-stone-900/80 border-stone-200/80 dark:border-white/10">
                      <h3 className="font-bold text-foreground mb-2">{faq.q}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </PageTransition>
      <Footer />
    </div>
  )
}
