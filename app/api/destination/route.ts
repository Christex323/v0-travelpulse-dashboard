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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const country = searchParams.get('country')

  if (!country) {
    return NextResponse.json({ error: 'Country parameter is required' }, { status: 400 })
  }

  try {
    // First, fetch country data to get coordinates and currency
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

    // Fetch weather and exchange rate concurrently using Promise.all
    const [weatherResult, exchangeResult] = await Promise.all([
      // Weather API call
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code`
      )
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null) as Promise<WeatherData | null>,

      // Exchange rate API call (Frankfurter)
      currencyCode && currencyCode !== 'USD'
        ? fetch(`https://api.frankfurter.app/latest?from=USD&to=${currencyCode}`)
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null) as Promise<ExchangeRateData | null>
        : Promise.resolve(currencyCode === 'USD' ? { rates: { USD: 1 } } : null),
    ])

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
