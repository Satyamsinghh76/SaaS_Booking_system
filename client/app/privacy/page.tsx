'use client'

import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { PageTransition } from '@/components/ui/motion'

const sections = [
  { title: 'Information We Collect', content: 'We collect information you provide when creating an account (name, email, phone number), booking details (service, date, time), and payment information. We also collect usage data such as pages visited, features used, and device information to improve our service.' },
  { title: 'How We Use Your Information', content: 'Your data is used to provide and improve our booking services, process payments, send booking confirmations and reminders, communicate service updates, and ensure platform security. We never sell your personal data to third parties.' },
  { title: 'Data Storage & Security', content: 'All data is stored in encrypted PostgreSQL databases. Passwords are hashed using bcrypt with 12 salt rounds. API communication uses HTTPS. Authentication tokens are signed with JWT and have configurable expiry times.' },
  { title: 'Third-Party Services', content: 'We integrate with trusted third-party services: Google OAuth for authentication, Twilio for SMS notifications, Gmail SMTP for email delivery, and Google Calendar for scheduling sync. Each provider has their own privacy policy.' },
  { title: 'Your Rights', content: 'You can access, update, or delete your personal data at any time through your dashboard settings. You can request a full data export or account deletion by contacting support. We respond to all data requests within 30 days.' },
  { title: 'Cookies', content: 'We use essential cookies for authentication (JWT tokens stored in localStorage) and preference cookies (theme mode). We do not use advertising or tracking cookies. See our Cookie Policy for details.' },
  { title: 'Changes to This Policy', content: 'We may update this policy from time to time. We will notify you of significant changes via email or an in-app notification. Continued use of BookFlow after changes constitutes acceptance of the updated policy.' },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-stone-950">
      <Navbar />
      <PageTransition>
        <main className="pt-24 pb-20">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="aurora-blob-1 aurora-grad-violet absolute -top-20 left-[10%] w-[400px] h-[400px] rounded-full blur-3xl" />
              <div className="absolute inset-0 bg-background/40 dark:bg-stone-950/50" />
            </div>

            <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-12 pt-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/15 mb-6">
                  <Shield className="h-7 w-7 text-primary" />
                </motion.div>
                <motion.h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  Privacy Policy
                </motion.h1>
                <motion.p className="mt-4 text-muted-foreground" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  Last updated: March 1, 2026
                </motion.p>
              </div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-8 mb-16">
                <p className="text-muted-foreground leading-relaxed">
                  At BookFlow, we take your privacy seriously. This policy explains what data we collect, how we use it, and your rights regarding your personal information.
                </p>
                {sections.map((s, i) => (
                  <div key={i}>
                    <h2 className="text-xl font-bold text-foreground mb-3">{s.title}</h2>
                    <p className="text-muted-foreground leading-relaxed">{s.content}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </main>
      </PageTransition>
      <Footer />
    </div>
  )
}
