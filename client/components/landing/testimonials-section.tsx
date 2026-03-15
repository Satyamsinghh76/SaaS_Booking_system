'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Star, Quote } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const testimonials = [
  {
    content: "BookFlow has transformed how we manage our appointments. The automation saves us hours every week, and our clients love the seamless booking experience.",
    author: "Sarah Chen",
    role: "Wellness Studio Owner",
    rating: 5,
    initials: "SC",
  },
  {
    content: "The analytics dashboard gives me insights I never had before. I can now make data-driven decisions about my business growth.",
    author: "Marcus Johnson",
    role: "Business Consultant",
    rating: 5,
    initials: "MJ",
  },
  {
    content: "Finally, a booking platform that just works. Clean interface, powerful features, and exceptional support. Highly recommended.",
    author: "Emily Rodriguez",
    role: "Creative Director",
    rating: 5,
    initials: "ER",
  },
]

export function TestimonialsSection() {
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
            Testimonials
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-balance">
            Loved by businesses worldwide
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            See what our customers have to say about their experience with BookFlow.
          </p>
        </motion.div>

        {/* Testimonials grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.15 }}
            >
              <TestimonialCard testimonial={testimonial} />
            </motion.div>
          ))}
        </div>

        {/* Trust indicators */}
        <motion.div 
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p className="text-sm text-muted-foreground mb-8">
            Trusted by 10,000+ businesses across industries
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {['Netflix', 'Tripadvisor', 'Box', 'eBay'].map((company, index) => (
              <motion.span
                key={company}
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 0.5 } : {}}
                transition={{ delay: 1 + index * 0.1 }}
                className="text-xl font-bold text-foreground/40"
              >
                {company}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function TestimonialCard({ testimonial }: { testimonial: typeof testimonials[0] }) {
  return (
    <motion.div
      className={cn(
        'relative flex flex-col h-full p-6 bg-card rounded-xl border transition-all duration-300',
        'hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20'
      )}
      whileHover={{ y: -4 }}
    >
      {/* Quote icon */}
      <Quote className="h-8 w-8 text-primary/20 mb-4" />

      {/* Rating */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-chart-4 text-chart-4" />
        ))}
      </div>

      {/* Content */}
      <p className="text-foreground leading-relaxed flex-1">
        &ldquo;{testimonial.content}&rdquo;
      </p>

      {/* Author */}
      <div className="flex items-center gap-3 mt-6 pt-4 border-t">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
            {testimonial.initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium text-foreground">{testimonial.author}</div>
          <div className="text-sm text-muted-foreground">{testimonial.role}</div>
        </div>
      </div>
    </motion.div>
  )
}
