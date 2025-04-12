import type { NextApiRequest, NextApiResponse } from 'next'
import { generateImage } from '@/services/image-generation'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { prompt } = req.body

    const { imageUrl } = await generateImage({ prompt })
    
    return res.status(200).json({ imageUrl })
  } catch (error: any) {
    return res.status(error?.status || 500).json({ 
      error: 'Image generation failed', 
      details: error?.message 
    })
  }
}