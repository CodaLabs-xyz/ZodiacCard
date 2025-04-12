import { NextResponse } from 'next/server'
import { uploadImageToS3 } from '@/services/s3-upload.service'

export async function POST(req: Request) {
  try {
    const { imageUrl, username, sign, zodiacType } = await req.json()
    
    const result = await uploadImageToS3({
      imageUrl,
      username,
      sign,
      zodiacType,
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: 'Failed to process upload request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 