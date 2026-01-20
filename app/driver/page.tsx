import React from "react"
import Link from "next/link"

export default function DriverPage() {
  return (
    <main className="px-4 py-6 flex justify-center">
      <div className="w-full max-w-4xl space-y-4">
        <h2 className="text-2xl font-semibold"></h2>

        <Link
          href="/fleet/driver"
          className="block border rounded bg-gradient-to-r from-green-100 to-pink-100 px-6 py-4"
        >
          <p className="text-lg font-semibold">
            ጠቅላላ ገፅ
          </p>
        </Link>

        {/* ...other driver dashboard content... */}
      </div>
    </main>
  )
}
