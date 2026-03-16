"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { User, Bell, Shield, CreditCard, Save, Camera, Loader2, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FadeIn, SlideIn, MotionCard } from "@/components/ui/motion"
import { useBookingStore } from "@/lib/store"
import api from "@/lib/api"
import { format } from "date-fns"

interface PaymentMethod {
  id: string
  card_type: string
  last4: string
  expiry_month: number
  expiry_year: number
}

interface BillingRecord {
  id: string
  service_name: string
  amount: number | string
  date: string
  status: string
  paid_at: string | null
}

export default function UserSettingsPage() {
  const { currentUser } = useBookingStore()

  const nameParts = (currentUser?.name || '').trim().split(/\s+/)
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''
  const initials = (firstName[0] || '') + (lastName[0] || firstName[1] || '')
  const memberSince = currentUser?.created_at
    ? new Date(currentUser.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : ''

  return (
    <div className="space-y-8">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-stone-900">Settings</h1>
          <p className="mt-1 text-stone-500">Manage your account preferences</p>
        </div>
      </FadeIn>

      <SlideIn direction="up" delay={0.1}>
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="flex h-auto flex-wrap gap-2 bg-transparent p-0">
            {[
              { value: "profile", label: "Profile", icon: User },
              { value: "notifications", label: "Notifications", icon: Bell },
              { value: "security", label: "Security", icon: Shield },
              { value: "billing", label: "Billing", icon: CreditCard },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="gap-2 rounded-xl border bg-white px-4 py-2 text-stone-600 data-[state=active]:border-lime-500 data-[state=active]:bg-lime-50 data-[state=active]:text-lime-700 shadow-sm"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── Profile Tab ──────────────────────────────────────── */}
          <TabsContent value="profile" className="space-y-6">
            <ProfileTab
              currentUser={currentUser}
              firstName={firstName}
              lastName={lastName}
              initials={initials}
              memberSince={memberSince}
            />
          </TabsContent>

          {/* ── Notifications Tab ────────────────────────────────── */}
          <TabsContent value="notifications" className="space-y-6">
            <NotificationsTab />
          </TabsContent>

          {/* ── Security Tab ─────────────────────────────────────── */}
          <TabsContent value="security" className="space-y-6">
            <SecurityTab />
          </TabsContent>

          {/* ── Billing Tab ──────────────────────────────────────── */}
          <TabsContent value="billing" className="space-y-6">
            <BillingTab />
          </TabsContent>
        </Tabs>
      </SlideIn>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Profile Tab
// ═══════════════════════════════════════════════════════════════

function ProfileTab({ currentUser, firstName, lastName, initials, memberSince }: {
  currentUser: { name: string; email: string; created_at: string } | null
  firstName: string; lastName: string; initials: string; memberSince: string
}) {
  return (
    <MotionCard className="p-6 bg-white rounded-2xl border border-stone-200/80 shadow-sm">
      <h2 className="mb-6 flex items-center gap-2 font-bold text-stone-900">
        <User className="h-5 w-5 text-lime-600" />
        Personal Information
      </h2>
      <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row">
        <div className="relative">
          <Avatar className="h-24 w-24">
            <AvatarImage src="" />
            <AvatarFallback className="bg-gradient-to-br from-lime-400 to-emerald-500 text-2xl text-white font-bold">
              {initials.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Button size="icon" variant="outline" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-white">
            <Camera className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-center sm:text-left">
          <h3 className="font-bold text-stone-900">{currentUser?.name || 'User'}</h3>
          <p className="text-sm text-stone-500">{currentUser?.email || ''}</p>
          {memberSince && <p className="mt-1 text-xs text-stone-400">Member since {memberSince}</p>}
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-stone-500 uppercase tracking-wider">First Name</Label>
          <Input defaultValue={firstName} key={firstName} className="h-11 rounded-xl border-stone-200 bg-stone-50/60" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-stone-500 uppercase tracking-wider">Last Name</Label>
          <Input defaultValue={lastName} key={lastName} className="h-11 rounded-xl border-stone-200 bg-stone-50/60" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-stone-500 uppercase tracking-wider">Email</Label>
          <Input defaultValue={currentUser?.email || ''} key={currentUser?.email} className="h-11 rounded-xl border-stone-200 bg-stone-50/60" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-stone-500 uppercase tracking-wider">Phone Number</Label>
          <Input placeholder="Enter your phone number" className="h-11 rounded-xl border-stone-200 bg-stone-50/60" />
        </div>
      </div>
    </MotionCard>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Notifications Tab
// ═══════════════════════════════════════════════════════════════

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  created_at: string
}

const notifTypeIcons: Record<string, { bg: string; color: string }> = {
  booking_confirmed: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', color: 'text-emerald-600 dark:text-emerald-400' },
  booking_completed: { bg: 'bg-blue-50 dark:bg-blue-950/30', color: 'text-blue-600 dark:text-blue-400' },
  booking_cancelled: { bg: 'bg-red-50 dark:bg-red-950/30', color: 'text-red-600 dark:text-red-400' },
  booking_reminder:  { bg: 'bg-amber-50 dark:bg-amber-950/30', color: 'text-amber-600 dark:text-amber-400' },
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    bookingConfirmations: true,
    bookingReminders: true,
    promotional: false,
    newsletter: false,
  })
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loadingNotifs, setLoadingNotifs] = useState(true)

  useEffect(() => {
    api.get('/api/user/notifications')
      .then(({ data }) => {
        const notifs = data?.data?.notifications || data?.notifications || []
        setNotifications(Array.isArray(notifs) ? notifs : [])
      })
      .catch(() => {})
      .finally(() => setLoadingNotifs(false))
  }, [])

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/api/user/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch { /* ignore */ }
  }

  const markAllRead = async () => {
    try {
      await api.post('/api/user/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch { /* ignore */ }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="space-y-6">
      {/* Notification Preferences */}
      <MotionCard className="p-6 bg-white dark:bg-stone-900/80 rounded-2xl border border-stone-200/80 dark:border-white/10 shadow-sm">
        <h2 className="mb-6 flex items-center gap-2 font-bold text-stone-900 dark:text-stone-100">
          <Bell className="h-5 w-5 text-lime-600" />
          Notification Preferences
        </h2>
        <div className="space-y-5">
          {[
            { key: 'bookingConfirmations' as const, label: 'Booking Confirmations', desc: 'Receive notification when your booking is confirmed' },
            { key: 'bookingReminders' as const, label: 'Booking Reminders', desc: 'Get reminded before your appointment' },
            { key: 'promotional' as const, label: 'Promotional Updates', desc: 'Receive updates about new services and offers' },
            { key: 'newsletter' as const, label: 'Weekly Tips & Newsletter', desc: 'Weekly tips and insights delivered to your inbox' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-stone-50/50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-700/50">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium text-stone-800 dark:text-stone-200">{item.label}</Label>
                <p className="text-xs text-stone-400 dark:text-stone-500">{item.desc}</p>
              </div>
              <Switch
                checked={prefs[item.key]}
                onCheckedChange={(checked) => setPrefs(p => ({ ...p, [item.key]: checked }))}
                className="data-[state=checked]:bg-lime-500"
              />
            </div>
          ))}
        </div>
      </MotionCard>

      {/* Recent Notifications */}
      <MotionCard className="p-6 bg-white dark:bg-stone-900/80 rounded-2xl border border-stone-200/80 dark:border-white/10 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="flex items-center gap-2 font-bold text-stone-900 dark:text-stone-100">
            <Bell className="h-5 w-5 text-lime-600" />
            Recent Notifications
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-lime-500 text-white">{unreadCount}</span>
            )}
          </h2>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200">
              Mark all read
            </Button>
          )}
        </div>

        {loadingNotifs ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-8 w-8 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
            <p className="text-sm text-stone-500 dark:text-stone-400">No notifications yet</p>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">You&apos;ll see booking updates here</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {notifications.map((notif) => {
              const style = notifTypeIcons[notif.type] || { bg: 'bg-stone-50 dark:bg-stone-800', color: 'text-stone-500' }
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => !notif.read && markAsRead(notif.id)}
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                    notif.read
                      ? 'bg-stone-50/30 dark:bg-stone-800/20 border-stone-100 dark:border-stone-700/30'
                      : 'bg-white dark:bg-stone-800/60 border-stone-200 dark:border-stone-600/50 shadow-sm'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${style.bg}`}>
                    <Bell className={`h-4 w-4 ${style.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${notif.read ? 'text-stone-500 dark:text-stone-400' : 'text-stone-900 dark:text-stone-100'}`}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-lime-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5 line-clamp-2">{notif.message}</p>
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1.5">
                      {format(new Date(notif.created_at), 'MMM d, yyyy · h:mm a')}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </MotionCard>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Security Tab — Change Password
// ═══════════════════════════════════════════════════════════════

function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChanging, setIsChanging] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleChangePassword = async () => {
    setMessage(null)
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters.' })
      return
    }
    setIsChanging(true)
    try {
      await api.post('/api/user/change-password', { currentPassword, newPassword })
      setMessage({ type: 'success', text: 'Password updated successfully!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password.' })
    } finally {
      setIsChanging(false)
    }
  }

  return (
    <MotionCard className="p-6 bg-white rounded-2xl border border-stone-200/80 shadow-sm">
      <h2 className="mb-6 flex items-center gap-2 font-bold text-stone-900">
        <Shield className="h-5 w-5 text-lime-600" />
        Change Password
      </h2>

      {message && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-4 sm:max-w-md">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-stone-500 uppercase tracking-wider">Current Password</Label>
          <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="h-11 rounded-xl border-stone-200 bg-stone-50/60" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-stone-500 uppercase tracking-wider">New Password</Label>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-11 rounded-xl border-stone-200 bg-stone-50/60" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-stone-500 uppercase tracking-wider">Confirm New Password</Label>
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-11 rounded-xl border-stone-200 bg-stone-50/60" />
        </div>
        <Button
          onClick={handleChangePassword}
          disabled={isChanging || !currentPassword || !newPassword || !confirmPassword}
          className="w-fit bg-stone-900 hover:bg-stone-800 text-white rounded-xl"
        >
          {isChanging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Update Password
        </Button>
      </div>
    </MotionCard>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Billing Tab — Payment Methods + History
// ═══════════════════════════════════════════════════════════════

function BillingTab() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [history, setHistory] = useState<BillingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddCard, setShowAddCard] = useState(false)
  const [newCard, setNewCard] = useState({ cardType: 'visa', last4: '', expiryMonth: '', expiryYear: '' })
  const [adding, setAdding] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get('/api/user/payment-methods').catch(() => ({ data: { data: [] } })),
      api.get('/api/user/billing-history').catch(() => ({ data: { data: [] } })),
    ]).then(([mRes, bRes]) => {
      setMethods(mRes.data.data)
      setHistory(bRes.data.data)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const addCard = async () => {
    setAdding(true)
    try {
      await api.post('/api/user/payment-methods', {
        cardType: newCard.cardType,
        last4: newCard.last4,
        expiryMonth: parseInt(newCard.expiryMonth),
        expiryYear: parseInt(newCard.expiryYear),
      })
      setShowAddCard(false)
      setNewCard({ cardType: 'visa', last4: '', expiryMonth: '', expiryYear: '' })
      load()
    } catch { }
    finally { setAdding(false) }
  }

  const removeCard = async (id: string) => {
    await api.delete(`/api/user/payment-methods/${id}`).catch(() => {})
    load()
  }

  return (
    <>
      {/* Payment Methods */}
      <MotionCard className="p-6 bg-white rounded-2xl border border-stone-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="flex items-center gap-2 font-bold text-stone-900">
            <CreditCard className="h-5 w-5 text-lime-600" />
            Payment Methods
          </h2>
          <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => setShowAddCard(!showAddCard)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Card
          </Button>
        </div>

        {showAddCard && (
          <div className="mb-5 p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] text-stone-400 uppercase">Card Type</Label>
                <select title="Card type" value={newCard.cardType} onChange={(e) => setNewCard(c => ({ ...c, cardType: e.target.value }))} className="w-full h-10 rounded-lg border border-stone-200 bg-white text-sm px-2">
                  <option value="visa">Visa</option>
                  <option value="mastercard">Mastercard</option>
                  <option value="amex">Amex</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-stone-400 uppercase">Last 4 Digits</Label>
                <Input value={newCard.last4} onChange={(e) => setNewCard(c => ({ ...c, last4: e.target.value.replace(/\D/g, '').slice(0, 4) }))} placeholder="4242" maxLength={4} className="h-10 rounded-lg" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-stone-400 uppercase">Month</Label>
                <Input value={newCard.expiryMonth} onChange={(e) => setNewCard(c => ({ ...c, expiryMonth: e.target.value }))} placeholder="12" maxLength={2} className="h-10 rounded-lg" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-stone-400 uppercase">Year</Label>
                <Input value={newCard.expiryYear} onChange={(e) => setNewCard(c => ({ ...c, expiryYear: e.target.value }))} placeholder="2026" maxLength={4} className="h-10 rounded-lg" />
              </div>
            </div>
            <Button onClick={addCard} disabled={adding || newCard.last4.length !== 4} size="sm" className="bg-stone-900 hover:bg-stone-800 text-white rounded-lg">
              {adding ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save Card
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            <div className="py-6 text-center text-stone-400 text-sm">Loading...</div>
          ) : methods.length === 0 ? (
            <div className="py-6 text-center text-stone-400 text-sm">No payment methods added yet.</div>
          ) : (
            methods.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-xl border border-stone-200 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-stone-700 to-stone-900">
                    <span className="text-[10px] font-bold text-white uppercase">{m.card_type}</span>
                  </div>
                  <div>
                    <p className="font-medium text-stone-800 text-sm capitalize">{m.card_type} ending in {m.last4}</p>
                    <p className="text-xs text-stone-400">Expires {String(m.expiry_month).padStart(2, '0')}/{m.expiry_year}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-stone-400 hover:text-red-600" onClick={() => removeCard(m.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </MotionCard>

      {/* Billing History */}
      <MotionCard className="p-6 bg-white rounded-2xl border border-stone-200/80 shadow-sm">
        <h2 className="mb-5 font-bold text-stone-900">Billing History</h2>
        <div className="space-y-3">
          {loading ? (
            <div className="py-6 text-center text-stone-400 text-sm">Loading...</div>
          ) : history.length === 0 ? (
            <div className="py-6 text-center text-stone-400 text-sm">No billing records yet. Payments from bookings will appear here.</div>
          ) : (
            history.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between rounded-xl border border-stone-200 p-4">
                <div>
                  <p className="font-medium text-stone-800 text-sm">{invoice.service_name}</p>
                  <p className="text-xs text-stone-400">
                    {invoice.paid_at ? format(new Date(invoice.paid_at), 'MMM d, yyyy') : invoice.date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-stone-900 text-sm">${parseFloat(invoice.amount as string).toFixed(2)}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Paid
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </MotionCard>
    </>
  )
}
