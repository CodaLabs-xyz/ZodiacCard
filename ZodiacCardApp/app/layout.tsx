import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ClientThemeProvider } from "./components/client-theme-provider"
import { WagmiConfig } from "@/providers/wagmi-provider"
import { SdkInitializer } from "@/components/sdk-initializer"

const inter = Inter({ subsets: ["latin"] })


const frameMetadata = {
  version: "next",
  imageUrl: process.env.NEXT_PUBLIC_IMAGE_URL,
  aspectRatio: "3:2",
  button: {
    title: "Zodiac Cards",
    action: {
      type: "launch_frame",
      name: "Zodiac Card",
      url: process.env.NEXT_PUBLIC_SITE_URL,
      splashImageUrl: process.env.NEXT_PUBLIC_SPLASH_IMAGE_URL,
      splashBackgroundColor: "#47218f"
    }
  }
}

export const metadata: Metadata = {
  title: "Zodiac - Cosmic Crypto Fortune",
  description: "Discover your crypto fortune based on your zodiac sign",
  generator: 'CodaLabs.xyz',
  other: {
    'fc:frame': JSON.stringify(frameMetadata)
  }  
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ClientThemeProvider>
          <WagmiConfig>
            <SdkInitializer />
            {children}
          </WagmiConfig>
        </ClientThemeProvider>
      </body>
    </html>
  )
}


import './globals.css'