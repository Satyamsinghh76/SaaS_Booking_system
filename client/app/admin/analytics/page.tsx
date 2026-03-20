'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, DollarSign, Calendar,
  Users, BarChart3, ArrowUpRight, ArrowDownRight,
  Download, RefreshCw, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FadeIn, SlideIn, StaggerContainer, StaggerItem, MotionCard } from '@/components/ui/motion'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api/client'

// ── Types ────────────────────────────────────────────────────────────────────

type Range = 'week' | 'month' | 'year'

interface OverviewData {
  period: { from: string; to: string }
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

// ── Date range helper ────────────────────────────────────────────────────────

function getDateRange(range: Range) {
  const to = new Date()
  const from = new Date()
  if (range === 'week') from.setDate(to.getDate() - 7)
  else if (range === 'month') from.setDate(to.getDate() - 30)
  else from.setFullYear(to.getFullYear() - 1)
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }
}

// ── Bar chart component ──────────────────────────────────────────────────────

function BarChart({
  data, labels, color = 'primary', height = 180, formatTooltip,
}: {
  data: number[]; labels: string[]; color?: string; height?: number
  formatTooltip?: (val: number) => string
}) {
  const max = Math.max(...data, 1)
  const fmt = formatTooltip ?? ((v: number) => v > 1000 ? `$${(v / 1000).toFixed(1)}k` : String(v))
  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end gap-1 h-full pb-6 relative">
        {data.map((val, i) => {
          const pct = (val / max) * 100
          return (
            <div key={i} className="flex-1 flex flex-col items-center group relative">
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover border text-popover-foreground text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-10 pointer-events-none">
                {fmt(val)}
              </div>
              <motion.div
                className={cn(
                  'w-full rounded-t-md transition-colors duration-150',
                  color === 'primary' ? 'bg-primary/70 group-hover:bg-primary' : 'bg-chart-2/70 group-hover:bg-chart-2',
                )}
                initial={{ height: 0 }}
                animate={{ height: `${pct}%` }}
                transition={{ duration: 0.6, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
              />
            </div>
          )
        })}
        <div className="absolute bottom-0 left-0 right-0 flex gap-1">
          {labels.map((l, i) => (
            <div key={i} className="flex-1 text-center text-[10px] text-muted-foreground truncate">{l}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Donut chart component ────────────────────────────────────────────────────

function DonutChart({ data, total }: { data: { name: string; share: number }[]; total: number }) {
  const colors = ['oklch(0.55 0.25 275)', 'oklch(0.6 0.2 260)', 'oklch(0.75 0.15 160)', 'oklch(0.7 0.18 280)', 'oklch(0.65 0.2 230)']
  const sumShares = data.reduce((s, d) => s + d.share, 0) || 1
  let offset = 0
  const r = 60, cx = 70, cy = 70, stroke = 22
  const circ = 2 * Math.PI * r

  return (
    <svg viewBox="0 0 140 140" className="w-full max-w-[140px]">
      {data.map((d, i) => {
        const pct = d.share / sumShares
        const dashArr = circ * pct
        offset += pct
        return (
          <motion.circle
            key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={colors[i % colors.length]} strokeWidth={stroke}
            strokeDasharray={`${dashArr} ${circ}`}
            strokeDashoffset={-circ * (offset - pct)}
            initial={{ strokeDasharray: `0 ${circ}` }}
            animate={{ strokeDasharray: `${dashArr} ${circ}` }}
            transition={{ duration: 0.8, delay: i * 0.15, ease: 'easeOut' }}
            style={{ transformOrigin: `${cx}px ${cy}px`, transform: 'rotate(-90deg)' }}
          />
        )
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" className="fill-foreground text-sm font-bold" style={{ fontSize: 14 }}>
        {total.toLocaleString()}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 9 }}>
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
  const printRef = useRef<HTMLDivElement>(null)

  // Data state
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

      const [overviewRes, revenueRes, servicesRes] = await Promise.all([
        apiClient.get(`/api/admin/analytics/overview?${qs}`),
        apiClient.get(`/api/admin/analytics/revenue?${qs}&granularity=${granularity}`),
        apiClient.get(`/api/admin/analytics/services?${qs}`),
      ])

      setOverview(overviewRes.data.data)
      setTimeSeries(revenueRes.data.data?.time_series ?? [])
      setByService(revenueRes.data.data?.by_service ?? [])
      setServices(servicesRes.data.data?.services ?? [])
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [range])

  useEffect(() => { fetchData() }, [fetchData])

  const handleExport = () => {
    window.print()
  }

  // ── Derived data ───────────────────────────────────────────────────────────

  const comp = overview?.comparison?.metrics
  const kpis = overview ? [
    {
      label: 'Total Revenue',
      value: `$${overview.revenue.total.toLocaleString()}`,
      change: comp ? `${comp.total_revenue.change_pct >= 0 ? '+' : ''}${comp.total_revenue.change_pct}%` : '',
      trend: (comp?.total_revenue.change_pct ?? 0) >= 0 ? 'up' as const : 'down' as const,
      icon: DollarSign, color: 'primary', sub: 'vs previous period',
    },
    {
      label: 'Total Bookings',
      value: overview.bookings.total.toLocaleString(),
      change: comp ? `${comp.total_bookings.change_pct >= 0 ? '+' : ''}${comp.total_bookings.change_pct}%` : '',
      trend: (comp?.total_bookings.change_pct ?? 0) >= 0 ? 'up' as const : 'down' as const,
      icon: Calendar, color: 'chart-2', sub: 'vs previous period',
    },
    {
      label: 'Unique Customers',
      value: overview.users.active_in_period.toLocaleString(),
      change: `${overview.users.new_in_period} new`,
      trend: 'up' as const,
      icon: Users, color: 'success', sub: 'active in period',
    },
    {
      label: 'Cancellation Rate',
      value: overview.bookings.total > 0
        ? `${((overview.bookings.cancelled / overview.bookings.total) * 100).toFixed(1)}%`
        : '0%',
      change: comp ? `${comp.cancellation_rate.change_pct >= 0 ? '+' : ''}${comp.cancellation_rate.change_pct}%` : '',
      trend: (comp?.cancellation_rate.change_pct ?? 0) <= 0 ? 'up' as const : 'down' as const,
      icon: BarChart3, color: 'destructive', sub: 'vs previous period',
    },
  ] : []

  // Chart data
  const chartLabels = timeSeries.map(r => {
    if (r.month) return r.month.slice(5) // "03" from "2026-03"
    if (r.date) {
      const d = new Date(r.date + 'T00:00:00')
      return d.toLocaleDateString('en-US', range === 'week' ? { weekday: 'short' } : { month: 'short', day: 'numeric' })
    }
    return ''
  })
  const revenueData = timeSeries.map(r => Number(r.revenue))
  const bookingData = timeSeries.map(r => Number(r.bookings))

  const totalRevenue = revenueData.reduce((s, v) => s + v, 0)
  const totalBookingsChart = bookingData.reduce((s, v) => s + v, 0)

  // Donut + service table
  const topServices = services.slice(0, 5).map(s => ({
    name: s.service_name,
    bookings: Number(s.total_bookings),
    revenue: Number(s.total_revenue),
    share: Number(s.total_bookings),
  }))
  const donutData = byService.slice(0, 5).map(s => ({
    name: s.service_name,
    share: Number(s.revenue_pct),
  }))

  // Summary stats
  const completionRate = overview && overview.bookings.total > 0
    ? ((overview.bookings.completed / overview.bookings.total) * 100).toFixed(1)
    : '0'
  const cancellationRate = overview && overview.bookings.total > 0
    ? ((overview.bookings.cancelled / overview.bookings.total) * 100).toFixed(1)
    : '0'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8 print:space-y-4" ref={printRef}>
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Analytics</h1>
            <p className="mt-1 text-muted-foreground">Platform performance and revenue insights.</p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <div className="flex rounded-lg border overflow-hidden">
              {(['week', 'month', 'year'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium capitalize transition-colors',
                    range === r
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {r === 'week' ? 'Week' : r === 'month' ? 'Month' : 'Year'}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchData(true)} disabled={isRefreshing}>
              <RefreshCw className={cn('h-4 w-4 mr-1.5', isRefreshing && 'animate-spin')} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1.5" />
              Export
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* KPI Cards */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <StaggerItem key={kpi.label}>
            <MotionCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  'p-2.5 rounded-xl',
                  kpi.color === 'primary' && 'bg-primary/10',
                  kpi.color === 'chart-2' && 'bg-chart-2/10',
                  kpi.color === 'success' && 'bg-success/10',
                  kpi.color === 'destructive' && 'bg-destructive/10',
                )}>
                  <kpi.icon className={cn(
                    'h-5 w-5',
                    kpi.color === 'primary' && 'text-primary',
                    kpi.color === 'chart-2' && 'text-chart-2',
                    kpi.color === 'success' && 'text-success',
                    kpi.color === 'destructive' && 'text-destructive',
                  )} />
                </div>
                {kpi.change && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-xs border-0 font-medium',
                      kpi.trend === 'up' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                    )}
                  >
                    {kpi.trend === 'up'
                      ? <ArrowUpRight className="h-3 w-3 mr-0.5 inline" />
                      : <ArrowDownRight className="h-3 w-3 mr-0.5 inline" />}
                    {kpi.change}
                  </Badge>
                )}
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{kpi.label}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{kpi.sub}</p>
            </MotionCard>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue over time */}
        <SlideIn direction="up" delay={0.1} className="lg:col-span-2">
          <div className="bg-card rounded-xl border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Revenue Overview</h2>
                <p className="text-sm text-muted-foreground">
                  {range === 'week' ? 'Daily revenue this week' : range === 'month' ? 'Daily revenue this month' : 'Monthly revenue this year'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">${totalRevenue.toLocaleString()}</p>
                {comp && (
                  <Badge variant="secondary" className={cn('border-0 text-xs', comp.total_revenue.change_pct >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>
                    {comp.total_revenue.change_pct >= 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5 inline" /> : <ArrowDownRight className="h-3 w-3 mr-0.5 inline" />}
                    {comp.total_revenue.change_pct >= 0 ? '+' : ''}{comp.total_revenue.change_pct}% vs previous
                  </Badge>
                )}
              </div>
            </div>
            {revenueData.length > 0 ? (
              <BarChart data={revenueData} labels={chartLabels} color="primary" height={200} formatTooltip={(v) => `$${v.toLocaleString()}`} />
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">No revenue data for this period</div>
            )}
          </div>
        </SlideIn>

        {/* Services donut */}
        <SlideIn direction="up" delay={0.2}>
          <div className="bg-card rounded-xl border p-6 h-full">
            <h2 className="text-lg font-semibold text-foreground mb-1">Bookings by Service</h2>
            <p className="text-sm text-muted-foreground mb-6">Share of total bookings</p>
            {donutData.length > 0 ? (
              <>
                <div className="flex justify-center mb-6">
                  <DonutChart data={donutData} total={overview?.bookings.total ?? 0} />
                </div>
                <div className="space-y-2.5">
                  {donutData.map((s, i) => {
                    const dotColors = ['bg-primary', 'bg-chart-2', 'bg-success', 'bg-chart-4', 'bg-chart-5']
                    return (
                      <div key={s.name} className="flex items-center gap-2 text-sm">
                        <div className={cn('w-2 h-2 rounded-full shrink-0', dotColors[i % dotColors.length])} />
                        <span className="text-muted-foreground truncate flex-1">{s.name}</span>
                        <span className="font-medium text-foreground">{s.share}%</span>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No service data</div>
            )}
          </div>
        </SlideIn>
      </div>

      {/* Booking volume + top services table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking volume chart */}
        <SlideIn direction="up" delay={0.15}>
          <div className="bg-card rounded-xl border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Booking Volume</h2>
                <p className="text-sm text-muted-foreground">
                  {range === 'week' ? 'Daily bookings this week' : range === 'month' ? 'Daily bookings this month' : 'Monthly bookings this year'}
                </p>
              </div>
              <p className="text-xl font-bold text-foreground">
                {totalBookingsChart.toLocaleString()} <span className="text-sm text-muted-foreground font-normal">in period</span>
              </p>
            </div>
            {bookingData.length > 0 ? (
              <BarChart data={bookingData} labels={chartLabels} color="chart-2" height={160} formatTooltip={(v) => `${v} bookings`} />
            ) : (
              <div className="flex items-center justify-center h-[160px] text-muted-foreground text-sm">No booking data for this period</div>
            )}
          </div>
        </SlideIn>

        {/* Top services table */}
        <SlideIn direction="up" delay={0.2}>
          <div className="bg-card rounded-xl border overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-foreground">Top Services</h2>
              <p className="text-sm text-muted-foreground">Ranked by booking count</p>
            </div>
            {topServices.length > 0 ? (
              <div className="divide-y">
                {topServices.map((s, i) => {
                  const maxBookings = topServices[0]?.bookings || 1
                  const barPct = (s.bookings / maxBookings) * 100
                  return (
                    <motion.div
                      key={s.name}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.07 }}
                    >
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.bookings} bookings</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-foreground text-sm">${Number(s.revenue).toLocaleString()}</p>
                        <div className="w-20 h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                          <motion.div
                            className="h-full bg-primary rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${barPct}%` }}
                            transition={{ duration: 0.7, delay: 0.4 + i * 0.07, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm p-6">No services data</div>
            )}
          </div>
        </SlideIn>
      </div>

      {/* Summary row */}
      <SlideIn direction="up" delay={0.2}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Avg. Booking Value', value: overview ? `$${overview.revenue.avg_booking_value.toFixed(2)}` : '$0' },
            { label: 'Completion Rate', value: `${completionRate}%` },
            { label: 'Cancellation Rate', value: `${cancellationRate}%` },
            { label: 'Paid Bookings', value: overview ? `${overview.payments.paid}` : '0' },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl border p-5 text-center">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </SlideIn>
    </div>
  )
}
