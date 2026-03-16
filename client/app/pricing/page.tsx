'use client'

import { motion } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { PageTransition } from '@/components/ui/motion'
import { cn } from '@/lib/utils'

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    period: '',
    description: 'Perfect for freelancers getting started.',
    features: ['Up to 50 bookings/month', '1 service', 'Email notifications', 'Basic analytics', 'Standard support'],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '$29',
    period: '/month',
    description: 'For growing businesses that need more power.',
    features: ['Unlimited bookings', 'Unlimited services', 'SMS + Email reminders', 'Advanced analytics', 'Google Calendar sync', 'Payment processing', 'Priority support'],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: '/month',
    description: 'For teams that need custom solutions.',
    features: ['Everything in Professional', 'Multi-provider support', 'Custom branding', 'API access', 'Dedicated account manager', 'SLA guarantee', '24/7 phone support'],
    cta: 'Contact Sales',
    highlighted: false,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-stone-950">
      <Navbar />
      <PageTransition>
        <main className="pt-24 pb-20">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="aurora-blob-1 aurora-grad-violet absolute -top-20 left-[10%] w-[500px] h-[500px] rounded-full blur-3xl" />
              <div className="aurora-blob-2 aurora-grad-emerald absolute top-20 right-[10%] w-[400px] h-[400px] rounded-full blur-3xl" />
              <div className="absolute inset-0 bg-background/30 dark:bg-stone-950/40" />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-16 pt-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 dark:bg-primary/15 border border-primary/20 px-5 py-2 rounded-full mb-8">
                  <Sparkles className="h-4 w-4" />
                  Pricing
                </motion.div>
                <motion.h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  Simple, transparent
                  <br />
                  <span className="bg-gradient-to-r from-primary via-violet-500 to-cyan-500 bg-clip-text text-transparent">pricing for everyone</span>
                </motion.h1>
                <motion.p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  Start free and scale as you grow. No hidden fees, no surprises.
                </motion.p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
                {plans.map((plan, i) => (
                  <motion.div key={plan.name} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.1 }} className={cn(
                    'card-glow relative flex flex-col p-8 rounded-2xl border transition-all duration-300',
                    plan.highlighted
                      ? 'bg-gradient-to-b from-primary/5 to-transparent dark:from-primary/10 border-primary/30 dark:border-primary/40 shadow-xl shadow-primary/10'
                      : 'bg-white dark:bg-stone-900/80 border-stone-200/80 dark:border-white/10'
                  )}>
                    {plan.highlighted && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full shadow-lg">Most Popular</div>
                    )}
                    <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                      {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-2.5 text-sm text-foreground">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href="/signup">
                      <Button className={cn('w-full h-12 rounded-xl font-semibold transition-all', plan.highlighted ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg' : 'bg-stone-900 dark:bg-white dark:text-stone-900 hover:opacity-90 text-white')}>
                        {plan.cta}
                      </Button>
                    </Link>
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
