"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import {
  Search,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  UserPlus,
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
import { FadeIn, StaggerContainer, StaggerItem, MotionCard, ScaleIn } from "@/components/ui/motion"

const customers = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    phone: "+1 (555) 123-4567",
    avatar: null,
    totalBookings: 12,
    totalSpent: 1850,
    lastBooking: new Date(2024, 11, 15),
    status: "active",
    joinedAt: new Date(2024, 5, 10),
  },
  {
    id: 2,
    name: "Michael Chen",
    email: "m.chen@company.com",
    phone: "+1 (555) 234-5678",
    avatar: null,
    totalBookings: 8,
    totalSpent: 1200,
    lastBooking: new Date(2024, 11, 18),
    status: "active",
    joinedAt: new Date(2024, 7, 22),
  },
  {
    id: 3,
    name: "Emily Davis",
    email: "emily.d@startup.io",
    phone: "+1 (555) 345-6789",
    avatar: null,
    totalBookings: 15,
    totalSpent: 3200,
    lastBooking: new Date(2024, 11, 19),
    status: "vip",
    joinedAt: new Date(2024, 2, 5),
  },
  {
    id: 4,
    name: "James Wilson",
    email: "jwilson@enterprise.com",
    phone: "+1 (555) 456-7890",
    avatar: null,
    totalBookings: 3,
    totalSpent: 425,
    lastBooking: new Date(2024, 10, 28),
    status: "inactive",
    joinedAt: new Date(2024, 8, 15),
  },
  {
    id: 5,
    name: "Lisa Anderson",
    email: "l.anderson@design.co",
    phone: "+1 (555) 567-8901",
    avatar: null,
    totalBookings: 20,
    totalSpent: 4500,
    lastBooking: new Date(2024, 11, 20),
    status: "vip",
    joinedAt: new Date(2024, 1, 20),
  },
  {
    id: 6,
    name: "David Brown",
    email: "d.brown@tech.io",
    phone: "+1 (555) 678-9012",
    avatar: null,
    totalBookings: 6,
    totalSpent: 900,
    lastBooking: new Date(2024, 11, 10),
    status: "active",
    joinedAt: new Date(2024, 6, 8),
  },
]

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  vip: "bg-primary/10 text-primary border-primary/20",
  inactive: "bg-muted text-muted-foreground border-muted",
}

export default function AdminCustomersPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalCustomers = customers.length
  const activeCustomers = customers.filter((c) => c.status !== "inactive").length
  const vipCustomers = customers.filter((c) => c.status === "vip").length
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)

  return (
    <div className="space-y-8">
      <FadeIn>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Customers</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your customer relationships
            </p>
          </div>
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </FadeIn>

      <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Customers",
            value: totalCustomers,
            icon: TrendingUp,
            change: "+12%",
          },
          {
            label: "Active Customers",
            value: activeCustomers,
            icon: TrendingUp,
            change: "+8%",
          },
          {
            label: "VIP Customers",
            value: vipCustomers,
            icon: TrendingUp,
            change: "+2",
          },
          {
            label: "Total Revenue",
            value: `$${totalRevenue.toLocaleString()}`,
            icon: TrendingUp,
            change: "+18%",
          },
        ].map((stat, index) => (
          <StaggerItem key={index}>
            <MotionCard className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <Badge variant="secondary" className="text-xs text-success">
                  {stat.change}
                </Badge>
              </div>
              <p className="mt-2 text-2xl font-bold">{stat.value}</p>
            </MotionCard>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <FadeIn delay={0.2}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search customers by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </FadeIn>

      <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filteredCustomers.map((customer, index) => (
            <StaggerItem key={customer.id}>
              <MotionCard
                className="group relative overflow-hidden"
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="absolute right-3 top-3 z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuItem>View Bookings</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Send Email</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={customer.avatar || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {customer.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-semibold">{customer.name}</h3>
                        <Badge
                          variant="outline"
                          className={statusColors[customer.status]}
                        >
                          {customer.status}
                        </Badge>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {customer.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{customer.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Last booking: {format(customer.lastBooking, "MMM d, yyyy")}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t pt-4">
                    <div className="text-center">
                      <p className="text-lg font-bold">{customer.totalBookings}</p>
                      <p className="text-xs text-muted-foreground">Bookings</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">${customer.totalSpent}</p>
                      <p className="text-xs text-muted-foreground">Total Spent</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">
                        ${Math.round(customer.totalSpent / customer.totalBookings)}
                      </p>
                      <p className="text-xs text-muted-foreground">Avg. Value</p>
                    </div>
                  </div>
                </div>

                <motion.div
                  className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
                  initial={false}
                />
              </MotionCard>
            </StaggerItem>
          ))}
        </AnimatePresence>
      </StaggerContainer>

      {filteredCustomers.length === 0 && (
        <ScaleIn>
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
            <div className="rounded-full bg-muted p-3">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-semibold">No customers found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search criteria
            </p>
          </div>
        </ScaleIn>
      )}
    </div>
  )
}
