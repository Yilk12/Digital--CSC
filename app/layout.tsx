import React from "react"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Playfair_Display } from "next/font/google"
import "./globals.css"
import Footer from "@/components/footer"
import AppHeader from "@/components/app-header"
import SidebarContainer from "@/components/sidebar/sidebar-container"
import { LocalizationProvider } from "@/hooks/use-localization"
import { ToastProvider } from "@/components/toast-provider"
import ToastView from "@/components/toast-view"
import dynamic from "next/dynamic"

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "700"],
})

const HEADER_HEIGHT = 84
// client-only dynamic import to avoid server-side rendering of the widget
const FleetReportWidget = dynamic(
  () => import("@/components/fleet-report-widget"),
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
              style={{
                display: "flex",
                flex: 1,
                minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
              }}
            >
              <SidebarContainer />
              <main
                style={{
                  minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  padding: 0,
                  maxWidth: "1400px",
                  width: "100%",
                  background: "transparent",
                  flex: 1,
                }}
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