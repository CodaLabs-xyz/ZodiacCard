"use client"

import { useEffect, useState } from "react"
import { getFrameMetadata } from "@coinbase/onchainkit"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

interface FrameComponentProps {
  username: string
  sign: string
  fortune: string
}

export function FrameComponent({ username, sign, fortune }: FrameComponentProps) {
  const [isFarcaster, setIsFarcaster] = useState(false)

  useEffect(() => {
    // Check if we're in a Farcaster frame context
    const userAgent = navigator.userAgent.toLowerCase()
    setIsFarcaster(userAgent.includes("farcaster") || window.location.href.includes("?fc=1"))
  }, [])

  if (!isFarcaster) {
    return null
  }

  // Generate frame metadata
  const frameMetadata = getFrameMetadata({
    buttons: [
      {
        label: "Get My Fortune",
      },
    ],
    image: {
      src: `${window.location.origin}/api/og?username=${encodeURIComponent(username)}&sign=${encodeURIComponent(sign)}&fortune=${encodeURIComponent(fortune)}`,
      aspectRatio: "1.91:1",
    },
    postUrl: `${window.location.origin}/api/frame`,
  })

  return (
    <div className="mt-4">
      <Button className="w-full bg-violet-600 hover:bg-violet-700">
        <Sparkles className="mr-2 h-4 w-4" />
        Continue in Frame
      </Button>
      <div dangerouslySetInnerHTML={{ __html: frameMetadata }} />
    </div>
  )
}
