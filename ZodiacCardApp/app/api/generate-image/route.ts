import { type NextRequest, NextResponse } from "next/server"

// Predefined image URLs for each zodiac sign
const zodiacImages = {
  Rat: "https://i.imgur.com/JQP8Hpm.png",
  Ox: "https://i.imgur.com/8JZC9Yw.png",
  Tiger: "https://i.imgur.com/KTvKnkD.png",
  Rabbit: "https://i.imgur.com/0XSxYcC.png",
  Dragon: "https://i.imgur.com/yfgmMHY.png",
  Snake: "https://i.imgur.com/JQP8Hpm.png",
  Horse: "https://i.imgur.com/8JZC9Yw.png",
  Goat: "https://i.imgur.com/KTvKnkD.png",
  Monkey: "https://i.imgur.com/0XSxYcC.png",
  Rooster: "https://i.imgur.com/yfgmMHY.png",
  Dog: "https://i.imgur.com/JQP8Hpm.png",
  Pig: "https://i.imgur.com/8JZC9Yw.png",
}

export async function POST(req: NextRequest) {
  try {
    const { sign } = await req.json()

    // Check if we have a predefined image for this sign
    if (zodiacImages[sign]) {
      return NextResponse.json({ imageUrl: zodiacImages[sign] })
    }

    // If no predefined image, return an error
    return NextResponse.json({ error: `No image available for ${sign}` }, { status: 404 })
  } catch (error) {
    console.error("Error generating image:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
