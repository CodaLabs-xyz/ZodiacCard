
import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Set in .env.local
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[${requestId}] 🟢 API Route Started - ${new Date().toISOString()}`)

  if (req.method !== 'POST') {
    console.log(`[${requestId}] ⚠️ Method Not Allowed: ${req.method}`)
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log(`[${requestId}] 📝 Parsing request body...`)
    const { prompt } = req.body
    console.log(`[${requestId}] ✅ Request parsed. Prompt length: ${prompt?.length ?? 0}`)
    console.log(`[${requestId}] 📄 Prompt content: "${prompt}"`)

    console.log(`[${requestId}] 🎨 Starting OpenAI image generation...`)
    const startTime = Date.now()
    
    const response = await openai.images.generate({
      model: 'dall-e-3', // or 'dall-e-2'
      prompt,
      n: 1,
      size: "1024x1024", // 👈 Smaller image size
    })
    
    const duration = Date.now() - startTime
    console.log(`[${requestId}] ✅ OpenAI request completed in ${duration}ms`)

    const imageUrl = response.data[0].url
    console.log(`[${requestId}] 🎉 Success - Image URL generated`)
    
    return res.status(200).json({ imageUrl })
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error'
    const errorCode = error?.code || 'NO_CODE'
    
    console.error(`[${requestId}] 🔴 Error generating image:`, {
      message: errorMessage,
      code: errorCode,
      stack: error?.stack,
      type: error?.type,
      status: error?.status,
      prompt: req.body?.prompt // Log the prompt in case of error too
    })
    
    // Check for specific OpenAI error types
    if (error instanceof OpenAI.APIError) {
      console.error(`[${requestId}] OpenAI API Error:`, {
        status: error.status,
        headers: error.headers,
        error: error.error
      })
    }
    
    return res.status(error?.status || 500).json({ 
      error: 'Image generation failed', 
      details: errorMessage 
    })
  } finally {
    console.log(`[${requestId}] 🏁 API Route Completed - ${new Date().toISOString()}`)
  }
}