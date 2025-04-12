'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes'
import type { ThemeProviderProps as NextThemesProviderProps } from 'next-themes'
// No longer need NextFontWithVariable as we are removing the check
// import type { NextFontWithVariable } from 'next/dist/compiled/@next/font' 

// Use the original props from next-themes, remove font object props
export function ThemeProvider({ 
  children, 
  ...props 
}: NextThemesProviderProps) { // Use original props type
  
  // Remove the useState and useEffect for font checking
  // const [fontsReady, setFontsReady] = React.useState(false)
  // React.useEffect(() => { ... font checking logic ... }, [])

  console.log('[ThemeProvider] Rendering directly without font check'); // Updated log

  // Render the NextThemesProvider immediately
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      {...props}
    >
      {/* Render children immediately */}
      {children} 
    </NextThemesProvider>
  )
}

export { useNextTheme as useTheme }
