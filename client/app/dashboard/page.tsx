'use client'

import { useState, useEffect, useMemo } from 'react'
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
  Plus,
  ArrowUpRight,
  CreditCard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useBookingStore, type Booking } from '@/lib/store'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import type { Booking as APIBooking } from '@/lib/api/bookings'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

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

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
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

  const upcomingBookings = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').slice(0, 5)
  const recentBookings = [...bookings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

  const paidBookings = bookings.filter(b => b.paymentStatus === 'paid' && b.status !== 'cancelled')
  const totalSpent = paidBookings.reduce((sum, b) => sum + b.price, 0)

  const upcomingCount = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length
  const completedCount = bookings.filter(b => b.status === 'completed').length
  const totalCount = bookings.filter(b => b.status !== 'cancelled').length

  // Build chart data — group paid bookings by booking_date month
  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const now = new Date()
    const data = []
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const monthBookings = bookings.filter(b => b.date.startsWith(monthKey) && b.status !== 'cancelled')
      const revenue = monthBookings.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.price, 0)
      data.push({
        month: months[d.getMonth()],
        bookings: monthBookings.length,
        revenue: Math.round(revenue),
      })
    }
    return data
  }, [bookings])

  // Chart total should match Total Spent — if not, bookings are outside the 8-month chart window
  const chartRevenue = chartData.reduce((s, d) => s + d.revenue, 0)

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="text-stone-500">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  const firstName = currentUser?.name?.split(' ')[0] || 'there'

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-stone-500 mt-1 text-sm">
            Stay on top of your bookings, monitor progress, and track status.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link href="/booking">
            <Button className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl h-10 px-5 shadow-lg shadow-stone-900/15">
              <Plus className="mr-2 h-4 w-4" />
              New booking
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hero card — Total Balance style */}
        <motion.div
          className="sm:col-span-2 lg:col-span-1 bg-gradient-to-br from-lime-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="absolute top-3 right-3 w-20 h-20 rounded-full bg-white/10 blur-xl" />
          <div className="absolute -bottom-4 -right-4 w-28 h-28 rounded-full bg-white/5 blur-lg" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-white/80" />
              <span className="text-sm font-medium text-white/80">Total Spent</span>
            </div>
            <p className="text-3xl font-extrabold tracking-tight">${chartRevenue.toLocaleString()}</p>
            <div className="flex items-center gap-1.5 mt-2 text-lime-200 text-xs font-medium">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>From {paidBookings.length} paid booking{paidBookings.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </motion.div>

        {/* Secondary KPI cards */}
        {[
          { label: 'Upcoming', value: upcomingCount, icon: Calendar, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
          { label: 'Completed', value: completedCount, icon: CheckCircle2, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
          { label: 'Total Bookings', value: totalCount, icon: CalendarDays, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm hover:shadow-md transition-shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn('p-2.5 rounded-xl', card.iconBg)}>
                <card.icon className={cn('h-5 w-5', card.iconColor)} />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-stone-900">{card.value}</p>
            <p className="text-sm text-stone-500 mt-0.5">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Chart + Recent Activity ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Chart */}
        <motion.div
          className="lg:col-span-2 bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Booking Overview</h2>
              <p className="text-sm text-stone-500 mt-0.5">Revenue and bookings over time</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-lime-500" />
                <span className="text-stone-500">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                <span className="text-stone-500">Bookings</span>
              </div>
            </div>
          </div>

          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f1ef" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#a8a29e', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a8a29e', fontSize: 12 }} width={40} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '13px' }}
                  cursor={{ fill: '#fafaf9' }}
                />
                <Bar dataKey="revenue" fill="#84cc16" radius={[6, 6, 0, 0]} name="Revenue ($)" />
                <Bar dataKey="bookings" fill="#d6d3d1" radius={[6, 6, 0, 0]} name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Quick Actions + Activity */}
        <motion.div
          className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm flex flex-col"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-lg font-bold text-stone-900 mb-4">Quick Actions</h2>

          <div className="space-y-2 mb-6">
            <Link href="/booking" className="block">
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors group cursor-pointer">
                <div className="p-2 bg-lime-50 rounded-lg">
                  <Calendar className="h-4 w-4 text-lime-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-800">Book appointment</p>
                  <p className="text-xs text-stone-400">Schedule a new session</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-stone-300 group-hover:text-stone-500 transition-colors" />
              </div>
            </Link>
            <Link href="/services" className="block">
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors group cursor-pointer">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <CalendarDays className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-800">Browse services</p>
                  <p className="text-xs text-stone-400">Explore available options</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-stone-300 group-hover:text-stone-500 transition-colors" />
              </div>
            </Link>
            <Link href="/dashboard/bookings" className="block">
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors group cursor-pointer">
                <div className="p-2 bg-violet-50 rounded-lg">
                  <Clock className="h-4 w-4 text-violet-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-800">My bookings</p>
                  <p className="text-xs text-stone-400">View and manage all</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-stone-300 group-hover:text-stone-500 transition-colors" />
              </div>
            </Link>
          </div>

          {/* Recent activity */}
          <h3 className="text-sm font-semibold text-stone-900 mb-3 pt-4 border-t">Recent Activity</h3>
          <div className="space-y-3 flex-1">
            {recentBookings.slice(0, 3).map((booking) => {
              const statusConfig: Record<string, { bg: string; icon: typeof CheckCircle2; color: string; label: string }> = {
                pending:    { bg: 'bg-amber-50',   icon: Clock,        color: 'text-amber-500',   label: 'Pending Approval' },
                confirmed:  { bg: 'bg-emerald-50', icon: CheckCircle2, color: 'text-emerald-500', label: 'Confirmed' },
                completed:  { bg: 'bg-blue-50',    icon: CheckCircle2, color: 'text-blue-500',    label: 'Completed' },
                cancelled:  { bg: 'bg-red-50',     icon: XCircle,      color: 'text-red-500',     label: 'Cancelled' },
              }
              const cfg = statusConfig[booking.status] || statusConfig.pending
              const StatusIcon = cfg.icon
              const payLabel = booking.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'
              return (
                <div key={booking.id} className="flex items-center gap-3">
                  <div className={cn('p-1.5 rounded-full shrink-0', cfg.bg)}>
                    <StatusIcon className={cn('h-3.5 w-3.5', cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-800 truncate">{booking.serviceName}</p>
                    <p className="text-xs text-stone-400">{format(new Date(booking.date + 'T00:00:00'), 'MMM d')} · {cfg.label} · {payLabel}</p>
                  </div>
                </div>
              )
            })}
            {recentBookings.length === 0 && (
              <p className="text-xs text-stone-400">No recent activity</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Upcoming Bookings Table ───────────────────────────── */}
      <motion.div
        className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-lg font-bold text-stone-900">Upcoming Bookings</h2>
          <Link href="/dashboard/bookings">
            <Button variant="ghost" size="sm" className="text-stone-500 hover:text-stone-800">
              View all
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="px-6 pb-6 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-stone-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : upcomingBookings.length > 0 ? (
          <div className="px-6 pb-6">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-stone-400 uppercase tracking-wider">
              <div className="col-span-5">Service</div>
              <div className="col-span-3 hidden sm:block">Date & Time</div>
              <div className="col-span-2 hidden sm:block">Status</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>

            <div className="space-y-2">
              {upcomingBookings.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="grid grid-cols-12 gap-4 items-center px-4 py-3.5 rounded-xl hover:bg-stone-50 transition-colors group"
                >
                  {/* Service */}
                  <div className="col-span-5 flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-lime-50 rounded-lg shrink-0">
                      <CalendarDays className="h-4 w-4 text-lime-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-stone-800 text-sm truncate">{booking.serviceName}</p>
                      <p className="text-xs text-stone-400 sm:hidden">
                        {format(new Date(booking.date + 'T00:00:00'), 'MMM d')} at {formatTime12h(booking.time)}
                      </p>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="col-span-3 hidden sm:block">
                    <p className="text-sm text-stone-700">{format(new Date(booking.date + 'T00:00:00'), 'MMM d, yyyy')}</p>
                    <p className="text-xs text-stone-400">{formatTime12h(booking.time)}</p>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 hidden sm:block">
                    {booking.status === 'confirmed' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Confirmed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Pending Approval
                      </span>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="col-span-2 text-right">
                    <p className="font-semibold text-stone-900 text-sm">${booking.price}</p>
                    {booking.paymentStatus !== 'paid' && (
                      <Link href={`/payment?bookingId=${booking.id}`}>
                        <span className="text-xs text-lime-600 hover:text-lime-700 font-medium cursor-pointer">Pay now</span>
                      </Link>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 pb-14">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-6 w-6 text-stone-400" />
            </div>
            <p className="text-stone-500 mb-4">No upcoming bookings</p>
            <Link href="/booking">
              <Button className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl">
                Book your first appointment
              </Button>
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  )
}
