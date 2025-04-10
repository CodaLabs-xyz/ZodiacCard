"use client"

import { useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from "@/components/ui/button"
import { Wallet, LogOut, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { truncateEthAddress } from "@/lib/utils"
import { sdk } from "@farcaster/frame-sdk"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ConnectMenu() {
  const [mounted, setMounted] = useState(false)
  const { isConnected, address } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [isFarcaster, setIsFarcaster] = useState(false)

  useEffect(() => {
    const checkFarcasterContext = async () => {
      try {
        const context = await sdk.context
        setIsFarcaster(!!context?.client?.clientFid)
      } catch (error) {
        console.error('Failed to get Farcaster context:', error)
        setIsFarcaster(false)
      }
    }

    checkFarcasterContext()
    setMounted(true)
  }, [])

  // Don't render anything on the server
  if (!mounted) {
    return (
      <Button 
        variant="outline" 
        className="bg-violet-600/10 text-violet-600 hover:bg-violet-600/20 hover:text-violet-700"
        disabled
      >
        <Wallet className="h-4 w-4" />
      </Button>
    )
  }

  if (isConnected) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="bg-violet-600/10 text-violet-600 hover:bg-violet-600/20 hover:text-violet-700"
          >
            <Wallet className="mr-2 h-4 w-4" />
            {truncateEthAddress(address)}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuItem
            className="text-red-500 focus:text-red-500 cursor-pointer"
            onClick={() => disconnect()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const handleConnect = async () => {
    try {
      if (isFarcaster) {
        // In Farcaster context, use the Farcaster connector
        await connect({ connector: connectors.find(c => c.id === 'farcasterFrame') })
      } else {
        // In browser context, prefer injected connector (MetaMask etc) if available
        const injectedConnector = connectors.find(c => c.id === 'injected')
        const walletConnectConnector = connectors.find(c => c.id === 'walletConnect')
        
        // Try injected first, fall back to WalletConnect
        if (injectedConnector && window.ethereum) {
          await connect({ connector: injectedConnector })
        } else if (walletConnectConnector) {
          await connect({ connector: walletConnectConnector })
        } else {
          console.error('No suitable wallet connector found')
        }
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }

  return (
    <Button
      onClick={handleConnect}
      className={cn(
        "bg-violet-600 hover:bg-violet-700",
        "text-white",
        "flex items-center gap-2"
      )}
    >
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </Button>
  )
} 