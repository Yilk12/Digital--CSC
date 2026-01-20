 import React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Playfair_Display } from "next/font/google"
import "./globals.css"
import Footer from "@/app/components/footer"
import AppHeader from "@/app/components/app-header"
import SidebarContainer from "@/app/components/sidebar/sidebar-container"
import { LocalizationProvider } from "@/app/hooks/use-localization"
import { ToastProvider } from "@/app/components/toast-provider"
import ToastView from "@/app/components/toast-view"
import dynamic from "next/dynamic"

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "700"],
})

const HEADER_HEIGHT = 84

export const metadata: Metadata = {
  title: "ICSDS",
  icons: {
    icon: "/gallery/FCSC.jpg",
  },
}

// client-only dynamic import to avoid server-side rendering of the widget
const FleetReportWidget = dynamic(
  () => import("@/app/components/fleet-report-widget"),
  { ssr: false }
)

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`font-sans min-h-screen flex flex-col ${GeistSans.variable} ${GeistMono.variable} ${playfairDisplay.variable}`}
        style={{ margin: 0, padding: 0 }}
      >
        <LocalizationProvider>
          <ToastProvider>
            <AppHeader />
            <div
              className="flex flex-1 min-h-[calc(100vh-84px)] flex-row"
            >
              <SidebarContainer />
              <main
                className="flex min-h-[calc(100vh-84px)] flex-1 flex-col items-center justify-start bg-transparent px-0 md:px-0 max-w-[1400px] w-full"
              >
                {/* Fleet manager chart (client-side) */}
                <FleetReportWidget />
                {children}
              </main>
            </div>
            <Footer />
            <ToastView />
          </ToastProvider>
        </LocalizationProvider>
      </body>
    </html>
  )
}
