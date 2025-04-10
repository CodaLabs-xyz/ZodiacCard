"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { zodiacData } from "@/lib/zodiac-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Share2 } from "lucide-react"
import { Header } from "@/components/header"

export default function ResultPage() {
  
  console.log('ResultPage')

  const searchParams = useSearchParams()
  const username = searchParams.get("username") || ""
  const sign = searchParams.get("sign") || ""
  const zodiacType = searchParams.get("zodiacType") || ""
  
  // Single ref to track generation state
  const generationStateRef = useRef({
    hasStarted: false,
    fortuneGenerated: false,
    imageGenerated: false
  })

  const [fortune, setFortune] = useState("")
  const [imageUrl, setImageUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [hasGeneratedFortune, setHasGeneratedFortune] = useState(false)

  // Get zodiac info
  const zodiacInfo = zodiacData[zodiacType as keyof typeof zodiacData]
  const signInfo = zodiacInfo?.signs.find((s) => s.name === sign) ||
    zodiacInfo?.signs.find((s) => s.name.includes(sign)) || { name: sign, element: "Unknown", symbol: "" }

  useEffect(() => {
    async function generateFortune() {
      if (!username || !sign || !zodiacType) {
        setIsLoading(false)
        setError("Missing required information")
        return
      }

      if (generationStateRef.current.fortuneGenerated) return

      try {
        console.log('Generating fortune')
        const response = await fetch("/api/generate-fortune", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            sign,
            zodiacType,
          }),
        })

        const data = await response.json()

        if (response.ok && data.fortune) {
          setFortune(data.fortune)
          generationStateRef.current.fortuneGenerated = true
        } else {
          // Fallback fortune
          setFortune(
            `As a ${sign}, your crypto journey looks promising! The stars align for financial growth, and your natural ${signInfo.element} energy will guide you to make wise investment choices. Trust your intuition this week.`,
          )
          generationStateRef.current.fortuneGenerated = true
        }
      } catch (apiError) {
        console.error("API error:", apiError)
        // Fallback fortune
        setFortune(
          `As a ${sign}, your crypto journey looks promising! The stars align for financial growth, and your natural ${signInfo.element} energy will guide you to make wise investment choices. Trust your intuition this week.`,
        )
        generationStateRef.current.fortuneGenerated = true
      }
    }

    async function generateImage() {
      if (!username || !sign || !zodiacType) {
        setError("Missing required information")
        return
      }

      if (generationStateRef.current.imageGenerated) return

      try {
        console.log('Generating image')
        const prompt = `This digital artwork blends anime and cosmic art to depict a mystical character embodying the zodiac ${zodiacType} and the sign ${sign}, intertwined with cryptocurrency themes. The character boasts flowing blue and turquoise hair, large ${sign} caracteristics adorned with starry constellations, and a glowing blockchain symbol floating beside the character, while the character holds a radiant crypto symbol that illuminates the character's robe, all set against an enchanting starry backdrop.`

        const imageResponse = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        })

        if (!imageResponse.ok) {
          throw new Error('Failed to generate image')
        }

        const imageData = await imageResponse.json()

        if (!imageData.imageUrl) {
          throw new Error('No image URL returned')
        }

        setImageUrl(imageData.imageUrl)
        generationStateRef.current.imageGenerated = true
      } catch (err) {
        console.error("Failed to generate image:", err)
        setError("Failed to generate your character image. Please try again.")
      }
    }

    async function generateAll() {
      if (generationStateRef.current.hasStarted) return
      
      try {
        generationStateRef.current.hasStarted = true
        setIsLoading(true)
        
        await generateFortune()
        await generateImage()
        
        setHasGeneratedFortune(true)
      } catch (err) {
        console.error("Error in generation process:", err)
        setError("Failed to complete the generation process. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    generateAll()

    return () => {
      // No need to reset the ref on cleanup as we want to preserve the generation state
    }
  }, [username, sign, zodiacType, signInfo.element])

  const handleShare = () => {
    const text = `My ${zodiacType} zodiac fortune from Zodiac: As a ${sign}, ${fortune} Check yours at https://ZodiacCard.xyz`
    const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`
    window.open(url, "_blank")
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center p-4 bg-[#2D1B69] bg-gradient-to-b from-[#2D1B69] to-[#1E1240]">
        <Header />
        <div className="flex flex-col items-center justify-center h-64 w-full max-w-md">
          <Loader2 className="h-12 w-12 text-amber-400 animate-spin mb-4" />
          <p className="text-amber-200 text-lg">Consulting the stars...</p>
        </div>
      </main>
    )
  }

  if (error || !zodiacInfo) {
    return (
      <main className="flex min-h-screen flex-col items-center p-4 bg-[#2D1B69] bg-gradient-to-b from-[#2D1B69] to-[#1E1240]">
        <Header />
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-amber-300/20">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <p className="text-red-300 mb-4">{error || "Something went wrong. Please try again."}</p>
            <Link href="/">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-[#2D1B69] bg-gradient-to-b from-[#2D1B69] to-[#1E1240]">
      <Header />
      <div className="w-full max-w-md mb-2 md:mb-6">
        <Link href="/">
          <Button variant="ghost" className="text-amber-200 hover:bg-amber-900/20">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Zodiac Selection
          </Button>
        </Link>
      </div>

      <Card className="w-full max-w-md bg-[#F5E6C8] border-2 border-amber-700 rounded-xl overflow-hidden">
        <div className="relative h-32 w-full">
          <Image
            src={zodiacInfo.image || "/placeholder.svg"}
            alt={zodiacInfo.name}
            fill
            className="object-cover object-top"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#F5E6C8]"></div>
        </div>

        <CardHeader className="text-center pt-2">
          <CardTitle className="text-2xl font-bold text-gray-800">
            <span className="text-amber-700">{username}</span>'s Fortune **
          </CardTitle>
          <CardDescription className="text-gray-600">
            {zodiacInfo.emoji} {zodiacInfo.name}: {signInfo.name} {'symbol' in signInfo ? signInfo.symbol : ''}
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center">
          {imageUrl && (
            <div className="mb-6 overflow-hidden">
              <div className="relative w-full aspect-square max-w-[400px] mx-auto rounded-xl overflow-hidden">
                <Image 
                  src={imageUrl} 
                  alt={`Generated character for ${username}'s ${zodiacType} ${sign}`}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          )}

          {generationStateRef.current.hasStarted && !imageUrl && !error && (
            <div className="mb-6 p-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
            </div>
          )}

          <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-gray-800 text-lg italic">{fortune}</p>
          </div>
          <p className="text-gray-600 text-sm">Generated on {new Date().toLocaleDateString()}</p>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          <Button onClick={handleShare} className="w-full bg-amber-500 hover:bg-amber-600 text-amber-950 font-medium">
            <Share2 className="mr-2 h-4 w-4" />
            Share on Warpcast
          </Button>

          <Link href={`/fortune/${zodiacType}`} className="w-full">
            <Button variant="outline" className="w-full border-amber-300 text-amber-800 hover:bg-amber-100">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Try Another
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </main>
  )
}
