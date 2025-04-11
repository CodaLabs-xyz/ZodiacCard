import { NextResponse } from 'next/server'
import pinataSDK from '@pinata/sdk'
import { Readable } from 'stream'

const pinata = new pinataSDK(
  process.env.PINATA_API_KEY as string,
  process.env.PINATA_SECRET_KEY as string
)

interface UploadToPinataResponse {
  IpfsHash: string
  PinSize: number
  Timestamp: string
  isDuplicate?: boolean
}

// Convert buffer to stream
function bufferToStream(buffer: Buffer) {
  const readable = new Readable()
  readable.push(buffer)
  readable.push(null)
  return readable
}

export async function POST(req: Request) {
  try {
    const { url, content, isMetadata } = await req.json()

    // Handle metadata upload
    if (isMetadata && content) {
      const result = await pinata.pinJSONToIPFS(JSON.parse(content), {
        pinataMetadata: {
          name: `zodiac-metadata-${Date.now()}.json`,
        },
        pinataOptions: {
          cidVersion: 1,
        },
      }) as UploadToPinataResponse

      return NextResponse.json({
        ipfsHash: result.IpfsHash,
        ipfsUrl: `ipfs://${result.IpfsHash}`,
        gatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
      })
    }

    // Handle image upload
    if (!url) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    let buffer: Buffer

    // Handle base64 data URLs
    if (url.startsWith('data:')) {
      const base64Data = url.split(',')[1]
      buffer = Buffer.from(base64Data, 'base64')
    } else {
      // Handle regular URLs
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch image')
      }
      const arrayBuffer = await response.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    }
    
    // Create a readable stream from the buffer
    const stream = bufferToStream(buffer)
    
    // Upload to Pinata
    const result = await pinata.pinFileToIPFS(stream, {
      pinataMetadata: {
        name: `zodiac-character-${Date.now()}.png`,
      },
      pinataOptions: {
        cidVersion: 1,
      },
    }) as UploadToPinataResponse

    // Return IPFS URL in ipfs:// format
    return NextResponse.json({
      ipfsHash: result.IpfsHash,
      ipfsUrl: `ipfs://${result.IpfsHash}`,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
    })
  } catch (error) {
    console.error('Error uploading to Pinata:', error)
    return NextResponse.json(
      { error: 'Failed to upload to IPFS' },
      { status: 500 }
    )
  }
} 