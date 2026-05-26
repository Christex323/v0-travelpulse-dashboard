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

// Map country regions/subregions to TheMealDB areas
function getMealDBArea(region: string, subregion?: string, countryName?: string): string {
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

  if (countryName && countryMappings[countryName]) {
    return countryMappings[countryName]
  }

  // Regional fallbacks
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

  if (subregion && regionMappings[subregion]) {
    return regionMappings[subregion]
  }

  // Broader region fallbacks
  const broadRegionMappings: Record<string, string> = {
    'Asia': 'Chinese',
    'Europe': 'Italian',
    'Africa': 'Moroccan',
    'Americas': 'American',
    'Oceania': 'British',
  }

  return broadRegionMappings[region] || 'Italian'
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

      // Exchange rate API call (Frankfurter)
      currencyCode && currencyCode !== 'USD'
        ? fetch(`https://api.frankfurter.app/latest?from=USD&to=${currencyCode}`)
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null) as Promise<ExchangeRateData | null>
        : Promise.resolve(currencyCode === 'USD' ? { rates: { USD: 1 } } : null),

      // TheMealDB API call for regional dishes
      fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${mealArea}`)
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null) as Promise<MealData | null>,
    ])

    // Pick a random meal from the results (if available)
    let localDish = null
    if (mealResult?.meals && mealResult.meals.length > 0) {
      const randomIndex = Math.floor(Math.random() * Math.min(mealResult.meals.length, 10))
      const meal = mealResult.meals[randomIndex]
      localDish = {
        name: meal.strMeal,
        image: meal.strMealThumb,
        cuisine: mealArea,
      }
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
      localFlavors: localDish,
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
