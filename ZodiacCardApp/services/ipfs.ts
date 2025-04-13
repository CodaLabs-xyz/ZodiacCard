import PinataClient from '@pinata/sdk'
import { Readable } from 'stream'

interface UploadToPinataResponse {
  IpfsHash: string
  PinSize: number
  Timestamp: string
  isDuplicate?: boolean
}

interface IpfsUploadResult {
  ipfsHash: string
  ipfsUrl: string
  gatewayUrl: string
}

interface IpfsServiceConfig {
  apiKey: string
  secretKey: string
}

// Convert buffer to stream
function bufferToStream(buffer: Buffer) {
  const readable = new Readable()
  readable.push(buffer)
  readable.push(null)
  return readable
}

export class IpfsService {
  private pinata: PinataClient

  constructor(config: IpfsServiceConfig) {
    this.pinata = new PinataClient(config.apiKey, config.secretKey)
  }

  async uploadMetadata(content: string): Promise<IpfsUploadResult> {
    const result = await this.pinata.pinJSONToIPFS(JSON.parse(content), {
      pinataMetadata: {
        name: `zodiac-metadata-${Date.now()}.json`,
      },
      pinataOptions: {
        cidVersion: 1,
      },
    }) as UploadToPinataResponse

    return this.formatUploadResult(result)
  }

  async uploadImage(url: string): Promise<IpfsUploadResult> {
    let buffer: Buffer

    // Handle base64 data URLs
    if (url.startsWith('data:')) {
      const base64Data = url.split(',')[1]
      buffer = Buffer.from(base64Data, 'base64')
    } else {
      // Handle regular URLs
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch image')
      }
      const arrayBuffer = await response.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    }
    
    // Create a readable stream from the buffer
    const stream = bufferToStream(buffer)
    
    // Upload to Pinata
    const result = await this.pinata.pinFileToIPFS(stream, {
      pinataMetadata: {
        name: `zodiac-character-${Date.now()}.png`,
      },
      pinataOptions: {
        cidVersion: 1,
      },
    }) as UploadToPinataResponse

    return this.formatUploadResult(result)
  }

  private formatUploadResult(result: UploadToPinataResponse): IpfsUploadResult {
    return {
      ipfsHash: result.IpfsHash,
      ipfsUrl: `ipfs://${result.IpfsHash}`,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
    }
  }
} 