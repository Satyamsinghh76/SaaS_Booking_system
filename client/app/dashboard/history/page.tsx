'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  Clock,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Search,
  Briefcase,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import type { Booking as APIBooking } from '@/lib/api/bookings'

interface HistoryBooking {
  id: string
  serviceName: string
  date: string
  time: string
  status: 'completed' | 'cancelled'
  paymentStatus: string
  price: number
}

function formatTime12h(time24: string) {
  const [h, m] = time24.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hour12}:${m.toString().padStart(2, '0')} ${suffix}`
}

function mapBooking(b: APIBooking): HistoryBooking | null {
  const status = b.status === 'completed' ? 'completed' : b.status === 'cancelled' ? 'cancelled' : null
  if (!status) return null
  return {
    id: b.id,
    serviceName: b.service_name,
    date: b.date,
    time: b.start_time,
    status,
    paymentStatus: b.payment_status,
    price: parseFloat(b.price_snapshot as unknown as string) || 0,
  }
}

export default function HistoryPage() {
  const [bookings, setBookings] = useState<HistoryBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all')

  const loadBookings = useCallback(() => {
    setIsLoading(true)
    setError(null)
    api.bookings.fetchBookings({ limit: 100 })
      .then(({ bookings: apiBookings }) => {
        const history = apiBookings.map(mapBooking).filter(Boolean) as HistoryBooking[]
        setBookings(history)
      })
      .catch(() => setError('Failed to load history.'))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => { loadBookings() }, [loadBookings])

  const filtered = bookings.filter(b => {
    const matchesSearch = b.serviceName.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || b.status === filter
    return matchesSearch && matchesFilter
  })

  const completedCount = bookings.filter(b => b.status === 'completed').length
  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Booking History
        </h1>
        <p className="text-stone-500 mt-1 text-sm">
          View your past and cancelled bookings.
        </p>
      </motion.div>

      {/* Tabs + Search */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-1 bg-stone-100/60 p-1 rounded-xl w-fit">
          {[
            { value: 'all' as const, label: 'All', count: bookings.length },
            { value: 'completed' as const, label: 'Completed', count: completedCount },
            { value: 'cancelled' as const, label: 'Cancelled', count: cancelledCount },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                filter === tab.value
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              )}
            >
              {tab.label}
              <span className={cn(
                'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center',
                filter === tab.value ? 'bg-lime-100 text-lime-700' : 'bg-stone-200/60 text-stone-400'
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            placeholder="Search by service name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl border-stone-200 bg-white shadow-sm"
          />
        </div>
      </motion.div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-3">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
          <p className="text-stone-500">{error}</p>
          <Button variant="outline" onClick={loadBookings} className="rounded-xl">Retry</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-stone-200">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
            <Clock className="h-6 w-6 text-stone-400" />
          </div>
          <p className="text-stone-500 font-medium">No history found</p>
          <p className="text-stone-400 text-sm mt-1">Completed and cancelled bookings will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking, index) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Icon */}
                <div className={cn(
                  'p-3 rounded-xl shrink-0 w-fit',
                  booking.status === 'completed' ? 'bg-emerald-50' : 'bg-stone-100'
                )}>
                  <Briefcase className={cn(
                    'h-5 w-5',
                    booking.status === 'completed' ? 'text-emerald-600' : 'text-stone-400'
                  )} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-stone-900 text-sm">{booking.serviceName}</h3>
                    {booking.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full">
                        <XCircle className="h-3 w-3" />
                        Cancelled
                      </span>
                    )}
                    {booking.paymentStatus === 'paid' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                        Paid
                      </span>
                    )}
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
                    <span className="flex items-center gap-1.5 font-semibold text-stone-800">
                      <DollarSign className="h-3.5 w-3.5" />
                      {booking.price}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
