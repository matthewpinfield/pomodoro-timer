'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ThemeProviderProps as NextThemesProviderProps } from 'next-themes'

// Use the original props from next-themes
export function ThemeProvider({
  children,
  ...props // Pass all configuration props from the usage site (layout.tsx)
}: NextThemesProviderProps) {

  console.log('[ThemeProvider] Rendering'); // Optional log

  // Render NextThemesProvider passing all props from layout.tsx
  // No hardcoded defaults here for theme/system detection
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  )
}

// Re-export useTheme if needed elsewhere
export { useTheme as useNextTheme } from 'next-themes';