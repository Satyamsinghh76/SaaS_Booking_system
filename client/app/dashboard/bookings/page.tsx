'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  DollarSign,
  Search,
  MoreHorizontal,
  CalendarDays,
  AlertCircle,
  CheckCircle2,
  CalendarPlus,
  XCircle,
  Loader2,
  Briefcase,
  RotateCcw,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { type Booking } from '@/lib/store'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import type { Booking as APIBooking } from '@/lib/api/bookings'

function formatTime12h(time24: string) {
  const [h, m] = time24.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hour12}:${m.toString().padStart(2, '0')} ${suffix}`
}

function mapAPIBooking(b: APIBooking): Booking {
  return {
    id: b.id,
    serviceId: b.service_id,
    serviceName: b.service_name,
    date: b.date,
    time: b.start_time,
    status:
      b.status === 'pending'
        ? 'pending'
        : b.status === 'confirmed'
        ? 'confirmed'
        : b.status === 'completed'
        ? 'completed'
        : 'cancelled',
    paymentStatus: b.payment_status,
    price: parseFloat(b.price_snapshot as unknown as string) || 0,
  }
}

const tabs = [
  { value: 'all', label: 'All', count: 0 },
  { value: 'pending', label: 'Pending', count: 0 },
  { value: 'confirmed', label: 'Confirmed', count: 0 },
  { value: 'completed', label: 'Completed', count: 0 },
  { value: 'cancelled', label: 'Cancelled', count: 0 },
]

// Business hours for rescheduling
const BUSINESS_HOURS = [
  '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'
]

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null)
  const [reschedulingBooking, setReschedulingBooking] = useState<Booking | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [rescheduleError, setRescheduleError] = useState<string | null>(null)

  const loadBookings = useCallback(() => {
    setIsLoading(true)
    setError(null)
    api.bookings.fetchBookings({ limit: 100 })
      .then(({ bookings: apiBookings }) => setBookings(apiBookings.map(mapAPIBooking)))
      .catch(() => setError('Failed to load bookings. Please try again.'))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => { loadBookings() }, [loadBookings])

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
      setIsCancelling(false)
    }
  }

  const openReschedule = (booking: Booking) => {
    setReschedulingBooking(booking)
    setRescheduleDate(booking.date)
    setRescheduleTime(booking.time)
    setRescheduleError(null)
  }

  const handleReschedule = async () => {
    if (!reschedulingBooking || !rescheduleDate || !rescheduleTime) return
    setIsRescheduling(true)
    setRescheduleError(null)
    try {
      await api.patch(`/api/bookings/${reschedulingBooking.id}/reschedule`, {
        date: rescheduleDate,
        start_time: rescheduleTime,
      })
      setReschedulingBooking(null)
      loadBookings()
    } catch (err: any) {
      setRescheduleError(err.response?.data?.message || 'Failed to reschedule. Please try again.')
    } finally {
      setIsRescheduling(false)
    }
  }

  // Compute tab counts
  const tabCounts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
            Your Bookings
          </h1>
          <p className="text-stone-500 mt-1 text-sm">
            Manage and track all your appointments.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Link href="/booking">
            <Button className="bg-stone-900 dark:bg-white hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 rounded-xl h-10 px-5 shadow-lg shadow-stone-900/15 dark:shadow-white/10">
              <Plus className="mr-2 h-4 w-4" />
              New booking
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Tab filters + Search */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-stone-100/60 dark:bg-stone-800/60 p-1 rounded-xl w-fit">
          {tabs.map((tab) => {
            const count = tabCounts[tab.value as keyof typeof tabCounts]
            const isActive = statusFilter === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                )}
              >
                {tab.label}
                <span className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center',
                  isActive ? 'bg-lime-100 text-lime-700' : 'bg-stone-200/60 text-stone-400'
                )}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            placeholder="Search by service name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-sm"
          />
        </div>
      </motion.div>

      {/* Bookings list */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-stone-100 dark:bg-stone-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-white dark:bg-stone-900/80 rounded-2xl border border-stone-200 dark:border-white/10 shadow-sm space-y-3">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
            <p className="text-stone-500">{error}</p>
            <Button variant="outline" onClick={loadBookings} className="rounded-xl">Retry</Button>
          </motion.div>
        ) : filteredBookings.length > 0 ? (
          <motion.div key={statusFilter} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {filteredBookings.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <BookingCard booking={booking} onCancel={() => setCancellingBooking(booking)} onReschedule={() => openReschedule(booking)} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-white dark:bg-stone-900/80 rounded-2xl border border-stone-200 dark:border-white/10">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="h-6 w-6 text-stone-400" />
            </div>
            <p className="text-stone-500 font-medium">No bookings found</p>
            {(search || statusFilter !== 'all') && (
              <Button variant="outline" className="mt-4 rounded-xl" onClick={() => { setSearch(''); setStatusFilter('all') }}>
                Clear filters
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel dialog */}
      <Dialog open={!!cancellingBooking} onOpenChange={() => !isCancelling && setCancellingBooking(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-stone-900 dark:text-stone-100">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Cancel Booking
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {cancellingBooking && (
            <div className="p-4 bg-stone-50 rounded-xl space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-400">Service</span>
                <span className="font-medium text-stone-800 dark:text-stone-200">{cancellingBooking.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Date</span>
                <span className="font-medium text-stone-800 dark:text-stone-200">{format(new Date(cancellingBooking.date + 'T00:00:00'), 'MMMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Time</span>
                <span className="font-medium text-stone-800 dark:text-stone-200">{formatTime12h(cancellingBooking.time)}</span>
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setCancellingBooking(null)}
              disabled={isCancelling}
              className="flex-1 rounded-xl border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
            >
              Keep Booking
            </Button>
            <Button
              onClick={handleCancelBooking}
              disabled={isCancelling}
              className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm"
            >
              {isCancelling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reschedule dialog */}
      <Dialog open={!!reschedulingBooking} onOpenChange={() => !isRescheduling && setReschedulingBooking(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-stone-900 dark:text-stone-100">
              <RotateCcw className="h-5 w-5 text-lime-600" />
              Reschedule Booking
            </DialogTitle>
            <DialogDescription>
              Pick a new date and time for your appointment.
            </DialogDescription>
          </DialogHeader>

          {reschedulingBooking && (
            <div className="space-y-4">
              {/* Current booking info */}
              <div className="p-3 bg-stone-50 rounded-xl text-sm">
                <p className="font-medium text-stone-800 dark:text-stone-200">{reschedulingBooking.serviceName}</p>
                <p className="text-stone-400 text-xs mt-0.5">
                  Currently: {format(new Date(reschedulingBooking.date + 'T00:00:00'), 'MMM d, yyyy')} at {formatTime12h(reschedulingBooking.time)}
                </p>
              </div>

              {/* Date picker */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-stone-500 uppercase tracking-wider">New Date</Label>
                <Input
                  type="date"
                  value={rescheduleDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="h-11 rounded-xl border-stone-200 bg-stone-50/60"
                />
              </div>

              {/* Time picker */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-stone-500 uppercase tracking-wider">New Time</Label>
                <div className="grid grid-cols-4 gap-2">
                  {BUSINESS_HOURS.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setRescheduleTime(time)}
                      className={cn(
                        'py-2.5 rounded-xl text-sm font-medium transition-all border',
                        rescheduleTime === time
                          ? 'bg-lime-500 text-white border-lime-500 shadow-sm'
                          : 'bg-white text-stone-600 border-stone-200 hover:border-lime-300 hover:bg-lime-50'
                      )}
                    >
                      {formatTime12h(time)}
                    </button>
                  ))}
                </div>
              </div>

              {rescheduleError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                  {rescheduleError}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setReschedulingBooking(null)}
              disabled={isRescheduling}
              className="flex-1 rounded-xl border-stone-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={isRescheduling || !rescheduleDate || !rescheduleTime}
              className="flex-1 rounded-xl bg-stone-900 hover:bg-stone-800 text-white shadow-sm"
            >
              {isRescheduling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />}
              {isRescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Booking Card
// ═══════════════════════════════════════════════════════════════

function BookingCard({ booking, onCancel, onReschedule }: { booking: Booking; onCancel: () => void; onReschedule: () => void }) {
  const statusConfig = {
    pending: { label: 'Pending Approval', dot: 'bg-amber-500', bg: 'bg-amber-50 text-amber-700' },
    confirmed: { label: 'Confirmed', dot: 'bg-emerald-500', bg: 'bg-emerald-50 text-emerald-700' },
    completed: { label: 'Completed', dot: 'bg-blue-500', bg: 'bg-blue-50 text-blue-700' },
    cancelled: { label: 'Cancelled', dot: 'bg-stone-400', bg: 'bg-stone-100 text-stone-500' },
  }
  const cfg = statusConfig[booking.status]

  const calendarUrl = (() => {
    const dateClean = booking.date.replace(/-/g, '')
    const [h, m] = booking.time.split(':').map(Number)
    const start = `${dateClean}T${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}00`
    const endH = h + 1
    const end = `${dateClean}T${String(endH).padStart(2, '0')}${String(m).padStart(2, '0')}00`
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(booking.serviceName + ' — BookFlow')}&dates=${start}/${end}&details=${encodeURIComponent('Booking via BookFlow\nService: ' + booking.serviceName + '\nPrice: $' + booking.price)}`
  })()

  return (
    <div className="group bg-white dark:bg-stone-900/80 rounded-2xl border border-stone-200/80 dark:border-white/10 p-5 shadow-sm hover:shadow-md hover:border-stone-300/80 dark:hover:border-white/20 transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Icon */}
        <div className={cn(
          'p-3 rounded-xl shrink-0 w-fit',
          booking.status === 'pending' ? 'bg-amber-50 dark:bg-amber-950/50' : booking.status === 'confirmed' ? 'bg-emerald-50 dark:bg-emerald-950/50' : booking.status === 'completed' ? 'bg-blue-50 dark:bg-blue-950/50' : 'bg-stone-100 dark:bg-stone-800'
        )}>
          <Briefcase className={cn(
            'h-5 w-5',
            booking.status === 'pending' ? 'text-amber-600' : booking.status === 'confirmed' ? 'text-emerald-600' : booking.status === 'completed' ? 'text-blue-600' : 'text-stone-400'
          )} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
              {booking.serviceName}
            </h3>
            {/* Status badge */}
            <span className={cn('inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full', cfg.bg)}>
              <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
              {cfg.label}
            </span>
            {/* Payment badge */}
            {booking.paymentStatus === 'paid' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3" />
                Paid
              </span>
            ) : (booking.status === 'pending' || booking.status === 'confirmed') ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Unpaid
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-stone-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(booking.date + 'T00:00:00'), 'MMM d, yyyy')}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {formatTime12h(booking.time)}
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-stone-800 dark:text-stone-200">
              <DollarSign className="h-3.5 w-3.5" />
              {booking.price}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {(booking.status === 'pending' || booking.status === 'confirmed') && (
            <>
              {booking.paymentStatus !== 'paid' && (
                <Link href={`/payment?bookingId=${booking.id}`}>
                  <Button size="sm" className="bg-lime-500 hover:bg-lime-600 text-white rounded-lg shadow-sm shadow-lime-500/20 text-xs font-semibold h-8 px-3">
                    Pay Now
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={onReschedule} className="rounded-lg text-xs font-medium h-8 px-3 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100">
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Reschedule
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-300">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem asChild>
                    <a href={calendarUrl} target="_blank" rel="noopener noreferrer">
                      <CalendarPlus className="h-4 w-4 mr-2" />
                      Add to Google Calendar
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600 focus:text-red-700" onClick={onCancel}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Booking
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          {booking.status === 'completed' && (
            <Link href="/booking">
              <Button variant="outline" size="sm" className="rounded-lg text-xs font-medium h-8 px-3 border-stone-200">
                Book Again
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
