'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Calendar, Github, Linkedin } from 'lucide-react'

const navigation = {
  product: [
    { name: 'Features', href: '/features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Services', href: '/services' },
    { name: 'Dashboard', href: '/dashboard' },
  ],
  company: [
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
  ],
  resources: [
    { name: 'Documentation', href: '/documentation' },
    { name: 'Help Center', href: '/help' },
  ],
  legal: [
    { name: 'Privacy', href: '/privacy' },
    { name: 'Terms', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
  ],
}

const social = [
  { name: 'GitHub', href: 'https://github.com/Satyamsinghh76/SaaS_Booking_system', icon: Github },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/in/satyam-singh-88988a279', icon: Linkedin },
]

export function Footer() {
  return (
    <footer className="bg-white dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-4 lg:col-span-1">
              <Link href="/" className="flex items-center gap-2">
                <motion.div
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-stone-900 dark:bg-white"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                >
                  <Calendar className="h-5 w-5 text-white dark:text-stone-900" />
                </motion.div>
                <span className="text-xl font-semibold text-foreground">
                  BookFlow
                </span>
              </Link>
              <p className="mt-4 text-sm text-muted-foreground max-w-xs">
                The complete booking platform for modern businesses. Streamline scheduling and grow your business.
              </p>

              {/* Social links */}
              <div className="mt-6 flex gap-4">
                {social.map((item) => (
                  <motion.a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={item.name}
                  >
                    <item.icon className="h-5 w-5" />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Product links */}
            <div>
              <h3 className="text-sm font-semibold text-foreground">Product</h3>
              <ul className="mt-4 space-y-3">
                {navigation.product.map((item) => (
                  <li key={item.name}>
                    <Link 
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company links */}
            <div>
              <h3 className="text-sm font-semibold text-foreground">Company</h3>
              <ul className="mt-4 space-y-3">
                {navigation.company.map((item) => (
                  <li key={item.name}>
                    <Link 
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources links */}
            <div>
              <h3 className="text-sm font-semibold text-foreground">Resources</h3>
              <ul className="mt-4 space-y-3">
                {navigation.resources.map((item) => (
                  <li key={item.name}>
                    <Link 
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal links */}
            <div>
              <h3 className="text-sm font-semibold text-foreground">Legal</h3>
              <ul className="mt-4 space-y-3">
                {navigation.legal.map((item) => (
                  <li key={item.name}>
                    <Link 
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t py-6 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} BookFlow. Built by Satyam Singh. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
