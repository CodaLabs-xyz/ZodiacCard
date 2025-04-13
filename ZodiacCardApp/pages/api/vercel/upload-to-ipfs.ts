import type { NextApiRequest, NextApiResponse } from 'next'
import { IpfsService } from '@/services/ipfs'

interface ResponseData {
  ipfsHash?: string
  ipfsUrl?: string
  gatewayUrl?: string
  error?: string
}

const ipfsService = new IpfsService({
  apiKey: process.env.PINATA_API_KEY as string,
  secretKey: process.env.PINATA_SECRET_KEY as string,
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { url, content, isMetadata } = req.body

    // Handle metadata upload
    if (isMetadata && content) {
      const result = await ipfsService.uploadMetadata(content)
      return res.status(200).json(result)
    }

    // Handle image upload
    if (!url) {
      return res.status(400).json({ error: 'Image URL is required' })
    }

    const result = await ipfsService.uploadImage(url)
    return res.status(200).json(result)
  } catch (error) {
    console.error('Error uploading to Pinata:', error)
    return res.status(500).json({ error: 'Failed to upload to IPFS' })
  }
} 