import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { username, sign, zodiacType } = await req.json()

    // Get OpenRouter API key from environment variables
    const apiKey = process.env.OPENROUTER_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        fortune: `As a ${sign}, your crypto journey looks promising! The stars align for financial growth, and your intuition will guide you to make wise investment choices. Trust your instincts this week.`,
      })
    }

    // Create a prompt for the fortune generation based on zodiac type
    let systemPrompt = "You are a mystical fortune teller specializing in crypto fortunes based on zodiac signs."

    const prompt = `Generate a positive, optimistic crypto fortune for a person with the ${zodiacType} zodiac sign of ${sign}. 
    The fortune should be personalized for ${username}, be 2-3 sentences long, and include:
    1. A reference to their zodiac sign's traits
    2. A positive prediction about their crypto investments or projects
    3. A bit of mystical/celestial language
    4. Keep it upbeat and encouraging
    
    Format it as a direct message to the user without any additional text.`

    // Add specific details based on zodiac type
    if (zodiacType === "western") {
      systemPrompt += " You specialize in Western astrology based on the sun's position at birth."
    } else if (zodiacType === "chinese") {
      systemPrompt += " You specialize in Chinese zodiac based on the 12-year animal cycle."
    } else if (zodiacType === "vedic") {
      systemPrompt += " You specialize in Vedic astrology (Jyotish) based on actual constellations."
    } else if (zodiacType === "mayan") {
      systemPrompt += " You specialize in Mayan Tzolk'in calendar and its 20 day signs."
    }

    // Call the OpenRouter API with GPT-4o-mini
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://zodiac.vercel.app",
        "X-Title": "Zodiac Fortune Teller",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 150,
      }),
    })

    // Handle API errors
    if (!response.ok) {
      console.error("OpenRouter API error:", await response.text())
      return NextResponse.json({
        fortune: `As a ${sign}, your crypto journey looks promising! The stars align for financial growth, and your intuition will guide you to make wise investment choices. Trust your instincts this week.`,
      })
    }

    try {
      const data = await response.json()
      const fortune = data.choices[0].message.content.trim()
      return NextResponse.json({ fortune })
    } catch (parseError) {
      console.error("Error parsing API response:", parseError)
      return NextResponse.json({
        fortune: `As a ${sign}, your crypto journey looks promising! The stars align for financial growth, and your intuition will guide you to make wise investment choices. Trust your instincts this week.`,
      })
    }
  } catch (error) {
    console.error("Error generating fortune:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
