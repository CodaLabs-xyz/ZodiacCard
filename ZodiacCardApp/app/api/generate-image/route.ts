// app/api/generate-image/route.ts
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Set in .env.local
})

export async function POST(req: Request) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[${requestId}] 🟢 API Route Started - ${new Date().toISOString()}`)

  if (req.method !== 'POST') {
    console.log(`[${requestId}] ⚠️ Method Not Allowed: ${req.method}`)
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }

  try {
    console.log(`[${requestId}] 📝 Parsing request body...`)
    const { prompt } = await req.json()
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
    
    return NextResponse.json({ imageUrl })
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error'
    const errorCode = error?.code || 'NO_CODE'
    
    console.error(`[${requestId}] 🔴 Error generating image:`, {
      message: errorMessage,
      code: errorCode,
      stack: error?.stack,
      type: error?.type,
      status: error?.status,
      prompt: prompt // Log the prompt in case of error too
    })
    
    // Check for specific OpenAI error types
    if (error instanceof OpenAI.APIError) {
      console.error(`[${requestId}] OpenAI API Error:`, {
        status: error.status,
        headers: error.headers,
        error: error.error
      })
    }
    
    return NextResponse.json(
      { error: 'Image generation failed', details: errorMessage },
      { status: error?.status || 500 }
    )
  } finally {
    console.log(`[${requestId}] 🏁 API Route Completed - ${new Date().toISOString()}`)
  }
}