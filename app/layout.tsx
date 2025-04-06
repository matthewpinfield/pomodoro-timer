import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../styles/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TaskProvider } from "@/context/task-context"
import { SettingsProvider } from "@/context/settings-context"
import { TimerProvider } from "@/context/timer-context"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FocusPie - ADHD-Friendly Focus Timer",
  description: "A visual focus timer application designed for individuals with ADHD",
  manifest: "/manifest.json",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={cn(inter.className, "min-h-screen bg-background font-sans antialiased")} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SettingsProvider>
            <TimerProvider>
              <TaskProvider>
                {children}
              </TaskProvider>
            </TimerProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}