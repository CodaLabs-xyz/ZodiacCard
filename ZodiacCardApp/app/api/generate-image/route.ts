// app/api/generate-image/route.ts
import { NextResponse } from 'next/server'
import { generateImage } from '@/services/image-generation'

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

    console.log(`[${requestId}] 🎨 Starting image generation...`)
    const startTime = Date.now()
    
    const { imageUrl } = await generateImage({ prompt })
    
    const duration = Date.now() - startTime
    console.log(`[${requestId}] ✅ Image generation completed in ${duration}ms`)

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
    
    return NextResponse.json(
      { error: 'Image generation failed', details: errorMessage },
      { status: error?.status || 500 }
    )
  } finally {
    console.log(`[${requestId}] 🏁 API Route Completed - ${new Date().toISOString()}`)
  }
}