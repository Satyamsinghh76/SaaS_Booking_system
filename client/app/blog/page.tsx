'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Calendar } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { PageTransition } from '@/components/ui/motion'
import { Badge } from '@/components/ui/badge'
import { posts, categoryColors } from '@/lib/blog-data'

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-stone-950">
      <Navbar />
      <PageTransition>
        <main className="pt-24 pb-20">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="aurora-blob-1 aurora-grad-cyan absolute -top-20 left-[5%] w-[500px] h-[500px] rounded-full blur-3xl" />
              <div className="aurora-blob-2 aurora-grad-rose absolute top-10 right-[10%] w-[400px] h-[400px] rounded-full blur-3xl" />
              <div className="absolute inset-0 bg-background/30 dark:bg-stone-950/40" />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-16 pt-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 dark:bg-primary/15 border border-primary/20 px-5 py-2 rounded-full mb-8">
                  <Sparkles className="h-4 w-4" />
                  Blog
                </motion.div>
                <motion.h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  Insights &
                  <br />
                  <span className="bg-gradient-to-r from-primary via-violet-500 to-cyan-500 bg-clip-text text-transparent">product updates</span>
                </motion.h1>
                <motion.p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  Tips, guides, and behind-the-scenes stories from the BookFlow team.
                </motion.p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {posts.map((post, i) => (
                  <Link key={post.slug} href={`/blog/${post.slug}`}>
                    <motion.article initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }} className="card-glow group flex flex-col h-full p-6 rounded-2xl border bg-white dark:bg-stone-900/80 border-stone-200/80 dark:border-white/10 hover:border-primary/30 dark:hover:border-primary/40 transition-all duration-300 cursor-pointer">
                      <div className="flex items-center gap-3 mb-4">
                        <Badge className={categoryColors[post.category] || 'bg-muted text-muted-foreground'}>{post.category}</Badge>
                        <span className="text-xs text-muted-foreground">{post.readTime}</span>
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">{post.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-2">{post.excerpt}</p>
                      <div className="flex items-center justify-between mt-5 pt-4 border-t border-dashed border-stone-200 dark:border-white/10">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {post.date}
                        </div>
                        <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                          Read <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </motion.article>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </main>
      </PageTransition>
      <Footer />
    </div>
  )
}
