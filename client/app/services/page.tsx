'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, Clock, DollarSign, ArrowRight, Grid, List } from 'lucide-react'
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
import { PageTransition, StaggerWrapper, StaggerItem } from '@/components/ui/motion'
import { cn } from '@/lib/utils'

const categories = ['All', 'Consulting', 'Design', 'Development', 'Branding', 'Marketing', 'General']

export default function ServicesPage() {
  const { services } = useBookingStore()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(search.toLowerCase()) ||
                         service.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'All' || service.category === category
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <PageTransition>
        <main className="pt-24 pb-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-12">
              <motion.span 
                className="text-sm font-medium text-primary uppercase tracking-wider"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Our Services
              </motion.span>
              <motion.h1 
                className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight text-foreground text-balance"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                Find the perfect service for your needs
              </motion.h1>
              <motion.p 
                className="mt-4 text-lg text-muted-foreground text-pretty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Browse our comprehensive range of services and book your appointment today.
              </motion.p>
            </div>

            {/* Filters */}
            <motion.div 
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>

              {/* Category filter */}
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full sm:w-[180px] h-11">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View toggle */}
              <div className="flex border rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 rounded-md transition-colors',
                    viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                  aria-label="Grid view"
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 rounded-md transition-colors',
                    viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </motion.div>

            {/* Services grid/list */}
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
                    {filteredServices.map((service) => (
                      <StaggerItem key={service.id}>
                        {viewMode === 'grid' ? (
                          <ServiceGridCard service={service} />
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
                  className="text-center py-16"
                >
                  <p className="text-muted-foreground">No services found matching your criteria.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => { setSearch(''); setCategory('All'); }}
                  >
                    Clear filters
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </PageTransition>

      <Footer />
    </div>
  )
}

function ServiceGridCard({ service }: { service: Service }) {
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

      {/* Hover gradient */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
  )
}

function ServiceListCard({ service }: { service: Service }) {
  return (
    <motion.div
      className={cn(
        'group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6 bg-card rounded-xl border transition-all duration-300',
        'hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20'
      )}
      whileHover={{ x: 4 }}
    >
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-semibold text-foreground">
            {service.name}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {service.category}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {service.description}
        </p>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-6 shrink-0">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{service.duration} min</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <DollarSign className="h-4 w-4" />
          <span>{service.price}</span>
        </div>
        
        <Link href={`/booking?service=${service.id}`}>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button className="bg-primary hover:bg-primary/90">
              Book
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </Link>
      </div>
    </motion.div>
  )
}
