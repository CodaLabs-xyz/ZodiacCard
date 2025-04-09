"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles } from "lucide-react"
import { getChineseZodiacSign } from "@/lib/zodiac-utils"

export function ChineseZodiacForm() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [year, setYear] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!username || !year) {
      setError("Please fill in all fields")
      return
    }

    const yearNum = Number.parseInt(year)
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear()) {
      setError("Please enter a valid birth year")
      return
    }

    setIsLoading(true)
    try {
      const sign = getChineseZodiacSign(yearNum)
      const params = new URLSearchParams({
        username,
        year,
        sign: sign.name,
        zodiacType: "chinese",
      })

      router.push(`/result?${params.toString()}`)
    } catch (err) {
      setError("Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username" className="text-gray-800">
          Farcaster Username
        </Label>
        <Input
          id="username"
          placeholder="@username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="bg-amber-50 border-amber-200 text-gray-800 placeholder:text-amber-400"
        />
        <p className="text-xs text-gray-600">Enter your Farcaster username without the @ symbol</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="year" className="text-gray-800">
          Birth Year
        </Label>
        <Input
          id="year"
          placeholder="YYYY"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="bg-amber-50 border-amber-200 text-gray-800 placeholder:text-amber-400"
        />
        <p className="text-xs text-gray-600">Your Chinese zodiac sign will be determined by your birth year</p>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Button
        type="submit"
        className="w-full bg-amber-500 hover:bg-amber-600 text-amber-950 font-medium"
        disabled={isLoading}
      >
        <Sparkles className="mr-2 h-4 w-4" />
        {isLoading ? "Consulting the stars..." : "Reveal My Fortune"}
      </Button>

      <p className="text-xs text-center text-gray-600">
        Your fortune will be generated using AI based on your Chinese zodiac sign
      </p>
    </form>
  )
}
