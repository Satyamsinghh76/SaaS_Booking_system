import { create } from 'zustand'
import type { User } from './api/auth'
import api from './api'

export interface Service {
  id: string
  name: string
  description: string
  duration: number
  price: number
  category: string
  image?: string
}

export interface TimeSlot {
  id: string
  time: string
  available: boolean
}

export interface Booking {
  id: string
  serviceId: string
  serviceName: string
  date: string
  time: string
  status: 'upcoming' | 'completed' | 'cancelled'
  customerName?: string
  customerEmail?: string
  price: number
}

interface BookingState {
  // Services
  services: Service[]
  setServices: (services: Service[]) => void
  selectedService: Service | null
  setSelectedService: (service: Service | null) => void
  
  // Booking flow
  selectedDate: Date | null
  selectedSlot: TimeSlot | null
  setSelectedDate: (date: Date | null) => void
  setSelectedSlot: (slot: TimeSlot | null) => void
  
  // User bookings
  bookings: Booking[]
  addBooking: (booking: Booking) => void
  cancelBooking: (id: string) => void
  
  // UI state
  isBookingModalOpen: boolean
  setBookingModalOpen: (open: boolean) => void
  
  // Mobile menu
  isMobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void

  // Auth
  currentUser: User | null
  setCurrentUser: (user: User) => void
  clearAuth: () => void
}

// Sample services data
const sampleServices: Service[] = [
  {
    id: '1',
    name: 'Strategy Consultation',
    description: 'One-on-one strategic planning session to align your business goals.',
    duration: 60,
    price: 150,
    category: 'Consulting',
  },
  {
    id: '2',
    name: 'Design Review',
    description: 'Expert review of your designs with actionable feedback.',
    duration: 45,
    price: 100,
    category: 'Design',
  },
  {
    id: '3',
    name: 'Technical Deep Dive',
    description: 'In-depth technical analysis and architecture review.',
    duration: 90,
    price: 200,
    category: 'Development',
  },
  {
    id: '4',
    name: 'Brand Workshop',
    description: 'Collaborative workshop to define your brand identity.',
    duration: 120,
    price: 300,
    category: 'Branding',
  },
  {
    id: '5',
    name: 'Growth Strategy',
    description: 'Develop a comprehensive growth plan for your business.',
    duration: 60,
    price: 175,
    category: 'Marketing',
  },
  {
    id: '6',
    name: 'Quick Sync',
    description: 'Brief check-in for ongoing projects and updates.',
    duration: 30,
    price: 50,
    category: 'General',
  },
]

// Sample bookings data
const sampleBookings: Booking[] = [
  {
    id: '1',
    serviceId: '1',
    serviceName: 'Strategy Consultation',
    date: '2026-03-15',
    time: '10:00 AM',
    status: 'upcoming',
    price: 150,
  },
  {
    id: '2',
    serviceId: '2',
    serviceName: 'Design Review',
    date: '2026-03-18',
    time: '2:00 PM',
    status: 'upcoming',
    price: 100,
  },
  {
    id: '3',
    serviceId: '3',
    serviceName: 'Technical Deep Dive',
    date: '2026-03-10',
    time: '11:00 AM',
    status: 'completed',
    price: 200,
  },
]

export const useBookingStore = create<BookingState>((set) => ({
  services: sampleServices,
  setServices: (services) => set({ services }),
  selectedService: null,
  setSelectedService: (service) => set({ selectedService: service }),
  
  selectedDate: null,
  selectedSlot: null,
  setSelectedDate: (date) => set({ selectedDate: date, selectedSlot: null }),
  setSelectedSlot: (slot) => set({ selectedSlot: slot }),
  
  bookings: sampleBookings,
  addBooking: (booking) => set((state) => ({ 
    bookings: [...state.bookings, booking] 
  })),
  cancelBooking: (id) => set((state) => ({
    bookings: state.bookings.map((b) => 
      b.id === id ? { ...b, status: 'cancelled' as const } : b
    ),
  })),
  
  isBookingModalOpen: false,
  setBookingModalOpen: (open) => set({ isBookingModalOpen: open }),
  
  isMobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),

  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  clearAuth: () => set({ currentUser: null }),
}))

interface LegacyAuthUser {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'provider' | 'customer'
  avatar_url?: string
}

interface LegacyRegisterData {
  email: string
  password: string
  first_name: string
  last_name: string
  role?: 'customer' | 'provider'
}

interface LegacyAuthState {
  user: LegacyAuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: LegacyRegisterData) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
}

const toLegacyUser = (user: User): LegacyAuthUser => {
  const [firstName = '', ...rest] = (user.name || '').trim().split(' ')
  return {
    id: user.id,
    email: user.email,
    first_name: firstName,
    last_name: rest.join(' '),
    role: user.role === 'admin' ? 'admin' : 'customer',
  }
}

export const useAuthStore = create<LegacyAuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const user = await api.auth.login({ email, password })
      set({ user: toLegacyUser(user), isAuthenticated: true })
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (payload) => {
    set({ isLoading: true })
    try {
      const user = await api.auth.signup({
        name: `${payload.first_name} ${payload.last_name}`.trim(),
        email: payload.email,
        password: payload.password,
      })
      set({ user: toLegacyUser(user), isAuthenticated: true })
    } finally {
      set({ isLoading: false })
    }
  },

  logout: async () => {
    try {
      await api.auth.logout()
    } finally {
      set({ user: null, isAuthenticated: false })
    }
  },

  fetchMe: async () => {
    set({ isLoading: true })
    try {
      const user = await api.auth.getMe()
      set({ user: toLegacyUser(user), isAuthenticated: true })
    } catch {
      set({ user: null, isAuthenticated: false })
    } finally {
      set({ isLoading: false })
    }
  },
}))

// Helper to generate time slots — deterministic based on date string
export function generateTimeSlots(date: Date): TimeSlot[] {
  const slots: TimeSlot[] = []
  const hours = [9, 10, 11, 13, 14, 15, 16, 17]
  // Simple seeded pseudo-random using date value so slots are stable across renders
  const seed = date.getDate() + date.getMonth() * 31

  hours.forEach((hour, index) => {
    const pseudo = Math.sin(seed * 9301 + index * 49297) * 0.5 + 0.5
    const isAvailable = pseudo > 0.3 // ~70% availability
    const time = hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`
    slots.push({
      id: `slot-${index}`,
      time,
      available: isAvailable,
    })
  })

  return slots
}
