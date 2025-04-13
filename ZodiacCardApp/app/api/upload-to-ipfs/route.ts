import { NextResponse } from 'next/server'
import { IpfsService } from '@/services/ipfs'

const ipfsService = new IpfsService({
  apiKey: process.env.PINATA_API_KEY as string,
  secretKey: process.env.PINATA_SECRET_KEY as string,
})

interface UploadToPinataResponse {
  IpfsHash: string
  PinSize: number
  Timestamp: string
  isDuplicate?: boolean
}

export async function POST(req: Request) {
  try {
    const { url, content, isMetadata } = await req.json()

    // Handle metadata upload
    if (isMetadata && content) {
      const result = await ipfsService.uploadMetadata(content)
      return NextResponse.json(result)
    }

    // Handle image upload
    if (!url) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    const result = await ipfsService.uploadImage(url)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error uploading to Pinata:', error)
    return NextResponse.json(
      { error: 'Failed to upload to IPFS' },
      { status: 500 }
    )
  }
} 