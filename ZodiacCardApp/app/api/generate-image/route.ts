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

  let prompt: string | undefined

  try {
    console.log(`[${requestId}] 📝 Parsing request body...`)
    const body = await req.json()
    prompt = body.prompt

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Invalid prompt. Must be a non-empty string.' },
        { status: 400 }
      )
    }

    if (prompt.length > 4000) {
      return NextResponse.json(
        { error: 'Prompt is too long. Maximum length is 4000 characters.' },
        { status: 400 }
      )
    }

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
      prompt: prompt // Now prompt is accessible here
    })
    
    return NextResponse.json(
      { error: 'Image generation failed', details: errorMessage },
      { status: error?.status || 500 }
    )
  } finally {
    console.log(`[${requestId}] 🏁 API Route Completed - ${new Date().toISOString()}`)
  }
}