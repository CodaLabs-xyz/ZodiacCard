import type { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const baseUrl = req.nextUrl.origin

  // Generate frame metadata
  const frameMetadata = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Zoda - Crypto Fortune Teller</title>
        <meta property="og:title" content="Zoda - Crypto Fortune Teller" />
        <meta property="og:description" content="Discover your crypto fortune based on your Chinese zodiac sign" />
        <meta property="og:image" content="${baseUrl}/api/og" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${baseUrl}/api/og" />
        <meta property="fc:frame:button:1" content="Get My Fortune" />
        <meta property="fc:frame:post_url" content="${baseUrl}/api/frame" />
      </head>
      <body>
        <p>This is a Farcaster Frame. View it on Warpcast or another Farcaster client.</p>
      </body>
    </html>
  `

  return new Response(frameMetadata, {
    headers: {
      "Content-Type": "text/html",
    },
  })
}
