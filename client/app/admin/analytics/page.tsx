'use client'

import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, DollarSign, Calendar,
  Users, BarChart3, ArrowUpRight, ArrowDownRight,
  Download, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FadeIn, SlideIn, StaggerContainer, StaggerItem, MotionCard } from '@/components/ui/motion'
import { cn } from '@/lib/utils'

// ── KPI data ──────────────────────────────────────────────────────────────────
const kpis = [
  {
    label: 'Total Revenue',
    value: '$48,620',
    change: '+23.5%',
    trend: 'up' as const,
    icon: DollarSign,
    color: 'primary',
    sub: 'vs last month',
  },
  {
    label: 'Total Bookings',
    value: '1,248',
    change: '+18.2%',
    trend: 'up' as const,
    icon: Calendar,
    color: 'chart-2',
    sub: 'vs last month',
  },
  {
    label: 'Unique Customers',
    value: '743',
    change: '+12.1%',
    trend: 'up' as const,
    icon: Users,
    color: 'success',
    sub: 'vs last month',
  },
  {
    label: 'Cancellation Rate',
    value: '12.98%',
    change: '-2.3%',
    trend: 'down' as const,
    icon: BarChart3,
    color: 'destructive',
    sub: 'improvement',
  },
]

// ── Revenue chart data ────────────────────────────────────────────────────────
const monthlyRevenue = [28400, 32100, 29800, 38200, 42100, 39500, 45200, 43800, 47600, 44200, 48620, 52100]
const monthlyBookings = [680, 720, 695, 840, 920, 880, 960, 940, 1010, 975, 1080, 1150]
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ── Top services ──────────────────────────────────────────────────────────────
const topServices = [
  { name: 'Deep Tissue Massage', bookings: 341, revenue: 17050, share: 35 },
  { name: 'Haircut & Style',      bookings: 298, revenue: 11920, share: 24 },
  { name: 'Manicure',             bookings: 245, revenue: 7350,  share: 20 },
  { name: 'Facial',               bookings: 202, revenue: 8080,  share: 16 },
  { name: 'Waxing',               bookings: 105, revenue: 4220,  share: 8  },
]

// ── Reusable bar chart (CSS-only, no external chart lib required) ─────────────
function BarChart({
  data,
  labels,
  color = 'primary',
  height = 180,
}: {
  data: number[]
  labels: string[]
  color?: string
  height?: number
}) {
  const max = Math.max(...data)
  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end gap-1 h-full pb-6 relative">
        {data.map((val, i) => {
          const pct = (val / max) * 100
          return (
            <div key={i} className="flex-1 flex flex-col items-center group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover border text-popover-foreground text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-10 pointer-events-none">
                {typeof val === 'number' && val > 1000 ? `$${(val/1000).toFixed(1)}k` : val}
              </div>
              <motion.div
                className={cn(
                  'w-full rounded-t-md',
                  color === 'primary' ? 'bg-primary/70 group-hover:bg-primary' : 'bg-chart-2/70 group-hover:bg-chart-2',
                  'transition-colors duration-150'
                )}
                initial={{ height: 0 }}
                animate={{ height: `${pct}%` }}
                transition={{ duration: 0.6, delay: i * 0.04, ease: [0.25,0.46,0.45,0.94] }}
              />
            </div>
          )
        })}
        {/* X axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex gap-1">
          {labels.map((l, i) => (
            <div key={i} className="flex-1 text-center text-[10px] text-muted-foreground truncate">
              {l}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Donut chart (SVG) ────────────────────────────────────────────────────────
function DonutChart({ data }: { data: typeof topServices }) {
  const colors = ['oklch(0.55 0.25 275)', 'oklch(0.6 0.2 260)', 'oklch(0.75 0.15 160)', 'oklch(0.7 0.18 280)', 'oklch(0.65 0.2 230)']
  const total = data.reduce((s, d) => s + d.share, 0)
  let offset = 0
  const r = 60, cx = 70, cy = 70, stroke = 22
  const circ = 2 * Math.PI * r

  return (
    <svg viewBox="0 0 140 140" className="w-full max-w-[140px]">
      {data.map((d, i) => {
        const pct = d.share / total
        const dashArr = circ * pct
        const dashOff = circ * (1 - offset) - circ
        offset += pct
        return (
          <motion.circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={colors[i]}
            strokeWidth={stroke}
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
        1,248
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 9 }}>
        bookings
      </text>
    </svg>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<'week' | 'month' | 'year'>('month')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refresh = async () => {
    setIsRefreshing(true)
    await new Promise(r => setTimeout(r, 800))
    setIsRefreshing(false)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Analytics</h1>
            <p className="mt-1 text-muted-foreground">
              Platform performance and revenue insights.
            </p>
          </div>
          <div className="flex items-center gap-2">
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
                  {r}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className={cn('h-4 w-4 mr-1.5', isRefreshing && 'animate-spin')} />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1.5" />
              Export
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* KPI Cards */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
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
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-xs border-0 font-medium',
                    kpi.trend === 'up'
                      ? 'bg-success/10 text-success'
                      : 'bg-destructive/10 text-destructive'
                  )}
                >
                  {kpi.trend === 'up'
                    ? <ArrowUpRight className="h-3 w-3 mr-0.5 inline" />
                    : <ArrowDownRight className="h-3 w-3 mr-0.5 inline" />
                  }
                  {kpi.change}
                </Badge>
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
                <p className="text-sm text-muted-foreground">Monthly revenue for 2025</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">$48,620</p>
                <Badge variant="secondary" className="bg-success/10 text-success border-0 text-xs">
                  <ArrowUpRight className="h-3 w-3 mr-0.5 inline" />
                  +23.5% vs last year
                </Badge>
              </div>
            </div>
            <BarChart data={monthlyRevenue} labels={months} color="primary" height={200} />
          </div>
        </SlideIn>

        {/* Services donut */}
        <SlideIn direction="up" delay={0.2}>
          <div className="bg-card rounded-xl border p-6 h-full">
            <h2 className="text-lg font-semibold text-foreground mb-1">Bookings by Service</h2>
            <p className="text-sm text-muted-foreground mb-6">Share of total bookings</p>
            <div className="flex justify-center mb-6">
              <DonutChart data={topServices} />
            </div>
            <div className="space-y-2.5">
              {topServices.map((s, i) => {
                const dotColors = ['bg-primary', 'bg-chart-2', 'bg-success', 'bg-chart-4', 'bg-chart-5']
                return (
                  <div key={s.name} className="flex items-center gap-2 text-sm">
                    <div className={cn('w-2 h-2 rounded-full shrink-0', dotColors[i])} />
                    <span className="text-muted-foreground truncate flex-1">{s.name}</span>
                    <span className="font-medium text-foreground">{s.share}%</span>
                  </div>
                )
              })}
            </div>
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
                <p className="text-sm text-muted-foreground">Monthly bookings 2025</p>
              </div>
              <p className="text-xl font-bold text-foreground">1,248 <span className="text-sm text-muted-foreground font-normal">this month</span></p>
            </div>
            <BarChart data={monthlyBookings} labels={months} color="chart-2" height={160} />
          </div>
        </SlideIn>

        {/* Top services table */}
        <SlideIn direction="up" delay={0.2}>
          <div className="bg-card rounded-xl border overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-foreground">Top Services</h2>
              <p className="text-sm text-muted-foreground">Ranked by booking count</p>
            </div>
            <div className="divide-y">
              {topServices.map((s, i) => (
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
                    <p className="font-semibold text-foreground text-sm">${s.revenue.toLocaleString()}</p>
                    <div className="w-20 h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${s.share}%` }}
                        transition={{ duration: 0.7, delay: 0.4 + i * 0.07, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </SlideIn>
      </div>

      {/* Summary row */}
      <SlideIn direction="up" delay={0.2}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Avg. Booking Value', value: '$48.18' },
            { label: 'Completion Rate',    value: '89.0%' },
            { label: 'Cancellation Rate',  value: '12.98%' },
            { label: 'Avg. Rating',        value: '4.9 / 5' },
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
