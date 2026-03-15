'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Search,
  Filter,
  MoreHorizontal,
  X,
  CalendarDays,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type Booking } from '@/lib/store'
import { StaggerWrapper, StaggerItem, AnimatedSkeleton } from '@/components/ui/motion'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import type { Booking as APIBooking, BookingStatus } from '@/lib/api/bookings'

function mapAPIBooking(b: APIBooking): Booking {
  return {
    id: b.id,
    serviceId: b.service_id,
    serviceName: b.service_name,
    date: b.date,
    time: b.start_time,
    status:
      b.status === 'pending' || b.status === 'confirmed'
        ? 'upcoming'
        : b.status === 'completed'
        ? 'completed'
        : 'cancelled',
    price: b.price_snapshot,
  }
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null)

  const loadBookings = useCallback(() => {
    setIsLoading(true)
    setError(null)
    api.bookings.fetchBookings({ limit: 100 })
      .then(({ bookings: apiBookings }) => setBookings(apiBookings.map(mapAPIBooking)))
      .catch(() => setError('Failed to load bookings. Please try again.'))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.serviceName.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCancelBooking = async () => {
    if (!cancellingBooking) return
    setIsCancelling(true)
    try {
      await api.bookings.cancelBooking(cancellingBooking.id)
      setCancellingBooking(null)
      loadBookings()
    } catch {
      // Keep dialog open; user can retry or dismiss
      setIsCancelling(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <motion.h1 
          className="text-2xl sm:text-3xl font-bold text-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Your Bookings
        </motion.h1>
        <motion.p 
          className="text-muted-foreground mt-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Manage and track all your appointments.
        </motion.p>
      </div>

      {/* Filters */}
      <motion.div 
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bookings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Bookings list */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <AnimatedSkeleton key={i} className="h-[104px] rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-card rounded-xl border space-y-3"
          >
            <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={loadBookings}>Retry</Button>
          </motion.div>
        ) : filteredBookings.length > 0 ? (
          <StaggerWrapper className="space-y-4">
            {filteredBookings.map((booking) => (
              <StaggerItem key={booking.id}>
                <BookingCard 
                  booking={booking} 
                  onCancel={() => setCancellingBooking(booking)}
                />
              </StaggerItem>
            ))}
          </StaggerWrapper>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-card rounded-xl border"
          >
            <CalendarDays className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No bookings found</p>
            {(search || statusFilter !== 'all') && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => { setSearch(''); setStatusFilter('all'); }}
              >
                Clear filters
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel confirmation dialog */}
      <Dialog open={!!cancellingBooking} onOpenChange={() => !isCancelling && setCancellingBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Cancel Booking
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {cancellingBooking && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service</span>
                <span className="font-medium">{cancellingBooking.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">
                  {format(new Date(cancellingBooking.date), 'MMMM d, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">{cancellingBooking.time}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancellingBooking(null)} disabled={isCancelling}>
              Keep Booking
            </Button>
            <Button variant="destructive" onClick={handleCancelBooking} disabled={isCancelling}>
              {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function BookingCard({ booking, onCancel }: { booking: Booking; onCancel: () => void }) {
  const statusStyles = {
    upcoming: 'bg-primary/10 text-primary',
    completed: 'bg-success/10 text-success',
    cancelled: 'bg-destructive/10 text-destructive',
  }

  return (
    <motion.div
      className="p-6 bg-card rounded-xl border transition-all hover:shadow-lg hover:border-primary/20"
      whileHover={{ x: 4 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Icon */}
        <div className="p-3 bg-primary/10 rounded-lg shrink-0 w-fit">
          <CalendarDays className="h-6 w-6 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start sm:items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground">
              {booking.serviceName}
            </h3>
            <Badge 
              variant="secondary" 
              className={cn('capitalize border-0', statusStyles[booking.status])}
            >
              {booking.status}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {format(new Date(booking.date), 'MMM d, yyyy')}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {booking.time}
            </span>
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <DollarSign className="h-4 w-4" />
              {booking.price}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {booking.status === 'upcoming' && (
            <>
              <Button variant="outline" size="sm">
                Reschedule
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>View Details</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={onCancel}>
                    Cancel Booking
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          {booking.status === 'completed' && (
            <Button variant="outline" size="sm">
              Book Again
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
