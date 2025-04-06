'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false)
  
  // After mounting, we can safely show the UI
  React.useEffect(() => {
    setMounted(true)
  }, [])
  
  // Prevent flash of unstyled content during hydration
  if (!mounted) {
    return <>{children}</>
  }
  
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
