'use client'

import { useState } from 'react'
import { MapPin, Utensils, ExternalLink, Navigation } from 'lucide-react'

interface DiningMapCardProps {
  lat: number
  lng: number
  capital: string
  countryName: string
}

export function DiningMapCard({ lat, lng, capital, countryName }: DiningMapCardProps) {
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  // Calculate bounding box (0.05 degrees offset for a nice zoom level)
  const offset = 0.05
  const bbox = `${lng - offset},${lat - offset},${lng + offset},${lat + offset}`
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`

  // Google search URL for restaurants
  const searchQuery = encodeURIComponent(`best restaurants in ${capital}, ${countryName}`)
  const googleSearchUrl = `https://www.google.com/search?q=${searchQuery}`

  // TripAdvisor search
  const tripAdvisorQuery = encodeURIComponent(`${capital} ${countryName} restaurants`)
  const tripAdvisorUrl = `https://www.tripadvisor.com/Search?q=${tripAdvisorQuery}`

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/10 rounded-xl">
              <Utensils className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Dining Near You</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {capital}, {countryName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-48 sm:h-56 bg-secondary/50">
        {!isMapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Loading map...</span>
            </div>
          </div>
        )}
        <iframe
          src={mapUrl}
          className={`w-full h-full border-0 transition-opacity duration-300 ${
            isMapLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ filter: 'invert(0.9) hue-rotate(180deg) brightness(0.95) contrast(0.9)' }}
          onLoad={() => setIsMapLoaded(true)}
          title={`Map of ${capital}, ${countryName}`}
          loading="lazy"
        />
        
        {/* Map Overlay Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent pointer-events-none" />
      </div>

      {/* Action Buttons */}
      <div className="p-4 pt-2 space-y-3">
        {/* Quick Search Button - Primary CTA */}
        <a
          href={googleSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
        >
          <Navigation className="h-4 w-4" />
          Quick Search Restaurants
        </a>

        {/* Secondary Actions */}
        <div className="flex gap-2">
          <a
            href={tripAdvisorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 flex-1 py-2.5 px-3 bg-secondary text-secondary-foreground rounded-xl text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            TripAdvisor
          </a>
          <a
            href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=14/${lat}/${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 flex-1 py-2.5 px-3 bg-secondary text-secondary-foreground rounded-xl text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            <MapPin className="h-3.5 w-3.5" />
            Full Map
          </a>
        </div>
      </div>
    </div>
  )
}
