'use client'

import { useState, useMemo, Suspense, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addDays, isSameDay } from 'date-fns'
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  Loader2
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useBookingStore, generateTimeSlots, type TimeSlot } from '@/lib/store'
import { fetchServices } from '@/lib/api'
import { PageTransition } from '@/components/ui/motion'
import { cn } from '@/lib/utils'

function BookingContent() {
  const searchParams = useSearchParams()
  const serviceIdParam = searchParams.get('service')
  
  const { 
    services,
    setServices,
    selectedService, 
    setSelectedService,
    selectedDate,
    selectedSlot,
    setSelectedDate,
    setSelectedSlot,
    addBooking,
  } = useBookingStore()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isConfirming, setIsConfirming] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [customerInfo, setCustomerInfo] = useState({ name: '', email: '' })

  // Initialize selected service from URL param
  useEffect(() => {
    if (serviceIdParam && !selectedService) {
      const service = services.find(s => s.id === serviceIdParam)
      if (service) setSelectedService(service)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceIdParam])

  // fetch services from backend and display them as cards
  const [loadingServices, setLoadingServices] = useState(true)
  const [servicesError, setServicesError] = useState('')

  const loadServices = useCallback(() => {
    setLoadingServices(true)
    setServicesError('')
    fetchServices()
      .then(({ services: apiServices }) =>
        setServices(
          apiServices.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description ?? '',
            duration: s.duration_minutes,
            price: s.price,
            category: '',
          }))
        )
      )
      .catch(() => setServicesError('Failed to load services. Please try again.'))
      .finally(() => setLoadingServices(false))
  }, [setServices])

  useEffect(() => {
    loadServices()
  }, [loadServices])

  // Generate dates for the next 14 days
  const availableDates = useMemo(() => {
    const dates = []
    for (let i = 0; i < 14; i++) {
      dates.push(addDays(new Date(), i))
    }
    return dates
  }, [])

  // Generate time slots for selected date
  const timeSlots = useMemo(() => {
    if (!selectedDate) return []
    return generateTimeSlots(selectedDate)
  }, [selectedDate])

  const handleServiceSelect = (service: typeof services[0]) => {
    setSelectedService(service)
    setStep(2)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const handleSlotSelect = (slot: TimeSlot) => {
    if (!slot.available) return
    setSelectedSlot(slot)
    setStep(3)
  }

  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedDate || !selectedSlot) return
    
    setIsConfirming(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    addBooking({
      id: Date.now().toString(),
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: selectedSlot.time,
      status: 'upcoming',
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      price: selectedService.price,
    })
    
    setIsConfirming(false)
    setShowConfirmation(true)
  }

  const resetBooking = () => {
    setSelectedService(null)
    setSelectedDate(null)
    setSelectedSlot(null)
    setStep(1)
    setShowConfirmation(false)
    setCustomerInfo({ name: '', email: '' })
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <PageTransition>
        <main className="pt-24 pb-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-12">
              <motion.h1 
                className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Book your appointment
              </motion.h1>
              <motion.p 
                className="mt-4 text-lg text-muted-foreground"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                Select a service, pick your preferred time, and confirm your booking.
              </motion.p>
            </div>

            {/* Progress steps */}
            <motion.div 
              className="flex items-center justify-center gap-4 mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {[
                { num: 1, label: 'Service' },
                { num: 2, label: 'Date & Time' },
                { num: 3, label: 'Confirm' },
              ].map((s, index) => (
                <div key={s.num} className="flex items-center">
                  <motion.div 
                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-full font-medium transition-all',
                      step >= s.num 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    )}
                    animate={step === s.num ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {step > s.num ? <Check className="h-5 w-5" /> : s.num}
                  </motion.div>
                  <span className={cn(
                    'ml-2 text-sm font-medium hidden sm:inline',
                    step >= s.num ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {s.label}
                  </span>
                  {index < 2 && (
                    <div className={cn(
                      'w-12 sm:w-20 h-0.5 mx-4 transition-colors',
                      step > s.num ? 'bg-primary' : 'bg-muted'
                    )} />
                  )}
                </div>
              ))}
            </motion.div>

            {/* Content */}
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  {/* Loading skeleton cards */}
                  {loadingServices && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="p-6 bg-card rounded-xl border animate-pulse">
                          <div className="h-5 w-24 bg-muted rounded mb-3" />
                          <div className="h-5 w-3/4 bg-muted rounded mb-2" />
                          <div className="h-4 w-full bg-muted rounded mb-1" />
                          <div className="h-4 w-2/3 bg-muted rounded mb-4" />
                          <div className="flex gap-4">
                            <div className="h-4 w-20 bg-muted rounded" />
                            <div className="h-4 w-16 bg-muted rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Error state with retry */}
                  {!loadingServices && servicesError && (
                    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                      <p className="text-muted-foreground">{servicesError}</p>
                      <Button variant="outline" onClick={loadServices}>Try again</Button>
                    </div>
                  )}

                  {/* Service cards from backend */}
                  {!loadingServices && !servicesError && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {services.map((service) => (
                        <motion.button
                          key={service.id}
                          onClick={() => handleServiceSelect(service)}
                          className={cn(
                            'text-left p-6 bg-card rounded-xl border transition-all',
                            'hover:shadow-lg hover:border-primary/20',
                            selectedService?.id === service.id && 'border-primary ring-2 ring-primary/20'
                          )}
                          whileHover={{ y: -4 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {service.category && (
                            <Badge variant="secondary" className="mb-3">
                              {service.category}
                            </Badge>
                          )}
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            {service.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            {service.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-4 w-4" /> {service.duration} min
                            </span>
                            <span className="flex items-center gap-1 font-medium text-foreground">
                              <DollarSign className="h-4 w-4" /> {service.price}
                            </span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {step === 2 && selectedService && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  {/* Selected service summary */}
                  <div className="p-4 bg-muted/50 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{selectedService.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedService.duration} min · ${selectedService.price}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                      Change
                    </Button>
                  </div>

                  {/* Date selection */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Select a date</h3>
                    <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
                      {availableDates.map((date) => {
                        const isSelected = selectedDate && isSameDay(date, selectedDate)
                        return (
                          <motion.button
                            key={date.toISOString()}
                            onClick={() => handleDateSelect(date)}
                            className={cn(
                              'flex flex-col items-center p-3 rounded-xl border transition-all min-w-[70px]',
                              isSelected 
                                ? 'bg-primary text-primary-foreground border-primary' 
                                : 'bg-card hover:border-primary/20 hover:shadow-md'
                            )}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <span className="text-xs opacity-70">
                              {format(date, 'EEE')}
                            </span>
                            <span className="text-lg font-semibold">
                              {format(date, 'd')}
                            </span>
                            <span className="text-xs opacity-70">
                              {format(date, 'MMM')}
                            </span>
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Time slot selection */}
                  {selectedDate && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <h3 className="text-lg font-semibold text-foreground mb-4">
                        Available times for {format(selectedDate, 'MMMM d, yyyy')}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {timeSlots.map((slot) => {
                          const isSelected = selectedSlot?.id === slot.id
                          return (
                            <motion.button
                              key={slot.id}
                              onClick={() => handleSlotSelect(slot)}
                              disabled={!slot.available}
                              className={cn(
                                'p-3 rounded-xl border text-center transition-all',
                                slot.available
                                  ? isSelected
                                    ? 'bg-primary text-primary-foreground border-primary animate-glow'
                                    : 'bg-card hover:border-primary/20 hover:shadow-md'
                                  : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
                              )}
                              whileHover={slot.available ? { scale: 1.05 } : {}}
                              whileTap={slot.available ? { scale: 0.95 } : {}}
                            >
                              <span className="font-medium">{slot.time}</span>
                              {!slot.available && (
                                <span className="block text-xs mt-1">Unavailable</span>
                              )}
                            </motion.button>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Back button */}
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to services
                  </Button>
                </motion.div>
              )}

              {step === 3 && selectedService && selectedDate && selectedSlot && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="max-w-xl mx-auto space-y-8"
                >
                  {/* Booking summary */}
                  <div className="p-6 bg-card rounded-xl border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Booking Summary</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Service</span>
                        <span className="font-medium text-foreground">{selectedService.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date</span>
                        <span className="font-medium text-foreground">
                          {format(selectedDate, 'MMMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Time</span>
                        <span className="font-medium text-foreground">{selectedSlot.time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="font-medium text-foreground">{selectedService.duration} min</span>
                      </div>
                      <div className="border-t pt-4 flex justify-between">
                        <span className="text-foreground font-medium">Total</span>
                        <span className="text-xl font-bold text-primary">${selectedService.price}</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer info */}
                  <div className="p-6 bg-card rounded-xl border space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Your Information</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                          className="h-11"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        onClick={handleConfirmBooking}
                        disabled={!customerInfo.name || !customerInfo.email || isConfirming}
                        className="w-full bg-primary hover:bg-primary/90"
                      >
                        {isConfirming ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            Confirm Booking
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </PageTransition>

      <Footer />

      {/* Confirmation dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.3 }}
          >
            <DialogHeader className="text-center">
              <motion.div 
                className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
              >
                <Check className="h-8 w-8 text-success" />
              </motion.div>
              <DialogTitle className="text-2xl">Booking Confirmed!</DialogTitle>
              <DialogDescription className="text-base">
                Your appointment has been successfully booked. A confirmation email will be sent to {customerInfo.email}.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 p-4 bg-muted/50 rounded-xl space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service</span>
                <span className="font-medium">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">
                  {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">{selectedSlot?.time}</span>
              </div>
            </div>
            <div className="mt-6 flex gap-4">
              <Button variant="outline" className="flex-1" onClick={resetBooking}>
                Book another
              </Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90" asChild>
                <a href="/dashboard">View bookings</a>
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <BookingContent />
    </Suspense>
  )
}
