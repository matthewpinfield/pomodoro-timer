import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Doto } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TaskProvider } from "@/context/task-context"
import { TimerProvider } from "@/context/timer-context"
import { Header } from '@/components/Header'

const inter = Inter({ subsets: ["latin"] })
const doto = Doto({ 
  subsets: ["latin"],
  variable: '--font-doto',
  display: 'swap',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
})

export const metadata: Metadata = {
  title: "FocusPie - ADHD-Friendly Focus Timer",
  description: "A visual focus timer application designed for individuals with ADHD",
  manifest: "/manifest.json",
  generator: 'v0.dev',
  appleWebApp: {
    title: 'FocusPie',
    statusBarStyle: 'black-translucent',
    capable: true
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#4299e1',
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
}

// Add this script to handle mobile viewport height
const mobileViewportHeight = `
  function setAppHeight() {
    const doc = document.documentElement;
    doc.style.setProperty('--app-height', window.innerHeight + 'px');
  }
  window.addEventListener('resize', setAppHeight);
  window.addEventListener('orientationchange', setAppHeight);
  setAppHeight();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link 
          rel="preload" 
          href="/icon-192x192.png" 
          as="image" 
          type="image/png"
        />
        <script dangerouslySetInnerHTML={{ __html: mobileViewportHeight }} />
      </head>
      <body className={`${inter.className} ${doto.variable} min-h-screen flex flex-col bg-gray-50 antialiased safe-top safe-bottom mobile-height`}>
        <ThemeProvider attribute="class" defaultTheme="light">
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