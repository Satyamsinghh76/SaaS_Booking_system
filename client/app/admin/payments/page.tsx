'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  DollarSign, TrendingUp, CreditCard, ArrowUpRight,
  Download, Search, Filter, MoreHorizontal, CheckCircle2, XCircle, Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { FadeIn, SlideIn, StaggerContainer, StaggerItem, MotionCard } from '@/components/ui/motion'
import { cn } from '@/lib/utils'

const stats = [
  { label: 'Total Revenue',    value: '$48,620', change: '+23.5%', icon: DollarSign, color: 'primary' },
  { label: 'This Month',       value: '$8,420',  change: '+12.1%', icon: TrendingUp, color: 'success' },
  { label: 'Pending Payouts',  value: '$1,240',  change: '3 items', icon: Clock,      color: 'chart-4' },
  { label: 'Avg. Transaction', value: '$48.18',  change: '+5.2%',  icon: CreditCard, color: 'chart-2' },
]

const payments = [
  { id: 'PAY001', customer: 'Sarah Johnson',  service: 'Strategy Consultation', date: new Date(2026, 2, 10), amount: 150, status: 'completed', method: 'Visa •• 4242' },
  { id: 'PAY002', customer: 'Marcus Chen',    service: 'Design Review',          date: new Date(2026, 2, 11), amount: 100, status: 'completed', method: 'Mastercard •• 1234' },
  { id: 'PAY003', customer: 'Emily Davis',    service: 'Technical Deep Dive',    date: new Date(2026, 2, 12), amount: 200, status: 'pending',   method: 'Visa •• 5678' },
  { id: 'PAY004', customer: 'David Kim',      service: 'Brand Workshop',         date: new Date(2026, 2, 12), amount: 300, status: 'completed', method: 'Amex •• 9012' },
  { id: 'PAY005', customer: 'Lisa Wang',      service: 'Growth Strategy',        date: new Date(2026, 2, 13), amount: 175, status: 'refunded',  method: 'Visa •• 3456' },
  { id: 'PAY006', customer: 'James Wilson',   service: 'Quick Sync',             date: new Date(2026, 2, 14), amount: 50,  status: 'completed', method: 'Mastercard •• 7890' },
  { id: 'PAY007', customer: 'Anna Rodriguez', service: 'Strategy Consultation',  date: new Date(2026, 2, 14), amount: 150, status: 'pending',   method: 'Visa •• 2345' },
]

const statusConfig = {
  completed: { label: 'Completed', icon: CheckCircle2, class: 'bg-success/10 text-success' },
  pending:   { label: 'Pending',   icon: Clock,        class: 'bg-chart-4/10 text-chart-4' },
  refunded:  { label: 'Refunded',  icon: XCircle,      class: 'bg-destructive/10 text-destructive' },
} as const

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState('')

  const filtered = payments.filter(p =>
    p.customer.toLowerCase().includes(search.toLowerCase()) ||
    p.service.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Payments</h1>
            <p className="mt-1 text-muted-foreground">Track revenue and transaction history.</p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </FadeIn>

      {/* Stats */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StaggerItem key={s.label}>
            <MotionCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn('p-2.5 rounded-xl',
                  s.color === 'primary' && 'bg-primary/10',
                  s.color === 'success' && 'bg-success/10',
                  s.color === 'chart-4' && 'bg-chart-4/10',
                  s.color === 'chart-2' && 'bg-chart-2/10',
                )}>
                  <s.icon className={cn('h-5 w-5',
                    s.color === 'primary' && 'text-primary',
                    s.color === 'success' && 'text-success',
                    s.color === 'chart-4' && 'text-chart-4',
                    s.color === 'chart-2' && 'text-chart-2',
                  )} />
                </div>
                <Badge variant="secondary" className="bg-success/10 text-success border-0 text-xs">
                  <ArrowUpRight className="h-3 w-3 mr-0.5 inline" />{s.change}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
            </MotionCard>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Table */}
      <SlideIn direction="up" delay={0.15}>
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="p-6 border-b flex flex-col sm:flex-row sm:items-center gap-4">
            <h2 className="text-lg font-semibold text-foreground flex-1">Transactions</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Service</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Method</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p, i) => {
                  const sc = statusConfig[p.status as keyof typeof statusConfig]
                  const Icon = sc.icon
                  return (
                    <motion.tr
                      key={p.id}
                      className="border-b transition-colors hover:bg-muted/30"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">{p.id}</TableCell>
                      <TableCell className="font-medium">{p.customer}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{p.service}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {format(p.date, 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="font-semibold">${p.amount}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn('border-0 gap-1', sc.class)}>
                          <Icon className="h-3 w-3" />{sc.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">{p.method}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View receipt</DropdownMenuItem>
                            <DropdownMenuItem>Send invoice</DropdownMenuItem>
                            {p.status === 'completed' && (
                              <DropdownMenuItem className="text-destructive">Issue refund</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </SlideIn>
    </div>
  )
}
