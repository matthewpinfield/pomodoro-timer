import type { Metadata, Viewport } from "next"
import { Inter, DM_Mono, Doto } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TaskProvider } from "@/context/task-context"
import { TimerProvider } from "@/context/timer-context"
import { Header } from '@/components/Header'
import { registerFonts } from "@/lib/font-registry"

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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: "#4299e1"
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${monoFont.variable} ${inter.className} min-h-screen flex flex-col bg-gray-50`}>
        <ThemeProvider>
          <TaskProvider>
            <TimerProvider>
              <Header />
              {children}
            </TimerProvider>
          </TaskProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}