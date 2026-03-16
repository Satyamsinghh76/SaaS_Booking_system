import type { Metadata } from 'next'
import './globals.css'
import { GoogleAuthProvider } from '@/components/google-oauth-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { TawkChat } from '@/components/tawk-chat'

export const metadata: Metadata = {
  title: 'BookFlow - Premium Booking Platform',
  description: 'The complete booking solution for modern businesses.',
}

/**
 * Inline script that runs before React hydration to prevent flash.
 * Reads the saved theme from localStorage (key: "theme") or falls back
 * to the system preference via prefers-color-scheme.
 */
const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch(e) {}
})();
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-[#fafaf9] text-stone-800 dark:bg-stone-950 dark:text-stone-200 transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="theme">
          <GoogleAuthProvider>
            {children}
            <TawkChat />
          </GoogleAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
