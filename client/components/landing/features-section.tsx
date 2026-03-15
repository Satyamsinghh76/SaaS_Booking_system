'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { 
  Calendar, 
  Clock, 
  Bell, 
  Shield, 
  BarChart3, 
  Smartphone,
  Globe,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

const features = [
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'AI-powered scheduling that learns your preferences and optimizes your calendar automatically.',
  },
  {
    icon: Clock,
    title: 'Real-time Availability',
    description: 'Instantly sync your availability across all platforms and prevent double bookings.',
  },
  {
    icon: Bell,
    title: 'Automated Reminders',
    description: 'Reduce no-shows with customizable email and SMS reminders for your clients.',
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'Accept payments securely with built-in Stripe integration and invoicing.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track bookings, revenue, and client insights with powerful analytics tools.',
  },
  {
    icon: Smartphone,
    title: 'Mobile First',
    description: 'Manage your bookings on the go with our responsive mobile experience.',
  },
  {
    icon: Globe,
    title: 'Multi-timezone',
    description: 'Serve clients worldwide with automatic timezone detection and conversion.',
  },
  {
    icon: Zap,
    title: 'Instant Setup',
    description: 'Get started in minutes with our intuitive onboarding and templates.',
  },
]

export function FeaturesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-24 sm:py-32 bg-muted/30" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div 
          className="text-center max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">
            Features
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-balance">
            Everything you need to manage bookings
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Powerful features designed to save you time and delight your clients.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <FeatureCard feature={feature} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ feature }: { feature: typeof features[0] }) {
  return (
    <motion.div
      className={cn(
        'group relative p-6 bg-card rounded-xl border transition-all duration-300',
        'hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20'
      )}
      whileHover={{ y: -4 }}
    >
      {/* Icon */}
      <div className="mb-4">
        <motion.div 
          className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
          whileHover={{ scale: 1.05, rotate: 5 }}
        >
          <feature.icon className="h-6 w-6" />
        </motion.div>
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {feature.title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {feature.description}
      </p>

      {/* Hover gradient effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
  )
}
