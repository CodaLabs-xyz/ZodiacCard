"use client"

import { useState, useContext } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Sparkles, Wallet } from "lucide-react"
import { WalletContext } from "@/providers/wagmi-provider"

interface MintButtonProps {
  username: string
  year: string
  sign: string
  fortune: string
  className?: string
}

export function MintButton({ username, year, sign, fortune, className }: MintButtonProps) {
  const [open, setOpen] = useState(false)
  const [minting, setMinting] = useState(false)
  const [approved, setApproved] = useState(false)
  const [error, setError] = useState("")

  const { isConnected, connect } = useContext(WalletContext)

  const handleMint = async () => {
    setError("")
    setMinting(true)

    try {
      if (!isConnected) {
        return
      }

      // Simulate approval process
      setTimeout(() => {
        setApproved(true)

        // Simulate minting after approval
        setTimeout(() => {
          setMinting(false)
          setOpen(false)
          alert("Fortune minted successfully! (Demo mode)")
        }, 2000)
      }, 2000)
    } catch (err) {
      console.error(err)
      setError("Something went wrong. Please try again.")
      setMinting(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className={`bg-violet-600 hover:bg-violet-700 ${className}`}>
        <Sparkles className="mr-2 h-4 w-4" />
        Mint as NFT
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-violet-950 border-violet-300/20 text-white">
          <DialogHeader>
            <DialogTitle>Mint Your Fortune as NFT</DialogTitle>
            <DialogDescription className="text-violet-200">
              Mint this unique fortune as an NFT on Base for just $0.5 USDC
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 rounded-lg bg-white/5 border border-violet-300/20">
            <p className="text-white text-sm mb-2">
              <span className="font-bold">Username:</span> {username}
            </p>
            <p className="text-white text-sm mb-2">
              <span className="font-bold">Sign:</span> {sign} ({year})
            </p>
            <p className="text-white text-sm italic">"{fortune}"</p>
          </div>

          {error && <p className="text-red-300 text-sm">{error}</p>}

          <DialogFooter>
            {!isConnected ? (
              <div className="flex flex-col space-y-2 w-full">
                <Button onClick={connect} className="w-full bg-violet-600 hover:bg-violet-700">
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </Button>
              </div>
            ) : (
              <Button onClick={handleMint} disabled={minting} className="w-full bg-violet-600 hover:bg-violet-700">
                {minting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {!approved ? "Approving USDC..." : "Minting..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {!approved ? "Approve USDC" : "Mint for $0.5 USDC"}
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
