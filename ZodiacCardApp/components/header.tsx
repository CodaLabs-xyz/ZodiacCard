import Image from "next/image"
import { zodiac } from "@/lib/zodiac"

export function Header() {
  // Get current year
  const currentYear = new Date().getFullYear()

  // Get the zodiac sign for the current year
  const currentSign = zodiac.getSign(currentYear)

  return (
    <div className="w-full flex flex-col items-center justify-center py-6 px-4">
      <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-2">
        <span className="text-violet-300">Zoda</span>
      </h1>
      <p className="text-violet-200 text-lg mb-4">Crypto Fortune Teller</p>

      <div className="relative w-40 h-40 mb-4">
        <div className="absolute inset-0 bg-violet-600/20 rounded-full blur-xl"></div>
        <div className="relative w-full h-full flex items-center justify-center">
          {currentYear === 2024 ? (
            <Image
              src="/dragon.svg"
              alt="Year of the Dragon"
              width={160}
              height={160}
              className="drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]"
            />
          ) : (
            <div className="text-7xl">{currentSign.emoji}</div>
          )}
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-xl text-white font-semibold">Year of the {currentSign.name}</h2>
        <p className="text-violet-200 text-sm">
          {currentYear} - {currentSign.element} {currentSign.name}
        </p>
      </div>
    </div>
  )
}
