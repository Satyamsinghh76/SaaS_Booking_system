"use client"

import { useState } from "react"
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
  User,
  Mail,
  Phone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { FadeIn, SlideIn, ScaleIn } from "@/components/ui/motion"

const bookings = [
  {
    id: "BK001",
    customer: {
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      phone: "+1 (555) 123-4567",
      avatar: null,
    },
    service: "Business Strategy Consultation",
    date: new Date(2024, 11, 20, 10, 0),
    duration: 60,
    status: "confirmed",
    price: 150,
  },
  {
    id: "BK002",
    customer: {
      name: "Michael Chen",
      email: "m.chen@company.com",
      phone: "+1 (555) 234-5678",
      avatar: null,
    },
    service: "Marketing Audit",
    date: new Date(2024, 11, 20, 14, 0),
    duration: 90,
    status: "pending",
    price: 200,
  },
  {
    id: "BK003",
    customer: {
      name: "Emily Davis",
      email: "emily.d@startup.io",
      phone: "+1 (555) 345-6789",
      avatar: null,
    },
    service: "Technical Architecture Review",
    date: new Date(2024, 11, 21, 9, 0),
    duration: 120,
    status: "confirmed",
    price: 300,
  },
  {
    id: "BK004",
    customer: {
      name: "James Wilson",
      email: "jwilson@enterprise.com",
      phone: "+1 (555) 456-7890",
      avatar: null,
    },
    service: "Financial Planning Session",
    date: new Date(2024, 11, 21, 15, 30),
    duration: 45,
    status: "cancelled",
    price: 125,
  },
  {
    id: "BK005",
    customer: {
      name: "Lisa Anderson",
      email: "l.anderson@design.co",
      phone: "+1 (555) 567-8901",
      avatar: null,
    },
    service: "Design Sprint Workshop",
    date: new Date(2024, 11, 22, 10, 0),
    duration: 180,
    status: "confirmed",
    price: 450,
  },
]

const statusColors: Record<string, string> = {
  confirmed: "bg-success/10 text-success border-success/20",
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  completed: "bg-muted text-muted-foreground border-muted",
}

export default function AdminBookingsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBooking, setSelectedBooking] = useState<typeof bookings[0] | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-8">
      <FadeIn>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Bookings</h1>
            <p className="mt-1 text-muted-foreground">
              Manage and track all customer bookings
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar View</span>
            </Button>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, service, or ID..."
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
                  <Badge variant="secondary" className="ml-1">
                    {statusFilter}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                All Statuses
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter("confirmed")}>
                Confirmed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("cancelled")}>
                Cancelled
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("completed")}>
                Completed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </FadeIn>

      <SlideIn direction="up" delay={0.2}>
        <div className="rounded-xl border bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Service</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
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
                      transition={{ delay: index * 0.05 }}
                      className="group cursor-pointer transition-colors hover:bg-muted/50"
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <TableCell className="font-mono text-sm">{booking.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={booking.customer.avatar || undefined} />
                            <AvatarFallback className="text-xs">
                              {booking.customer.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="hidden sm:block">
                            <p className="font-medium">{booking.customer.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {booking.customer.email}
                            </p>
                          </div>
                          <p className="font-medium sm:hidden">{booking.customer.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden max-w-[200px] truncate md:table-cell">
                        {booking.service}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {format(booking.date, "MMM d, yyyy")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(booking.date, "h:mm a")} · {booking.duration}m
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge
                          variant="outline"
                          className={statusColors[booking.status]}
                        >
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${booking.price}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Check className="mr-2 h-4 w-4" />
                              Confirm
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <X className="mr-2 h-4 w-4" />
                              Cancel
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>

          {filteredBookings.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-semibold">No bookings found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      </SlideIn>

      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              {selectedBooking?.id} · Created {selectedBooking && format(selectedBooking.date, "MMM d, yyyy")}
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <ScaleIn className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {selectedBooking.customer.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedBooking.customer.name}</h3>
                  <Badge
                    variant="outline"
                    className={statusColors[selectedBooking.status]}
                  >
                    {selectedBooking.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedBooking.customer.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedBooking.customer.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(selectedBooking.date, "EEEE, MMMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedBooking.duration} minutes</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedBooking.service}</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="text-xl font-bold">${selectedBooking.price}</span>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  Reschedule
                </Button>
                <Button className="flex-1">Send Reminder</Button>
              </div>
            </ScaleIn>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
