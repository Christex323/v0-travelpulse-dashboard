'use client'

import { useState } from 'react'
import { UtensilsCrossed, ChefHat, Globe, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface LocalFlavorsCardProps {
  dish: {
    name: string | null
    image: string | null
    cuisine: string | null
    isDirectMatch?: boolean
    region?: string
    regionCuisine?: string
    fallbackArea?: string | null
  } | null
}

interface RegionalDish {
  name: string
  image: string
  cuisine: string
}

export function LocalFlavorsCard({ dish }: LocalFlavorsCardProps) {
  const [regionalDish, setRegionalDish] = useState<RegionalDish | null>(null)
  const [isLoadingRegional, setIsLoadingRegional] = useState(false)
  const [showRegional, setShowRegional] = useState(false)

  const hasValidDish = dish?.name && dish?.image && dish?.isDirectMatch

  const handleViewRegionalDishes = async () => {
    if (!dish?.fallbackArea) return

    setIsLoadingRegional(true)
    setShowRegional(true)

    try {
      const response = await fetch(
        `https://www.themealdb.com/api/json/v1/1/filter.php?a=${dish.fallbackArea}`
      )
      const data = await response.json()

      if (data.meals && data.meals.length > 0) {
        const randomIndex = Math.floor(Math.random() * Math.min(data.meals.length, 10))
        const meal = data.meals[randomIndex]
        setRegionalDish({
          name: meal.strMeal,
          image: meal.strMealThumb,
          cuisine: dish.fallbackArea,
        })
      }
    } catch (error) {
      console.error('Failed to fetch regional dishes:', error)
    } finally {
      setIsLoadingRegional(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-chart-5/20 rounded-xl">
          <UtensilsCrossed className="h-5 w-5 text-chart-5" />
        </div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Local Flavors
        </h3>
      </div>

      {hasValidDish && dish ? (
        <div className="space-y-4">
          {/* Dish Image */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-secondary">
            <Image
              src={dish.image!}
              alt={dish.name!}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>

          {/* Dish Info */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Popular Dish</p>
            <p className="text-xl font-semibold text-foreground">{dish.name}</p>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-1">Cuisine Style</p>
            <span className="inline-flex items-center px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-lg">
              {dish.cuisine} Cuisine
            </span>
          </div>
        </div>
      ) : showRegional && regionalDish ? (
        // Regional fallback dish display
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg">
            <Globe className="h-3.5 w-3.5" />
            <span>Showing {dish?.regionCuisine} regional cuisine</span>
          </div>

          {/* Regional Dish Image */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-secondary">
            <Image
              src={regionalDish.image}
              alt={regionalDish.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>

          {/* Regional Dish Info */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Regional Dish</p>
            <p className="text-xl font-semibold text-foreground">{regionalDish.name}</p>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-1">Cuisine Style</p>
            <span className="inline-flex items-center px-3 py-1.5 bg-chart-5/10 text-chart-5 text-sm font-medium rounded-lg">
              {regionalDish.cuisine} Cuisine
            </span>
          </div>
        </div>
      ) : showRegional && isLoadingRegional ? (
        // Loading state for regional dishes
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground text-sm">
            Finding regional dishes...
          </p>
        </div>
      ) : (
        // Unavailable state with regional fallback option
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="p-4 bg-secondary rounded-full mb-4">
            <ChefHat className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium mb-1">
            Local Culinary Data Unavailable
          </p>
          <p className="text-muted-foreground text-sm mb-6 max-w-[240px]">
            Specific cuisine data for this destination is currently unavailable.
          </p>

          {dish?.fallbackArea && (
            <button
              onClick={handleViewRegionalDishes}
              disabled={isLoadingRegional}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoadingRegional ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4" />
                  View {dish.regionCuisine} Dishes
                </>
              )}
            </button>
          )}

          {!dish?.fallbackArea && (
            <p className="text-muted-foreground/60 text-xs">
              Try another destination
            </p>
          )}
        </div>
      )}
    </div>
  )
}
