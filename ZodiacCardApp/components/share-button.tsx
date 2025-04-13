"use client"

import { Button } from "@/components/ui/button"
import { Share2 } from "lucide-react"

interface ShareButtonProps {
  username: string
  sign: string
  fortune: string
  imageUrl?: string
  className?: string
}

export function ShareButton({ username, sign, fortune, imageUrl, className }: ShareButtonProps) {
  const handleShare = () => {
    let text = `🔮 My crypto fortune from Zoda: As a ${sign}, ${fortune}`

    // Add image if available
    if (imageUrl) {
      text += ` Check out my ${sign} character!`
    }

    text += ` Get yours at zoda.vercel.app`

    // Create the Warpcast URL
    let url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`
    if (imageUrl) {
      url += `&embeds[]=${encodeURIComponent(imageUrl)}&embeds[]=${encodeURIComponent('https://zodiaccard.xyz')}`
    }

    window.open(url, "_blank")
  }

  return (
    <Button
      onClick={handleShare}
      variant="outline"
      className={`border-violet-300/30 text-violet-200 hover:bg-violet-800/30 ${className}`}
    >
      <Share2 className="mr-2 h-4 w-4" />
      Share on Warpcast
    </Button>
  )
}
