'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { PageTransition } from '@/components/ui/motion'
import { cn } from '@/lib/utils'

interface TOCItem {
  id: string
  label: string
}

interface DocLayoutProps {
  title: string
  description: string
  icon: React.ReactNode
  toc?: TOCItem[]
  children: React.ReactNode
}

export function DocLayout({ title, description, icon, toc, children }: DocLayoutProps) {
  return (
    <div className="min-h-screen bg-background dark:bg-stone-950">
      <Navbar />
      <PageTransition>
        <main className="pt-24 pb-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-sm text-muted-foreground mb-8"
            >
              <Link href="/documentation" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                Documentation
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground font-medium">{title}</span>
            </motion.div>

            <div className="flex gap-10">
              {/* Sidebar TOC (desktop) */}
              {toc && toc.length > 0 && (
                <motion.aside
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="hidden lg:block w-56 shrink-0 sticky top-28 self-start"
                >
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">On this page</p>
                  <nav className="space-y-1">
                    {toc.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className="block text-sm text-muted-foreground hover:text-primary py-1.5 px-3 rounded-lg hover:bg-primary/5 transition-colors"
                      >
                        {item.label}
                      </a>
                    ))}
                  </nav>
                </motion.aside>
              )}

              {/* Main content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="flex-1 min-w-0 max-w-4xl"
              >
                {/* Header */}
                <div className="mb-10">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/15 mb-5">
                    {icon}
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-3">{title}</h1>
                  <p className="text-lg text-muted-foreground">{description}</p>
                </div>

                {/* Content */}
                <div className="prose prose-stone dark:prose-invert max-w-none
                  prose-headings:scroll-mt-24 prose-headings:font-bold
                  prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:border-b prose-h2:border-stone-200 prose-h2:dark:border-stone-800 prose-h2:pb-3
                  prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
                  prose-p:text-muted-foreground prose-p:leading-relaxed
                  prose-li:text-muted-foreground
                  prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-stone-900 prose-pre:dark:bg-stone-950 prose-pre:border prose-pre:border-stone-200 prose-pre:dark:border-stone-800 prose-pre:rounded-xl
                  prose-strong:text-foreground
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                ">
                  {children}
                </div>

                {/* Back link */}
                <div className="mt-16 pt-8 border-t border-stone-200 dark:border-stone-800">
                  <Link
                    href="/documentation"
                    className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Documentation
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </PageTransition>
      <Footer />
    </div>
  )
}

/** Reusable styled code block */
export function CodeBlock({ children, title }: { children: string; title?: string }) {
  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden my-6 not-prose">
      {title && (
        <div className="bg-stone-100 dark:bg-stone-800/60 px-4 py-2 text-xs font-semibold text-muted-foreground border-b border-stone-200 dark:border-stone-800">
          {title}
        </div>
      )}
      <pre className="bg-stone-950 p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="text-stone-300">{children}</code>
      </pre>
    </div>
  )
}

/** Styled info/tip callout */
export function Callout({ type = 'info', children }: { type?: 'info' | 'warning' | 'tip'; children: React.ReactNode }) {
  const styles = {
    info: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
    warning: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
    tip: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300',
  }
  const labels = { info: 'Note', warning: 'Warning', tip: 'Tip' }
  return (
    <div className={cn('rounded-xl border p-4 my-6 not-prose text-sm', styles[type])}>
      <p className="font-bold text-xs uppercase tracking-wider mb-1">{labels[type]}</p>
      <div className="leading-relaxed">{children}</div>
    </div>
  )
}

/** Styled endpoint row */
export function Endpoint({ method, path, description, auth }: { method: string; path: string; description: string; auth?: string }) {
  const methodColors: Record<string, string> = {
    GET: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    POST: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    PATCH: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    DELETE: 'bg-red-500/10 text-red-600 dark:text-red-400',
  }
  return (
    <div className="flex items-start gap-3 py-3 not-prose border-b border-stone-100 dark:border-stone-800 last:border-0">
      <span className={cn('text-xs font-bold px-2 py-1 rounded-md shrink-0 mt-0.5', methodColors[method] || 'bg-stone-100 text-stone-600')}>
        {method}
      </span>
      <div className="min-w-0">
        <code className="text-sm font-mono text-foreground">{path}</code>
        <p className="text-xs text-muted-foreground mt-0.5">{description}{auth && <span className="ml-2 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500">{auth}</span>}</p>
      </div>
    </div>
  )
}
