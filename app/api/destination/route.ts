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

    // Get meal area based on country/region
    const mealArea = getMealDBArea(
      countryData.region,
      countryData.subregion,
      countryData.name.common
    )

    // Fetch weather, exchange rate, and meals concurrently using Promise.all
    const [weatherResult, exchangeResult, mealResult] = await Promise.all([
      // Weather API call with timezone
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=auto`
      )
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null) as Promise<(WeatherData & { timezone: string }) | null>,

      // Exchange rate API call (Frankfurter) with robust error handling
      currencyCode && currencyCode !== 'USD'
        ? fetch(`https://api.frankfurter.app/latest?from=USD&to=${currencyCode}`)
            .then((res) => {
              if (!res.ok) {
                console.error(`[v0] Frankfurter API failed for currency: ${currencyCode}, status: ${res.status}`)
                return null
              }
              return res.json()
            })
            .then((data) => {
              // Validate that rates object exists and has the expected currency
              if (data && data.rates && typeof data.rates[currencyCode] === 'number') {
                return data as ExchangeRateData
              }
              console.error(`[v0] Frankfurter API returned invalid data for currency: ${currencyCode}`, data)
              return null
            })
            .catch((err) => {
              console.error(`[v0] Frankfurter API error for currency: ${currencyCode}`, err)
              return null
            }) as Promise<ExchangeRateData | null>
        : Promise.resolve(currencyCode === 'USD' ? { rates: { USD: 1 } } : null),

      // TheMealDB API call for regional dishes - only fetch if direct match
      mealArea.isDirectMatch
        ? fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${mealArea.area}`)
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null) as Promise<MealData | null>
        : Promise.resolve(null),
    ])

    // Pick a random meal from the results (if available and direct match)
    let localDish = null
    if (mealArea.isDirectMatch && mealResult?.meals && mealResult.meals.length > 0) {
      const randomIndex = Math.floor(Math.random() * Math.min(mealResult.meals.length, 10))
      const meal = mealResult.meals[randomIndex]
      localDish = {
        name: meal.strMeal,
        image: meal.strMealThumb,
        cuisine: mealArea.area,
        isDirectMatch: true,
      }
    }

    // Build local flavors response with fallback info
    const localFlavorsData = localDish
      ? localDish
      : {
          name: null,
          image: null,
          cuisine: null,
          isDirectMatch: false,
          region: countryData.region,
          regionCuisine: mealArea.continentCuisine,
          fallbackArea: mealArea.regionFallback,
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
          currencyCode && exchangeResult?.rates?.[currencyCode]
            ? exchangeResult.rates[currencyCode]
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
