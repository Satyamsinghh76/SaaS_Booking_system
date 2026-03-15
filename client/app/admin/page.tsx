'use client'

import { motion } from 'framer-motion'
import { format } from 'date-fns'
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
  CalendarDays
} from 'lucide-react'
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
import { useBookingStore } from '@/lib/store'
import { StaggerWrapper, StaggerItem, AnimatedSkeleton } from '@/components/ui/motion'
import { cn } from '@/lib/utils'

const stats = [
  { 
    label: 'Total Revenue', 
    value: '$12,450', 
    change: '+23%',
    trend: 'up',
    icon: DollarSign,
  },
  { 
    label: 'Total Bookings', 
    value: '256', 
    change: '+18%',
    trend: 'up',
    icon: Calendar,
  },
  { 
    label: 'Active Users', 
    value: '1,284', 
    change: '+12%',
    trend: 'up',
    icon: Users,
  },
  { 
    label: 'Avg. Duration', 
    value: '45 min', 
    change: '-5%',
    trend: 'down',
    icon: Clock,
  },
]

const recentBookings = [
  { id: '1', customer: 'Sarah Chen', email: 'sarah@example.com', service: 'Strategy Consultation', date: '2026-03-15', time: '10:00 AM', amount: 150, status: 'confirmed' },
  { id: '2', customer: 'Marcus Johnson', email: 'marcus@example.com', service: 'Design Review', date: '2026-03-15', time: '11:30 AM', amount: 100, status: 'pending' },
  { id: '3', customer: 'Emily Rodriguez', email: 'emily@example.com', service: 'Technical Deep Dive', date: '2026-03-15', time: '2:00 PM', amount: 200, status: 'confirmed' },
  { id: '4', customer: 'David Kim', email: 'david@example.com', service: 'Brand Workshop', date: '2026-03-16', time: '9:00 AM', amount: 300, status: 'confirmed' },
  { id: '5', customer: 'Lisa Wang', email: 'lisa@example.com', service: 'Growth Strategy', date: '2026-03-16', time: '3:00 PM', amount: 175, status: 'cancelled' },
]

const topServices = [
  { name: 'Strategy Consultation', bookings: 45, revenue: 6750, growth: 12 },
  { name: 'Design Review', bookings: 38, revenue: 3800, growth: 8 },
  { name: 'Technical Deep Dive', bookings: 32, revenue: 6400, growth: 15 },
  { name: 'Brand Workshop', bookings: 28, revenue: 8400, growth: 22 },
]

export default function AdminDashboardPage() {
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
            Admin Dashboard
          </motion.h1>
          <motion.p 
            className="text-muted-foreground mt-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Overview of your booking platform performance.
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2"
        >
          <Button variant="outline">
            Export
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            <Package className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        </motion.div>
      </div>

      {/* Stats grid */}
      <StaggerWrapper className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StaggerItem key={stat.label}>
            <motion.div
              className="p-6 bg-card rounded-xl border transition-all hover:shadow-lg hover:border-primary/20"
              whileHover={{ y: -4 }}
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <Badge 
                  variant="secondary" 
                  className={cn(
                    'text-xs border-0',
                    stat.trend === 'up' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                  )}
                >
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                  )}
                  {stat.change}
                </Badge>
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
        {/* Recent bookings table */}
        <motion.div 
          className="lg:col-span-2 bg-card rounded-xl border overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Recent Bookings</h2>
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden sm:table-cell">Service</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{booking.customer}</p>
                        <p className="text-xs text-muted-foreground hidden sm:block">{booking.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {booking.service}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      <div>
                        <p>{format(new Date(booking.date), 'MMM d')}</p>
                        <p className="text-xs">{booking.time}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">${booking.amount}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={cn(
                          'capitalize border-0',
                          booking.status === 'confirmed' && 'bg-success/10 text-success',
                          booking.status === 'pending' && 'bg-chart-4/10 text-chart-4',
                          booking.status === 'cancelled' && 'bg-destructive/10 text-destructive',
                        )}
                      >
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View details</DropdownMenuItem>
                          <DropdownMenuItem>Edit booking</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Cancel</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </motion.div>

        {/* Top services */}
        <motion.div 
          className="bg-card rounded-xl border p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-6">Top Services</h2>
          <div className="space-y-4">
            {topServices.map((service, index) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{service.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {service.bookings} bookings · ${service.revenue}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-success/10 text-success border-0 shrink-0">
                  +{service.growth}%
                </Badge>
              </motion.div>
            ))}
          </div>

          {/* Quick stats */}
          <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              <p className="text-2xl font-bold text-foreground">89%</p>
              <p className="text-xs text-muted-foreground">Completion Rate</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              <p className="text-2xl font-bold text-foreground">4.9</p>
              <p className="text-xs text-muted-foreground">Avg. Rating</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Revenue chart — animated */}
      <motion.div
        className="bg-card rounded-xl border p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Revenue Overview</h2>
            <p className="text-sm text-muted-foreground">Monthly revenue — 2025</p>
          </div>
          <div className="flex items-center gap-2">
            {['Week', 'Month', 'Year'].map((label, i) => (
              <Button key={label} variant={i === 1 ? 'default' : 'outline'} size="sm"
                className={i === 1 ? 'bg-primary text-primary-foreground' : ''}>
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="relative h-56">
          <div className="flex items-end gap-1.5 h-full pb-7">
            {[28400,32100,29800,38200,42100,39500,45200,43800,47600,44200,48620,52100].map((val, i) => {
              const max = 52100
              const pct = (val / max) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative">
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover border text-popover-foreground text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-10 pointer-events-none">
                    ${(val/1000).toFixed(1)}k
                  </div>
                  <motion.div
                    className="w-full bg-primary/25 rounded-t-md group-hover:bg-primary/60 transition-colors duration-150 cursor-pointer"
                    style={{ height: `${pct}%` }}
                    initial={{ scaleY: 0, originY: 1 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.5, delay: 0.55 + i * 0.045, ease: [0.25,0.46,0.45,0.94] }}
                  />
                </div>
              )
            })}
          </div>
          {/* X labels */}
          <div className="absolute bottom-0 left-0 right-0 flex gap-1.5">
            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m) => (
              <div key={m} className="flex-1 text-center text-[10px] text-muted-foreground">{m}</div>
            ))}
          </div>
        </div>

        {/* Footer stats */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Total 2025</p>
            <p className="font-semibold text-foreground">$491,640</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Best Month</p>
            <p className="font-semibold text-foreground">Dec · $52.1k</p>
          </div>
          <div className="ml-auto">
            <Badge variant="secondary" className="bg-success/10 text-success border-0">
              +23.5% vs 2024
            </Badge>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
