// app/api/generate-image/route.ts
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Set in .env.local
})

export async function POST(req: Request) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }

  try {
    const { prompt } = await req.json()

    const response = await openai.images.generate({
      model: 'dall-e-3', // or 'dall-e-2'
      prompt,
      n: 1,
      size: "1024x1024", // 👈 Smaller image size
    })

    const imageUrl = response.data[0].url
    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('Error generating image:', error)
    return NextResponse.json({ error: 'Image generation failed' }, { status: 500 })
  }
}