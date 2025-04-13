import pinataSDK from '@pinata/sdk'
import { z } from 'zod'

const pinata = new pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_SECRET_KEY
)

// Define attribute type
interface NFTAttribute {
  trait_type: string
  value: string
}

// Validate metadata structure following OpenSea standard
const MetadataSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  image: z.string(),
  external_url: z.string().optional(),
  attributes: z.array(z.object({
    trait_type: z.string(),
    value: z.string()
  }))
})

export type NFTMetadata = z.infer<typeof MetadataSchema>

export interface UploadMetadataResponse {
  metadataUrl: string
  ipfsHash: string
}

export class MetadataServiceError extends Error {
  constructor(
    message: string,
    public readonly details?: z.ZodError['errors']
  ) {
    super(message)
    this.name = 'MetadataServiceError'
  }
}

export async function uploadMetadata(metadata: unknown): Promise<UploadMetadataResponse> {
  if (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET_KEY) {
    throw new MetadataServiceError('IPFS upload service not configured')
  }

  // Validate metadata structure
  const validationResult = MetadataSchema.safeParse(metadata)
  if (!validationResult.success) {
    throw new MetadataServiceError('Invalid metadata format', validationResult.error.errors)
  }

  const validMetadata = validationResult.data

  try {
    // Upload metadata to IPFS via Pinata
    const result = await pinata.pinJSONToIPFS(validMetadata, {
      pinataMetadata: {
        name: `Zoda Fortune - ${validMetadata.name}`
      },
    })

    return {
      metadataUrl: `ipfs://${result.IpfsHash}`,
      ipfsHash: result.IpfsHash,
    }
  } catch (error) {
    console.error('Error uploading metadata to IPFS:', error)
    throw new MetadataServiceError('Failed to upload metadata to IPFS')
  }
} 