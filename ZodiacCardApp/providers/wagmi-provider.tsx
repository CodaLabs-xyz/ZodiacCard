"use client"

import React from "react"

// Create a simple context for wallet connection state
export const WalletContext = React.createContext({
  isConnected: false,
  address: "",
  connect: () => {},
  disconnect: () => {},
})

// Create a simple provider that simulates wallet connection
export function WagmiProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = React.useState(false)
  const [address, setAddress] = React.useState("")

  const connect = () => {
    setIsConnected(true)
    setAddress("0x1234...5678") // Mock address
  }

  const disconnect = () => {
    setIsConnected(false)
    setAddress("")
  }

  return (
    <WalletContext.Provider value={{ isConnected, address, connect, disconnect }}>{children}</WalletContext.Provider>
  )
}
