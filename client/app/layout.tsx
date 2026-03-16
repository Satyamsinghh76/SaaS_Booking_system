import type { Metadata } from 'next'
import './globals.css'
import { GoogleAuthProvider } from '@/components/google-oauth-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { TawkChat } from '@/components/tawk-chat'

export const metadata: Metadata = {
  title: 'BookFlow - Premium Booking Platform',
  description: 'The complete booking solution for modern businesses.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#fafaf9] text-stone-800 dark:bg-stone-950 dark:text-stone-200">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="bookflow-theme">
          <GoogleAuthProvider>
            {children}
            <TawkChat />
          </GoogleAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
