'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import Link from 'next/link'
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useBookingStore, type Booking } from '@/lib/store'
import { StaggerWrapper, StaggerItem, AnimatedSkeleton } from '@/components/ui/motion'
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
      b.status === 'pending' || b.status === 'confirmed'
        ? 'upcoming'
        : b.status === 'completed'
        ? 'completed'
        : 'cancelled',
    paymentStatus: b.payment_status,
    price: b.price_snapshot,
  }
}

export default function DashboardPage() {
  const { currentUser } = useBookingStore()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.bookings.fetchBookings({ limit: 50 })
      .then(({ bookings: apiBookings }) => {
        setBookings(apiBookings.map(mapAPIBooking))
      })
      .catch(() => setError('Failed to load bookings. Please refresh to try again.'))
      .finally(() => setIsLoading(false))
  }, [])
  
  const upcomingBookings = bookings.filter(b => b.status === 'upcoming').slice(0, 5)
  const recentBookings = bookings.filter(b => b.status === 'completed').slice(0, 3)

  const totalSpent = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.price, 0)

  const computedStats = [
    {
      label: 'Upcoming Bookings',
      value: String(bookings.filter(b => b.status === 'upcoming').length),
      change: '',
      icon: Calendar,
      color: 'primary',
    },
    {
      label: 'Completed',
      value: String(bookings.filter(b => b.status === 'completed').length),
      change: '',
      icon: CheckCircle2,
      color: 'success',
    },
    {
      label: 'Total Spent',
      value: `$${totalSpent.toLocaleString()}`,
      change: '',
      icon: DollarSign,
      color: 'accent',
    },
    {
      label: 'Total Bookings',
      value: String(bookings.filter(b => b.status !== 'cancelled').length),
      change: '',
      icon: Clock,
      color: 'chart-2',
    },
  ]

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <motion.h1 
            className="text-2xl sm:text-3xl font-bold text-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Welcome back{currentUser ? `, ${currentUser.name.split(' ')[0]}` : ''}
          </motion.h1>
          <motion.p 
            className="text-muted-foreground mt-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Here&apos;s what&apos;s happening with your bookings today.
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link href="/booking">
            <Button className="bg-primary hover:bg-primary/90">
              <Calendar className="mr-2 h-4 w-4" />
              New booking
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Stats grid */}
      <StaggerWrapper className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <StaggerItem key={i}>
                <AnimatedSkeleton className="h-[116px] rounded-xl" />
              </StaggerItem>
            ))
          : computedStats.map((stat) => (
          <StaggerItem key={stat.label}>
            <motion.div
              className="p-6 bg-card rounded-xl border transition-all hover:shadow-lg hover:border-primary/20"
              whileHover={{ y: -4 }}
            >
              <div className="flex items-center justify-between">
                <div className={cn(
                  'p-2 rounded-lg',
                  stat.color === 'primary' && 'bg-primary/10',
                  stat.color === 'success' && 'bg-success/10',
                  stat.color === 'accent' && 'bg-accent/10',
                  stat.color === 'chart-2' && 'bg-chart-2/10',
                )}>
                  <stat.icon className={cn(
                    'h-5 w-5',
                    stat.color === 'primary' && 'text-primary',
                    stat.color === 'success' && 'text-success',
                    stat.color === 'accent' && 'text-accent',
                    stat.color === 'chart-2' && 'text-chart-2',
                  )} />
                </div>
                {stat.change && (
                  <Badge variant="secondary" className="text-xs bg-success/10 text-success border-0">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stat.change}
                  </Badge>
                )}
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </motion.div>
          </StaggerItem>
        ))}
      </StaggerWrapper>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming bookings */}
        <motion.div 
          className="lg:col-span-2 bg-card rounded-xl border p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">Upcoming Bookings</h2>
            <Link href="/dashboard/bookings">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {upcomingBookings.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">
                    {booking.serviceName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(booking.date), 'MMM d, yyyy')} at {formatTime12h(booking.time)}
                  </p>
                </div>
                <div className="shrink-0 text-right flex flex-col items-end gap-1.5">
                  <p className="font-medium text-foreground">${booking.price}</p>
                  {booking.paymentStatus === 'paid' ? (
                    <Badge variant="secondary" className="bg-success/10 text-success border-0">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Paid
                    </Badge>
                  ) : (
                    <Link href={`/payment?bookingId=${booking.id}`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        Pay Now
                      </Button>
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}

            {upcomingBookings.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No upcoming bookings</p>
                <Link href="/booking">
                  <Button variant="outline" className="mt-4">
                    Book your first appointment
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent activity */}
        <motion.div 
          className="bg-card rounded-xl border p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-6">Recent Activity</h2>

          <div className="space-y-4">
            {recentBookings.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className={cn(
                  'p-1.5 rounded-full shrink-0 mt-0.5',
                  booking.status === 'completed' ? 'bg-success/10' : 'bg-destructive/10'
                )}>
                  {booking.status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">
                    {booking.serviceName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(booking.date), 'MMM d')} - Completed
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="mt-6 pt-6 border-t space-y-2">
            <h3 className="text-sm font-medium text-foreground mb-3">Quick Actions</h3>
            <Link href="/booking">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Book appointment
              </Button>
            </Link>
            <Link href="/services">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <ArrowRight className="mr-2 h-4 w-4" />
                Browse services
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
