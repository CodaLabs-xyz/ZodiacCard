import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ClientThemeProvider } from "./components/client-theme-provider"
import { WagmiConfig } from "@/providers/wagmi-provider"
import { SdkInitializer } from "@/components/sdk-initializer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Zodiac - Cosmic Crypto Fortune",
  description: "Discover your crypto fortune based on your zodiac sign",
  generator: 'CodaLabs.xyz'
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