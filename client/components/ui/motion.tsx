'use client'

import { motion, type HTMLMotionProps, type Variants } from 'framer-motion'
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

// Reusable animation variants
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
}

export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
}

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
}

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

// Page transition wrapper
export function PageTransition({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeInUp}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Animated card with lift effect
interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
  className?: string
  hoverScale?: number
  hoverY?: number
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, className, hoverScale = 1.02, hoverY = -4, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          'bg-card text-card-foreground rounded-xl border shadow-sm transition-shadow hover:shadow-lg',
          className
        )}
        whileHover={{ 
          scale: hoverScale, 
          y: hoverY,
          transition: { duration: 0.2, ease: 'easeOut' }
        }}
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
AnimatedCard.displayName = 'AnimatedCard'

// Button with ripple effect
interface RippleButtonProps extends HTMLMotionProps<'button'> {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
}

export function RippleButton({ 
  children, 
  className,
  variant = 'default',
  ...props 
}: RippleButtonProps) {
  const baseStyles = 'relative overflow-hidden inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
  
  const variantStyles = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-6',
    ghost: 'hover:bg-accent hover:text-accent-foreground h-10 px-4',
  }

  return (
    <motion.button
      className={cn(baseStyles, variantStyles[variant], className)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      {...props}
    >
      {children}
    </motion.button>
  )
}

// Animated loading skeleton with shimmer
type AnimatedSkeletonProps = Omit<HTMLMotionProps<'div'>, 'children'>

export function AnimatedSkeleton({ 
  className,
  ...props 
}: AnimatedSkeletonProps) {
  return (
    <motion.div
      className={cn('animate-shimmer rounded-lg', className)}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ 
        duration: 1.5, 
        repeat: Infinity, 
        repeatType: 'reverse' 
      }}
      {...props}
    />
  )
}

// Stagger children animation wrapper
export function StaggerWrapper({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Individual stagger item
export function StaggerItem({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  )
}

// Glow effect wrapper for interactive elements
export function GlowWrapper({ 
  children, 
  className,
  glowColor = 'primary'
}: { 
  children: React.ReactNode
  className?: string
  glowColor?: 'primary' | 'success' | 'accent'
}) {
  const glowStyles = {
    primary: 'hover:shadow-[0_0_30px_oklch(0.55_0.25_275_/_0.3)]',
    success: 'hover:shadow-[0_0_30px_oklch(0.75_0.15_160_/_0.3)]',
    accent: 'hover:shadow-[0_0_30px_oklch(0.6_0.2_260_/_0.3)]',
  }

  return (
    <motion.div 
      className={cn('transition-shadow duration-300', glowStyles[glowColor], className)}
      whileHover={{ scale: 1.01 }}
    >
      {children}
    </motion.div>
  )
}

// Floating animation for decorative elements
export function FloatingElement({ 
  children, 
  className,
  delay = 0
}: { 
  children?: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      className={className}
      animate={{ 
        y: [0, -10, 0],
      }}
      transition={{ 
        duration: 3, 
        repeat: Infinity, 
        ease: 'easeInOut',
        delay
      }}
    >
      {children}
    </motion.div>
  )
}

// Counter animation for numbers
export function AnimatedCounter({ 
  value, 
  className,
  duration = 2
}: { 
  value: number
  className?: string
  duration?: number
}) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {value.toLocaleString()}
      </motion.span>
    </motion.span>
  )
}

// Modal animation wrapper
export function ModalTransition({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ 
        duration: 0.2, 
        ease: [0.25, 0.46, 0.45, 0.94] 
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ── Aliases used across admin/dashboard pages ─────────────────────────────────

/** Simple fade-in with optional delay */
export function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Slide in from a direction */
export function SlideIn({
  children,
  className,
  direction = 'up',
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  direction?: 'up' | 'down' | 'left' | 'right'
  delay?: number
}) {
  const dirMap: Record<string, { x?: number; y?: number }> = {
    up:    { y: 24 },
    down:  { y: -24 },
    left:  { x: 24 },
    right: { x: -24 },
  }
  const from = dirMap[direction]
  return (
    <motion.div
      initial={{ opacity: 0, ...from }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Scale + fade in */
export function ScaleIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.93 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Card with hover lift + border glow */
export function MotionCard({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof motion.div>) {
  return (
    <motion.div
      className={cn(
        'bg-card text-card-foreground rounded-xl border shadow-sm',
        'transition-shadow duration-200 hover:shadow-lg hover:border-primary/20',
        className
      )}
      whileHover={{ y: -3, transition: { duration: 0.18, ease: 'easeOut' } }}
      whileTap={{ scale: 0.99 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/** Stagger container (alias for StaggerWrapper, named variant for admin pages) */
export function StaggerContainer({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Ripple effect on click */
export function RippleEffect({ className }: { className?: string }) {
  return (
    <motion.span
      className={cn(
        'absolute inset-0 rounded-inherit pointer-events-none',
        className
      )}
      initial={{ scale: 0, opacity: 0.4 }}
      animate={{ scale: 2.5, opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    />
  )
}
