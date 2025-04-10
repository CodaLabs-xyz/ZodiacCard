"use client"
import dynamic from "next/dynamic"

// Dynamically import ConnectMenu with no SSR
const ConnectMenu = dynamic(
  () => import("@/components/connect-menu").then(mod => mod.ConnectMenu),
  { ssr: false }
)

export function Header() {
  return (
    <div className="relative w-full flex flex-col items-center justify-center px-4 md:pt-16 pt-8">
      {/* Connect Menu - Fixed positioned for mobile, absolute for desktop */}
      <div className="fixed sm:absolute top-2 sm:top-4 right-2 sm:right-4 z-10">
        <ConnectMenu />
      </div>
    </div>
  )
}

