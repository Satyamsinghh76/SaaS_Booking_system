'use client'

import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { ArrowRight, Clock, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useBookingStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function ServicesPreview() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const { services } = useBookingStore()

  // Show first 3 services
  const previewServices = services.slice(0, 3)

  return (
    <section className="py-24 sm:py-32 bg-background" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div 
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div>
            <span className="text-sm font-medium text-primary uppercase tracking-wider">
              Services
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-balance">
              Popular services
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl text-pretty">
              Browse our most booked services and find the perfect fit for your needs.
            </p>
          </div>
          <Link href="/services">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="outline" className="shrink-0">
                View all services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </Link>
        </motion.div>

        {/* Services grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {previewServices.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            >
              <ServiceCard service={service} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ServiceCard({ service }: { service: { id: string; name: string; description: string; duration: number; price: number; category: string } }) {
  return (
    <motion.div
      className={cn(
        'group relative flex flex-col h-full p-6 bg-card rounded-xl border transition-all duration-300',
        'hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20'
      )}
      whileHover={{ y: -8 }}
    >
      {/* Category badge */}
      <Badge variant="secondary" className="w-fit mb-4">
        {service.category}
      </Badge>

      {/* Service info */}
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {service.name}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed flex-1">
        {service.description}
      </p>

      {/* Meta info */}
      <div className="flex items-center gap-4 mt-6 pt-4 border-t">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{service.duration} min</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <DollarSign className="h-4 w-4" />
          <span>{service.price}</span>
        </div>
      </div>

      {/* CTA */}
      <Link href={`/booking?service=${service.id}`} className="mt-4">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button className="w-full bg-primary hover:bg-primary/90">
            Book now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </Link>

      {/* Hover gradient effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
  )
}
