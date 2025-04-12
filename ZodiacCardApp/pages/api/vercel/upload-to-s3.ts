import type { NextApiRequest, NextApiResponse } from 'next'
import { uploadImageToS3 } from '@/services/s3-upload.service'

type ResponseData = {
  success?: boolean
  s3Url?: string
  error?: string
  fallback?: boolean
  details?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { imageUrl, username, sign, zodiacType } = req.body
    
    const result = await uploadImageToS3({
      imageUrl,
      username,
      sign,
      zodiacType,
    })

    if (!result.success) {
      return res.status(500).json(result)
    }

    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      error: 'Failed to process upload request',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 