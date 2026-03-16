'use client'

import { useTheme as useNextTheme } from 'next-themes'
import { useEffect, useState } from 'react'

/**
 * Reusable theme hook wrapping next-themes.
 *
 * Provides:
 *  - `theme`        – current resolved theme ('light' | 'dark')
 *  - `toggleTheme`  – switch between light and dark
 *  - `setTheme`     – set a specific theme ('light' | 'dark' | 'system')
 *  - `mounted`      – true after hydration (safe to read theme)
 *
 * Persistence: localStorage key "theme" (configured in ThemeProvider).
 * Default: follows system preference via prefers-color-scheme.
 */
export function useTheme() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useNextTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return {
    /** Current theme value ('light' | 'dark' | 'system') */
    theme: theme as string,
    /** Resolved theme after system preference ('light' | 'dark') */
    resolvedTheme: resolvedTheme as 'light' | 'dark' | undefined,
    /** Whether the component has mounted (safe to render theme-dependent UI) */
    mounted,
    /** Toggle between light and dark */
    toggleTheme,
    /** Set a specific theme */
    setTheme,
    /** Current system preference */
    systemTheme,
    /** Whether dark mode is active */
    isDark: resolvedTheme === 'dark',
  }
}
