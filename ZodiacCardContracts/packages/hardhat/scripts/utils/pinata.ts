import axios from 'axios'
import * as dotenv from 'dotenv'
dotenv.config()

const PINATA_API_KEY = process.env.PINATA_API_KEY
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY

if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    throw new Error('Pinata API keys not found in .env')
}

export async function uploadJsonToPinata(json: any) {
    try {
        const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS'
        const response = await axios.post(
            url,
            json,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'pinata_api_key': PINATA_API_KEY,
                    'pinata_secret_api_key': PINATA_SECRET_KEY
                }
            }
        )
        return response.data.IpfsHash
    } catch (error: any) {
        console.error('Error uploading to Pinata:', error.response?.data || error.message)
        throw error
    }
}

export async function uploadMetadataAndSetBaseURI(zodaNFT: any, metadata: any) {
    try {
        // Upload metadata to IPFS via Pinata
        console.log('\n📤 Uploading metadata to IPFS via Pinata...')
        const metadataHash = await uploadJsonToPinata(metadata)
        console.log('✅ Metadata uploaded! IPFS Hash:', metadataHash)

        // Set the base URI in the contract
        const baseURI = `ipfs://${metadataHash}/`
        console.log('\n🔄 Setting base URI to:', baseURI)
        
        const tx = await zodaNFT.setBaseURI(baseURI)
        console.log('⏳ Transaction hash:', tx.hash)
        
        await tx.wait()
        console.log('✅ Base URI set successfully!')

        return baseURI
    } catch (error: any) {
        console.error('Error in upload and URI setting:', error.message)
        throw error
    }
} 