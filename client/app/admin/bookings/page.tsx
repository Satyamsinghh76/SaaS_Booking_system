"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import {
  Calendar,
  Search,
  Filter,
  MoreVertical,
  Check,
  X,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import api from "@/lib/api"
import type { Booking as APIBooking } from "@/lib/api/bookings"

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
}

function mapBooking(b: APIBooking): AdminBooking {
  return {
    id: b.id,
    serviceName: b.service_name,
    customerName: b.user_id,
    customerEmail: "",
    date: b.date,
    time: b.start_time,
    status: b.status,
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

const statusColors: Record<string, string> = {
  confirmed: "bg-success/10 text-success border-success/20",
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  completed: "bg-muted text-muted-foreground border-muted",
  no_show: "bg-muted text-muted-foreground border-muted",
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null)
  const [acting, setActing] = useState<string | null>(null)

  const loadBookings = useCallback(() => {
    setIsLoading(true)
    setError(null)
    api.bookings.fetchBookings({ limit: 100 })
      .then(({ bookings: apiBookings }) => setBookings(apiBookings.map(mapBooking)))
      .catch(() => setError("Failed to load bookings."))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => { loadBookings() }, [loadBookings])

  const updateStatus = async (bookingId: string, newStatus: string, e?: React.MouseEvent) => {
    if (e) { e.stopPropagation(); e.preventDefault() }
    setActing(bookingId + newStatus)
    try {
      const res = await api.patch(`/api/bookings/${bookingId}/status`, { status: newStatus })
      console.log('[admin] Status updated:', res.data)
      setSelectedBooking(null)
    } catch (err) {
      console.error('[admin] Status update failed:', err)
    } finally {
      setActing(null)
      loadBookings()
    }
  }

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Bookings</h1>
          <p className="mt-1 text-muted-foreground">
            Manage and track all customer bookings
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by service or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Status
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="ml-1 capitalize">
                  {statusFilter}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>All Statuses</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setStatusFilter("pending")}>Pending</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("confirmed")}>Confirmed</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("completed")}>Completed</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("cancelled")}>Cancelled</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-card rounded-xl border space-y-3">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={loadBookings}>Retry</Button>
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Payment</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {filteredBookings.map((booking, index) => (
                    <motion.tr
                      key={booking.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.03 }}
                      className="group cursor-pointer transition-colors hover:bg-muted/50"
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <TableCell>
                        <p className="font-medium">{booking.serviceName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{booking.id.slice(0, 8)}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">
                          {format(new Date(booking.date + 'T00:00:00'), "MMM d, yyyy")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime12h(booking.time)}
                        </p>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className={cn("capitalize", statusColors[booking.status])}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {booking.paymentStatus === "paid" ? (
                          <Badge variant="secondary" className="bg-success/10 text-success border-0 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Paid
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-0 text-xs">
                            Unpaid
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">${booking.price}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {booking.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                                onClick={(e) => updateStatus(booking.id, "confirmed", e)}
                                disabled={acting === booking.id + "confirmed"}
                              >
                                {acting === booking.id + "confirmed"
                                  ? <Loader2 className="h-4 w-4 animate-spin" />
                                  : <Check className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => updateStatus(booking.id, "cancelled", e)}
                                disabled={acting === booking.id + "cancelled"}
                              >
                                {acting === booking.id + "cancelled"
                                  ? <Loader2 className="h-4 w-4 animate-spin" />
                                  : <X className="h-4 w-4" />}
                              </Button>
                            </>
                          )}
                          {booking.status === "confirmed" && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => updateStatus(booking.id, "completed")}>
                                  <Check className="mr-2 h-4 w-4" /> Complete
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => updateStatus(booking.id, "cancelled")}
                                >
                                  <X className="mr-2 h-4 w-4" /> Cancel
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>

          {filteredBookings.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold">No bookings found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search or filter
              </p>
            </div>
          )}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              {selectedBooking?.id.slice(0, 8)} · {selectedBooking && format(new Date(selectedBooking.date + 'T00:00:00'), "MMM d, yyyy")}
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-lg">{selectedBooking.serviceName}</span>
                <Badge variant="outline" className={cn("capitalize", statusColors[selectedBooking.status])}>
                  {selectedBooking.status}
                </Badge>
              </div>

              <div className="space-y-3 rounded-lg bg-muted/50 p-4 text-sm">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(selectedBooking.date + 'T00:00:00'), "EEEE, MMMM d, yyyy")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatTime12h(selectedBooking.time)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>${selectedBooking.price}</span>
                  {selectedBooking.paymentStatus === "paid" ? (
                    <Badge variant="secondary" className="bg-success/10 text-success border-0 text-xs ml-1">Paid</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-0 text-xs ml-1">Unpaid</Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {selectedBooking.status === "pending" && (
                  <>
                    <Button
                      className="flex-1 bg-success hover:bg-success/90 text-white"
                      onClick={() => updateStatus(selectedBooking.id, "confirmed")}
                      disabled={!!acting}
                    >
                      {acting === selectedBooking.id + "confirmed" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                      Confirm
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => updateStatus(selectedBooking.id, "cancelled")}
                      disabled={!!acting}
                    >
                      {acting === selectedBooking.id + "cancelled" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
                      Cancel
                    </Button>
                  </>
                )}
                {selectedBooking.status === "confirmed" && (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => updateStatus(selectedBooking.id, "completed")}
                      disabled={!!acting}
                    >
                      Complete
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => updateStatus(selectedBooking.id, "cancelled")}
                      disabled={!!acting}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
