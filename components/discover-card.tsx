'use client'

import { useState, useEffect } from 'react'
import { MapPin, ExternalLink, Compass, Users } from 'lucide-react'

interface DiscoverCardProps {
  countryName: string
}

interface WikiData {
  summary: string
  pageUrl: string
}

export function DiscoverCard({ countryName }: DiscoverCardProps) {
  const [wikiData, setWikiData] = useState<WikiData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchWikiData = async () => {
      setIsLoading(true)
      setError(false)

      try {
        // Format country name for Wikipedia (replace spaces with underscores)
        const formattedName = countryName.replace(/\s+/g, '_')
        
        // Try Tourism_in_{Country} first
        const tourismTitle = `Tourism_in_${formattedName}`
        const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(tourismTitle)}&origin=*`

        const response = await fetch(apiUrl)
        
        if (!response.ok) {
          throw new Error('Failed to fetch')
        }

        const data = await response.json()
        const pages = data.query?.pages

        if (pages) {
          const pageId = Object.keys(pages)[0]
          const page = pages[pageId]

          // Check if page exists (pageId !== '-1' means it exists)
          if (pageId !== '-1' && page.extract) {
            setWikiData({
              summary: page.extract,
              pageUrl: `https://en.wikipedia.org/wiki/${tourismTitle}`,
            })
          } else {
            // Fallback: try just the country name
            const fallbackUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(formattedName)}&origin=*`
            const fallbackResponse = await fetch(fallbackUrl)
            const fallbackData = await fallbackResponse.json()
            const fallbackPages = fallbackData.query?.pages
            
            if (fallbackPages) {
              const fallbackPageId = Object.keys(fallbackPages)[0]
              const fallbackPage = fallbackPages[fallbackPageId]
              
              if (fallbackPageId !== '-1' && fallbackPage.extract) {
                setWikiData({
                  summary: fallbackPage.extract,
                  pageUrl: `https://en.wikipedia.org/wiki/${formattedName}`,
                })
              } else {
                setError(true)
              }
            } else {
              setError(true)
            }
          }
        } else {
          setError(true)
        }
      } catch {
        setError(true)
      } finally {
        setIsLoading(false)
      }
    }

    if (countryName) {
      fetchWikiData()
    }
  }, [countryName])

  // Truncate text to a reasonable length
  const truncateText = (text: string, maxLength: number = 400) => {
    if (text.length <= maxLength) return text
    const truncated = text.substring(0, maxLength)
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?')
    )
    if (lastSentenceEnd > maxLength * 0.6) {
      return truncated.substring(0, lastSentenceEnd + 1)
    }
    return truncated.substring(0, truncated.lastIndexOf(' ')) + '...'
  }

  const googleSearchUrl = `https://www.google.com/search?q=best+tour+guides+in+${encodeURIComponent(countryName)}`

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 bg-primary/10 rounded-xl">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Places to Visit</h3>
          <p className="text-xs text-muted-foreground">Tourism highlights</p>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-secondary rounded w-full" />
          <div className="h-4 bg-secondary rounded w-5/6" />
          <div className="h-4 bg-secondary rounded w-4/6" />
          <div className="h-4 bg-secondary rounded w-full" />
          <div className="h-4 bg-secondary rounded w-3/6" />
        </div>
      ) : error || !wikiData ? (
        <div className="bg-secondary/50 rounded-xl p-6 text-center">
          <Compass className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            Tourism information currently unavailable for this destination.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary Text */}
          <p className="text-muted-foreground text-sm leading-relaxed">
            {truncateText(wikiData.summary)}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {/* Read More Link */}
            <a
              href={wikiData.pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl text-sm font-medium transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Read More on Wikipedia
            </a>

            {/* Find a Guide Button */}
            <a
              href={googleSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-medium transition-colors"
            >
              <Users className="h-4 w-4" />
              Find a Guide
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
