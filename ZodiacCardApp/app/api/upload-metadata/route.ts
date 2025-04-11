import { NextResponse } from 'next/server'
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

type NFTMetadata = z.infer<typeof MetadataSchema>

export async function POST(req: Request) {
  try {
    if (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET_KEY) {
      return NextResponse.json(
        { error: 'IPFS upload service not configured' },
        { status: 503 }
      )
    }

    const metadata = await req.json()

    // Validate metadata structure
    const validationResult = MetadataSchema.safeParse(metadata)
    if (!validationResult.success) {
      console.error('Metadata validation failed:', validationResult.error)
      return NextResponse.json(
        { error: 'Invalid metadata format', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const validMetadata = validationResult.data

    console.log('Uploading metadata to IPFS:', validMetadata)

    // Get zodiac sign and year from attributes
    const zodiacSign = validMetadata.attributes.find((attr: NFTAttribute) => attr.trait_type === 'Zodiac Sign')?.value || ''
    const year = validMetadata.attributes.find((attr: NFTAttribute) => attr.trait_type === 'Year')?.value || ''

    // Upload metadata to IPFS via Pinata
    const result = await pinata.pinJSONToIPFS(validMetadata, {
      pinataMetadata: {
        name: `Zoda Fortune - ${validMetadata.name}`
      },
    })

    console.log('Metadata uploaded successfully:', result)

    return NextResponse.json({ 
      metadataUrl: `ipfs://${result.IpfsHash}`,
      ipfsHash: result.IpfsHash,
    })
  } catch (error) {
    console.error('Error uploading metadata:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid metadata format', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to upload metadata to IPFS' },
      { status: 500 }
    )
  }
} 