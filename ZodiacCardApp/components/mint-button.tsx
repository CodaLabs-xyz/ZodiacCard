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
import { sdk } from "@farcaster/frame-sdk"
import { useNFTMint, createNFTMetadata } from "@/services/nft"
import { parseUnits, formatUnits, decodeEventLog, type Log } from "viem"
import { zodiacNftAbi } from "@/lib/abis"
import { type BaseError, ContractFunctionExecutionError } from 'viem'

// Get chain configuration from environment variables
const TARGET_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "84532")
const NETWORK_NAME = TARGET_CHAIN_ID === 8453 ? "Base" : "Base Sepolia"

// Get contract addresses from environment variables
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_PROXY_CONTRACT_ADDRESS as `0x${string}`
const USDC_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS as `0x${string}`
const MINT_FEE = parseUnits(process.env.NEXT_PUBLIC_USDC_MINT_PRICE || "0.5", 6) // USDC with 6 decimals

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

export function MintButton({ 
  imageUrl, 
  zodiacSign, 
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
        console.log('Approving USDC spending:', formatUnits(MINT_FEE, 6), 'USDC')
        setIsApproving(true)

        const approvalHash = await writeContract({
          address: USDC_CONTRACT_ADDRESS,
          abi: usdcAbi,
          functionName: 'approve',
          args: [CONTRACT_ADDRESS, MINT_FEE],
        })

        // Wait for approval transaction
        await publicClient.waitForTransactionReceipt({ hash: approvalHash })
        setIsApproving(false)
      }

      // Upload image to IPFS
      const { ipfsUrl: imageIpfsUrl } = await uploadToIPFS(imageUrl)
      if (!imageIpfsUrl) throw new Error('Failed to upload image to IPFS')

      // Create metadata
      const metadata = {
        name: `Zodiac Card Fortune #${Date.now()}`,
        description: `A unique Zodiac fortune for ${username}. ${fortune}`,
        image: imageIpfsUrl,
        external_url: process.env.NEXT_PUBLIC_SITE_URL,
        attributes: [
          { trait_type: "Zodiac Card", value: "western" },
          { trait_type: "Zodiac Sign", value: zodiacSign },
          { trait_type: "Username", value: username },
          { trait_type: "Collection", value: "Zodiac Card" }
        ]
      }

      // Upload metadata to IPFS
      const { ipfsUrl: metadataIpfsUrl } = await uploadToIPFS(JSON.stringify(metadata), true)
      if (!metadataIpfsUrl) throw new Error('Failed to upload metadata to IPFS')

      // Mint NFT
      console.log('Minting NFT with metadata:', metadataIpfsUrl)
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

  return (
    <>
      <Button
        onClick={handleMint}
        disabled={isMinting || isApproving || !address}
        className="w-full"
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
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Process NFT
          </>
        )}
      </Button>

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>NFT Minted Successfully!</DialogTitle>
            <DialogDescription>
              Your Zodiac Card NFT has been minted. You can view it on OpenSea.
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
            >
              <Share2 className="mr-2 h-4 w-4" />
              View on OpenSea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

