import type { Metadata, Viewport } from "next"
import { Share_Tech_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TaskProvider } from "@/context/task-context"
import { TimerProvider } from "@/context/timer-context"
import { SettingsProvider } from "@/context/settings-context"
import { AlarmProvider } from "@/context/alarm-context"
import { AuthProvider } from "@/context/auth-context"
import { Header } from '@/components/Header' // Assuming Header has sticky/fixed positioning
import { Toaster } from "@/components/ui/toaster"
import { AlarmFiringOverlay } from "@/components/alarm-firing-overlay"
import { cn } from "@/lib/utils"

// --- Font definitions ---
const digitalFont = Share_Tech_Mono({ subsets: ["latin"], weight: "400", variable: "--font-digital", display: "swap" })

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
      <body className={cn("font-sans h-screen overflow-hidden selection:bg-primary/20", digitalFont.variable)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
        >
          <AuthProvider>
            <SettingsProvider>
              <TaskProvider>
                <TimerProvider>
                  <AlarmProvider>
                    <div id="app-root" className="flex flex-col h-full relative overflow-hidden">
                      {/* Background Ambient Glow */}
                      <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
                        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
                        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
                      </div>

                      <Header />

                      {/* Main content area - Responsive Padding & Internal Scroll */}
                      <main
                        id="main-content-area"
                        className="flex-1 overflow-y-auto w-full max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 custom-scrollbar"
                      >
                        {children}
                      </main>
                    </div>
                    <Toaster />
                    <AlarmFiringOverlay />
                  </AlarmProvider>
                </TimerProvider>
              </TaskProvider>
            </SettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}