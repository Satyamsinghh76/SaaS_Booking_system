'use client'

import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

const plans = [
  {
    name: 'Starter',
    description: 'Perfect for individuals and small teams getting started.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'Up to 50 bookings/month',
      'Email notifications',
      'Basic analytics',
      'Mobile app access',
      'Email support',
    ],
    cta: 'Start for free',
    highlighted: false,
  },
  {
    name: 'Professional',
    description: 'Best for growing businesses with advanced needs.',
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: [
      'Unlimited bookings',
      'SMS & email notifications',
      'Advanced analytics',
      'Custom branding',
      'Team collaboration',
      'Payment processing',
      'Priority support',
    ],
    cta: 'Get started',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    description: 'For large organizations with custom requirements.',
    monthlyPrice: 99,
    yearlyPrice: 990,
    features: [
      'Everything in Professional',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
      'Advanced security',
      'API access',
      'White-label option',
    ],
    cta: 'Contact sales',
    highlighted: false,
  },
]

export function PricingSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [isYearly, setIsYearly] = useState(false)

  return (
    <section className="py-24 sm:py-32 bg-background" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div 
          className="text-center max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">
            Pricing
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-balance">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Choose the plan that fits your needs. Upgrade or downgrade anytime.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className={cn(
              'text-sm font-medium transition-colors',
              !isYearly ? 'text-foreground' : 'text-muted-foreground'
            )}>
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <span className={cn(
              'text-sm font-medium transition-colors',
              isYearly ? 'text-foreground' : 'text-muted-foreground'
            )}>
              Yearly
            </span>
            {isYearly && (
              <Badge variant="secondary" className="bg-success/10 text-success border-0">
                Save 20%
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Pricing cards */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.15 }}
            >
              <PricingCard plan={plan} isYearly={isYearly} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PricingCard({ plan, isYearly }: { plan: typeof plans[0]; isYearly: boolean }) {
  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice

  return (
    <motion.div
      className={cn(
        'relative flex flex-col h-full p-8 rounded-2xl border transition-all duration-300',
        plan.highlighted 
          ? 'bg-card border-primary shadow-xl shadow-primary/10' 
          : 'bg-card hover:shadow-lg hover:border-primary/20'
      )}
      whileHover={{ y: plan.highlighted ? 0 : -4 }}
    >
      {/* Popular badge */}
      {plan.highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-4 py-1">
            <Sparkles className="h-3 w-3 mr-1" />
            Most popular
          </Badge>
        </div>
      )}

      {/* Plan header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-foreground">
            ${price}
          </span>
          <span className="text-muted-foreground">
            /{isYearly ? 'year' : 'month'}
          </span>
        </div>
      </div>

      {/* Features */}
      <ul className="flex-1 space-y-3 mb-8">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <div className="mt-0.5 p-1 rounded-full bg-success/10">
              <Check className="h-3 w-3 text-success" />
            </div>
            <span className="text-sm text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link href="/booking">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button 
            className={cn(
              'w-full',
              plan.highlighted 
                ? 'bg-primary hover:bg-primary/90' 
                : ''
            )}
            variant={plan.highlighted ? 'default' : 'outline'}
          >
            {plan.cta}
          </Button>
        </motion.div>
      </Link>
    </motion.div>
  )
}
