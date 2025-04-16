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
import { Loader2, Sparkles, Wallet, Share2, SwitchCamera } from "lucide-react"
import Image from "next/image"
import { parseUnits, formatUnits, decodeEventLog, type Log } from "viem"
import { zodiacNftAbi } from "@/lib/abis"
import { type BaseError, ContractFunctionExecutionError } from 'viem'
import { sdk } from "@farcaster/frame-sdk"

// Get chain configuration from environment variables
const TARGET_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "84532")
const NETWORK_NAME = TARGET_CHAIN_ID === 8453 ? "Base" : "Base Sepolia"

// Get contract addresses from environment variables
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_PROXY_CONTRACT_ADDRESS as `0x${string}`
const USDC_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS as `0x${string}`
const MINT_FEE = parseUnits(process.env.NEXT_PUBLIC_USDC_MINT_PRICE || "2.99", 6) // USDC with 6 decimals

// Configure OpenSea URL based on network
const OPENSEA_URL = TARGET_CHAIN_ID === 8453 
  ? `https://opensea.io/item/base/${CONTRACT_ADDRESS.toLowerCase()}`
  : `https://testnets.opensea.io/assets/base_sepolia/${CONTRACT_ADDRESS.toLowerCase()}`

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
  const { switchChain, isPending: isSwitchPending } = useSwitchChain()
  const publicClient = usePublicClient()
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [tokenId, setTokenId] = useState<string | null>(null)
  const [isMinted, setIsMinted] = useState(false)
  const [imageIpfsUrl, setImageIpfsUrl] = useState<string | null>(null)
  const [isWrongNetwork, setIsWrongNetwork] = useState(false)
  const [mintStep, setMintStep] = useState<'initial' | 'approving' | 'uploading' | 'minting'>('initial')

  // Check if we're on the wrong network
  useEffect(() => {
    if (chainId && chainId !== TARGET_CHAIN_ID) {
      setIsWrongNetwork(true)
      setError(`Please switch to ${NETWORK_NAME} to mint`)
    } else {
      setIsWrongNetwork(false)
      setError(null)
    }
  }, [chainId])

  // Check USDC allowance
  const { data: usdcAllowance } = useContractRead({
    address: USDC_CONTRACT_ADDRESS,
    abi: usdcAbi,
    functionName: 'allowance',
    args: [address!, CONTRACT_ADDRESS],
    query: {
      enabled: !!address && !isWrongNetwork,
      select: (data: unknown) => BigInt(data?.toString() || "0")
    }
  })

  const { writeContract } = useContractInteraction()

  const handleSwitchNetwork = async () => {
    try {
      setError(null)
      await switchChain({ chainId: TARGET_CHAIN_ID })
    } catch (error) {
      console.error('Failed to switch network:', error)
      setError(`Failed to switch to ${NETWORK_NAME}. Please try manually.`)
    }
  }

  const handleApproveAndMint = async () => {
    try {
      setError(null)
      setMintStep('initial')

      if (!publicClient || !address) {
        setError('Wallet not connected')
        return
      }

      // Check chain ID first
      if (chainId !== TARGET_CHAIN_ID) {
        setError(`Please switch to ${NETWORK_NAME} to mint`)
        try {
          await switchChain({ chainId: TARGET_CHAIN_ID })
        } catch (error) {
          console.error('Failed to switch network:', error)
          setError(`Failed to switch to ${NETWORK_NAME}. Please switch manually.`)
        }
        return
      }

      // Check USDC allowance and approve if needed
      const currentAllowance = usdcAllowance ?? BigInt("0")
      if (currentAllowance < MINT_FEE) {
        setMintStep('approving')
        try {
          const approvalHash = await writeContract({
            address: USDC_CONTRACT_ADDRESS,
            abi: usdcAbi,
            functionName: 'approve',
            args: [CONTRACT_ADDRESS, MINT_FEE],
          })
          await publicClient.waitForTransactionReceipt({ hash: approvalHash })
        } catch (error) {
          console.error('USDC approval error:', error)
          if (error instanceof Error) {
            if (error.message.includes('user rejected')) {
              setError('USDC approval was rejected. Please try again.')
            } else if (error.message.includes('insufficient funds')) {
              setError('Insufficient USDC balance for approval.')
            } else {
              setError(`Failed to approve USDC: ${error.message}`)
            }
          } else {
            setError('Failed to approve USDC spending')
          }
          setMintStep('initial')
          return
        }
      }

      // Upload to IPFS
      setMintStep('uploading')
      const { ipfsUrl: imageIpfsUrlUploaded } = await uploadToIPFS(imageUrl)
      if (!imageIpfsUrlUploaded) {
        setError('Failed to upload image to IPFS')
        setMintStep('initial')
        return
      }
      setImageIpfsUrl(imageIpfsUrlUploaded)

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

      const { ipfsUrl: metadataIpfsUrl } = await uploadToIPFS(JSON.stringify(metadata), true)
      if (!metadataIpfsUrl) {
        setError('Failed to upload metadata to IPFS')
        setMintStep('initial')
        return
      }

      // Mint NFT
      setMintStep('minting')
      try {
        const mintHash = await writeContract({
          address: CONTRACT_ADDRESS,
          abi: zodiacNftAbi,
          functionName: 'mint',
          args: [address, metadataIpfsUrl],
        })

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
        } else {
          throw new Error('Mint transaction succeeded but no NFTMinted event found')
        }

        setMintStep('initial')
        setIsDialogOpen(true)

      } catch (err) {
        console.error('Mint error:', err)
        const error = err as Error
        const message = error.message.toLowerCase()
        
        if (message.includes('user rejected')) {
          setError('Transaction was rejected. Please try again.')
        } else if (message.includes('insufficient funds')) {
          setError('Insufficient USDC balance to mint.')
        } else if (message.includes('gas required exceeds allowance')) {
          setError('Transaction requires more gas than allowed. Please try again.')
        } else if (message.includes('nonce too low')) {
          setError('Transaction failed due to nonce mismatch. Please try again.')
        } else if (message.includes('timeout')) {
          setError('Transaction timed out. Please check your wallet for the status.')
        } else if (message.includes('network error') || message.includes('connection refused')) {
          setError('Network connection error. Please check your connection and try again.')
        } else {
          setError(error.message || 'Failed to mint NFT')
        }
        setMintStep('initial')
      }

    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
      setMintStep('initial')
    }
  }

  const handleShareWarpcast = async () => {
    if (!tokenId) return
    
    const text = `Just minted my Zodiac Card NFT! Check out my fortune ✨:\n\nZodiac: ${zodiacType.toUpperCase()}\nSign: ${zodiacSign}\n${fortune}\n\nCheck in OpenSea: ${OPENSEA_URL}/${tokenId}`
    // let warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`
    // if(imageIpfsUrl) {
    //   const gatewayUrl = `https://ipfs.io/ipfs/${imageIpfsUrl.replace('ipfs://', '')}`
    //   //warpcastUrl += `&embeds[]=${imageUrl}&embeds[]=${encodeURIComponent('https://zodiaccard.xyz')}`
    // }
    //console.log(warpcastUrl)
    //window.open(warpcastUrl, '_blank')

    await sdk.actions.composeCast({ 
      text,
      embeds: [imageUrl,"https://zodiaccard.xyz"],
    })    
  }
     

  // Render button based on current state
  const renderButton = () => {
    if (isWrongNetwork) {
      return (
        <Button
          onClick={handleSwitchNetwork}
          disabled={isSwitchPending}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
        >
          {isSwitchPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Switching Network...
            </>
          ) : (
            <>
              <SwitchCamera className="mr-2 h-4 w-4" />
              Switch to {NETWORK_NAME}
            </>
          )}
        </Button>
      )
    }

    if (!address) {
      return (
        <Button onClick={handleApproveAndMint} disabled={true} className="w-full">
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
        </Button>
      )
    }

    if (isMinted) {
      return (
        <Button disabled className="w-full" variant="secondary">
          <Sparkles className="mr-2 h-4 w-4" />
          NFT Minted
        </Button>
      )
    }

    return (
      <Button
        onClick={handleApproveAndMint}
        disabled={mintStep !== 'initial'}
        className="w-full"
      >
        {mintStep === 'approving' ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Approving USDC...
          </>
        ) : mintStep === 'uploading' ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading to IPFS...
          </>
        ) : mintStep === 'minting' ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Minting NFT...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Mint NFT • {formatUSDC(MINT_FEE)}
          </>
        )}
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {renderButton()}
      
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}

      {!address && (
        <p className="mt-2 text-sm text-muted-foreground text-center">
          Mint cost: {formatUSDC(MINT_FEE)}
        </p>
      )}

      {/* Success actions */}
      {isMinted && tokenId && (
        <div className="flex gap-2">
          <Button
            onClick={async () => {
              // window.open(`${OPENSEA_URL}/${tokenId}`, '_blank')
              // handleShareWarpcast()
              await sdk.actions.openUrl(`${OPENSEA_URL}/${tokenId}`)
            }}
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
            Share
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
              onClick={async () => {
                // window.open(`${OPENSEA_URL}/${tokenId}`, '_blank')
                await sdk.actions.openUrl(`${OPENSEA_URL}/${tokenId}`)
              }}
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
              Share
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

