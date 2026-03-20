'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, TrendingDown, DollarSign, Calendar,
  Users, BarChart3, ArrowUpRight, ArrowDownRight,
  Download, RefreshCw, Loader2, Sparkles, CheckCircle2, XCircle, CreditCard
} from 'lucide-react'
import {
  AreaChart, Area, BarChart as ReBarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StaggerWrapper, StaggerItem } from '@/components/ui/motion'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api/client'

// ── Types ────────────────────────────────────────────────────────────────────

type Range = 'week' | 'month' | 'year'

interface OverviewData {
  bookings: { total: number; active: number; completed: number; pending: number; cancelled: number; no_show: number }
  revenue: { total: number; avg_booking_value: number; total_refunded: number }
  payments: { paid: number; unpaid: number; refunded: number }
  users: { total: number; new_in_period: number; active_in_period: number }
  comparison: {
    metrics: {
      total_bookings: { current: number; previous: number; change_pct: number }
      total_revenue: { current: number; previous: number; change_pct: number }
      avg_booking_value: { current: number; previous: number; change_pct: number }
      cancellation_rate: { current: number; previous: number; change_pct: number }
    }
  }
}

interface TimeSeriesRow { date?: string; month?: string; bookings: string | number; revenue: string | number }
interface ServiceRow { service_name: string; total_bookings: string | number; total_revenue: string | number; cancellation_rate_pct: string | number }
interface RevenueByService { service_name: string; revenue: string | number; revenue_pct: string | number }

// ── Helpers ──────────────────────────────────────────────────────────────────

function getDateRange(range: Range) {
  const to = new Date()
  const from = new Date()
  if (range === 'week') from.setDate(to.getDate() - 7)
  else if (range === 'month') from.setDate(to.getDate() - 30)
  else from.setFullYear(to.getFullYear() - 1)
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }
}

function fmtCurrency(v: number) {
  return v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`
}

// ── Donut chart ──────────────────────────────────────────────────────────────

const DONUT_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899']

function DonutChart({ data, total }: { data: { name: string; share: number }[]; total: number }) {
  const sumShares = data.reduce((s, d) => s + d.share, 0) || 1
  let offset = 0
  const r = 60, cx = 70, cy = 70, stroke = 22
  const circ = 2 * Math.PI * r

  return (
    <svg viewBox="0 0 140 140" className="w-full max-w-[160px]">
      {data.map((d, i) => {
        const pct = d.share / sumShares
        const dashArr = circ * pct
        offset += pct
        return (
          <motion.circle
            key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={DONUT_COLORS[i % DONUT_COLORS.length]} strokeWidth={stroke}
            strokeDasharray={`${dashArr} ${circ}`}
            strokeDashoffset={-circ * (offset - pct)}
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circ}` }}
            animate={{ strokeDasharray: `${dashArr} ${circ}` }}
            transition={{ duration: 1, delay: i * 0.15, ease: 'easeOut' }}
            style={{ transformOrigin: `${cx}px ${cy}px`, transform: 'rotate(-90deg)' }}
          />
        )
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" className="fill-stone-900 dark:fill-stone-100 font-bold" style={{ fontSize: 16 }}>
        {total.toLocaleString()}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" className="fill-stone-400 dark:fill-stone-500" style={{ fontSize: 9 }}>
        bookings
      </text>
    </svg>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<Range>('month')
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [timeSeries, setTimeSeries] = useState<TimeSeriesRow[]>([])
  const [byService, setByService] = useState<RevenueByService[]>([])
  const [services, setServices] = useState<ServiceRow[]>([])

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true)
    else setLoading(true)
    try {
      const { from, to } = getDateRange(range)
      const granularity = range === 'year' ? 'month' : 'day'
      const qs = `from=${from}&to=${to}`
      const [oRes, rRes, sRes] = await Promise.all([
        apiClient.get(`/api/admin/analytics/overview?${qs}`),
        apiClient.get(`/api/admin/analytics/revenue?${qs}&granularity=${granularity}`),
        apiClient.get(`/api/admin/analytics/services?${qs}`),
      ])
      setOverview(oRes.data.data)
      setTimeSeries(rRes.data.data?.time_series ?? [])
      setByService(rRes.data.data?.by_service ?? [])
      setServices(sRes.data.data?.services ?? [])
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [range])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Derived data ─────────────────────────────────────────────────────────

  const comp = overview?.comparison?.metrics

  const kpis = overview ? [
    {
      label: 'Total Revenue',
      value: `$${overview.revenue.total.toLocaleString()}`,
      change: comp ? `${comp.total_revenue.change_pct >= 0 ? '+' : ''}${comp.total_revenue.change_pct}%` : '',
      trend: (comp?.total_revenue.change_pct ?? 0) >= 0 ? 'up' as const : 'down' as const,
      icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-600',
      bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
      textColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Total Bookings',
      value: overview.bookings.total.toLocaleString(),
      change: comp ? `${comp.total_bookings.change_pct >= 0 ? '+' : ''}${comp.total_bookings.change_pct}%` : '',
      trend: (comp?.total_bookings.change_pct ?? 0) >= 0 ? 'up' as const : 'down' as const,
      icon: Calendar,
      gradient: 'from-violet-500 to-indigo-600',
      bgLight: 'bg-violet-50 dark:bg-violet-950/30',
      textColor: 'text-violet-600 dark:text-violet-400',
    },
    {
      label: 'Active Users',
      value: overview.users.active_in_period.toLocaleString(),
      change: `${overview.users.new_in_period} new`,
      trend: 'up' as const,
      icon: Users,
      gradient: 'from-cyan-500 to-blue-600',
      bgLight: 'bg-cyan-50 dark:bg-cyan-950/30',
      textColor: 'text-cyan-600 dark:text-cyan-400',
    },
    {
      label: 'Cancellation Rate',
      value: overview.bookings.total > 0
        ? `${((overview.bookings.cancelled / overview.bookings.total) * 100).toFixed(1)}%`
        : '0%',
      change: comp ? `${comp.cancellation_rate.change_pct <= 0 ? '' : '+'}${comp.cancellation_rate.change_pct}%` : '',
      trend: (comp?.cancellation_rate.change_pct ?? 0) <= 0 ? 'up' as const : 'down' as const,
      icon: BarChart3,
      gradient: 'from-amber-500 to-orange-600',
      bgLight: 'bg-amber-50 dark:bg-amber-950/30',
      textColor: 'text-amber-600 dark:text-amber-400',
    },
  ] : []

  // Chart data
  const chartData = timeSeries.map(r => {
    let label = ''
    if (r.month) {
      const [y, m] = r.month.split('-')
      label = new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', { month: 'short' })
    } else if (r.date) {
      const d = new Date(r.date + 'T00:00:00')
      label = range === 'week'
        ? d.toLocaleDateString('en-US', { weekday: 'short' })
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    return { label, revenue: Number(r.revenue), bookings: Number(r.bookings) }
  })

  const totalRevenue = chartData.reduce((s, r) => s + r.revenue, 0)
  const totalBookings = chartData.reduce((s, r) => s + r.bookings, 0)
  const bestEntry = chartData.reduce((best, c) => c.revenue > best.revenue ? c : best, { label: '-', revenue: 0, bookings: 0 })

  // Donut
  const donutData = byService.slice(0, 5).map(s => ({
    name: s.service_name,
    share: Number(s.revenue_pct),
  }))

  // Top services
  const topServices = services.slice(0, 5)

  // Summary stats
  const completionRate = overview && overview.bookings.total > 0
    ? ((overview.bookings.completed / overview.bookings.total) * 100).toFixed(1) : '0'
  const cancellationRate = overview && overview.bookings.total > 0
    ? ((overview.bookings.cancelled / overview.bookings.total) * 100).toFixed(1) : '0'

  const rangePeriodLabel = { week: 'this week', month: 'this month', year: 'this year' }

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        <p className="text-sm text-stone-400 dark:text-stone-500">Loading analytics...</p>
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 dark:from-violet-500/30 dark:to-indigo-500/30">
              <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">Analytics</h1>
          </div>
          <p className="text-stone-500 dark:text-stone-400 mt-1.5 ml-[52px]">
            Platform performance and revenue insights
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex items-center gap-2.5 print:hidden"
        >
          {/* Range tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-stone-800">
            {(['week', 'month', 'year'] as const).map((r) => (
              <Button
                key={r}
                variant="ghost"
                size="sm"
                onClick={() => setRange(r)}
                className={cn(
                  'rounded-lg text-xs h-8 px-4 transition-all capitalize',
                  range === r
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                )}
              >
                {r}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="rounded-xl border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 gap-2"
          >
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </motion.div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <StaggerWrapper className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <StaggerItem key={kpi.label}>
            <motion.div
              className="card-glow group relative p-6 rounded-2xl border bg-white dark:bg-stone-900/80 border-stone-200/80 dark:border-white/10 hover:border-primary/30 dark:hover:border-primary/40 transition-all duration-300 overflow-hidden"
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <div className={cn('absolute top-0 left-0 right-0 h-1 bg-gradient-to-r', kpi.gradient)} />
              <div className="flex items-center justify-between mb-4">
                <div className={cn('p-2.5 rounded-xl', kpi.bgLight)}>
                  <kpi.icon className={cn('h-5 w-5', kpi.textColor)} />
                </div>
                {kpi.change && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-xs border-0 font-medium',
                      kpi.trend === 'up'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                        : 'bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400'
                    )}
                  >
                    {kpi.trend === 'up' ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                    {kpi.change}
                  </Badge>
                )}
              </div>
              <p className="text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">{kpi.value}</p>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{kpi.label}</p>
            </motion.div>
          </StaggerItem>
        ))}
      </StaggerWrapper>

      {/* ── Revenue Chart + Donut ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <motion.div
          className="lg:col-span-2 card-glow rounded-2xl border bg-white dark:bg-stone-900/80 border-stone-200/80 dark:border-white/10 p-6 overflow-hidden"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Revenue Overview</h2>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {range === 'week' ? 'Daily revenue this week' : range === 'month' ? 'Daily revenue this month' : 'Monthly revenue this year'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">${totalRevenue.toLocaleString()}</p>
              {comp && (
                <Badge variant="secondary" className={cn('border-0 text-xs font-medium', comp.total_revenue.change_pct >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400')}>
                  {comp.total_revenue.change_pct >= 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5 inline" /> : <ArrowDownRight className="h-3 w-3 mr-0.5 inline" />}
                  {comp.total_revenue.change_pct >= 0 ? '+' : ''}{comp.total_revenue.change_pct}% vs previous
                </Badge>
              )}
            </div>
          </div>

          {chartData.length > 0 ? (
            <div className="h-[260px] -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#a8a29e', fontSize: 11 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a8a29e', fontSize: 11 }} tickFormatter={(v) => fmtCurrency(v)} width={55} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1c1917', border: 'none', borderRadius: '12px', padding: '10px 14px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
                    labelStyle={{ color: '#a8a29e', fontSize: 11, marginBottom: 4 }}
                    itemStyle={{ color: '#fff', fontSize: 13, fontWeight: 700 }}
                    formatter={(value: number, name: string) => [name === 'revenue' ? `$${value.toLocaleString()}` : value, name === 'revenue' ? 'Revenue' : 'Bookings']}
                    cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revenueGrad)" activeDot={{ r: 5, stroke: '#6366f1', strokeWidth: 2, fill: '#fff' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-stone-400 dark:text-stone-500 text-sm">No revenue data for this period</div>
          )}

          {/* Footer */}
          <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t border-stone-200/80 dark:border-white/10">
            <div>
              <p className="text-xs text-stone-400 dark:text-stone-500">Total Revenue</p>
              <p className="text-lg font-bold text-stone-900 dark:text-stone-100">${totalRevenue.toLocaleString()}</p>
            </div>
            <div className="w-px h-8 bg-stone-200 dark:bg-stone-700" />
            <div>
              <p className="text-xs text-stone-400 dark:text-stone-500">Best Period</p>
              <p className="text-lg font-bold text-stone-900 dark:text-stone-100">{bestEntry.label} · ${bestEntry.revenue.toLocaleString()}</p>
            </div>
            <div className="ml-auto">
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 border-0 font-medium">
                <TrendingUp className="h-3.5 w-3.5 mr-1" />
                {totalBookings} bookings {rangePeriodLabel[range]}
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Donut */}
        <motion.div
          className="card-glow rounded-2xl border bg-white dark:bg-stone-900/80 border-stone-200/80 dark:border-white/10 p-6 h-full overflow-hidden"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-1">Revenue by Service</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">Share of total revenue</p>
          {donutData.length > 0 ? (
            <>
              <div className="flex justify-center mb-6">
                <DonutChart data={donutData} total={overview?.bookings.total ?? 0} />
              </div>
              <div className="space-y-3">
                {donutData.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    <span className="text-sm text-stone-600 dark:text-stone-300 truncate flex-1">{s.name}</span>
                    <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">{s.share}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-stone-400 dark:text-stone-500 text-sm">No data</div>
          )}
        </motion.div>
      </div>

      {/* ── Booking Volume + Top Services ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Volume Bar Chart */}
        <motion.div
          className="card-glow rounded-2xl border bg-white dark:bg-stone-900/80 border-stone-200/80 dark:border-white/10 p-6 overflow-hidden"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Booking Volume</h2>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {range === 'week' ? 'Daily bookings this week' : range === 'month' ? 'Daily bookings this month' : 'Monthly bookings this year'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">{totalBookings}</p>
              <p className="text-xs text-stone-400 dark:text-stone-500">{rangePeriodLabel[range]}</p>
            </div>
          </div>

          {chartData.length > 0 ? (
            <div className="h-[220px] -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={chartData} barCategoryGap="20%">
                  <defs>
                    <linearGradient id="bookingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#a8a29e', fontSize: 11 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a8a29e', fontSize: 11 }} width={35} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1c1917', border: 'none', borderRadius: '12px', padding: '10px 14px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
                    labelStyle={{ color: '#a8a29e', fontSize: 11, marginBottom: 4 }}
                    itemStyle={{ color: '#fff', fontSize: 13, fontWeight: 700 }}
                    formatter={(value: number) => [value, 'Bookings']}
                    cursor={{ fill: 'rgba(99,102,241,0.05)' }}
                  />
                  <Bar dataKey="bookings" fill="url(#bookingGrad)" radius={[6, 6, 0, 0]} animationDuration={800} />
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-stone-400 dark:text-stone-500 text-sm">No booking data for this period</div>
          )}
        </motion.div>

        {/* Top Services */}
        <motion.div
          className="card-glow rounded-2xl border bg-white dark:bg-stone-900/80 border-stone-200/80 dark:border-white/10 overflow-hidden"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        >
          <div className="p-6 border-b border-stone-200/80 dark:border-white/10">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Top Services</h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">Ranked by booking count</p>
          </div>
          {topServices.length > 0 ? (
            <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
              {topServices.map((s, i) => {
                const bookings = Number(s.total_bookings)
                const revenue = Number(s.total_revenue)
                const maxBookings = Number(topServices[0]?.total_bookings) || 1
                const barPct = (bookings / maxBookings) * 100
                const gradients = [
                  'from-violet-500 to-indigo-600',
                  'from-cyan-500 to-blue-600',
                  'from-emerald-500 to-teal-600',
                  'from-amber-500 to-orange-600',
                  'from-rose-500 to-pink-600',
                ]
                return (
                  <motion.div
                    key={s.service_name}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50/80 dark:hover:bg-stone-800/30 transition-colors"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.07 }}
                  >
                    <div className={cn('flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br text-white text-xs font-bold shrink-0', gradients[i % gradients.length])}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-900 dark:text-stone-100 text-sm truncate">{s.service_name}</p>
                      <p className="text-xs text-stone-400 dark:text-stone-500">{bookings} booking{bookings !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right shrink-0 w-28">
                      <p className="font-bold text-stone-900 dark:text-stone-100 text-sm">${revenue.toLocaleString()}</p>
                      <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full mt-1.5 overflow-hidden">
                        <motion.div
                          className={cn('h-full rounded-full bg-gradient-to-r', gradients[i % gradients.length])}
                          initial={{ width: 0 }}
                          animate={{ width: `${barPct}%` }}
                          transition={{ duration: 0.8, delay: 0.4 + i * 0.07, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-stone-400 dark:text-stone-500 text-sm p-6">No data</div>
          )}
        </motion.div>
      </div>

      {/* ── Summary Cards ──────────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
      >
        {[
          { label: 'Avg. Booking Value', value: overview ? `$${overview.revenue.avg_booking_value.toFixed(2)}` : '$0', icon: DollarSign, bg: 'bg-emerald-50 dark:bg-emerald-950/30', color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Completion Rate', value: `${completionRate}%`, icon: CheckCircle2, bg: 'bg-violet-50 dark:bg-violet-950/30', color: 'text-violet-600 dark:text-violet-400' },
          { label: 'Cancellation Rate', value: `${cancellationRate}%`, icon: XCircle, bg: 'bg-amber-50 dark:bg-amber-950/30', color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Paid Bookings', value: overview ? String(overview.payments.paid) : '0', icon: CreditCard, bg: 'bg-cyan-50 dark:bg-cyan-950/30', color: 'text-cyan-600 dark:text-cyan-400' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            className="card-glow p-5 rounded-2xl border bg-white dark:bg-stone-900/80 border-stone-200/80 dark:border-white/10"
            whileHover={{ y: -3 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={cn('p-1.5 rounded-lg', stat.bg)}>
                <stat.icon className={cn('h-3.5 w-3.5', stat.color)} />
              </div>
              <span className="text-xs text-stone-500 dark:text-stone-400">{stat.label}</span>
            </div>
            <p className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
