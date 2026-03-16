'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, CheckCheck, Calendar, Megaphone, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  link: string | null
  created_at: string
}

const typeIcons: Record<string, typeof Calendar> = {
  booking_confirmed: Calendar,
  booking_reminder: Bell,
  promotional: Megaphone,
  newsletter: Mail,
  info: Bell,
}

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifications = () => {
    api.get('/api/user/notifications')
      .then((res) => {
        setNotifications(res.data.data.notifications)
        setUnreadCount(res.data.data.unreadCount)
      })
      .catch(() => {})
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const markAsRead = (id: string) => {
    api.post(`/api/user/notifications/${id}/read`).then(fetchNotifications).catch(() => {})
  }

  const markAllRead = () => {
    api.post('/api/user/notifications/read-all').then(fetchNotifications).catch(() => {})
  }

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-12 w-80 sm:w-96 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-2xl shadow-stone-900/10 dark:shadow-black/30 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs font-medium text-lime-600 hover:text-lime-700 flex items-center gap-1 transition-colors"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-stone-400 dark:text-stone-500 text-sm">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-stone-300 dark:text-stone-600" />
                  No notifications yet
                </div>
              ) : (
                notifications.slice(0, 10).map((n) => {
                  const Icon = typeIcons[n.type] || Bell
                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (!n.read) markAsRead(n.id)
                        if (n.link) window.location.href = n.link
                        setOpen(false)
                      }}
                      className={cn(
                        'flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors border-b border-stone-50 dark:border-stone-800 last:border-0',
                        !n.read && 'bg-lime-50/40 dark:bg-lime-950/20'
                      )}
                    >
                      <div className={cn(
                        'p-2 rounded-xl shrink-0 mt-0.5',
                        !n.read ? 'bg-lime-100 text-lime-600' : 'bg-stone-100 text-stone-400'
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn('text-sm truncate', !n.read ? 'font-semibold text-stone-900 dark:text-stone-100' : 'text-stone-600 dark:text-stone-400')}>
                            {n.title}
                          </p>
                          {!n.read && <div className="w-2 h-2 rounded-full bg-lime-500 shrink-0" />}
                        </div>
                        <p className="text-xs text-stone-400 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-stone-300 mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
