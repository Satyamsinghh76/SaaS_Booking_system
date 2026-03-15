'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import type { Booking as APIBooking } from '@/lib/api/bookings'

interface ProviderBooking {
  id: string
  serviceName: string
  customerName: string
  date: string
  time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  paymentStatus: string
  price: number
}

function mapBooking(b: APIBooking): ProviderBooking {
  return {
    id: b.id,
    serviceName: b.service_name,
    customerName: b.user_id,
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

const statusConfig = {
  pending:   { label: 'Pending',   style: 'bg-amber-500/10 text-amber-600', icon: Clock },
  confirmed: { label: 'Confirmed', style: 'bg-primary/10 text-primary', icon: CheckCircle2 },
  completed: { label: 'Completed', style: 'bg-success/10 text-success', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', style: 'bg-destructive/10 text-destructive', icon: XCircle },
}

export default function ProviderDashboardPage() {
  const [bookings, setBookings] = useState<ProviderBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadBookings = () => {
    setIsLoading(true)
    api.bookings.fetchBookings({ limit: 100 })
      .then(({ bookings: apiBookings }) => setBookings(apiBookings.map(mapBooking)))
      .catch(() => setError('Failed to load bookings.'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { loadBookings() }, [])

  const pending = bookings.filter(b => b.status === 'pending')
  const confirmed = bookings.filter(b => b.status === 'confirmed')
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayBookings = bookings.filter(b => b.date === todayStr && b.status !== 'cancelled')
  const totalRevenue = bookings
    .filter(b => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + b.price, 0)

  const stats = [
    { label: 'Pending', value: pending.length, icon: Clock, color: 'text-amber-600 bg-amber-500/10' },
    { label: 'Confirmed', value: confirmed.length, icon: CheckCircle2, color: 'text-primary bg-primary/10' },
    { label: "Today's Bookings", value: todayBookings.length, icon: Calendar, color: 'text-chart-2 bg-chart-2/10' },
    { label: 'Revenue (Paid)', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-success bg-success/10' },
  ]

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={loadBookings}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Provider Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage your bookings and track performance.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            className="p-5 bg-card rounded-xl border hover:shadow-lg transition-shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={cn('p-2 rounded-lg w-fit', stat.color.split(' ')[1])}>
              <stat.icon className={cn('h-5 w-5', stat.color.split(' ')[0])} />
            </div>
            <p className="text-2xl font-bold text-foreground mt-3">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Pending bookings requiring action */}
      {pending.length > 0 && (
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            Awaiting Confirmation ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.slice(0, 5).map((booking) => (
              <BookingRow key={booking.id} booking={booking} onUpdate={loadBookings} />
            ))}
          </div>
          {pending.length > 5 && (
            <Link href="/provider/bookings" className="block mt-4">
              <Button variant="ghost" size="sm">
                View all pending <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Today's schedule */}
      <div className="bg-card rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Today&apos;s Schedule
        </h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : todayBookings.length > 0 ? (
          <div className="space-y-3">
            {todayBookings.map((booking) => (
              <BookingRow key={booking.id} booking={booking} onUpdate={loadBookings} />
            ))}
          </div>
        ) : (
          <p className="text-center py-8 text-muted-foreground">No bookings scheduled for today.</p>
        )}
      </div>
    </div>
  )
}

function BookingRow({ booking, onUpdate }: { booking: ProviderBooking; onUpdate: () => void }) {
  const [acting, setActing] = useState<string | null>(null)
  const cfg = statusConfig[booking.status]

  const updateStatus = async (status: string) => {
    setActing(status)
    try {
      await api.patch(`/api/bookings/${booking.id}/status`, { status })
      onUpdate()
    } catch {
      // silently fail — UI will refresh
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-muted/30 rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-foreground">{booking.serviceName}</span>
          <Badge variant="secondary" className={cn('border-0 text-xs', cfg.style)}>
            {cfg.label}
          </Badge>
          {booking.paymentStatus === 'paid' && (
            <Badge variant="secondary" className="bg-success/10 text-success border-0 text-xs">
              Paid
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {format(new Date(booking.date + 'T00:00:00'), 'MMM d, yyyy')}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatTime12h(booking.time)}
          </span>
          <span className="flex items-center gap-1 font-medium text-foreground">
            <DollarSign className="h-3.5 w-3.5" />
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
              onClick={() => updateStatus('confirmed')}
              disabled={acting !== null}
              className="bg-success hover:bg-success/90 text-white"
            >
              {acting === 'confirmed' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => updateStatus('cancelled')}
              disabled={acting !== null}
            >
              {acting === 'cancelled' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Decline'}
            </Button>
          </>
        )}
        {booking.status === 'confirmed' && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateStatus('completed')}
              disabled={acting !== null}
            >
              {acting === 'completed' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Complete'}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => updateStatus('cancelled')}
              disabled={acting !== null}
            >
              {acting === 'cancelled' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
