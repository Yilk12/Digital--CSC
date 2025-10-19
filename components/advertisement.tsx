import dynamic from "next/dynamic"

// Re-export the new AdsFeed client component so legacy imports still work.
// AdsFeed implements Feed / Archive modes and creation UI.
const AdsFeed = dynamic(() => import("@/components/ads-feed"), { ssr: false })

export default AdsFeed