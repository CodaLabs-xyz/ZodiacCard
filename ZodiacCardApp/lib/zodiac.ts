interface ZodiacSign {
  name: string
  years: number[]
  emoji: string
  element: string
  traits: string[]
}

const signs: ZodiacSign[] = [
  {
    name: "Rat",
    years: [1924, 1936, 1948, 1960, 1972, 1984, 1996, 2008, 2020],
    emoji: "🐀",
    element: "Water",
    traits: ["quick-witted", "resourceful", "versatile", "adaptable"],
  },
  {
    name: "Ox",
    years: [1925, 1937, 1949, 1961, 1973, 1985, 1997, 2009, 2021],
    emoji: "🐂",
    element: "Earth",
    traits: ["diligent", "dependable", "strong", "determined"],
  },
  {
    name: "Tiger",
    years: [1926, 1938, 1950, 1962, 1974, 1986, 1998, 2010, 2022],
    emoji: "🐅",
    element: "Wood",
    traits: ["brave", "confident", "competitive", "unpredictable"],
  },
  {
    name: "Rabbit",
    years: [1927, 1939, 1951, 1963, 1975, 1987, 1999, 2011, 2023],
    emoji: "🐇",
    element: "Wood",
    traits: ["quiet", "elegant", "kind", "responsible"],
  },
  {
    name: "Dragon",
    years: [1928, 1940, 1952, 1964, 1976, 1988, 2000, 2012, 2024],
    emoji: "🐉",
    element: "Earth",
    traits: ["confident", "intelligent", "enthusiastic", "ambitious"],
  },
  {
    name: "Snake",
    years: [1929, 1941, 1953, 1965, 1977, 1989, 2001, 2013, 2025],
    emoji: "🐍",
    element: "Fire",
    traits: ["enigmatic", "intuitive", "wise", "determined"],
  },
  {
    name: "Horse",
    years: [1930, 1942, 1954, 1966, 1978, 1990, 2002, 2014, 2026],
    emoji: "🐎",
    element: "Fire",
    traits: ["energetic", "independent", "impatient", "adventurous"],
  },
  {
    name: "Goat",
    years: [1931, 1943, 1955, 1967, 1979, 1991, 2003, 2015, 2027],
    emoji: "🐐",
    element: "Earth",
    traits: ["gentle", "compassionate", "creative", "resilient"],
  },
  {
    name: "Monkey",
    years: [1932, 1944, 1956, 1968, 1980, 1992, 2004, 2016, 2028],
    emoji: "🐒",
    element: "Metal",
    traits: ["witty", "intelligent", "curious", "playful"],
  },
  {
    name: "Rooster",
    years: [1933, 1945, 1957, 1969, 1981, 1993, 2005, 2017, 2029],
    emoji: "🐓",
    element: "Metal",
    traits: ["observant", "hardworking", "courageous", "talented"],
  },
  {
    name: "Dog",
    years: [1934, 1946, 1958, 1970, 1982, 1994, 2006, 2018, 2030],
    emoji: "🐕",
    element: "Earth",
    traits: ["loyal", "honest", "amiable", "responsible"],
  },
  {
    name: "Pig",
    years: [1935, 1947, 1959, 1971, 1983, 1995, 2007, 2019, 2031],
    emoji: "🐖",
    element: "Water",
    traits: ["compassionate", "generous", "diligent", "optimistic"],
  },
]

export const zodiac = {
  getSign: (year: number): ZodiacSign => {
    const sign = signs.find((sign) => sign.years.includes(year))
    if (!sign) {
      // Calculate the sign based on the 12-year cycle
      const remainder = year % 12
      const index = [8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7][remainder]
      return signs[index]
    }
    return sign
  },
  getAllSigns: (): ZodiacSign[] => {
    return signs
  },
}
