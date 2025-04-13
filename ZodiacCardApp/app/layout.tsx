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
  imageUrl: "https://codalabs-public-assets.s3.us-east-1.amazonaws.com/ZodiacImages/ZodiacEmbedImage.png",
  aspectRatio: "3:2",
  button: {
    title: "Zodiac Cards",
    action: {
      type: "launch_frame",
      name: "Zodiac Card",
      url: "https://zodiaccard.xyz",
      splashImageUrl: "https://codalabs-public-assets.s3.us-east-1.amazonaws.com/ZodiacImages/ZodiacSplash.png",
      splashBackgroundColor: "#18111f"
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