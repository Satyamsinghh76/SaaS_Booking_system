'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
  Calendar, Search, Filter, MoreVertical, Check, X, Clock,
  DollarSign, CheckCircle2, AlertCircle, Loader2, Eye,
  CalendarDays, Sparkles, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import type { Booking as APIBooking } from '@/lib/api/bookings'

interface AdminBooking {
  id: string
  serviceName: string
  customerName: string
  customerEmail: string
  date: string
  time: string
  status: string
  paymentStatus: string
  price: number
  notes?: string
  phone?: string
}

function mapBooking(b: APIBooking): AdminBooking {
  const raw = b as Record<string, unknown>
  return {
    id: b.id,
    serviceName: b.service_name,
    customerName: (raw.customer_name as string) || (raw.user_name as string) || 'Customer',
    customerEmail: (raw.customer_email as string) || (raw.user_email as string) || '',
    date: b.date,
    time: b.start_time,
    status: b.status,
    paymentStatus: b.payment_status,
    price: parseFloat(b.price_snapshot as unknown as string) || 0,
    notes: (raw.notes as string) || '',
    phone: (raw.user_phone as string) || '',
  }
}

function formatTime12h(time24: string) {
  const [h, m] = time24.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hour12}:${m.toString().padStart(2, '0')} ${suffix}`
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  confirmed: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', label: 'Confirmed' },
  completed: { bg: 'bg-blue-500/10 dark:bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400', label: 'Completed' },
  pending:   { bg: 'bg-amber-500/10 dark:bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400', label: 'Pending' },
  cancelled: { bg: 'bg-red-500/10 dark:bg-red-500/15', text: 'text-red-600 dark:text-red-400', label: 'Cancelled' },
  no_show:   { bg: 'bg-stone-500/10 dark:bg-stone-500/15', text: 'text-stone-600 dark:text-stone-400', label: 'No Show' },
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null)
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

  const updateStatus = async (bookingId: string, newStatus: string) => {
    setActing(bookingId + newStatus)
    try {
      await api.patch(`/api/bookings/${bookingId}/status`, { status: newStatus })
      loadBookings()
      setSelectedBooking(null)
    } catch (err) {
      console.error('[admin] Status update failed:', err)
    } finally {
      setActing(null)
    }
  }

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch = b.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Stats
  const totalBookings = bookings.length
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length
  const pendingCount = bookings.filter(b => b.status === 'pending').length
  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <motion.div className="flex items-center gap-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 dark:from-primary/30 dark:to-violet-500/30">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">Bookings</h1>
          </motion.div>
          <motion.p className="text-stone-500 dark:text-stone-400 mt-1.5 ml-[52px]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            Manage and track all customer bookings
          </motion.p>
        </div>
      </div>

      {/* ── Stats Row ───────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: totalBookings, gradient: 'from-violet-500 to-indigo-600', bg: 'bg-violet-50 dark:bg-violet-950/30', color: 'text-violet-600 dark:text-violet-400', icon: Calendar },
          { label: 'Confirmed', value: confirmedCount, gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', color: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
          { label: 'Pending', value: pendingCount, gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-50 dark:bg-amber-950/30', color: 'text-amber-600 dark:text-amber-400', icon: Clock },
          { label: 'Cancelled', value: cancelledCount, gradient: 'from-red-500 to-rose-600', bg: 'bg-red-50 dark:bg-red-950/30', color: 'text-red-600 dark:text-red-400', icon: X },
        ].map((s) => (
          <div key={s.label} className="card-glow p-4 rounded-2xl border bg-white dark:bg-stone-900/80 border-stone-200/80 dark:border-white/10 relative overflow-hidden">
            <div className={cn('absolute top-0 left-0 right-0 h-1 bg-gradient-to-r', s.gradient)} />
            <div className={cn('p-2 rounded-xl w-fit mb-2', s.bg)}>
              <s.icon className={cn('h-4 w-4', s.color)} />
            </div>
            <p className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">{s.value}</p>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* ── Search + Filter ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className={cn(
          'flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 rounded-2xl border',
          'bg-white/60 dark:bg-white/5 backdrop-blur-xl',
          'border-white/40 dark:border-white/10',
          'shadow-lg shadow-black/5 dark:shadow-black/20'
        )}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by service or booking ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="w-px h-8 bg-border/50 hidden sm:block" />
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'confirmed', label: 'Confirmed' },
            { key: 'completed', label: 'Completed' },
            { key: 'cancelled', label: 'Cancelled' },
          ].map((f) => (
            <Button
              key={f.key}
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                'rounded-lg text-xs h-8 px-3.5 shrink-0 transition-all',
                statusFilter === f.key
                  ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-sm'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
              )}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* ── Table ───────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
        </div>
      ) : error ? (
        <div className="text-center py-20 rounded-2xl border bg-white dark:bg-stone-900/80 border-stone-200/80 dark:border-white/10 space-y-3">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
          <p className="text-stone-500">{error}</p>
          <Button variant="outline" className="rounded-xl" onClick={loadBookings}>Retry</Button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border bg-white dark:bg-stone-900/80 border-stone-200/80 dark:border-white/10 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-stone-50/50 dark:bg-stone-800/30 hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">Service</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">Date & Time</TableHead>
                  <TableHead className="hidden sm:table-cell text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">Status</TableHead>
                  <TableHead className="hidden sm:table-cell text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">Payment</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 text-right">Amount</TableHead>
                  <TableHead className="w-[60px] text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {filteredBookings.map((booking, index) => {
                    const sc = statusConfig[booking.status] || statusConfig.pending
                    return (
                      <motion.tr
                        key={booking.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.03 }}
                        className="group hover:bg-stone-50/80 dark:hover:bg-stone-800/30 transition-colors"
                      >
                        <TableCell>
                          <p className="font-medium text-stone-900 dark:text-stone-100">{booking.serviceName}</p>
                          <p className="text-xs text-stone-500 dark:text-stone-400">{booking.customerName} <span className="text-stone-400 dark:text-stone-500 font-mono">· {booking.id.slice(0, 8)}</span></p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-stone-700 dark:text-stone-300">
                            {format(new Date(booking.date + 'T00:00:00'), 'MMM d, yyyy')}
                          </p>
                          <p className="text-xs text-stone-400">{formatTime12h(booking.time)}</p>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="secondary" className={cn('capitalize border-0 font-medium', sc.bg, sc.text)}>
                            {sc.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {booking.paymentStatus === 'paid' ? (
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 border-0 text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Paid
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 border-0 text-xs">
                              Unpaid
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-stone-900 dark:text-stone-100">${booking.price}</TableCell>
                        <TableCell>
                          <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-lg z-50 min-w-[160px]">
                                <DropdownMenuItem onClick={() => setSelectedBooking(booking)}>
                                  <Eye className="h-3.5 w-3.5 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {booking.status === 'pending' && (
                                  <DropdownMenuItem onClick={() => updateStatus(booking.id, 'confirmed')}>
                                    <Check className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                                    Confirm Booking
                                  </DropdownMenuItem>
                                )}
                                {(booking.status === 'confirmed' || booking.status === 'pending') && (
                                  <DropdownMenuItem onClick={() => updateStatus(booking.id, 'completed')}>
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-blue-500" />
                                    Mark Completed
                                  </DropdownMenuItem>
                                )}
                                {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                  <DropdownMenuItem className="text-red-600 dark:text-red-400" onClick={() => updateStatus(booking.id, 'cancelled')}>
                                    <X className="h-3.5 w-3.5 mr-2" />
                                    Cancel Booking
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>

          {filteredBookings.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
                <Calendar className="h-7 w-7 text-stone-400" />
              </div>
              <h3 className="font-semibold text-stone-900 dark:text-stone-100">No bookings found</h3>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Try adjusting your search or filter</p>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Detail Dialog ───────────────────────────────────────── */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="sm:max-w-[480px] bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-stone-900 dark:text-stone-100">Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (() => {
            const sc = statusConfig[selectedBooking.status] || statusConfig.pending
            return (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-stone-900 dark:text-stone-100">{selectedBooking.serviceName}</span>
                  <Badge variant="secondary" className={cn('capitalize border-0 font-medium', sc.bg, sc.text)}>
                    {sc.label}
                  </Badge>
                </div>

                <div className="rounded-xl bg-stone-50 dark:bg-stone-800/50 p-4 space-y-4">
                  {/* Customer + Email — full width rows */}
                  <div className="flex items-start gap-2.5">
                    <Eye className="h-4 w-4 text-stone-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-stone-400 uppercase tracking-wider">Customer</p>
                      <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{selectedBooking.customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="h-4 w-4 text-stone-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-stone-400 uppercase tracking-wider">Email</p>
                      <p className="text-sm font-medium text-stone-900 dark:text-stone-100 break-all">{selectedBooking.customerEmail || '-'}</p>
                    </div>
                  </div>
                  {/* 2x2 grid for shorter fields */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stone-200/60 dark:border-stone-700/50">
                    {[
                      { label: 'Date', value: format(new Date(selectedBooking.date + 'T00:00:00'), 'MMM d, yyyy'), icon: Calendar },
                      { label: 'Time', value: formatTime12h(selectedBooking.time), icon: Clock },
                      { label: 'Amount', value: `$${selectedBooking.price}`, icon: DollarSign },
                      { label: 'Booking ID', value: selectedBooking.id.slice(0, 8), icon: Sparkles },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start gap-2.5">
                        <item.icon className="h-4 w-4 text-stone-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] text-stone-400 uppercase tracking-wider">{item.label}</p>
                          <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-400">Payment:</span>
                  {selectedBooking.paymentStatus === 'paid' ? (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 border-0 text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Paid
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 border-0 text-xs">
                      Unpaid
                    </Badge>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-3 border-t border-stone-200 dark:border-stone-700">
                  {selectedBooking.status === 'pending' && (
                    <Button
                      className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={!!acting}
                      onClick={() => updateStatus(selectedBooking.id, 'confirmed')}
                    >
                      {acting === selectedBooking.id + 'confirmed' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                      Confirm
                    </Button>
                  )}
                  {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl"
                      disabled={!!acting}
                      onClick={() => updateStatus(selectedBooking.id, 'completed')}
                    >
                      {acting === selectedBooking.id + 'completed' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                      Complete
                    </Button>
                  )}
                  {selectedBooking.status !== 'cancelled' && selectedBooking.status !== 'completed' && (
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                      disabled={!!acting}
                      onClick={() => updateStatus(selectedBooking.id, 'cancelled')}
                    >
                      {acting === selectedBooking.id + 'cancelled' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
