import type { Metadata, Viewport } from "next"
import { Inter, DM_Mono, Doto } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TaskProvider } from "@/context/task-context"
import { TimerProvider } from "@/context/timer-context"
import { Header } from '@/components/Header'
import { registerFonts } from "@/lib/font-registry"

// --- Font definitions remain the same ---
export const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-sans',
  preload: false,
})

export const monoFont = DM_Mono({
  subsets: ["latin"],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500'],
  preload: false,
})

export const dotoFont = Doto({
  subsets: ["latin"],
  variable: '--font-doto',
  display: 'swap',
  weight: ['400'],
  preload: false,
})

registerFonts({
  sans: inter,
  mono: monoFont,
  doto: dotoFont
})

// --- Viewport and Metadata remain the same ---
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: "#4299e1" // Example theme color
}

export const metadata: Metadata = {
  title: "FocusPie - ADHD-Friendly Focus Timer",
  description: "A visual focus timer application designed for individuals with ADHD",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Add h-full for robustness with body's height setting
    <html lang="en" suppressHydrationWarning className="h-full">
      {/*
        - Change min-h-screen to h-full (or h-screen) to ensure body takes full viewport height
        - Keep flex flex-col
        - Keep font variables and bg color
      */}
      <body className={`${inter.variable} ${monoFont.variable} ${dotoFont.variable} ${inter.className} h-full flex flex-col bg-gray-50 dark:bg-slate-900`}> {/* Added dark mode bg */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem> {/* ThemeProvider often wraps everything */}
          <TaskProvider>
            <TimerProvider>
              <Header /> {/* Header takes its natural height */}

              {/* ***** THE KEY CHANGE IS HERE ***** */}
              {/* This main element wraps the page content */}
              {/* flex-1 makes it take up the remaining vertical space */}
              {/* overflow-y-auto handles scrolling *within* this main area */}
          
              <main id="main-content-area" className="flex-1 overflow-y-auto p-6 min-h-0">
                {children} {/* <--- Your page content goes INSIDE the main tag */}
              </main>
            
            </TimerProvider>
          </TaskProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}