'use client'

import { useState } from 'react'
import {
  Thermometer,
  MapPin,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudFog,
  CloudLightning,
  Wind,
  Cloudy,
} from 'lucide-react'

interface ClimateCardProps {
  capital: string
  temperature: number | null
  weatherCode: number | null
}

// WMO Weather interpretation codes
// https://open-meteo.com/en/docs
function getWeatherInfo(code: number | null): {
  icon: React.ReactNode
  description: string
} {
  if (code === null) {
    return { icon: <Cloud className="h-8 w-8" />, description: 'Unknown' }
  }

  // Clear
  if (code === 0) {
    return { icon: <Sun className="h-8 w-8 text-yellow-400" />, description: 'Clear sky' }
  }
  // Mainly clear, partly cloudy
  if (code >= 1 && code <= 2) {
    return { icon: <Sun className="h-8 w-8 text-yellow-400" />, description: 'Mostly clear' }
  }
  // Overcast
  if (code === 3) {
    return { icon: <Cloudy className="h-8 w-8 text-gray-400" />, description: 'Overcast' }
  }
  // Fog
  if (code >= 45 && code <= 48) {
    return { icon: <CloudFog className="h-8 w-8 text-gray-400" />, description: 'Foggy' }
  }
  // Drizzle
  if (code >= 51 && code <= 55) {
    return { icon: <CloudRain className="h-8 w-8 text-blue-400" />, description: 'Drizzle' }
  }
  // Freezing drizzle
  if (code >= 56 && code <= 57) {
    return { icon: <CloudSnow className="h-8 w-8 text-blue-300" />, description: 'Freezing drizzle' }
  }
  // Rain
  if (code >= 61 && code <= 65) {
    return { icon: <CloudRain className="h-8 w-8 text-blue-500" />, description: 'Rainy' }
  }
  // Freezing rain
  if (code >= 66 && code <= 67) {
    return { icon: <CloudSnow className="h-8 w-8 text-blue-300" />, description: 'Freezing rain' }
  }
  // Snow
  if (code >= 71 && code <= 77) {
    return { icon: <CloudSnow className="h-8 w-8 text-white" />, description: 'Snowy' }
  }
  // Rain showers
  if (code >= 80 && code <= 82) {
    return { icon: <CloudRain className="h-8 w-8 text-blue-500" />, description: 'Rain showers' }
  }
  // Snow showers
  if (code >= 85 && code <= 86) {
    return { icon: <CloudSnow className="h-8 w-8 text-white" />, description: 'Snow showers' }
  }
  // Thunderstorm
  if (code >= 95 && code <= 99) {
    return {
      icon: <CloudLightning className="h-8 w-8 text-yellow-500" />,
      description: 'Thunderstorm',
    }
  }
  // Wind (not a standard WMO code, but as fallback)
  return { icon: <Wind className="h-8 w-8 text-gray-400" />, description: 'Windy' }
}

function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32
}

export function ClimateCard({ capital, temperature, weatherCode }: ClimateCardProps) {
  const [unit, setUnit] = useState<'C' | 'F'>('C')
  const weather = getWeatherInfo(weatherCode)

  const displayTemp =
    temperature !== null
      ? unit === 'C'
        ? Math.round(temperature)
        : Math.round(celsiusToFahrenheit(temperature))
      : null

  return (
    <div className="bg-card border border-border rounded-2xl p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-chart-2/20 rounded-xl">
            <Thermometer className="h-5 w-5 text-chart-2" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Climate
          </h3>
        </div>
        
        {/* Metric/Imperial Toggle */}
        <div className="flex items-center bg-secondary rounded-lg p-0.5">
          <button
            onClick={() => setUnit('C')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              unit === 'C'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-label="Celsius"
          >
            °C
          </button>
          <button
            onClick={() => setUnit('F')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              unit === 'F'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-label="Fahrenheit"
          >
            °F
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {/* Capital City */}
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground text-sm">Capital</span>
        </div>
        <p className="text-xl font-semibold text-foreground -mt-2">{capital}</p>

        {/* Weather Display */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Weather</p>
              <p className="text-4xl font-bold text-foreground">
                {displayTemp !== null ? `${displayTemp}°${unit}` : 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{weather.description}</p>
            </div>
            <div className="p-4 bg-secondary rounded-xl">{weather.icon}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
