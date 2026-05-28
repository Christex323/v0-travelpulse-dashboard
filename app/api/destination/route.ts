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

interface MealData {
  meals: Array<{
    strMeal: string
    strMealThumb: string
    strArea: string
    idMeal: string
  }> | null
}

// Supported TheMealDB cuisine areas
const SUPPORTED_CUISINES = [
  'American', 'British', 'Canadian', 'Chinese', 'Croatian', 'Dutch', 
  'Egyptian', 'Filipino', 'French', 'Greek', 'Indian', 'Irish', 
  'Italian', 'Jamaican', 'Japanese', 'Kenyan', 'Malaysian', 'Mexican', 
  'Moroccan', 'Polish', 'Portuguese', 'Russian', 'Spanish', 'Thai', 
  'Tunisian', 'Turkish', 'Vietnamese'
]

// Map continent/region to broad cuisine category for fallback
const REGION_TO_CUISINE: Record<string, string> = {
  'Asia': 'Asian',
  'Europe': 'European',
  'Africa': 'African',
  'Americas': 'American',
  'Oceania': 'British',
  'Antarctic': 'British',
}

// Map region to a supported TheMealDB cuisine for API queries
const REGION_TO_MEALDB_CUISINE: Record<string, string> = {
  'Asia': 'Chinese',
  'Europe': 'Italian',
  'Africa': 'Moroccan',
  'Americas': 'American',
  'Oceania': 'British',
  'Antarctic': 'British',
}

interface MealAreaResult {
  area: string
  isDirectMatch: boolean
  regionFallback: string | null
  continentCuisine: string
}

// Map country regions/subregions to TheMealDB areas
function getMealDBArea(region: string, subregion?: string, countryName?: string): MealAreaResult {
  // Direct country mappings that TheMealDB supports
  const countryMappings: Record<string, string> = {
    'Japan': 'Japanese',
    'China': 'Chinese',
    'Thailand': 'Thai',
    'Vietnam': 'Vietnamese',
    'India': 'Indian',
    'Malaysia': 'Malaysian',
    'Philippines': 'Filipino',
    'Greece': 'Greek',
    'Italy': 'Italian',
    'France': 'French',
    'Spain': 'Spanish',
    'Portugal': 'Portuguese',
    'United Kingdom': 'British',
    'Ireland': 'Irish',
    'Netherlands': 'Dutch',
    'Poland': 'Polish',
    'Russia': 'Russian',
    'Turkey': 'Turkish',
    'Egypt': 'Egyptian',
    'Morocco': 'Moroccan',
    'Tunisia': 'Tunisian',
    'Kenya': 'Kenyan',
    'United States': 'American',
    'Canada': 'Canadian',
    'Mexico': 'Mexican',
    'Jamaica': 'Jamaican',
    'Croatia': 'Croatian',
  }

  const continentCuisine = REGION_TO_CUISINE[region] || 'International'
  const regionFallbackCuisine = REGION_TO_MEALDB_CUISINE[region] || 'Italian'

  if (countryName && countryMappings[countryName]) {
    return {
      area: countryMappings[countryName],
      isDirectMatch: true,
      regionFallback: regionFallbackCuisine,
      continentCuisine,
    }
  }

  // Regional fallbacks - these are NOT direct matches
  const regionMappings: Record<string, string> = {
    'Eastern Asia': 'Chinese',
    'South-Eastern Asia': 'Thai',
    'Southern Asia': 'Indian',
    'Western Asia': 'Turkish',
    'Northern Africa': 'Moroccan',
    'Eastern Africa': 'Kenyan',
    'Southern Europe': 'Italian',
    'Western Europe': 'French',
    'Northern Europe': 'British',
    'Eastern Europe': 'Polish',
    'Central America': 'Mexican',
    'Caribbean': 'Jamaican',
    'North America': 'American',
    'South America': 'Mexican',
  }

  // Return without direct match - will trigger fallback UI
  return {
    area: subregion && regionMappings[subregion] ? regionMappings[subregion] : regionFallbackCuisine,
    isDirectMatch: false,
    regionFallback: regionFallbackCuisine,
    continentCuisine,
  }
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
