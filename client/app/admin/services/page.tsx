'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Edit2, Trash2, Clock, DollarSign, MoreVertical,
  Sparkles, Package, ArrowUpRight, Loader2, AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { apiClient } from '@/lib/api/client'
import { cn } from '@/lib/utils'

const SERVICE_CATEGORIES = ['Consulting', 'Design', 'Development', 'Branding', 'Marketing', 'General']

interface Service {
  id: string
  name: string
  description: string
  duration_minutes: number
  price: number
  category: string
  is_active: boolean
}

const categoryGradients: Record<string, string> = {
  Consulting: 'from-violet-500 to-indigo-600',
  Design: 'from-rose-500 to-pink-600',
  Development: 'from-cyan-500 to-blue-600',
  Branding: 'from-amber-500 to-orange-600',
  Marketing: 'from-emerald-500 to-teal-600',
  General: 'from-slate-500 to-slate-700',
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editService, setEditService] = useState<Service | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({ name: '', description: '', duration: '', price: '', category: '' })

  const fetchServices = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/api/services')
      const raw = data.data || data.services || data || []
      setServices(raw.map((s: Record<string, unknown>) => ({ ...s, price: Number(s.price) || 0 })))
    } catch { /* empty */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchServices() }, [fetchServices])

  const categories = ['All', ...Array.from(new Set(services.map(s => s.category).filter(Boolean)))]

  const filteredServices = services.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCat = selectedCategory === 'All' || s.category === selectedCategory
    return matchesSearch && matchesCat
  })

  const resetForm = () => {
    setFormData({ name: '', description: '', duration: '', price: '', category: '' })
    setFormError('')
  }

  const openAdd = () => { resetForm(); setEditService(null); setIsAddOpen(true) }

  const openEdit = (s: Service) => {
    setFormData({
      name: s.name,
      description: s.description,
      duration: String(s.duration_minutes),
      price: String(s.price),
      category: s.category,
    })
    setEditService(s)
    setIsAddOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.duration || !formData.price) {
      setFormError('Name, duration, and price are required.')
      return
    }
    setFormLoading(true)
    setFormError('')
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        duration_minutes: Number(formData.duration),
        price: Number(formData.price),
        category: formData.category || 'General',
      }
      if (editService) {
        await apiClient.patch(`/api/services/${editService.id}`, payload)
      } else {
        await apiClient.post('/api/services', payload)
      }
      setIsAddOpen(false)
      resetForm()
      setEditService(null)
      fetchServices()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setFormError(msg || 'Failed to save service.')
    } finally { setFormLoading(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/api/services/${id}`)
      setServices(prev => prev.filter(s => s.id !== id))
      setDeleteConfirm(null)
      fetchServices()
    } catch { /* ignore */ }
  }

  const totalRevenue = services.reduce((s, svc) => s + svc.price, 0)

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <motion.div className="flex items-center gap-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 dark:from-primary/30 dark:to-violet-500/30">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">Services</h1>
          </motion.div>
          <motion.p className="text-stone-500 dark:text-stone-400 mt-1.5 ml-[52px]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            Manage your service offerings and pricing
          </motion.p>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Button onClick={openAdd} className="rounded-xl bg-stone-900 text-white dark:bg-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 gap-2 shadow-lg shadow-stone-900/10 dark:shadow-white/10">
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        </motion.div>
      </div>

      {/* ── Stats Row ───────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Services', value: String(services.length), icon: Package, bg: 'bg-violet-50 dark:bg-violet-950/30', color: 'text-violet-600 dark:text-violet-400', gradient: 'from-violet-500 to-indigo-600' },
          { label: 'Active', value: String(services.filter(s => s.is_active).length), icon: Sparkles, bg: 'bg-emerald-50 dark:bg-emerald-950/30', color: 'text-emerald-600 dark:text-emerald-400', gradient: 'from-emerald-500 to-teal-600' },
          { label: 'Categories', value: String(new Set(services.map(s => s.category).filter(Boolean)).size), icon: ArrowUpRight, bg: 'bg-cyan-50 dark:bg-cyan-950/30', color: 'text-cyan-600 dark:text-cyan-400', gradient: 'from-cyan-500 to-blue-600' },
          { label: 'Avg. Price', value: services.length ? `$${Math.round(totalRevenue / services.length)}` : '$0', icon: DollarSign, bg: 'bg-amber-50 dark:bg-amber-950/30', color: 'text-amber-600 dark:text-amber-400', gradient: 'from-amber-500 to-orange-600' },
        ].map((stat) => (
          <div key={stat.label} className="card-glow p-4 rounded-2xl border bg-white dark:bg-stone-900/80 border-stone-200/80 dark:border-white/10 relative overflow-hidden">
            <div className={cn('absolute top-0 left-0 right-0 h-1 bg-gradient-to-r', stat.gradient)} />
            <div className={cn('p-2 rounded-xl w-fit mb-2', stat.bg)}>
              <stat.icon className={cn('h-4 w-4', stat.color)} />
            </div>
            <p className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">{stat.value}</p>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{stat.label}</p>
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
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="w-px h-8 bg-border/50 hidden sm:block" />
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'rounded-lg text-xs h-8 px-3.5 shrink-0 transition-all',
                selectedCategory === cat
                  ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-sm'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
              )}
            >
              {cat}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* ── Services Grid ───────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {filteredServices.length > 0 ? (
            <motion.div
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {filteredServices.map((service, i) => {
                const gradient = categoryGradients[service.category] || categoryGradients.General
                return (
                  <motion.div
                    key={service.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className="card-glow group relative flex flex-col rounded-2xl border bg-white dark:bg-stone-900/80 border-stone-200/80 dark:border-white/10 hover:border-primary/30 dark:hover:border-primary/40 overflow-hidden transition-all duration-300"
                  >
                    {/* Gradient header */}
                    <div className={cn('h-2 bg-gradient-to-r', gradient)} />

                    {/* Actions dropdown */}
                    <div className="absolute right-3 top-5 z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-lg z-50">
                          <DropdownMenuItem onClick={() => openEdit(service)}>
                            <Edit2 className="mr-2 h-3.5 w-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 dark:text-red-400" onClick={() => setDeleteConfirm(service.id)}>
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={cn('p-2.5 rounded-xl bg-gradient-to-br shadow-md shrink-0', gradient)}>
                          <Package className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-stone-900 dark:text-stone-100 group-hover:text-primary transition-colors truncate">
                            {service.name}
                          </h3>
                          <Badge className={cn('mt-1.5 text-[10px] border-0 font-medium', service.is_active
                            ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                            : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'
                          )}>
                            {service.is_active ? 'Active' : 'Draft'}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-2 flex-1 mb-4">
                        {service.description}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-dashed border-stone-200 dark:border-white/10">
                        <div className="flex items-center gap-4 text-sm text-stone-500 dark:text-stone-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {service.duration_minutes}m
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5" />
                            {service.price}
                          </span>
                        </div>
                        <Badge variant="secondary" className="bg-primary/5 text-primary dark:bg-primary/10 border-0 text-xs">
                          {service.category}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-4">
                <Search className="h-7 w-7 text-stone-400" />
              </div>
              <p className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-1">No services found</p>
              <p className="text-stone-500 dark:text-stone-400 mb-6">Try adjusting your search or filter criteria.</p>
              <Button variant="outline" className="rounded-xl" onClick={() => { setSearchQuery(''); setSelectedCategory('All') }}>
                Clear filters
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ── Add / Edit Dialog ───────────────────────────────────── */}
      <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) { resetForm(); setEditService(null) } }}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-stone-900 dark:text-stone-100">
              {editService ? 'Edit Service' : 'Add New Service'}
            </DialogTitle>
            <DialogDescription>
              {editService ? 'Update the service details below.' : 'Create a new service offering for your customers.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Service Name</Label>
              <Input placeholder="e.g., Business Consultation" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="rounded-xl h-11" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <textarea
                placeholder="Describe your service..."
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px] resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Duration (min)</Label>
                <Input type="number" placeholder="60" value={formData.duration} onChange={e => setFormData(p => ({ ...p, duration: e.target.value }))} className="rounded-xl h-11" />
              </div>
              <div className="space-y-1.5">
                <Label>Price ($)</Label>
                <Input type="number" placeholder="100" value={formData.price} onChange={e => setFormData(p => ({ ...p, price: e.target.value }))} className="rounded-xl h-11" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(val) => setFormData(p => ({ ...p, category: val }))}>
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl">
                  {SERVICE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSubmit} disabled={formLoading} className="rounded-xl bg-stone-900 text-white dark:bg-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200">
              {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : editService ? 'Save Changes' : 'Create Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ─────────────────────────────────── */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null) }}>
        <DialogContent className="sm:max-w-[400px] bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-stone-900 dark:text-stone-100">Delete Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this service? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="rounded-xl">Cancel</Button>
            <Button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="rounded-xl bg-red-600 hover:bg-red-700 text-white">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
