import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

export async function POST(req: Request) {
  try {
    // Validate environment variables
    const bucketName = process.env.AWS_S3_BUCKET
    if (!bucketName) {
      console.error('AWS_S3_BUCKET environment variable is not set')
      return NextResponse.json({ error: 'S3 bucket not configured' }, { status: 500 })
    }

    const { imageUrl, username, sign, zodiacType } = await req.json()
    const bucketDirectory = process.env.AWS_S3_BUCKET_DIRECTORY || 'ZodiacAssets'

    console.log('Uploading to bucket:', bucketName)
    console.log('Directory:', bucketDirectory)

    // Fetch the image from the URL
    const response = await fetch(imageUrl)
    if (!response.ok) throw new Error('Failed to fetch image')
    const imageBuffer = await response.arrayBuffer()

    // Generate a unique filename
    const timestamp = Date.now()
    const filename = `${username}-${zodiacType}-${sign}-${timestamp}.png`
    const key = `${bucketDirectory}/${filename}`

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: Buffer.from(imageBuffer),
      ContentType: 'image/png',
    })

    console.log('Attempting to upload file:', key)
    await s3Client.send(uploadCommand)
    console.log('Successfully uploaded to S3')

    // Construct the S3 URL
    const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`
    console.log('Generated S3 URL:', s3Url)

    return NextResponse.json({ success: true, s3Url })
  } catch (error) {
    console.error('Error uploading to S3:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      })
    }
    return NextResponse.json({ 
      error: 'Failed to upload image to S3',
      fallback: true,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 