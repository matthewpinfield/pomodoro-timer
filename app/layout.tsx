import type { Metadata, Viewport } from "next"
import { Inter, DM_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TaskProvider } from "@/context/task-context"
import { TimerProvider } from "@/context/timer-context"
import { Header } from '@/components/Header' // Assuming Header has sticky/fixed positioning
import { registerFonts } from "@/lib/font-registry"

// --- Font definitions ---
export const inter = Inter({ subsets: ["latin"], display: 'swap', variable: '--font-sans', preload: false })
export const monoFont = DM_Mono({ subsets: ["latin"], variable: '--font-mono', display: 'swap', weight: ['400', '500'], preload: false })
registerFonts({ sans: inter, mono: monoFont })

// --- Viewport and Metadata ---
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: "#4299e1" } // Adjust themeColor
export const metadata: Metadata = { title: "FocusPie - ADHD-Friendly Focus Timer", description: "A visual focus timer application designed for individuals with ADHD" }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Removed h-full. Body uses min-h-screen to allow natural height growth */}
      <body className={`${inter.variable} ${monoFont.variable} ${inter.className} min-h-screen bg-gray-50 dark:bg-slate-900`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TaskProvider>
            <TimerProvider>
              {/* Header component - Must handle its own sticky/fixed positioning */}
              <Header />

              {/* Main content area - Simplified, just provides padding and semantic meaning */}
              <main id="main-content-area" className="p-6">
                {children}
              </main>

            </TimerProvider>
          </TaskProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}