import React from "react"
import dynamic from "next/dynamic"

const RequestForm = dynamic(() => import("@/components/request-form"), { ssr: false })

export default function DriverPage() {
  return (
    <main style={{ padding: 20, display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 1000 }}>
        <h2 style={{ marginTop: 0 }}>Driver Dashboard</h2>
        {/* Request form only shown for drivers (component does role detection) */}
        <RequestForm />
        {/* ...other driver dashboard content... */}
      </div>
    </main>
  )
}
