import type { Metadata } from 'next'
import './globals.css'
import { GoogleAuthProvider } from '@/components/google-oauth-provider'

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
    <html lang="en">
      <body className="bg-slate-50 text-slate-800">
        <GoogleAuthProvider>
          {children}
        </GoogleAuthProvider>
      </body>
    </html>
  )
}
