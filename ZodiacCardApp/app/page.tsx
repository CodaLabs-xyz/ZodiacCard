"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence, type PanInfo } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Header } from "@/components/header"

const zodiacSystems = [
  {
    id: "western",
    name: "Western Zodiac",
    description: "Based on: Sun's position at your birth",
    requirements: "Required: Date of birth (day, month, year)",
    image: "/images/western-zodiac.png",
    emoji: "🌟",
  },
  {
    id: "chinese",
    name: "Chinese Zodiac",
    description: "Based on: 12-year animal cycle in the lunar calendar",
    requirements: "Required: Year of birth",
    image: "/images/chinese-zodiac.png",
    emoji: "🐉",
  },
  {
    id: "vedic",
    name: "Vedic Zodiac (Jyotish)",
    description: "Based on: Actual constellations (sidereal zodiac)",
    requirements: "Required: Date of birth (day, month, year)",
    image: "/images/vedic-zodiac.png",
    emoji: "🕉",
  },
  {
    id: "mayan",
    name: "Mayan Zodiac",
    description: "Based on: Tzolk'in calendar (260-day cycle)",
    requirements: "Required: Date of birth (day, month, year)",
    image: "/images/mayan-zodiac.png",
    emoji: "🌿",
  },
]

export default function Home() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  useEffect(() => {
    // Auto-rotate carousel every 10 seconds
    const timer = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prevIndex) => (prevIndex + 1) % zodiacSystems.length)
    }, 10000)

    // Clear the timer when component unmounts or when currentIndex changes
    return () => clearInterval(timer)
  }, [currentIndex]) // Reset timer when user manually changes slides

  const handleNext = () => {
    setDirection(1)
    setCurrentIndex((prevIndex) => (prevIndex + 1) % zodiacSystems.length)
  }

  const handlePrevious = () => {
    setDirection(-1)
    setCurrentIndex((prevIndex) => (prevIndex - 1 + zodiacSystems.length) % zodiacSystems.length)
  }

  const handleSelect = () => {
    router.push(`/fortune/${zodiacSystems[currentIndex].id}`)
  }

  // Handle drag/swipe gestures
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 100) {
      // Swiped right - go to previous
      handlePrevious()
    } else if (info.offset.x < -100) {
      // Swiped left - go to next
      handleNext()
    }
  }

  const currentZodiac = zodiacSystems[currentIndex]

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 bg-[#2D1B69] bg-gradient-to-b from-[#2D1B69] to-[#1E1240]">
      <Header />
      <div className="w-full max-w-md text-center mb-4">
        <h1 className="text-3xl font-bold text-white mb-2">
          <span className="text-amber-300">Zodiac</span> Card
        </h1>
        <p className="text-amber-100">Discover your cosmic crypto destiny</p>
      </div>

      <div className="relative w-full max-w-sm">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction * 200 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -200 }}
            transition={{ duration: 0.3 }}
            className="w-full"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
          >
            <div className="flex justify-center">
              <Card className="w-[290px] md:w-full bg-[#F5E6C8] border-2 border-amber-700 rounded-xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative w-full flex justify-center">
                    <Image
                      src={currentZodiac.image || "/placeholder.svg"}
                      alt={currentZodiac.name}
                      width={400}
                      height={600}
                      className="w-auto h-[270px] md:h-[500px] mt-2 rounded-md"
                      priority={currentIndex === 0}
                      loading={currentIndex === 0 ? "eager" : "lazy"}
                      sizes="(max-width: 768px) 100vw, 400px"
                      draggable={false}
                    />
                  </div>
                  <div className="p-6 text-center">
                    {/*
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      {currentZodiac.emoji} {currentZodiac.name}
                    </h2>
                    */}

                    <p className="text-gray-700 mb-2">{currentZodiac.description}</p>
                    <p className="text-gray-600 text-sm">{currentZodiac.requirements}</p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center pb-6">
                  <Button
                    onClick={handleSelect}
                    className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-medium px-8 py-6 rounded-lg shadow-md transition-transform hover:scale-105"
                  >
                    Select {currentZodiac.name}
                  </Button>
                </CardFooter>
              </Card>
            </div>

          </motion.div>
        </AnimatePresence>

        <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1/2">
          <Button
            onClick={handlePrevious}
            size="icon"
            variant="outline"
            className="rounded-full bg-amber-100/80 border-amber-300 text-amber-900 hover:bg-amber-200 hover:text-amber-950"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </div>

        <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2">
          <Button
            onClick={handleNext}
            size="icon"
            variant="outline"
            className="rounded-full bg-amber-100/80 border-amber-300 text-amber-900 hover:bg-amber-200 hover:text-amber-950"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <div className="flex justify-center mt-6 gap-1">
        {zodiacSystems.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full ${index === currentIndex ? "bg-amber-300" : "bg-amber-300/30"}`}
          />
        ))}
      </div>
    </main>
  )
}
