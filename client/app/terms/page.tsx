'use client'

import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { PageTransition } from '@/components/ui/motion'

const sections = [
  { title: '1. Acceptance of Terms', content: 'By accessing or using BookFlow, you agree to be bound by these Terms of Service. If you do not agree, you may not use the platform. These terms apply to all users, including customers, service providers, and administrators.' },
  { title: '2. Account Registration', content: 'You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials. You must be at least 18 years old to create an account. One person may not maintain more than one account.' },
  { title: '3. Services & Bookings', content: 'BookFlow provides a platform for scheduling and managing appointments. We facilitate connections between service providers and customers but are not a party to the service agreement between them. Booking confirmations are subject to provider availability.' },
  { title: '4. Payments', content: 'Payment processing is handled through our integrated payment system. Prices are displayed in USD unless otherwise specified. Refund policies are determined by individual service providers. BookFlow charges no hidden fees for standard usage.' },
  { title: '5. Cancellation Policy', content: 'Users may cancel bookings through the dashboard. Cancellation policies vary by service provider. Repeated no-shows may result in account restrictions. Providers may set their own cancellation windows and fees.' },
  { title: '6. Acceptable Use', content: 'You agree not to misuse the platform, including: attempting to access other users\' accounts, reverse-engineering the software, using automated tools to scrape data, or engaging in any activity that disrupts the service.' },
  { title: '7. Intellectual Property', content: 'All BookFlow branding, code, and content are owned by BookFlow. You retain ownership of content you create on the platform. By using BookFlow, you grant us a license to display your booking and profile information as needed to operate the service.' },
  { title: '8. Limitation of Liability', content: 'BookFlow is provided "as is" without warranties of any kind. We are not liable for missed appointments, payment disputes between users and providers, or service interruptions. Our total liability is limited to fees paid in the prior 12 months.' },
  { title: '9. Termination', content: 'We may suspend or terminate accounts that violate these terms. You may delete your account at any time through Settings. Upon termination, your data will be deleted within 30 days, except where retention is required by law.' },
  { title: '10. Changes to Terms', content: 'We may update these terms from time to time. We will notify users of material changes via email. Continued use after changes constitutes acceptance. If you disagree with changes, you should discontinue use and delete your account.' },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-stone-950">
      <Navbar />
      <PageTransition>
        <main className="pt-24 pb-20">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="aurora-blob-2 aurora-grad-cyan absolute -top-20 right-[10%] w-[400px] h-[400px] rounded-full blur-3xl" />
              <div className="absolute inset-0 bg-background/40 dark:bg-stone-950/50" />
            </div>

            <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-12 pt-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/15 mb-6">
                  <FileText className="h-7 w-7 text-primary" />
                </motion.div>
                <motion.h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  Terms of Service
                </motion.h1>
                <motion.p className="mt-4 text-muted-foreground" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  Last updated: March 1, 2026
                </motion.p>
              </div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-8 mb-16">
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
