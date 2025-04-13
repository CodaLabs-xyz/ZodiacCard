import { NextResponse } from 'next/server'
import { uploadMetadata, MetadataServiceError } from '@/services/metadata'

export async function POST(req: Request) {
  try {
    const metadata = await req.json()
    const result = await uploadMetadata(metadata)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in upload-metadata route:', error)
    
    if (error instanceof MetadataServiceError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.message.includes('not configured') ? 503 : 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to upload metadata to IPFS' },
      { status: 500 }
    )
  }
} 