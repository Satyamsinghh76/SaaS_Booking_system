'use client'

import { use } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageTransition } from '@/components/ui/motion'
import { getPostBySlug, categoryColors } from '@/lib/blog-data'

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const post = getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background dark:bg-stone-950">
      <Navbar />
      <PageTransition>
        <main className="pt-24 pb-20">
          <div className="relative overflow-hidden">
            {/* Aurora background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="aurora-blob-1 aurora-grad-violet absolute -top-20 left-[10%] w-[500px] h-[500px] rounded-full blur-3xl" />
              <div className="aurora-blob-2 aurora-grad-cyan absolute top-20 right-[10%] w-[400px] h-[400px] rounded-full blur-3xl" />
              <div className="absolute inset-0 bg-background/40 dark:bg-stone-950/50" />
            </div>

            <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
              {/* Back button */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-8 pt-4"
              >
                <Link href="/blog">
                  <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Blog
                  </Button>
                </Link>
              </motion.div>

              {/* Article header */}
              <motion.header
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-10"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Badge className={categoryColors[post.category] || 'bg-muted text-muted-foreground'}>
                    {post.category}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{post.readTime}</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15] mb-6">
                  {post.title}
                </h1>

                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  {post.excerpt}
                </p>

                <div className="flex items-center gap-6 text-sm text-muted-foreground pb-8 border-b border-stone-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span>BookFlow Team</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {post.date}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {post.readTime}
                  </div>
                </div>
              </motion.header>

              {/* Article content */}
              <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-16"
              >
                <div className="space-y-5">
                  {post.content.map((block, i) => {
                    // Heading
                    if (block.startsWith('## ')) {
                      return (
                        <h2 key={i} className="text-2xl font-bold text-foreground mt-10 mb-4">
                          {block.replace('## ', '')}
                        </h2>
                      )
                    }

                    // Code block
                    if (block.startsWith('```')) {
                      const code = block.replace(/```\w*\n?/, '').replace(/\n```$/, '')
                      return (
                        <pre key={i} className="p-5 rounded-2xl bg-stone-900 dark:bg-stone-900/80 border border-stone-800 dark:border-white/10 overflow-x-auto">
                          <code className="text-sm text-stone-300 font-mono leading-relaxed whitespace-pre">
                            {code}
                          </code>
                        </pre>
                      )
                    }

                    // Regular paragraph
                    return (
                      <p key={i} className="text-muted-foreground leading-relaxed text-[16px]">
                        {block}
                      </p>
                    )
                  })}
                </div>
              </motion.article>

              {/* Bottom CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-8 rounded-2xl border bg-white dark:bg-stone-900/80 border-stone-200/80 dark:border-white/10 text-center"
              >
                <h3 className="text-xl font-bold text-foreground mb-3">Ready to streamline your bookings?</h3>
                <p className="text-muted-foreground mb-6">Try BookFlow free and see the difference.</p>
                <div className="flex items-center justify-center gap-4">
                  <Link href="/signup">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 h-11 font-semibold">
                      Get Started Free
                    </Button>
                  </Link>
                  <Link href="/blog">
                    <Button variant="outline" className="rounded-xl px-6 h-11">
                      More Articles
                    </Button>
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
