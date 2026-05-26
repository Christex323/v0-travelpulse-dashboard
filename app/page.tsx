'use client'

import { useState } from 'react'
import { Compass } from 'lucide-react'
import { SearchBar } from '@/components/search-bar'
import { GeographyCard } from '@/components/geography-card'
import { ClimateCard } from '@/components/climate-card'
import { FinancialsCard } from '@/components/financials-card'
import { ErrorState, EmptyState } from '@/components/states'

interface DestinationData {
  geography: {
    name: string
    officialName: string
    flag: string
    flagImage: string
    languages: string[]
  }
  climate: {
    capital: string
    temperature: number | null
    weatherCode: number | null
  }
  financials: {
    currencyCode: string
    currencyName: string
    currencySymbol: string
    exchangeRate: number | null
  }
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DestinationData | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (country: string) => {
    setIsLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      const response = await fetch(
        `/api/destination?country=${encodeURIComponent(country)}`
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch destination data')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Please check the spelling and try again.'
      )
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Compass className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">TravelPulse</h1>
              <p className="text-sm text-muted-foreground">
                Destination Snapshot
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero / Search Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
              Instant Travel Intelligence
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              Get real-time geography, climate, and financial data for any
              destination worldwide.
            </p>
          </div>

          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        </div>
      </section>

      {/* Results Section */}
      <section className="pb-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-2xl p-6 animate-pulse"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-secondary rounded-xl" />
                    <div className="h-4 w-24 bg-secondary rounded" />
                  </div>
                  <div className="space-y-4">
                    <div className="h-6 w-3/4 bg-secondary rounded" />
                    <div className="h-4 w-1/2 bg-secondary rounded" />
                    <div className="h-20 bg-secondary rounded-xl mt-4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && <ErrorState message={error} />}

          {/* Empty State */}
          {!isLoading && !error && !data && !hasSearched && <EmptyState />}

          {/* Results Grid */}
          {!isLoading && !error && data && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GeographyCard
                name={data.geography.name}
                officialName={data.geography.officialName}
                flag={data.geography.flag}
                flagImage={data.geography.flagImage}
                languages={data.geography.languages}
              />
              <ClimateCard
                capital={data.climate.capital}
                temperature={data.climate.temperature}
                weatherCode={data.climate.weatherCode}
              />
              <FinancialsCard
                currencyCode={data.financials.currencyCode}
                currencyName={data.financials.currencyName}
                currencySymbol={data.financials.currencySymbol}
                exchangeRate={data.financials.exchangeRate}
              />
            </div>
          )}

          {/* No results after search */}
          {!isLoading && !error && !data && hasSearched && (
            <EmptyState />
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-center text-sm text-muted-foreground">
            Powered by REST Countries, Open-Meteo, and Frankfurter APIs
          </p>
        </div>
      </footer>
    </main>
  )
}
