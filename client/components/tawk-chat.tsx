'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    Tawk_API?: {
      maximize: () => void
      minimize: () => void
      toggle: () => void
      isChatMaximized: () => boolean
      onLoad?: () => void
    }
    Tawk_LoadStart?: Date
  }
}

/**
 * Opens the Tawk.to chat widget programmatically.
 * Call this from any component — the widget loads globally via TawkChat.
 */
export function openTawkChat() {
  if (window.Tawk_API?.maximize) {
    window.Tawk_API.maximize()
  }
}

/**
 * Drop this component once in the root layout.
 * It loads the Tawk.to widget script asynchronously.
 *
 * To get your own property/widget IDs:
 * 1. Sign up at https://www.tawk.to
 * 2. Go to Administration → Channels → Chat Widget
 * 3. Copy the property ID and widget ID from the embed code
 */
export function TawkChat() {
  useEffect(() => {
    // Prevent double-loading
    if (document.getElementById('tawk-script')) return

    window.Tawk_API = window.Tawk_API || {} as never
    window.Tawk_LoadStart = new Date()

    const s = document.createElement('script')
    s.id = 'tawk-script'
    s.async = true
    s.src = 'https://embed.tawk.to/default/default'
    s.charset = 'UTF-8'
    s.setAttribute('crossorigin', '*')

    // Replace with your actual Tawk.to property/widget IDs:
    // s.src = 'https://embed.tawk.to/YOUR_PROPERTY_ID/YOUR_WIDGET_ID'
    // For now we use the default demo widget.

    document.head.appendChild(s)

    return () => {
      // Cleanup on unmount (unlikely for layout-level component)
      const el = document.getElementById('tawk-script')
      if (el) el.remove()
    }
  }, [])

  return null
}
