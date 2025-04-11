import { Address, parseEther, type Hash } from 'viem'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useChainId } from 'wagmi'
import { zodiacNftAbi } from '@/lib/abis'

interface NFTMetadata {
  name: string
  description: string
  image: string
  external_url?: string
  attributes: {
    trait_type: string
    value: string
  }[]
}

// Get chain configuration from environment variables
const TARGET_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "84532")

// Get contract address from environment variable
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_PROXY_CONTRACT_ADDRESS as Address
if (!CONTRACT_ADDRESS) {
  throw new Error('NEXT_PUBLIC_PROXY_CONTRACT_ADDRESS not set')
}

// Get mint price from environment variable
const MINT_PRICE = process.env.NEXT_PUBLIC_USDC_MINT_PRICE || "0.5"

export function createNFTMetadata({
  username,
  sign,
  year,
  fortune,
  imageUrl,
  tokenId,
}: {
  username: string
  sign: string
  year: string
  fortune: string
  imageUrl: string
  tokenId?: string
}): NFTMetadata {
  // Convert ipfs:// URLs to https gateway URLs for preview
  const formattedImageUrl = imageUrl.startsWith('ipfs://')
    ? `https://ipfs.io/ipfs/${imageUrl.replace('ipfs://', '')}`
    : imageUrl.startsWith('https://ipfs.io/ipfs/')
      ? imageUrl
      : `https://ipfs.io/ipfs/${imageUrl}`

  const metadata = {
    name: tokenId ? `Zodiac Card NFT #${tokenId}` : `${username}'s ${sign} Fortune`,
    description: fortune,
    image: formattedImageUrl, // Use gateway URL for better compatibility
    external_url: "https://ZodiacCard.xyz",
    attributes: [
      {
        trait_type: 'Collection',
        value: 'Zoda'
      },
      {
        trait_type: 'Zodiac Sign',
        value: sign,
      },
      {
        trait_type: 'Year',
        value: year,
      },
      {
        trait_type: 'Username',
        value: username,
      },
    ],
  }
  console.log('Creating NFT metadata with full details:', {
    name: metadata.name,
    description: metadata.description.substring(0, 100) + '...',
    image: metadata.image,
    imageUrl,
    formattedImageUrl,
    attributes: metadata.attributes
  })
  return metadata
}

export function useNFTMint() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const chainId = useChainId()

  // Contract write hook for NFT minting
  const {
    writeContract: mintNft,
    data: mintHash,
    isPending: isMinting,
    isSuccess: isMinted,
    error: mintError
  } = useWriteContract()

  // Wait for mint transaction
  const { 
    isLoading: isWaitingMint,
    isSuccess: isTransactionConfirmed,
  } = useWaitForTransactionReceipt({
    hash: mintHash,
  })

  const uploadMetadataToIPFS = async (metadata: NFTMetadata): Promise<string> => {
    console.log('Uploading metadata to IPFS with full details:', {
      name: metadata.name,
      description: metadata.description.substring(0, 100) + '...',
      image: metadata.image,
      attributes: metadata.attributes
    })

    const response = await fetch('/api/upload-metadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Failed to upload metadata:', error)
      throw new Error(error.error || 'Failed to upload metadata to IPFS')
    }

    const { metadataUrl } = await response.json()
    console.log('Metadata uploaded successfully:', { 
      metadataUrl,
      originalImage: metadata.image
    })

    // Convert ipfs:// to https:// for better compatibility
    const gatewayUrl = metadataUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')
    return gatewayUrl
  }

  const handleMint = async (metadata: NFTMetadata) => {
    try {
      if (!address) throw new Error('Wallet not connected')
      if (!publicClient) throw new Error('Public client not initialized')
      if (chainId !== TARGET_CHAIN_ID) throw new Error('Wrong network')

      console.log('Starting NFT mint process with metadata:', {
        name: metadata.name,
        description: metadata.description.substring(0, 100) + '...',
        image: metadata.image,
        attributes: metadata.attributes
      })

      const metadataUrl = await uploadMetadataToIPFS(metadata)
      console.log('Metadata URL for minting:', metadataUrl)

      // Mint NFT with metadata URL and mint price
      console.log('Minting NFT with params:', {
        contract: CONTRACT_ADDRESS,
        to: address,
        metadataUrl,
        value: MINT_PRICE
      })

      await mintNft({
        address: CONTRACT_ADDRESS,
        abi: zodiacNftAbi,
        functionName: 'mint',
        args: [address, metadataUrl] as const,
        value: parseEther(MINT_PRICE),
      })

      console.log('Mint transaction submitted successfully')
      return true
    } catch (error) {
      console.error('Minting error:', error)
      throw error
    }
  }

  return {
    handleMint,
    isMinting: isMinting || isWaitingMint,
    isSuccess: isMinted && isTransactionConfirmed,
    error: mintError,
    mintPrice: MINT_PRICE,
    mintHash,
  }
} 