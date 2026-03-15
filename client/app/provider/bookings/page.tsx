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
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'
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
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import type { Booking as APIBooking } from '@/lib/api/bookings'

interface ProviderBooking {
  id: string
  serviceName: string
  date: string
  time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  paymentStatus: string
  price: number
}

function mapBooking(b: APIBooking): ProviderBooking {
  return {
    id: b.id,
    serviceName: b.service_name,
    date: b.date,
    time: b.start_time,
    status: b.status as ProviderBooking['status'],
    paymentStatus: b.payment_status,
    price: parseFloat(b.price_snapshot as unknown as string) || 0,
  }
}

function formatTime12h(time24: string) {
  const [h, m] = time24.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hour12}:${m.toString().padStart(2, '0')} ${suffix}`
}

const statusStyles: Record<string, string> = {
  pending:   'bg-amber-500/10 text-amber-600',
  confirmed: 'bg-primary/10 text-primary',
  completed: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
  no_show:   'bg-muted text-muted-foreground',
}

export default function ProviderBookingsPage() {
  const [bookings, setBookings] = useState<ProviderBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [acting, setActing] = useState<string | null>(null)

  const loadBookings = useCallback(() => {
    setIsLoading(true)
    setError(null)
    api.bookings.fetchBookings({ limit: 100 })
      .then(({ bookings: apiBookings }) => setBookings(apiBookings.map(mapBooking)))
      .catch(() => setError('Failed to load bookings.'))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => { loadBookings() }, [loadBookings])

  const filtered = bookings.filter(b => {
    const matchesSearch = b.serviceName.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const updateStatus = async (bookingId: string, status: string) => {
    setActing(bookingId + status)
    try {
      await api.patch(`/api/bookings/${bookingId}/status`, { status })
      loadBookings()
    } catch {
      // refresh anyway
      loadBookings()
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">All Bookings</h1>
        <p className="text-muted-foreground mt-1">View, confirm, and manage all bookings.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by service..."
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bookings list */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-card rounded-xl border space-y-3">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={loadBookings}>Retry</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border">
          <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((booking) => (
              <motion.div
                key={booking.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-5 bg-card rounded-xl border hover:shadow-md transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">{booking.serviceName}</span>
                    <Badge variant="secondary" className={cn('border-0 capitalize text-xs', statusStyles[booking.status])}>
                      {booking.status}
                    </Badge>
                    {booking.paymentStatus === 'paid' ? (
                      <Badge variant="secondary" className="bg-success/10 text-success border-0 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Paid
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-0 text-xs">
                        Unpaid
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(booking.date + 'T00:00:00'), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {formatTime12h(booking.time)}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <DollarSign className="h-4 w-4" />
                      {booking.price}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {booking.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateStatus(booking.id, 'confirmed')}
                        disabled={acting !== null}
                        className="bg-success hover:bg-success/90 text-white"
                      >
                        {acting === booking.id + 'confirmed' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateStatus(booking.id, 'cancelled')}
                        disabled={acting !== null}
                      >
                        {acting === booking.id + 'cancelled' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Decline'}
                      </Button>
                    </>
                  )}
                  {booking.status === 'confirmed' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(booking.id, 'completed')}
                        disabled={acting !== null}
                      >
                        {acting === booking.id + 'completed' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Complete'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateStatus(booking.id, 'cancelled')}
                        disabled={acting !== null}
                      >
                        {acting === booking.id + 'cancelled' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel'}
                      </Button>
                    </>
                  )}
                  {booking.status === 'completed' && (
                    <span className="text-xs text-muted-foreground">Done</span>
                  )}
                  {booking.status === 'cancelled' && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5" /> Cancelled
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
