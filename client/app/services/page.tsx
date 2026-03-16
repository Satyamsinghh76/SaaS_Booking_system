'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import Tilt from 'react-parallax-tilt'
import { Search, Filter, Clock, DollarSign, ArrowRight, Grid, List, Sparkles, Star, Zap } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBookingStore, type Service } from '@/lib/store'
import { fetchServices } from '@/lib/api'
import { PageTransition, StaggerWrapper, StaggerItem } from '@/components/ui/motion'
import { cn } from '@/lib/utils'

const categories = ['All', 'Consulting', 'Design', 'Development', 'Branding', 'Marketing', 'General']

const categoryIcons: Record<string, typeof Sparkles> = {
  Consulting: Sparkles,
  Design: Star,
  Development: Zap,
  Branding: Star,
  Marketing: Sparkles,
  General: Zap,
}

const categoryGradients: Record<string, string> = {
  Consulting: 'from-violet-500 to-indigo-600',
  Design:     'from-rose-500 to-pink-600',
  Development:'from-cyan-500 to-blue-600',
  Branding:   'from-amber-500 to-orange-600',
  Marketing:  'from-emerald-500 to-teal-600',
  General:    'from-slate-500 to-slate-700',
}

export default function ServicesPage() {
  const { services, setServices } = useBookingStore()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Always fetch fresh services from API on mount
  useEffect(() => {
    fetchServices()
      .then(({ services: apiServices }) =>
        setServices(
          apiServices.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description ?? '',
            duration: s.duration_minutes,
            price: Number(s.price) || 0,
            category: s.category || '',
          }))
        )
      )
      .catch(() => {})
  }, [setServices])

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(search.toLowerCase()) ||
                         service.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'All' || service.category === category
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-background dark:bg-stone-950">
      <Navbar />

      <PageTransition>
        <main className="pt-24 pb-20">
          {/* ── Hero Section with aurora background ────────────────── */}
          <div className="relative overflow-hidden pb-4">
            {/* Aurora background layer */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Grid overlay */}
              <div className="absolute inset-0 aurora-grid aurora-grid-pattern" />

              {/* Aurora blobs */}
              <div className="aurora-blob-1 aurora-grad-violet absolute -top-20 left-[5%] w-[500px] h-[500px] rounded-full blur-3xl" />
              <div className="aurora-blob-2 aurora-grad-cyan absolute top-0 right-[5%] w-[450px] h-[450px] rounded-full blur-3xl" />
              <div className="aurora-blob-3 aurora-grad-emerald absolute top-[120px] left-[30%] w-[400px] h-[400px] rounded-full blur-3xl" />
              <div className="aurora-blob-1 aurora-grad-rose absolute top-[60px] right-[20%] w-[300px] h-[300px] rounded-full blur-3xl [animation-delay:-5s]" />

              {/* Readability overlay */}
              <div className="absolute inset-0 bg-background/30 dark:bg-stone-950/40" />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {/* Hero text */}
              <div className="text-center max-w-3xl mx-auto mb-16 pt-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 dark:bg-primary/15 border border-primary/20 dark:border-primary/30 px-5 py-2 rounded-full mb-8"
                >
                  <Sparkles className="h-4 w-4" />
                  Our Services
                </motion.div>

                <motion.h1
                  className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                >
                  Find the perfect
                  <br />
                  <span className="bg-gradient-to-r from-primary via-violet-500 to-cyan-500 bg-clip-text text-transparent">
                    service for your needs
                  </span>
                </motion.h1>

                <motion.p
                  className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  Browse our comprehensive range of professional services and book your appointment in minutes.
                </motion.p>

                {/* Stats bar */}
                <motion.div
                  className="mt-10 inline-flex items-center gap-6 sm:gap-8 text-sm text-muted-foreground"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    <span><strong className="text-foreground">{services.length}</strong> Services</span>
                  </div>
                  <div className="w-px h-4 bg-border" />
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                    <span><strong className="text-foreground">Instant</strong> Booking</span>
                  </div>
                  <div className="w-px h-4 bg-border hidden sm:block" />
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                    <span><strong className="text-foreground">24/7</strong> Availability</span>
                  </div>
                </motion.div>
              </div>

              {/* ── Glassmorphism filter bar ──────────────────────────── */}
              <motion.div
                className={cn(
                  'flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-10 p-3 rounded-2xl border',
                  'bg-white/60 dark:bg-white/5 backdrop-blur-xl',
                  'border-white/40 dark:border-white/10',
                  'shadow-lg shadow-black/5 dark:shadow-black/20'
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search services..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-11 border-0 bg-transparent shadow-none focus-visible:ring-0"
                  />
                </div>

                <div className="w-px h-8 bg-border/50 hidden sm:block" />

                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full sm:w-[180px] h-11 border-0 bg-transparent shadow-none">
                    <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="w-px h-8 bg-border/50 hidden sm:block" />

                <div className="flex border rounded-xl p-1 bg-muted/30 dark:bg-white/5">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'p-2.5 rounded-lg transition-all',
                      viewMode === 'grid'
                        ? 'bg-background dark:bg-white/10 text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    aria-label="Grid view"
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'p-2.5 rounded-lg transition-all',
                      viewMode === 'list'
                        ? 'bg-background dark:bg-white/10 text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    aria-label="List view"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>

              {/* ── Services grid/list ────────────────────────────────── */}
              <AnimatePresence mode="wait">
                {filteredServices.length > 0 ? (
                  <motion.div
                    key={viewMode}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <StaggerWrapper className={cn(
                      viewMode === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                        : 'space-y-4'
                    )}>
                      {filteredServices.map((service, index) => (
                        <StaggerItem key={service.id}>
                          {viewMode === 'grid' ? (
                            <ServiceGridCard service={service} index={index} />
                          ) : (
                            <ServiceListCard service={service} />
                          )}
                        </StaggerItem>
                      ))}
                    </StaggerWrapper>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-muted/50 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                      <Search className="h-7 w-7 text-muted-foreground/50" />
                    </div>
                    <p className="text-lg font-medium text-foreground mb-1">No services found</p>
                    <p className="text-muted-foreground mb-6">Try adjusting your search or filter criteria.</p>
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => { setSearch(''); setCategory('All'); }}
                    >
                      Clear filters
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </PageTransition>

      <Footer />
    </div>
  )
}

/* ── 3D Tilt Grid Card ──────────────────────────────────────────── */

function ServiceGridCard({ service, index }: { service: Service; index: number }) {
  const gradient = categoryGradients[service.category] || categoryGradients.General
  const IconComp = categoryIcons[service.category] || Zap

  return (
    <Tilt
      tiltMaxAngleX={8}
      tiltMaxAngleY={8}
      glareEnable
      glareMaxOpacity={0.08}
      glareColor="#ffffff"
      glarePosition="all"
      glareBorderRadius="1rem"
      scale={1.02}
      transitionSpeed={400}
      className="h-full"
    >
      <motion.div
        className={cn(
          'card-glow group relative flex flex-col h-full rounded-2xl border overflow-hidden',
          'bg-white dark:bg-stone-900/80',
          'border-stone-200/80 dark:border-white/10',
          'hover:border-primary/30 dark:hover:border-primary/40',
          'transition-all duration-500'
        )}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08, duration: 0.5 }}
      >
        {/* Gradient header strip */}
        <div className={cn('h-32 bg-gradient-to-br relative overflow-hidden', gradient)}>
          {/* Decorative circles */}
          <div className="absolute top-3 right-3 w-20 h-20 rounded-full bg-white/10 blur-md" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/10 blur-lg" />

          {/* Animated shimmer on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

          {/* Category icon */}
          <div className="absolute bottom-4 left-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/20 shadow-lg">
              <IconComp className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* Category label */}
          <div className="absolute top-4 right-4">
            <span className="text-xs font-semibold text-white/90 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
              {service.category}
            </span>
          </div>
        </div>

        <div className="flex flex-col flex-1 p-6 pt-5">
          {/* Service info */}
          <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
            {service.name}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-2">
            {service.description}
          </p>

          {/* Price + Duration row */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-dashed border-stone-200 dark:border-white/10">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{service.duration} min</span>
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-sm text-muted-foreground">$</span>
              <span className="text-2xl font-extrabold text-foreground">{service.price}</span>
            </div>
          </div>

          {/* CTA */}
          <Link href={`/booking?service=${service.id}`} className="mt-5 block">
            <Button className={cn(
              'w-full h-12 rounded-xl font-semibold text-white shadow-lg transition-all duration-300',
              'bg-gradient-to-r hover:opacity-90 hover:shadow-xl',
              gradient
            )}>
              Book now
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1.5 transition-transform duration-300" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </Tilt>
  )
}

/* ── List Card ──────────────────────────────────────────────────── */

function ServiceListCard({ service }: { service: Service }) {
  const gradient = categoryGradients[service.category] || categoryGradients.General
  const IconComp = categoryIcons[service.category] || Zap

  return (
    <motion.div
      className={cn(
        'card-glow group relative flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 rounded-2xl border overflow-hidden',
        'bg-white dark:bg-stone-900/80',
        'border-stone-200/80 dark:border-white/10',
        'hover:border-primary/30 dark:hover:border-primary/40',
        'transition-all duration-300'
      )}
      whileHover={{ x: 6 }}
    >
      {/* Left accent */}
      <div className={cn(
        'absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b opacity-0 group-hover:opacity-100 transition-opacity duration-300',
        gradient
      )} />

      {/* Icon */}
      <div className={cn(
        'flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br shrink-0 shadow-lg',
        gradient
      )}>
        <IconComp className="h-6 w-6 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-1">
          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-300">
            {service.name}
          </h3>
          <Badge variant="secondary" className="text-xs bg-primary/5 dark:bg-primary/15 text-primary border-primary/20 hidden sm:inline-flex">
            {service.category}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {service.description}
        </p>
      </div>

      {/* Meta + CTA */}
      <div className="flex items-center gap-5 shrink-0">
        <div className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{service.duration} min</span>
        </div>
        <div className="flex items-baseline gap-0.5">
          <span className="text-sm text-muted-foreground">$</span>
          <span className="text-xl font-extrabold text-foreground">{service.price}</span>
        </div>

        <Link href={`/booking?service=${service.id}`}>
          <Button className={cn(
            'rounded-xl font-semibold text-white shadow-md transition-all duration-300',
            'bg-gradient-to-r hover:opacity-90 hover:shadow-lg',
            gradient
          )}>
            Book
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
        </Link>
      </div>
    </motion.div>
  )
}
