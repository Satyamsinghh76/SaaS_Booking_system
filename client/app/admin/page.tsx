'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import Link from 'next/link'
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Package,
  Clock,
  Download,
  BarChart3,
  Settings,
  Eye,
  Plus,
  Sparkles,
  Star,
  ThumbsUp,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { apiClient } from '@/lib/api/client'
import { useBookingStore } from '@/lib/store'
import { StaggerWrapper, StaggerItem } from '@/components/ui/motion'
import { cn } from '@/lib/utils'

function buildStats(bookings: AdminBooking[]) {
  const real = bookings
  const active = real.filter(b => b.status !== 'cancelled')
  const paid = active.filter(b => b.paymentStatus === 'paid')
  const totalRevenue = paid.reduce((s, b) => s + b.amount, 0)
  const totalBookings = real.length
  const cancelledCount = real.filter(b => b.status === 'cancelled').length
  const uniqueUsers = new Set(active.map(b => b.email)).size
  const avgDuration = active.length > 0 ? Math.round(active.reduce((s, b) => {
    // Estimate duration from service price (rough heuristic: $50=30min, $100=60min, etc.)
    const mins = b.amount <= 50 ? 30 : b.amount <= 100 ? 45 : b.amount <= 200 ? 60 : b.amount <= 300 ? 90 : 120
    return s + mins
  }, 0) / active.length) : 0

  return [
    {
      label: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      change: `${active.length} active`,
      trend: 'up' as const,
      icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-600',
      bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
      textColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Total Bookings',
      value: String(totalBookings),
      change: `${cancelledCount} cancelled`,
      trend: 'up' as const,
      icon: Calendar,
      gradient: 'from-violet-500 to-indigo-600',
      bgLight: 'bg-violet-50 dark:bg-violet-950/30',
      textColor: 'text-violet-600 dark:text-violet-400',
    },
    {
      label: 'Active Users',
      value: String(uniqueUsers),
      change: 'unique customers',
      trend: 'up' as const,
      icon: Users,
      gradient: 'from-cyan-500 to-blue-600',
      bgLight: 'bg-cyan-50 dark:bg-cyan-950/30',
      textColor: 'text-cyan-600 dark:text-cyan-400',
    },
    {
      label: 'Avg. Duration',
      value: `${avgDuration} min`,
      change: 'per session',
      trend: avgDuration >= 45 ? 'up' as const : 'down' as const,
      icon: Clock,
      gradient: 'from-amber-500 to-orange-600',
      bgLight: 'bg-amber-50 dark:bg-amber-950/30',
      textColor: 'text-amber-600 dark:text-amber-400',
    },
  ]
}

interface AdminBooking {
  id: string
  customer: string
  email: string
  service: string
  date: string
  time: string
  amount: number
  status: string
  paymentStatus?: string
  paidAt?: string
  createdAt?: string
  notes?: string
  phone?: string
}


function buildTopServices(bookings: AdminBooking[]) {
  const active = bookings.filter(b => b.status !== 'cancelled')
  const paid = active.filter(b => b.paymentStatus === 'paid')
  const totalPaidRevenue = paid.reduce((s, b) => s + b.amount, 0)
  const byService: Record<string, { bookings: number; revenue: number }> = {}
  active.forEach(b => {
    if (!byService[b.service]) byService[b.service] = { bookings: 0, revenue: 0 }
    byService[b.service].bookings++
    if (b.paymentStatus === 'paid') byService[b.service].revenue += b.amount
  })
  return Object.entries(byService)
    .map(([name, data]) => ({ name, ...data, growth: Math.round((data.revenue / (totalPaidRevenue || 1)) * 100) }))
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 4)
}

const quickActions = [
  { label: 'Add Service', icon: Plus, href: '/admin/services', gradient: 'from-emerald-500 to-teal-600' },
  { label: 'Manage Services', icon: Settings, href: '/admin/services', gradient: 'from-violet-500 to-indigo-600' },
  { label: 'View Bookings', icon: Eye, href: '/admin/bookings', gradient: 'from-cyan-500 to-blue-600' },
  { label: 'Analytics', icon: BarChart3, href: '/admin/analytics', gradient: 'from-amber-500 to-orange-600' },
]


const statusConfig: Record<string, { bg: string; text: string }> = {
  confirmed: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' },
  completed: { bg: 'bg-blue-500/10 dark:bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400' },
  pending: { bg: 'bg-amber-500/10 dark:bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400' },
  cancelled: { bg: 'bg-red-500/10 dark:bg-red-500/15', text: 'text-red-600 dark:text-red-400' },
  upcoming: { bg: 'bg-violet-500/10 dark:bg-violet-500/15', text: 'text-violet-600 dark:text-violet-400' },
}

function formatTime12h(t: string) {
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

type ChartPeriod = 'Week' | 'Month' | 'Year'


function getWeekRange(weekOffset: number) {
  const now = new Date()
  // Monday of the current week
  const dayOfWeek = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + weekOffset * 7)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { monday, sunday }
}

// Revenue date = when payment was collected (paid_at), fallback to created_at
function getRevenueDate(b: AdminBooking): string {
  if (b.paidAt) return b.paidAt.slice(0, 10)
  if (b.createdAt) return b.createdAt.slice(0, 10)
  return b.date
}

function buildChartData(bookings: AdminBooking[], period: ChartPeriod, weekOffset = 0) {
  const real = bookings
  const now = new Date()

  if (period === 'Week') {
    const { monday } = getWeekRange(weekOffset)
    const today = now.toISOString().slice(0, 10)
    const days: { label: string; revenue: number; bookings: number }[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const dateStr = d.toISOString().slice(0, 10)
      const dayLabel = dateStr === today
        ? `Today ${format(d, 'd')}`
        : format(d, 'EEE d')
      const dayBookings = real.filter(b => b.date === dateStr && b.status !== 'cancelled')
      const dayPaid = real.filter(b => b.paymentStatus === 'paid' && getRevenueDate(b) === dateStr)
      days.push({
        label: dayLabel,
        revenue: dayPaid.reduce((s, b) => s + b.amount, 0),
        bookings: dayBookings.length,
      })
    }
    return days
  }

  if (period === 'Month') {
    const months: { label: string; revenue: number; bookings: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const yr = d.getFullYear()
      const mo = d.getMonth()
      const label = format(d, 'MMM')
      const moBookings = real.filter(b => {
        const bd = new Date(b.date + 'T00:00:00')
        return bd.getFullYear() === yr && bd.getMonth() === mo && b.status !== 'cancelled'
      })
      const moPaid = real.filter(b => {
        if (b.paymentStatus !== 'paid') return false
        const rd = new Date(getRevenueDate(b) + 'T00:00:00')
        return rd.getFullYear() === yr && rd.getMonth() === mo
      })
      months.push({
        label,
        revenue: moPaid.reduce((s, b) => s + b.amount, 0),
        bookings: moBookings.length,
      })
    }
    return months
  }

  // Year — from 2020 to current year
  const startYear = 2020
  const endYear = now.getFullYear()
  const years: { label: string; revenue: number; bookings: number }[] = []
  for (let yr = startYear; yr <= endYear; yr++) {
    const yrBookings = real.filter(b => {
      const bd = new Date(b.date + 'T00:00:00')
      return bd.getFullYear() === yr && b.status !== 'cancelled'
    })
    const yrPaid = real.filter(b => {
      if (b.paymentStatus !== 'paid') return false
      const rd = new Date(getRevenueDate(b) + 'T00:00:00')
      return rd.getFullYear() === yr
    })
    years.push({
      label: String(yr),
      revenue: yrPaid.reduce((s, b) => s + b.amount, 0),
      bookings: yrBookings.length,
    })
  }
  return years
}

export default function AdminDashboardPage() {
  const [realBookings, setRealBookings] = useState<AdminBooking[]>([])
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('Month')

  const fetchBookings = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/api/bookings')
      const list = (data.data || data.bookings || []).map((b: Record<string, unknown>) => ({
        id: b.id as string,
        customer: (b.customer_name || b.user_name || 'Customer') as string,
        email: (b.customer_email || b.user_email || '') as string,
        service: (b.service_name || 'Service') as string,
        date: (b.booking_date || b.date || '') as string,
        time: b.start_time ? formatTime12h(b.start_time as string) : '',
        amount: Number(b.price_snapshot || b.price || 0),
        status: (b.status || 'pending') as string,
        paymentStatus: (b.payment_status || 'unpaid') as string,
        paidAt: (b.paid_at || '') as string,
        createdAt: (b.created_at || '') as string,
        notes: (b.notes || '') as string,
        phone: (b.user_phone || '') as string,
      }))
      setRealBookings(list)
    } catch {
      // API unavailable — bookings list stays empty
    }
  }, [])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  const bookings = [...realBookings]

  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const updateStatus = async (id: string, status: string) => {
    setActionLoading(id)
    setActionMessage(null)
    try {
      if (status === 'confirmed') {
        await apiClient.patch(`/api/admin/bookings/${id}/confirm`)
      } else if (status === 'cancelled') {
        await apiClient.patch(`/api/admin/bookings/${id}/cancel`)
      } else {
        await apiClient.patch(`/api/bookings/${id}/status`, { status })
      }
      setRealBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
      setActionMessage({ text: `Booking ${status}. User has been notified.`, type: 'success' })
      fetchBookings()
    } catch (err) {
      console.error('Failed to update status:', err)
      setActionMessage({ text: 'Failed to update booking status.', type: 'error' })
    } finally {
      setActionLoading(null)
      setTimeout(() => setActionMessage(null), 4000)
    }
  }

  const cancelBooking = async (id: string) => {
    setActionLoading(id)
    setActionMessage(null)
    try {
      await apiClient.patch(`/api/admin/bookings/${id}/cancel`)
      setRealBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b))
      setActionMessage({ text: 'Booking cancelled. User has been notified.', type: 'success' })
      fetchBookings()
    } catch (err) {
      console.error('Failed to cancel booking:', err)
      setActionMessage({ text: 'Failed to cancel booking.', type: 'error' })
    } finally {
      setActionLoading(null)
      setTimeout(() => setActionMessage(null), 4000)
    }
  }

  const deleteBooking = async (id: string) => {
    if (!confirm('Permanently delete this booking? This cannot be undone.')) return
    setActionLoading(id)
    setActionMessage(null)
    try {
      await apiClient.delete(`/api/admin/bookings/${id}`)
      setRealBookings(prev => prev.filter(b => b.id !== id))
      setActionMessage({ text: 'Booking deleted permanently.', type: 'success' })
    } catch (err) {
      console.error('Failed to delete booking:', err)
      setActionMessage({ text: 'Failed to delete booking.', type: 'error' })
    } finally {
      setActionLoading(null)
      setTimeout(() => setActionMessage(null), 4000)
    }
  }

  const recentBookings = bookings.slice(0, 10)

  return (
    <>
    {/* Booking Details Dialog */}
    <Dialog open={showDetails} onOpenChange={setShowDetails}>
      <DialogContent className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-stone-900 dark:text-stone-100">Booking Details</DialogTitle>
        </DialogHeader>
        {selectedBooking && (
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Customer', value: selectedBooking.customer },
                { label: 'Email', value: selectedBooking.email },
                { label: 'Service', value: selectedBooking.service },
                { label: 'Date', value: selectedBooking.date ? format(new Date(selectedBooking.date + 'T00:00:00'), 'MMM d, yyyy') : '-' },
                { label: 'Time', value: selectedBooking.time },
                { label: 'Amount', value: `$${selectedBooking.amount}` },
                { label: 'Status', value: selectedBooking.status },
                { label: 'Payment', value: selectedBooking.paymentStatus || 'unpaid' },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-0.5">{item.label}</p>
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-100 capitalize">{item.value || '-'}</p>
                </div>
              ))}
            </div>
            {selectedBooking.phone && (
              <div>
                <p className="text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-0.5">Phone</p>
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{selectedBooking.phone}</p>
              </div>
            )}
            {selectedBooking.notes && (
              <div>
                <p className="text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-0.5">Notes</p>
                <p className="text-sm text-stone-600 dark:text-stone-400">{selectedBooking.notes}</p>
              </div>
            )}
            {/* Action Buttons — only for non-terminal states */}
            {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
              <div className="flex gap-2 pt-3 border-t border-stone-200 dark:border-stone-700">
                {selectedBooking.status === 'pending' && (
                  <Button
                    size="sm"
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                    disabled={actionLoading === selectedBooking.id}
                    onClick={() => { updateStatus(selectedBooking.id, 'confirmed'); setSelectedBooking(prev => prev ? { ...prev, status: 'confirmed' } : null) }}
                  >
                    Confirm
                  </Button>
                )}
                {selectedBooking.status === 'confirmed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl flex-1"
                    disabled={actionLoading === selectedBooking.id}
                    onClick={() => { updateStatus(selectedBooking.id, 'completed'); setSelectedBooking(prev => prev ? { ...prev, status: 'completed' } : null) }}
                  >
                    Mark Completed
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex-1"
                  disabled={actionLoading === selectedBooking.id}
                  onClick={() => { cancelBooking(selectedBooking.id); setSelectedBooking(prev => prev ? { ...prev, status: 'cancelled' } : null) }}
                >
                  Cancel Booking
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>

    <div className="space-y-6">
      {/* ── Action Toast ────────────────────────────────────────── */}
      <AnimatePresence>
        {actionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              'fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2',
              actionMessage.type === 'success'
                ? 'bg-emerald-500 text-white'
                : 'bg-red-500 text-white'
            )}
          >
            {actionMessage.type === 'success' ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}
            {actionMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 dark:from-primary/30 dark:to-violet-500/30">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
              Admin Dashboard
            </h1>
          </motion.div>
          <motion.p
            className="text-stone-500 dark:text-stone-400 mt-1.5 ml-[52px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            Overview of your booking platform performance
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2.5"
        >
          <Button variant="outline" onClick={() => window.print()} className="rounded-xl border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Link href="/admin/services">
            <Button className="rounded-xl bg-stone-900 text-white dark:bg-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 gap-2 shadow-lg shadow-stone-900/10 dark:shadow-white/10">
              <Package className="h-4 w-4" />
              Add Service
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* ── Stats Grid ──────────────────────────────────────────── */}
      <StaggerWrapper className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {buildStats(bookings).map((stat) => (
          <StaggerItem key={stat.label}>
            <motion.div
              className="card-glow group relative p-6 rounded-2xl border bg-white dark:bg-stone-900/80 border-stone-200/80 dark:border-white/10 hover:border-primary/30 dark:hover:border-primary/40 transition-all duration-300 overflow-hidden"
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {/* Subtle gradient accent top */}
              <div className={cn('absolute top-0 left-0 right-0 h-1 bg-gradient-to-r', stat.gradient)} />

              <div className="flex items-center justify-between mb-4">
                <div className={cn('p-2.5 rounded-xl', stat.bgLight)}>
                  <stat.icon className={cn('h-5 w-5', stat.textColor)} />
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-xs border-0 font-medium',
                    stat.trend === 'up'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                      : 'bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400'
                  )}
                >
                  {stat.trend === 'up' ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                  {stat.change}
                </Badge>
              </div>
              <p className="text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                {stat.value}
              </p>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{stat.label}</p>
            </motion.div>
          </StaggerItem>
        ))}
      </StaggerWrapper>

      {/* ── Quick Actions ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {quickActions.map((action, i) => (
          <Link key={action.label} href={action.href}>
            <motion.div
              className="group flex items-center gap-3 p-4 rounded-2xl border bg-white dark:bg-stone-900/80 border-stone-200/80 dark:border-white/10 hover:border-primary/30 dark:hover:border-primary/40 transition-all duration-300 cursor-pointer"
              whileHover={{ y: -2 }}
            >
              <div className={cn('p-2 rounded-xl bg-gradient-to-br shadow-md', action.gradient)}>
                <action.icon className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300 group-hover:text-primary transition-colors">
                {action.label}
              </span>
            </motion.div>
          </Link>
        ))}
      </motion.div>

      {/* ── Main Content Grid ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings Table */}
        <motion.div
          className="lg:col-span-2 rounded-2xl border bg-white dark:bg-stone-900/80 border-stone-200/80 dark:border-white/10 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="p-6 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Recent Bookings</h2>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">Latest customer appointments</p>
            </div>
            <Link href="/admin/bookings">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 gap-1">
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-stone-50/50 dark:bg-stone-800/30 hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">Customer</TableHead>
                  <TableHead className="hidden sm:table-cell text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">Service</TableHead>
                  <TableHead className="hidden md:table-cell text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">Date</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">Amount</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBookings.map((booking) => {
                  const sc = statusConfig[booking.status] || statusConfig.pending
                  return (
                    <TableRow key={booking.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-violet-500/20 dark:from-primary/30 dark:to-violet-500/30 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {booking.customer.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium text-stone-900 dark:text-stone-100">{booking.customer}</p>
                            <p className="text-xs text-stone-400 hidden sm:block">{booking.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-stone-600 dark:text-stone-400 text-sm">
                        {booking.service}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div>
                          <p className="text-sm text-stone-700 dark:text-stone-300">{format(new Date(booking.date + 'T00:00:00'), 'MMM d, yyyy')}</p>
                          <p className="text-xs text-stone-400">{booking.time}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-stone-900 dark:text-stone-100">${booking.amount}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn('capitalize border-0 font-medium', sc.bg, sc.text)}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-lg z-50">
                            <DropdownMenuItem onClick={() => { setSelectedBooking(booking); setShowDetails(true) }}>
                              <Eye className="h-3.5 w-3.5 mr-2" />
                              View details
                            </DropdownMenuItem>
                            {booking.status === 'pending' && (
                              <DropdownMenuItem onClick={() => updateStatus(booking.id, 'confirmed')}>
                                <ArrowUpRight className="h-3.5 w-3.5 mr-2" />
                                Confirm booking
                              </DropdownMenuItem>
                            )}
                            {booking.status === 'confirmed' && (
                              <DropdownMenuItem onClick={() => updateStatus(booking.id, 'completed')}>
                                <ArrowUpRight className="h-3.5 w-3.5 mr-2" />
                                Mark completed
                              </DropdownMenuItem>
                            )}
                            {(booking.status === 'pending' || booking.status === 'confirmed') && (
                              <DropdownMenuItem className="text-red-600 dark:text-red-400" onClick={() => cancelBooking(booking.id)}>
                                <ArrowDownRight className="h-3.5 w-3.5 mr-2" />
                                Cancel booking
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-red-600 dark:text-red-400" onClick={() => deleteBooking(booking.id)}>
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              Delete booking
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </motion.div>

        {/* Top Services */}
        <motion.div
          className="rounded-2xl border bg-white dark:bg-stone-900/80 border-stone-200/80 dark:border-white/10 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Top Services</h2>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-xs">All time</Badge>
          </div>
          <div className="space-y-5">
            {buildTopServices(bookings).length === 0 && (
              <p className="text-sm text-stone-400 dark:text-stone-500 text-center py-6">No bookings yet</p>
            )}
            {buildTopServices(bookings).map((service, index) => {
              const topSvcs = buildTopServices(bookings)
              const maxBookings = Math.max(...topSvcs.map(s => s.bookings), 1)
              const barWidth = (service.bookings / maxBookings) * 100
              const rankColors = ['from-emerald-500 to-teal-600', 'from-violet-500 to-indigo-600', 'from-cyan-500 to-blue-600', 'from-amber-500 to-orange-600']
              return (
                <motion.div
                  key={service.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + index * 0.08 }}
                  className="group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn('flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br text-white text-xs font-bold shadow-sm', rankColors[index] || rankColors[0])}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-800 dark:text-stone-200 text-sm truncate group-hover:text-primary transition-colors">{service.name}</p>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 border-0 text-xs shrink-0">
                      +{service.growth}%
                    </Badge>
                  </div>
                  {/* Progress bar */}
                  <div className="ml-10">
                    <div className="h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                      <motion.div
                        className={cn('h-full rounded-full bg-gradient-to-r', rankColors[index] || rankColors[0])}
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 0.6, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-stone-400">{service.bookings} bookings</span>
                      <span className="text-xs font-medium text-stone-600 dark:text-stone-300">${service.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Quick stats */}
          {(() => {
            const real = bookings
            const completed = real.filter(b => b.status === 'completed' || b.status === 'confirmed').length
            const total = real.length || 1
            const rate = Math.round((completed / total) * 100)
            return (
              <div className="mt-6 pt-6 border-t border-stone-200/80 dark:border-white/10 grid grid-cols-2 gap-3">
                <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl text-center">
                  <p className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">{rate}%</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Completion Rate</p>
                </div>
                <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl text-center">
                  <p className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">{real.length}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Total Bookings</p>
                </div>
              </div>
            )
          })()}
        </motion.div>
      </div>

      {/* ── Revenue Overview (Real-time) ─────────────────────── */}
      <RevenueOverview bookings={bookings} chartPeriod={chartPeriod} setChartPeriod={setChartPeriod} />

      {/* ── Customer Reviews Overview ──────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rating Summary + Distribution */}
          <div className="lg:col-span-2 rounded-2xl border bg-white dark:bg-stone-900/80 border-stone-200/80 dark:border-white/10 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30">
                <Star className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Customer Reviews</h2>
                <p className="text-sm text-stone-500 dark:text-stone-400">Rating analytics and feedback</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Big Rating */}
              <div className="flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-100 dark:border-amber-900/30">
                <p className="text-6xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">4.9</p>
                <div className="flex items-center gap-0.5 my-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={cn('h-5 w-5', s <= 4 ? 'fill-amber-400 text-amber-400' : 'fill-amber-400/60 text-amber-400/60')} />
                  ))}
                </div>
                <p className="text-sm text-stone-500 dark:text-stone-400">Based on <strong className="text-stone-700 dark:text-stone-300">1,284</strong> reviews</p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10">
                    <ThumbsUp className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">89% Positive</span>
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4">Rating Distribution</p>
                {[
                  { stars: 5, count: 842, pct: 65.6 },
                  { stars: 4, count: 298, pct: 23.2 },
                  { stars: 3, count: 89, pct: 6.9 },
                  { stars: 2, count: 38, pct: 3.0 },
                  { stars: 1, count: 17, pct: 1.3 },
                ].map((r) => (
                  <div key={r.stars} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-stone-600 dark:text-stone-400 w-3">{r.stars}</span>
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                    <div className="flex-1 h-2.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${r.pct}%` }}
                        transition={{ delay: 0.6 + (5 - r.stars) * 0.08, duration: 0.6, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="text-xs text-stone-400 dark:text-stone-500 w-10 text-right">{r.count}</span>
                    <span className="text-xs font-medium text-stone-600 dark:text-stone-300 w-12 text-right">{r.pct}%</span>
                  </div>
                ))}
                {/* Satisfaction bar */}
                <div className="mt-5 pt-4 border-t border-stone-200/80 dark:border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Customer Satisfaction</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">89%</span>
                  </div>
                  <div className="h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                      initial={{ width: 0 }}
                      animate={{ width: '89%' }}
                      transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Reviews */}
          <div className="rounded-2xl border bg-white dark:bg-stone-900/80 border-stone-200/80 dark:border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Latest Reviews</h2>
              <MessageSquare className="h-4 w-4 text-stone-400" />
            </div>
            <div className="space-y-4">
              {[
                { name: 'Sarah Chen', rating: 5, text: 'Excellent consultation experience. Very professional and insightful.', time: '2 hours ago' },
                { name: 'Marcus Johnson', rating: 5, text: 'Design review was thorough. Got actionable feedback immediately.', time: '5 hours ago' },
                { name: 'Emily Rodriguez', rating: 4, text: 'Great technical deep dive. Would have liked more time for Q&A.', time: '1 day ago' },
                { name: 'David Kim', rating: 5, text: 'Brand workshop exceeded expectations. Highly recommend!', time: '2 days ago' },
              ].map((review, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.08 }}
                  className="p-4 rounded-xl bg-stone-50/80 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-700/50 hover:border-primary/20 dark:hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-violet-500/20 dark:from-primary/30 dark:to-violet-500/30 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {review.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">{review.name}</p>
                      <p className="text-[10px] text-stone-400">{review.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 mb-1.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={cn('h-3 w-3', s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200 dark:text-stone-700')} />
                    ))}
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-2">&ldquo;{review.text}&rdquo;</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
    </>
  )
}

/* ── Revenue Overview Component ─────────────────────────────────── */

function RevenueOverview({
  bookings,
  chartPeriod,
  setChartPeriod,
}: {
  bookings: AdminBooking[]
  chartPeriod: ChartPeriod
  setChartPeriod: (p: ChartPeriod) => void
}) {
  const [weekOffset, setWeekOffset] = useState(0)

  // Reset week offset when switching away from Week view
  useEffect(() => { if (chartPeriod !== 'Week') setWeekOffset(0) }, [chartPeriod])

  const chartData = buildChartData(bookings, chartPeriod, weekOffset)
  const totalChartRevenue = chartData.reduce((s, d) => s + d.revenue, 0)
  const totalChartBookings = chartData.reduce((s, d) => s + d.bookings, 0)

  // Week range label
  const weekRange = getWeekRange(weekOffset)
  const weekLabel = `${format(weekRange.monday, 'MMM d')} — ${format(weekRange.sunday, 'MMM d, yyyy')}`

  const periodLabels: Record<ChartPeriod, string> = {
    Week: weekOffset === 0 ? `This week · ${weekLabel}` : weekLabel,
    Month: 'Last 12 months',
    Year: '2020 — present',
  }

  const bestPeriodLabels: Record<ChartPeriod, string> = {
    Week: 'Best Day',
    Month: 'Best Month',
    Year: 'Best Year',
  }

  const formatVal = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`

  // Compute stats from the PERIOD data only (not all-time)
  const bestEntry = chartData.reduce((best, d) => d.revenue > best.revenue ? d : best, { label: '-', revenue: 0, bookings: 0 })
  const nonZeroEntries = chartData.filter(d => d.revenue > 0)
  const avgPerEntry = nonZeroEntries.length > 0 ? totalChartRevenue / nonZeroEntries.length : 0

  const avgLabel: Record<ChartPeriod, string> = {
    Week: 'per day',
    Month: 'per month',
    Year: 'per year',
  }

  const summaryCards = [
    { label: 'Total Revenue', value: formatVal(totalChartRevenue), icon: DollarSign, sub: `${totalChartBookings} bookings`, bg: 'bg-emerald-50 dark:bg-emerald-950/30', color: 'text-emerald-600 dark:text-emerald-400' },
    { label: bestPeriodLabels[chartPeriod], value: formatVal(bestEntry.revenue), icon: TrendingUp, sub: bestEntry.label, bg: 'bg-violet-50 dark:bg-violet-950/30', color: 'text-violet-600 dark:text-violet-400' },
    { label: 'Average', value: formatVal(avgPerEntry), icon: BarChart3, sub: avgLabel[chartPeriod], bg: 'bg-cyan-50 dark:bg-cyan-950/30', color: 'text-cyan-600 dark:text-cyan-400' },
    { label: 'Bookings', value: String(totalChartBookings), icon: ArrowUpRight, sub: periodLabels[chartPeriod], bg: 'bg-amber-50 dark:bg-amber-950/30', color: 'text-amber-600 dark:text-amber-400' },
  ]

  return (
    <motion.div
      className="rounded-2xl border bg-white dark:bg-stone-900/80 border-stone-200/80 dark:border-white/10 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      {/* Header + Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
            <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Revenue Overview</h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">{periodLabels[chartPeriod]}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Week navigation arrows — only visible in Week mode */}
          {chartPeriod === 'Week' && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWeekOffset(prev => prev - 1)}
                className="rounded-lg h-8 w-8 p-0 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWeekOffset(0)}
                disabled={weekOffset === 0}
                className="rounded-lg h-8 px-3 text-xs text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 disabled:opacity-40"
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWeekOffset(prev => prev + 1)}
                className="rounded-lg h-8 w-8 p-0 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-100 dark:bg-stone-800">
            {(['Week', 'Month', 'Year'] as ChartPeriod[]).map((label) => (
              <Button
                key={label}
                variant="ghost"
                size="sm"
                onClick={() => setChartPeriod(label)}
                className={cn(
                  'rounded-lg text-xs h-8 px-4 transition-all',
                  chartPeriod === label
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                )}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {summaryCards.map((m) => (
          <div key={m.label} className="p-3.5 rounded-xl bg-stone-50/80 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-700/50">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('p-1.5 rounded-lg', m.bg)}>
                <m.icon className={cn('h-3.5 w-3.5', m.color)} />
              </div>
              <span className="text-xs text-stone-500 dark:text-stone-400">{m.label}</span>
            </div>
            <p className="text-xl font-extrabold text-stone-900 dark:text-stone-100">{m.value}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Recharts Area Chart */}
      <div className="h-[280px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#a8a29e', fontSize: 12 }} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a8a29e', fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`} width={55} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1c1917', border: 'none', borderRadius: '12px', padding: '10px 14px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
              labelStyle={{ color: '#a8a29e', fontSize: 11, marginBottom: 4 }}
              itemStyle={{ color: '#fff', fontSize: 13, fontWeight: 700 }}
              formatter={(value: number, name: string) => {
                if (name === 'revenue') return [value >= 1000 ? `$${(value / 1000).toFixed(1)}k` : `$${value}`, 'Revenue']
                return [value, 'Bookings']
              }}
              cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revenueGradient)" dot={chartPeriod === 'Year'} activeDot={{ r: 5, stroke: '#6366f1', strokeWidth: 2, fill: '#fff' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center gap-6 mt-4 pt-5 border-t border-stone-200/80 dark:border-white/10">
        <div>
          <p className="text-xs text-stone-400 dark:text-stone-500">Total Revenue</p>
          <p className="text-lg font-bold text-stone-900 dark:text-stone-100">${totalChartRevenue.toLocaleString()}</p>
        </div>
        <div className="w-px h-8 bg-stone-200 dark:bg-stone-700" />
        <div>
          <p className="text-xs text-stone-400 dark:text-stone-500">{bestPeriodLabels[chartPeriod]}</p>
          <p className="text-lg font-bold text-stone-900 dark:text-stone-100">{bestEntry.label} · {formatVal(bestEntry.revenue)}</p>
        </div>
        <div className="ml-auto">
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 border-0 font-medium">
            <TrendingUp className="h-3.5 w-3.5 mr-1" />
            {totalChartBookings} bookings
          </Badge>
        </div>
      </div>
    </motion.div>
  )
}
