"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { zodiac } from "@/lib/zodiac"
import { fortunes } from "@/lib/fortunes"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MintButton } from "@/components/mint-button"
import { ShareButton } from "@/components/share-button"
import { ArrowLeft, Loader2, Download, RefreshCw } from "lucide-react"

export default function FortunePage() {
  const searchParams = useSearchParams()
  const username = searchParams.get("username") || ""
  const year = searchParams.get("year") || ""
  const signName = searchParams.get("sign") || ""

  const [fortune, setFortune] = useState("")
  const [sign, setSign] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [isImageLoading, setIsImageLoading] = useState(false)
  const [imageError, setImageError] = useState("")

  // Function to generate the character image
  const generateCharacterImage = async () => {
    if (!signName) return

    try {
      setIsImageLoading(true)
      setImageError("")

      const imageResponse = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sign: signName,
        }),
      })

      // Handle non-OK responses
      if (!imageResponse.ok) {
        const errorData = await imageResponse.json().catch(() => ({}))
        console.error("Image API error response:", errorData)
        throw new Error(errorData.error || `API responded with status ${imageResponse.status}`)
      }

      // Try to parse the JSON response
      let imageData
      try {
        imageData = await imageResponse.json()
      } catch (parseError) {
        console.error("Error parsing image response:", parseError)
        throw new Error("Failed to parse image generation response")
      }

      if (imageData.imageUrl) {
        setImageUrl(imageData.imageUrl)
      } else {
        throw new Error("No image URL returned")
      }
    } catch (err) {
      console.error("Image generation error:", err)
      setImageError(err instanceof Error ? err.message : "Could not generate character image")
    } finally {
      setIsImageLoading(false)
    }
  }

  useEffect(() => {
    async function generateFortune() {
      if (!year || !username || !signName) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const birthYear = Number.parseInt(year)
        const zodiacSign = zodiac.getSign(birthYear)
        setSign(zodiacSign)

        // Try to get an AI-generated fortune
        try {
          const response = await fetch("/api/generate-fortune", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username,
              sign: signName,
              year,
            }),
          })

          const data = await response.json()

          if (response.ok && data.fortune) {
            setFortune(data.fortune)
          } else {
            // Fallback to predefined fortunes if API fails
            const signFortunes = fortunes[zodiacSign.name] || fortunes.default
            const randomIndex = Math.floor(Math.random() * signFortunes.length)
            setFortune(signFortunes[randomIndex])
          }
        } catch (apiError) {
          console.error("API error:", apiError)
          // Fallback to predefined fortunes
          const signFortunes = fortunes[zodiacSign.name] || fortunes.default
          const randomIndex = Math.floor(Math.random() * signFortunes.length)
          setFortune(signFortunes[randomIndex])
        }

        // Generate the character image
        await generateCharacterImage()
      } catch (err) {
        console.error(err)
        setError("Failed to generate your fortune. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    generateFortune()
  }, [year, username, signName])

  const handleDownloadImage = () => {
    if (imageUrl) {
      const link = document.createElement("a")
      link.href = imageUrl
      link.download = `zoda-${signName.toLowerCase()}-character.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center p-4 bg-gradient-to-b from-violet-900 to-indigo-950">
        <Header />
        <div className="flex flex-col items-center justify-center h-64 w-full max-w-md">
          <Loader2 className="h-12 w-12 text-violet-400 animate-spin mb-4" />
          <p className="text-violet-200 text-lg">Consulting the stars...</p>
        </div>
      </main>
    )
  }

  if (error || !sign) {
    return (
      <main className="flex min-h-screen flex-col items-center p-4 bg-gradient-to-b from-violet-900 to-indigo-950">
        <Header />
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-violet-300/20 mt-4">
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
    <main className="flex min-h-screen flex-col items-center p-4 bg-gradient-to-b from-violet-900 to-indigo-950">
      <Header />

      <div className="w-full max-w-md space-y-4">
        {/* Character Image Card */}
        <Card className="w-full bg-white/10 backdrop-blur-md border-violet-300/20">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-bold text-white">Your {sign.name} Character</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-4">
            {isImageLoading ? (
              <div className="w-full aspect-square flex flex-col items-center justify-center bg-violet-900/30 rounded-lg">
                <Loader2 className="h-12 w-12 text-violet-400 animate-spin mb-4" />
                <p className="text-violet-200">Creating your character...</p>
              </div>
            ) : imageUrl ? (
              <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                <Image
                  src={imageUrl || "/placeholder.svg"}
                  alt={`${sign.name} Character`}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-full aspect-square flex flex-col items-center justify-center bg-violet-900/30 rounded-lg">
                {imageError ? (
                  <>
                    <p className="text-6xl mb-4">{sign.emoji}</p>
                    <p className="text-violet-300 text-center mb-4">{imageError}</p>
                    <Button
                      onClick={generateCharacterImage}
                      variant="outline"
                      className="border-violet-300/30 text-violet-200 hover:bg-violet-800/30"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Try Again
                    </Button>
                  </>
                ) : (
                  <p className="text-6xl">{sign.emoji}</p>
                )}
              </div>
            )}
          </CardContent>
          {imageUrl && (
            <CardFooter>
              <Button
                onClick={handleDownloadImage}
                variant="outline"
                className="w-full border-violet-300/30 text-violet-200 hover:bg-violet-800/30"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Character
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* Fortune Card */}
        <Card className="w-full bg-white/10 backdrop-blur-md border-violet-300/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">
              <span className="text-violet-300">{username}</span>'s Fortune
            </CardTitle>
            <CardDescription className="text-violet-200">
              {sign.emoji} {sign.name} ({sign.years.join(", ")})
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-6 p-4 rounded-lg bg-white/5 border border-violet-300/20">
              <p className="text-white text-lg italic">{fortune}</p>
            </div>
            <p className="text-violet-200 text-sm">Generated on {new Date().toLocaleDateString()}</p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <div className="flex space-x-3 w-full">
              <ShareButton
                username={username}
                sign={sign.name}
                fortune={fortune}
                imageUrl={imageUrl}
                className="flex-1"
              />
              <MintButton username={username} year={year} sign={sign.name} fortune={fortune} className="flex-1" />
            </div>
            <Link href="/" className="w-full">
              <Button variant="ghost" className="w-full text-violet-200 hover:bg-violet-800/30">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Try Another
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
