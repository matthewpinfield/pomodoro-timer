import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TaskProvider } from "@/context/task-context"

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
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <TaskProvider>{children}</TaskProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'