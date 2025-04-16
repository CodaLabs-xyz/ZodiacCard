import OpenAI from 'openai'

// Types
interface GenerateImageOptions {
  prompt: string
  requestId?: string
  model?: 'dall-e-3' | 'dall-e-2'
  size?: '1024x1024' | '1792x1024' | '1024x1792'
}

interface GenerateImageResponse {
  imageUrl: string
  duration: number
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Logger utility
function log(requestId: string, message: string, data?: any) {
  const timestamp = new Date().toISOString()
  console.log(`[${requestId}] ${message} - ${timestamp}`, data ? data : '')
}

export async function generateImage({
  prompt,
  requestId = Math.random().toString(36).substring(7),
  model = 'dall-e-3',
  size = '1024x1024'
}: GenerateImageOptions): Promise<GenerateImageResponse> {
  log(requestId, '🟢 Image Generation Started')

  try {
    const startTime = Date.now()
    
    // Check content moderation first
    log(requestId, '🔍 Checking content moderation...')
    const moderation = await openai.moderations.create({
      input: prompt,
    })
    
    const flagged = moderation.results[0].flagged
    
    if (flagged) {
      log(requestId, '⚠️ Prompt flagged by moderation API')
      throw new Error('Prompt contains inappropriate content and was flagged by moderation API.')
    }
    
    log(requestId, '✅ Content moderation passed')
    log(requestId, '🎨 Starting OpenAI image generation...')

    const response = await openai.images.generate({
      model,
      prompt,
      n: 1,
      size,
    })

    const duration = Date.now() - startTime
    const imageUrl = response.data[0].url

    if (!imageUrl) throw new Error('No image URL returned from OpenAI')

    log(requestId, `✅ OpenAI request completed in ${duration}ms`)
    log(requestId, '🎉 Success - Image URL generated')

    return {
      imageUrl,
      duration
    }
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error'
    const errorCode = error?.code || 'NO_CODE'
    
    console.error(`[${requestId}] 🔴 Error generating image:`, {
      message: errorMessage,
      code: errorCode,
      stack: error?.stack,
      type: error?.type,
      status: error?.status,
      prompt
    })
    
    if (error instanceof OpenAI.APIError) {
      console.error(`[${requestId}] OpenAI API Error:`, {
        status: error.status,
        headers: error.headers,
        error: error.error
      })
    }

    throw error
  } finally {
    log(requestId, '🏁 Image Generation Completed')
  }
} 