import type { NextApiRequest, NextApiResponse } from 'next'
import { uploadMetadata, MetadataServiceError } from '@/services/metadata'

interface ResponseData {
  metadataUrl?: string
  ipfsHash?: string
  error?: string
  details?: unknown
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const result = await uploadMetadata(req.body)
    return res.status(200).json(result)
  } catch (error) {
    console.error('Error in upload-metadata handler:', error)
    
    if (error instanceof MetadataServiceError) {
      return res.status(error.message.includes('not configured') ? 503 : 400).json({
        error: error.message,
        details: error.details
      })
    }

    return res.status(500).json({ error: 'Failed to upload metadata to IPFS' })
  }
} 