'use client'

import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { ArrowRight, Sparkles, Calendar, Users, Zap, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FloatingElement, StaggerWrapper, StaggerItem } from '@/components/ui/motion'

const stats = [
  { label: 'Active users',  value: '50K+' },
  { label: 'Bookings made', value: '2M+'  },
  { label: 'Uptime',        value: '99.9%'},
]
const avatars = ['JD','SK','MR','AL','PK']

export function HeroSection() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start','end start'] })
  const bgY    = useTransform(scrollYProgress, [0,1], ['0%','30%'])
  const bgOpac = useTransform(scrollYProgress, [0,0.6],[1,0])

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Layered background */}
      <motion.div className="absolute inset-0" style={{ y: bgY, opacity: bgOpac }}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-chart-5/6 dark:from-primary/12 dark:to-chart-5/8" />
        <FloatingElement delay={0}   className="absolute top-20   left-[10%] w-80 h-80 bg-primary/15  rounded-full blur-3xl" />
        <FloatingElement delay={1.2} className="absolute bottom-24 right-[8%] w-96 h-96 bg-chart-5/12 rounded-full blur-3xl" />
        <FloatingElement delay={0.6} className="absolute top-1/2  left-1/2   w-[700px] h-[500px] bg-accent/6 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <FloatingElement delay={2}   className="absolute -top-10 right-1/4   w-64 h-64 bg-chart-2/10 rounded-full blur-3xl" />
      </motion.div>

      {/* Dot grid */}
      <div className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04] pointer-events-none"
        style={{ backgroundImage:'radial-gradient(circle, oklch(0.4 0.1 265) 1px, transparent 1px)', backgroundSize:'28px 28px' }} />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <StaggerWrapper className="text-center">

          {/* Pill */}
          <StaggerItem>
            <Link href="/services" className="inline-flex">
              <motion.div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}>
                <Sparkles className="w-3.5 h-3.5" />
                New: AI-powered scheduling is live
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.div>
            </Link>
          </StaggerItem>

          {/* Headline */}
          <StaggerItem>
            <h1 className="mt-8 text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground text-balance leading-[1.05]">
              The complete platform<br />
              <span className="gradient-text">for modern booking</span>
            </h1>
          </StaggerItem>

          {/* Subheading */}
          <StaggerItem>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
              Streamline your scheduling, manage appointments effortlessly, and grow your business with our intelligent booking platform.
            </p>
          </StaggerItem>

          {/* Social proof */}
          <StaggerItem>
            <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
              <div className="flex -space-x-2">
                {avatars.map((a,i) => (
                  <motion.div key={i}
                    className="w-9 h-9 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-xs font-semibold text-primary"
                    initial={{ opacity:0, scale:0 }}
                    animate={{ opacity:1, scale:1 }}
                    transition={{ delay:0.4+i*0.08, type:'spring', bounce:0.4 }}>
                    {a}
                  </motion.div>
                ))}
              </div>
              <span className="text-sm text-muted-foreground"><span className="text-foreground font-semibold">4,800+</span> businesses trust BookFlow</span>
              <div className="flex items-center gap-0.5">
                {[0,1,2,3,4].map(i => <Star key={i} className="w-3.5 h-3.5 fill-chart-4 text-chart-4" />)}
              </div>
            </div>
          </StaggerItem>

          {/* CTAs */}
          <StaggerItem>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/booking">
                <motion.div whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}>
                  <Button size="lg" className="h-12 px-8 text-base bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 gap-2">
                    Start booking free <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
              <Link href="/services">
                <motion.div whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}>
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base">Browse services</Button>
                </motion.div>
              </Link>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">No credit card required · Free forever plan</p>
          </StaggerItem>

          {/* Stats */}
          <StaggerItem>
            <div className="mt-14 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
              {stats.map((s,i) => (
                <motion.div key={s.label} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6+i*0.1 }} className="text-center">
                  <div className="text-3xl font-bold text-foreground">{s.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </StaggerItem>

          {/* Dashboard preview */}
          <StaggerItem>
            <motion.div className="mt-16 sm:mt-20 relative"
              initial={{ opacity:0, y:48 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:0.7, duration:0.8, ease:[0.25,0.46,0.45,0.94] }}>
              <div className="relative mx-auto max-w-5xl">
                <div className="absolute -inset-6 bg-gradient-to-r from-primary/20 via-chart-5/15 to-primary/20 rounded-3xl blur-3xl opacity-60" />
                <div className="relative bg-card border rounded-2xl shadow-2xl overflow-hidden">
                  {/* Browser bar */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border-b">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-destructive/50" />
                      <div className="w-3 h-3 rounded-full bg-chart-4/50" />
                      <div className="w-3 h-3 rounded-full bg-success/50" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="px-4 py-1 bg-background rounded-md text-xs text-muted-foreground border">bookflow.app/dashboard</div>
                    </div>
                  </div>
                  <div className="p-5 sm:p-7 bg-background">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { icon:Calendar, label:'Upcoming', value:'24',   color:'primary' },
                        { icon:Users,    label:'Clients',  value:'1,284', color:'chart-2' },
                        { icon:Zap,      label:'This week',value:'89%',   color:'success' },
                      ].map((item,i) => (
                        <motion.div key={item.label}
                          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                          transition={{ delay:0.85+i*0.1 }}
                          className="p-4 bg-muted/30 rounded-xl border card-hover-glow">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-${item.color}/10`}>
                              <item.icon className={`h-5 w-5 text-${item.color}`} />
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-foreground">{item.value}</div>
                              <div className="text-xs text-muted-foreground">{item.label}</div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <motion.div className="mt-4 p-4 bg-muted/30 rounded-xl border"
                      initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.15 }}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-sm text-foreground">March 2026</span>
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">3 upcoming</Badge>
                      </div>
                      <div className="flex gap-1.5 mb-1">
                        {['Mon','Tue','Wed','Thu','Fri'].map(d => (
                          <div key={d} className="flex-1 text-center text-[10px] text-muted-foreground">{d}</div>
                        ))}
                      </div>
                      <div className="flex gap-1.5">
                        {[10,11,12,13,14].map((date,i) => (
                          <motion.div key={date}
                            initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }}
                            transition={{ delay:1.2+i*0.06, type:'spring', bounce:0.5 }}
                            className={`flex-1 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                              date===12 ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30' : 'bg-background text-foreground hover:bg-muted'
                            }`}>
                            {date}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </StaggerItem>
        </StaggerWrapper>
      </div>
    </section>
  )
}
