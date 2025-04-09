import { zodiacData } from "./zodiac-data"

// Western Zodiac
export function getWesternZodiacSign(day: number, month: number) {
  const dates = [
    { name: "Capricorn", start: { month: 12, day: 22 }, end: { month: 1, day: 19 } },
    { name: "Aquarius", start: { month: 1, day: 20 }, end: { month: 2, day: 18 } },
    { name: "Pisces", start: { month: 2, day: 19 }, end: { month: 3, day: 20 } },
    { name: "Aries", start: { month: 3, day: 21 }, end: { month: 4, day: 19 } },
    { name: "Taurus", start: { month: 4, day: 20 }, end: { month: 5, day: 20 } },
    { name: "Gemini", start: { month: 5, day: 21 }, end: { month: 6, day: 20 } },
    { name: "Cancer", start: { month: 6, day: 21 }, end: { month: 7, day: 22 } },
    { name: "Leo", start: { month: 7, day: 23 }, end: { month: 8, day: 22 } },
    { name: "Virgo", start: { month: 8, day: 23 }, end: { month: 9, day: 22 } },
    { name: "Libra", start: { month: 9, day: 23 }, end: { month: 10, day: 22 } },
    { name: "Scorpio", start: { month: 10, day: 23 }, end: { month: 11, day: 21 } },
    { name: "Sagittarius", start: { month: 11, day: 22 }, end: { month: 12, day: 21 } },
  ]

  for (const sign of dates) {
    // Special case for Capricorn (spans December to January)
    if (sign.name === "Capricorn") {
      if ((month === 12 && day >= sign.start.day) || (month === 1 && day <= sign.end.day)) {
        return (
          zodiacData.western.signs.find((s) => s.name === sign.name) || {
            name: sign.name,
            element: "Unknown",
            symbol: "",
          }
        )
      }
    } else {
      if ((month === sign.start.month && day >= sign.start.day) || (month === sign.end.month && day <= sign.end.day)) {
        return (
          zodiacData.western.signs.find((s) => s.name === sign.name) || {
            name: sign.name,
            element: "Unknown",
            symbol: "",
          }
        )
      }
    }
  }

  // Default fallback
  return { name: "Unknown", element: "Unknown", symbol: "" }
}

// Chinese Zodiac
export function getChineseZodiacSign(year: number) {
  const animals = zodiacData.chinese.signs

  // Find the sign that includes this year
  for (const sign of animals) {
    if (sign.years.includes(year)) {
      return sign
    }
  }

  // If not found directly, calculate based on the 12-year cycle
  const remainder = year % 12
  const index = [8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7][remainder]
  return animals[index]
}

// Vedic Zodiac
export function getVedicZodiacSign(day: number, month: number) {
  const dates = [
    { name: "Mesha (Aries)", start: { month: 4, day: 14 }, end: { month: 5, day: 14 } },
    { name: "Vrishabha (Taurus)", start: { month: 5, day: 15 }, end: { month: 6, day: 14 } },
    { name: "Mithuna (Gemini)", start: { month: 6, day: 15 }, end: { month: 7, day: 14 } },
    { name: "Karka (Cancer)", start: { month: 7, day: 15 }, end: { month: 8, day: 14 } },
    { name: "Simha (Leo)", start: { month: 8, day: 15 }, end: { month: 9, day: 15 } },
    { name: "Kanya (Virgo)", start: { month: 9, day: 16 }, end: { month: 10, day: 15 } },
    { name: "Tula (Libra)", start: { month: 10, day: 16 }, end: { month: 11, day: 14 } },
    { name: "Vrishchika (Scorpio)", start: { month: 11, day: 15 }, end: { month: 12, day: 14 } },
    { name: "Dhanu (Sagittarius)", start: { month: 12, day: 15 }, end: { month: 1, day: 13 } },
    { name: "Makara (Capricorn)", start: { month: 1, day: 14 }, end: { month: 2, day: 12 } },
    { name: "Kumbha (Aquarius)", start: { month: 2, day: 13 }, end: { month: 3, day: 14 } },
    { name: "Meena (Pisces)", start: { month: 3, day: 15 }, end: { month: 4, day: 13 } },
  ]

  for (const sign of dates) {
    // Special case for signs that span across months
    if (sign.start.month > sign.end.month) {
      if ((month === sign.start.month && day >= sign.start.day) || (month === sign.end.month && day <= sign.end.day)) {
        return (
          zodiacData.vedic.signs.find((s) => s.name === sign.name) || {
            name: sign.name,
            element: "Unknown",
            symbol: "",
          }
        )
      }
    } else {
      if ((month === sign.start.month && day >= sign.start.day) || (month === sign.end.month && day <= sign.end.day)) {
        return (
          zodiacData.vedic.signs.find((s) => s.name === sign.name) || {
            name: sign.name,
            element: "Unknown",
            symbol: "",
          }
        )
      }
    }
  }

  // Default fallback
  return { name: "Unknown", element: "Unknown", symbol: "" }
}

// Mayan Zodiac
export function getMayanZodiacSign(day: number, month: number, year: number) {
  // Simplified calculation for Mayan Tzolkin calendar
  // This is a basic approximation - a real implementation would be more complex

  // Convert Gregorian date to Julian day number (simplified)
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  const jdn =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045

  // Calculate Tzolkin day (1-20)
  const tzolkinDay = (jdn + 4) % 20 || 20

  // Get the corresponding sign
  const sign = zodiacData.mayan.signs[tzolkinDay - 1]

  return sign || { name: "Unknown", element: "Unknown", symbol: "" }
}
