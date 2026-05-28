import { NextRequest, NextResponse } from 'next/server'

interface CountryData {
  name: {
    common: string
    official: string
  }
  capital?: string[]
  capitalInfo?: {
    latlng?: [number, number]
  }
  currencies?: Record<string, { name: string; symbol: string }>
  languages?: Record<string, string>
  flag: string
  flags: {
    png: string
    svg: string
  }
  latlng: [number, number]
  region: string
  subregion?: string
  timezones: string[]
}

interface WeatherData {
  current: {
    temperature_2m: number
    weather_code: number
  }
}

interface ExchangeRateData {
  rates: Record<string, number>
}

interface WikipediaData {
  query?: {
    pages?: Record<string, {
      pageid?: number
      extract?: string
      title?: string
    }>
  }
}

// TheMealDB has curated dishes for these 28 countries — use it first
const COUNTRY_TO_MEALDB_AREA: Record<string, string> = {
  'United States': 'American', 'United Kingdom': 'British', 'Canada': 'Canadian',
  'China': 'Chinese', 'Croatia': 'Croatian', 'Netherlands': 'Dutch',
  'Egypt': 'Egyptian', 'Philippines': 'Filipino', 'France': 'French',
  'Greece': 'Greek', 'India': 'Indian', 'Ireland': 'Irish', 'Italy': 'Italian',
  'Jamaica': 'Jamaican', 'Japan': 'Japanese', 'Kenya': 'Kenyan',
  'Malaysia': 'Malaysian', 'Mexico': 'Mexican', 'Morocco': 'Moroccan',
  'Poland': 'Polish', 'Portugal': 'Portuguese', 'Russia': 'Russian',
  'Spain': 'Spanish', 'Thailand': 'Thai', 'Tunisia': 'Tunisian',
  'Turkey': 'Turkish', 'Ukraine': 'Ukrainian', 'Vietnam': 'Vietnamese',
}

// Category titles to skip when searching Wikipedia — not actual dish categories
const SKIP_CAT = ['stubs', 'template', 'redirect', 'portal', 'by country', 'by region']
// Page titles to skip — non-dish articles that end up in cuisine categories
const SKIP_DISH = ['cuisine', 'cooking', 'chef', 'restaurant', 'network', 'television', 'culture', 'history', 'people', 'list of', 'food security', 'agriculture']

async function findLocalDish(countryName: string): Promise<{
  name: string | null
  image: string | null
  cuisine: string
}> {
  // Step 1: TheMealDB for countries with direct area support (curated, reliable images)
  const mealdbArea = COUNTRY_TO_MEALDB_AREA[countryName]
  if (mealdbArea) {
    try {
      const res = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${mealdbArea}`)
      if (res.ok) {
        const data = await res.json()
        if (data.meals?.length > 0) {
          // Pick a well-known dish: take from the middle of the list to avoid
          // purely alphabetical-first picks (which can be obscure)
          const idx = Math.min(3, Math.floor(data.meals.length / 4))
          const meal = data.meals[idx]
          return { name: meal.strMeal, image: meal.strMealThumb, cuisine: countryName }
        }
      }
    } catch (e) {
      console.error('[v0] TheMealDB error', e)
    }
  }

  // Step 2: For all other countries, find the Wikipedia cuisine category
  let categoryTitle: string | null = null
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(countryName + ' cuisine')}&srnamespace=14&srlimit=5&origin=*`
    )
    if (res.ok) {
      const data = await res.json()
      // Skip stub/template/redirect categories, take first real cuisine category
      const match = (data?.query?.search ?? []).find(
        (r: { title: string }) => !SKIP_CAT.some(s => r.title.toLowerCase().includes(s))
      )
      categoryTitle = match?.title ?? null
    }
  } catch (e) {
    console.error('[v0] Wikipedia category search error', e)
  }

  if (!categoryTitle) return { name: null, image: null, cuisine: countryName }

  // Step 3: One call — get category members + article sizes + images together
  // Sort by article size descending: larger articles = more notable/popular dishes
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&format=json` +
      `&generator=categorymembers&gcmtitle=${encodeURIComponent(categoryTitle)}&gcmlimit=30&gcmtype=page` +
      `&prop=info%7Cpageimages&pithumbsize=400&origin=*`
    )
    if (res.ok) {
      const data = await res.json()
      const pages: Array<{ title: string; length: number; thumbnail?: { source: string } }> =
        Object.values(data?.query?.pages ?? {}) as Array<{ title: string; length: number; thumbnail?: { source: string } }>

      const dishes = pages
        .filter(p => !SKIP_DISH.some(s => p.title.toLowerCase().includes(s)))
        .sort((a, b) => (b.length ?? 0) - (a.length ?? 0))

      // Return the most notable dish that has an image
      const withImage = dishes.find(p => p.thumbnail?.source)
      if (withImage) {
        return { name: withImage.title, image: withImage.thumbnail!.source, cuisine: countryName }
      }
      // Fallback: most notable dish even without image
      if (dishes.length > 0) {
        return { name: dishes[0].title, image: null, cuisine: countryName }
      }
    }
  } catch (e) {
    console.error('[v0] Wikipedia generator query error', e)
  }

  return { name: null, image: null, cuisine: countryName }
}

// Map regions to Wikipedia cuisine fallback titles
const REGION_TO_CUISINE_TITLE: Record<string, string> = {
  'Western Africa': 'West African cuisine',
  'Eastern Africa': 'East African cuisine',
  'Northern Africa': 'North African cuisine',
  'Southern Africa': 'Cuisine of Southern Africa',
  'Middle Africa': 'Central African cuisine',
  'Eastern Asia': 'East Asian cuisine',
  'South-Eastern Asia': 'Southeast Asian cuisine',
  'Southern Asia': 'South Asian cuisine',
  'Western Asia': 'Middle Eastern cuisine',
  'Central Asia': 'Central Asian cuisine',
  'Northern Europe': 'Northern European cuisine',
  'Western Europe': 'Western European cuisine',
  'Southern Europe': 'Mediterranean cuisine',
  'Eastern Europe': 'Eastern European cuisine',
  'Central America': 'Central American cuisine',
  'Caribbean': 'Caribbean cuisine',
  'South America': 'South American cuisine',
  'North America': 'North American cuisine',
  'Australia and New Zealand': 'Australian cuisine',
  'Melanesia': 'Oceanian cuisine',
  'Micronesia': 'Oceanian cuisine',
  'Polynesia': 'Polynesian cuisine',
}

// Broader region fallbacks
const BROAD_REGION_TO_CUISINE: Record<string, string> = {
  'Africa': 'African cuisine',
  'Asia': 'Asian cuisine',
  'Europe': 'European cuisine',
  'Americas': 'Latin American cuisine',
  'Oceania': 'Oceanian cuisine',
  'Antarctic': 'International cuisine',
}

// Fetch Wikipedia cuisine data with fallback
async function fetchCuisineData(countryName: string, subregion?: string, region?: string): Promise<{
  content: string | null
  source: 'country' | 'region' | null
  sourceTitle: string | null
}> {
  // Try country-specific cuisine first
  const countryTitle = `Cuisine_of_${countryName.replace(/ /g, '_')}`
  const countryUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(countryTitle)}&origin=*`
  
  try {
    const countryResponse = await fetch(countryUrl)
    if (countryResponse.ok) {
      const data: WikipediaData = await countryResponse.json()
      const pages = data.query?.pages
      if (pages) {
        const page = Object.values(pages)[0]
        if (page?.extract && page.pageid && page.pageid !== -1) {
          return {
            content: page.extract,
            source: 'country',
            sourceTitle: `Cuisine of ${countryName}`,
          }
        }
      }
    }
  } catch (error) {
    console.error(`[v0] Wikipedia API error for country cuisine: ${countryName}`, error)
  }

  // Try regional cuisine fallback
  const regionTitle = subregion && REGION_TO_CUISINE_TITLE[subregion]
    ? REGION_TO_CUISINE_TITLE[subregion]
    : region && BROAD_REGION_TO_CUISINE[region]
    ? BROAD_REGION_TO_CUISINE[region]
    : null

  if (regionTitle) {
    const regionUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(regionTitle.replace(/ /g, '_'))}&origin=*`
    
    try {
      const regionResponse = await fetch(regionUrl)
      if (regionResponse.ok) {
        const data: WikipediaData = await regionResponse.json()
        const pages = data.query?.pages
        if (pages) {
          const page = Object.values(pages)[0]
          if (page?.extract && page.pageid && page.pageid !== -1) {
            return {
              content: page.extract,
              source: 'region',
              sourceTitle: regionTitle,
            }
          }
        }
      }
    } catch (error) {
      console.error(`[v0] Wikipedia API error for regional cuisine: ${regionTitle}`, error)
    }
  }

  return { content: null, source: null, sourceTitle: null }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const country = searchParams.get('country')

  if (!country) {
    return NextResponse.json({ error: 'Country parameter is required' }, { status: 400 })
  }

  try {
    // First, fetch country data to get coordinates, currency, region, and timezone
    const countryResponse = await fetch(
      `https://restcountries.com/v3.1/name/${encodeURIComponent(country)}?fullText=false`
    )

    if (!countryResponse.ok) {
      return NextResponse.json({ error: 'Destination not found' }, { status: 404 })
    }

    const countries: CountryData[] = await countryResponse.json()
    const countryData = countries[0]

    if (!countryData) {
      return NextResponse.json({ error: 'Destination not found' }, { status: 404 })
    }

    // Get coordinates for weather (prefer capital coordinates if available)
    const lat = countryData.capitalInfo?.latlng?.[0] ?? countryData.latlng[0]
    const lng = countryData.capitalInfo?.latlng?.[1] ?? countryData.latlng[1]

    // Get currency code
    const currencyCode = countryData.currencies
      ? Object.keys(countryData.currencies)[0]
      : null
    const currencyInfo = currencyCode
      ? countryData.currencies?.[currencyCode]
      : null

    // Fetch weather, exchange rate, and country-specific dish concurrently
    const [weatherResult, exchangeResult, localDish] = await Promise.all([
      // Weather API call with timezone
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=auto`
      )
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null) as Promise<(WeatherData & { timezone: string }) | null>,

      // Exchange rate API call (open.er-api.com — free, 160+ currencies, no key needed)
      currencyCode && currencyCode !== 'USD'
        ? fetch(`https://open.er-api.com/v6/latest/USD`)
            .then((res) => {
              if (!res.ok) {
                console.error(`[v0] open.er-api failed, status: ${res.status}`)
                return null
              }
              return res.json()
            })
            .then((data) => {
              if (data?.result === 'success' && data.rates && typeof data.rates[currencyCode] === 'number') {
                return { rates: { [currencyCode]: data.rates[currencyCode] } } as ExchangeRateData
              }
              console.error(`[v0] open.er-api returned no rate for currency: ${currencyCode}`, data)
              return null
            })
            .catch((err) => {
              console.error(`[v0] open.er-api error for currency: ${currencyCode}`, err)
              return null
            }) as Promise<ExchangeRateData | null>
        : Promise.resolve(currencyCode === 'USD' ? { rates: { USD: 1 } } : null),

      // Country-specific dish via Wikipedia cuisine category + pageimages
      findLocalDish(countryData.name.common),
    ])

    const localFlavorsData = {
      name: localDish.name,
      image: localDish.image,
      cuisine: localDish.cuisine,
      hasImage: localDish.image !== null,
    }

    // Build response
    const response = {
      geography: {
        name: countryData.name.common,
        officialName: countryData.name.official,
        flag: countryData.flag,
        flagImage: countryData.flags.svg,
        languages: countryData.languages
          ? Object.values(countryData.languages)
          : [],
        region: countryData.region,
        subregion: countryData.subregion,
        coordinates: {
          lat,
          lng,
        },
      },
      climate: {
        capital: countryData.capital?.[0] ?? 'N/A',
        temperature: weatherResult?.current?.temperature_2m ?? null,
        weatherCode: weatherResult?.current?.weather_code ?? null,
      },
      financials: {
        currencyCode: currencyCode ?? 'N/A',
        currencyName: currencyInfo?.name ?? 'N/A',
        currencySymbol: currencyInfo?.symbol ?? '',
        exchangeRate:
          currencyCode && exchangeResult?.rates
            ? (exchangeResult.rates as Record<string, number>)[currencyCode] ?? null
            : currencyCode === 'USD'
            ? 1
            : null,
      },
      localTime: {
        timezone: weatherResult?.timezone ?? countryData.timezones?.[0] ?? null,
        capital: countryData.capital?.[0] ?? 'N/A',
      },
      localFlavors: localFlavorsData,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch destination data' },
      { status: 500 }
    )
  }
}
