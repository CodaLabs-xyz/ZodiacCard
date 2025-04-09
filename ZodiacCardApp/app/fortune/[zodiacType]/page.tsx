"use client"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { zodiacData } from "@/lib/zodiac-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { WesternZodiacForm } from "@/components/western-zodiac-form"
import { ChineseZodiacForm } from "@/components/chinese-zodiac-form"
import { VedicZodiacForm } from "@/components/vedic-zodiac-form"
import { MayanZodiacForm } from "@/components/mayan-zodiac-form"
import { useParams } from "next/navigation"

type ZodiacType = keyof typeof zodiacData

export default function FortunePage() {
  const router = useRouter()
  const params = useParams()
  const zodiacType = params.zodiacType as ZodiacType
  const zodiacInfo = zodiacData[zodiacType]

  if (!zodiacInfo) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#2D1B69] bg-gradient-to-b from-[#2D1B69] to-[#1E1240]">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-amber-300/20">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <p className="text-red-300 mb-4">Invalid zodiac type selected.</p>
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
      <div className="w-full max-w-md mb-6">
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
            priority
            className="object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#F5E6C8]"></div>
        </div>

        <CardHeader className="text-center pt-2">
          <CardTitle className="text-2xl font-bold text-gray-800">
            {zodiacInfo.emoji} {zodiacInfo.name} Fortune
          </CardTitle>
          <CardDescription className="text-gray-600">{zodiacInfo.description}</CardDescription>
        </CardHeader>

        <CardContent>
          {zodiacType === "western" && <WesternZodiacForm />}
          {zodiacType === "chinese" && <ChineseZodiacForm />}
          {zodiacType === "vedic" && <VedicZodiacForm />}
          {zodiacType === "mayan" && <MayanZodiacForm />}
        </CardContent>
      </Card>
    </main>
  )
}
