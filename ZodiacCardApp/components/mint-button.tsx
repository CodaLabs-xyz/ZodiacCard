"use client"

import { useState, useEffect } from "react"
import { useAccount, useConnect, useChainId, useSwitchChain, usePublicClient, useContractRead, useWaitForTransactionReceipt } from 'wagmi'
import { useContractInteraction } from "@/hooks/useContractInteraction"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Sparkles, Wallet, Share2 } from "lucide-react"
import Image from "next/image"
import { parseUnits, formatUnits, decodeEventLog, type Log } from "viem"
import { zodiacNftAbi } from "@/lib/abis"
import { type BaseError, ContractFunctionExecutionError } from 'viem'

// Get chain configuration from environment variables
const TARGET_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "84532")
const NETWORK_NAME = TARGET_CHAIN_ID === 8453 ? "Base" : "Base Sepolia"

// Get contract addresses from environment variables
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_PROXY_CONTRACT_ADDRESS as `0x${string}`
const USDC_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS as `0x${string}`
const MINT_FEE = parseUnits(process.env.NEXT_PUBLIC_USDC_MINT_PRICE || "2.99", 6) // USDC with 6 decimals

// Configure OpenSea URL based on network
const OPENSEA_URL = TARGET_CHAIN_ID === 8453 
  ? `https://opensea.io/item/base/${CONTRACT_ADDRESS}`
  : `https://testnets.opensea.io/assets/base_sepolia/${CONTRACT_ADDRESS}`

if (!CONTRACT_ADDRESS || !USDC_CONTRACT_ADDRESS) {
  throw new Error('Contract addresses not set in environment variables')
}

// USDC ABI for approval
const usdcAbi = [
  {
    constant: false,
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function"
  }
]

interface MintButtonProps {
  imageUrl: string
  zodiacSign: string
  zodiacType: string
  fortune: string
  username: string
  onSuccess?: (tokenId: string) => void
}

// Helper function to upload to IPFS
async function uploadToIPFS(content: string | Blob, isMetadata: boolean = false): Promise<{ ipfsUrl: string }> {
  const response = await fetch('/api/upload-to-ipfs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(isMetadata ? { content, isMetadata } : { url: content })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`Failed to upload to IPFS: ${errorData.error || response.statusText}`)
  }

  return response.json()
}

// Add this helper function after the contract addresses declarations
function formatUSDC(amount: bigint): string {
  return `${formatUnits(amount, 6)} USDC`
}

export function MintButton({ 
  imageUrl, 
  zodiacSign, 
  zodiacType,
  fortune, 
  username, 
  onSuccess 
}: MintButtonProps) {
  const { address } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const publicClient = usePublicClient()
  const [isMinting, setIsMinting] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [tokenId, setTokenId] = useState<string | null>(null)
  const [isMinted, setIsMinted] = useState(false)
  const [imageIpfsUrl, setImageIpfsUrl] = useState<string | null>(null)

  // Check USDC allowance
  const { data: usdcAllowance } = useContractRead({
    address: USDC_CONTRACT_ADDRESS,
    abi: usdcAbi,
    functionName: 'allowance',
    args: [address!, CONTRACT_ADDRESS],
    query: {
      enabled: !!address,
      select: (data: unknown) => BigInt(data?.toString() || "0")
    }
  })

  const { writeContract } = useContractInteraction()

  const handleMint = async () => {
    try {
      setError(null)
      setIsMinting(true)

      if (!publicClient || !address) {
        setError('Wallet not connected')
        setIsMinting(false)
        return
      }

      // Check chain ID
      if (chainId !== TARGET_CHAIN_ID) {
        await switchChain({ chainId: TARGET_CHAIN_ID })
        return
      }

      // Check USDC allowance
      const currentAllowance = usdcAllowance ?? BigInt("0")
      if (currentAllowance < MINT_FEE) {
        // console.log('Approving USDC spending:', formatUSDC(MINT_FEE))
        setIsApproving(true)

        try {
          const approvalHash = await writeContract({
            address: USDC_CONTRACT_ADDRESS,
            abi: usdcAbi,
            functionName: 'approve',
            args: [CONTRACT_ADDRESS, MINT_FEE],
          })

          // Wait for approval transaction
          await publicClient.waitForTransactionReceipt({ hash: approvalHash })
        } catch (error) {
          console.error('USDC approval error:', error)
          setError('Failed to approve USDC spending')
          setIsApproving(false)
          setIsMinting(false)
          return
        }
        setIsApproving(false)
      }

      // Upload image to IPFS
      const { ipfsUrl: imageIpfsUrlUploaded } = await uploadToIPFS(imageUrl)
      if (!imageIpfsUrlUploaded) throw new Error('Failed to upload image to IPFS')
      setImageIpfsUrl(imageIpfsUrlUploaded)

      // Create metadata

      const metadata = {
        name: `Zodiac Card Fortune #${Date.now()}`,
        description: `A unique Zodiac fortune for ${username}. ${fortune}`,
        image: `https://ipfs.io/ipfs/${imageIpfsUrlUploaded.replace('ipfs://', '')}`,
        external_url: process.env.NEXT_PUBLIC_SITE_URL,
        attributes: [
          { trait_type: "Zodiac Card", value: zodiacType },
          { trait_type: "Zodiac Sign", value: zodiacSign },
          { trait_type: "Username", value: username },
          { trait_type: "Collection", value: "Zodiac Card" }
        ]
      }

      // Upload metadata to IPFS
      const { ipfsUrl: metadataIpfsUrl } = await uploadToIPFS(JSON.stringify(metadata), true)
      if (!metadataIpfsUrl) throw new Error('Failed to upload metadata to IPFS')

      // Mint NFT - the contract will handle the USDC transfer
      // console.log('Minting NFT with metadata:', metadataIpfsUrl)
      const mintHash = await writeContract({
        address: CONTRACT_ADDRESS,
        abi: zodiacNftAbi,
        functionName: 'mint',
        args: [address, metadataIpfsUrl],
      })

      // Wait for mint transaction and get token ID
      const receipt = await publicClient.waitForTransactionReceipt({ hash: mintHash })
      const mintEvent = receipt.logs.find(log => {
        try {
          const event = decodeEventLog({
            abi: zodiacNftAbi,
            data: log.data,
            topics: log.topics,
          })
          return event.eventName === 'NFTMinted'
        } catch {
          return false
        }
      })

      if (mintEvent) {
        const { args } = decodeEventLog({
          abi: zodiacNftAbi,
          data: mintEvent.data,
          topics: mintEvent.topics,
        }) as { args: { tokenId: bigint } }
        
        const newTokenId = args.tokenId.toString()
        setTokenId(newTokenId)
        setIsMinted(true)
        onSuccess?.(newTokenId)
      }

      setIsMinting(false)
      setIsDialogOpen(true)

    } catch (err) {
      console.error('Mint error:', err)
      const error = err as BaseError
      setError(error.shortMessage || 'Failed to mint NFT')
      setIsMinting(false)
    }
  }

  const handleShareWarpcast = async () => {
    if (!tokenId) return
    
    // console.log(zodiacSign)
    // console.log(tokenId)
    // console.log(imageUrl)
    // console.log(zodiacType)
    // console.log(username)
    // console.log(fortune)
    // console.log(imageIpfsUrl)
    // console.log("--------------------------------")

    const text = `Just minted my Zodiac Card NFT! Check out my fortune ✨:\n\nZodiac: ${zodiacType.toUpperCase()}\nSign: ${zodiacSign}\n${fortune}\n\nCheck yours at www.ZodiacCard.xyz`
    const url = `${OPENSEA_URL}/${tokenId}`
    
    let warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`

    if(imageIpfsUrl) {
      //warpcastUrl +=  `&embeds[]=${encodeURIComponent(imageIpfsUrl)}`
      const gatewayUrl = `https://ipfs.io/ipfs/${imageIpfsUrl.replace('ipfs://', '')}`
      warpcastUrl += `&embeds[]=${encodeURIComponent(gatewayUrl)}`
    }
    window.open(warpcastUrl, '_blank')
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <Button
        onClick={handleMint}
        disabled={isMinting || isApproving || !address || isMinted}
        className="w-full"
        variant={isMinted ? "secondary" : "default"}
      >
        {isApproving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Approving USDC...
          </>
        ) : isMinting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Minting...
          </>
        ) : !address ? (
          <>
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet
          </>
        ) : isMinted ? (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            NFT Minted
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Mint NFT • {formatUSDC(MINT_FEE)}
          </>
        )}
      </Button>

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}

      {!address && (
        <p className="mt-2 text-sm text-muted-foreground text-center">
          Mint cost: {formatUSDC(MINT_FEE)}
        </p>
      )}

      {isMinted && tokenId && (
        <div className="flex gap-2">
          <Button
            onClick={() => window.open(`${OPENSEA_URL}/${tokenId}`, '_blank')}
            variant="outline"
            className="flex-1"
          >
            <Image
              src="/opensea.png"
              alt="OpenSea"
              width={20}
              height={20}
              className="mr-2"
            />
            View on OpenSea
          </Button>
          <Button
            onClick={handleShareWarpcast}
            variant="outline"
            className="flex-1"
          >
            <Image
              src="/farcaster.png"
              alt="Warpcast"
              width={20}
              height={20}
              className="mr-2"
            />
            Share on Warpcast
          </Button>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>NFT Minted Successfully!</DialogTitle>
            <DialogDescription>
              Your Zodiac Card NFT has been minted. You can view it on OpenSea or share it on Warpcast.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            <Image
              src={imageUrl}
              alt="Minted NFT"
              width={300}
              height={300}
              className="rounded-lg"
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              onClick={() => window.open(`${OPENSEA_URL}/${tokenId}`, '_blank')}
              variant="outline"
            >
              <Image
                src="/opensea.png"
                alt="OpenSea"
                width={20}
                height={20}
                className="mr-2"
              />
              View on OpenSea
            </Button>
            <Button
              onClick={handleShareWarpcast}
              variant="outline"
            >
              <Image
                src="/farcaster.png"
                alt="Warpcast"
                width={20}
                height={20}
                className="mr-2"
              />
              Share on Warpcast
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

