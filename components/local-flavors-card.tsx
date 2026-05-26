import { UtensilsCrossed } from 'lucide-react'
import Image from 'next/image'

interface LocalFlavorsCardProps {
  dish: {
    name: string
    image: string
    cuisine: string
  } | null
}

export function LocalFlavorsCard({ dish }: LocalFlavorsCardProps) {
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

      {dish ? (
        <div className="space-y-4">
          {/* Dish Image */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-secondary">
            <Image
              src={dish.image}
              alt={dish.name}
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
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="p-4 bg-secondary rounded-full mb-4">
            <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">
            Recipe data currently unavailable
          </p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            Try another destination
          </p>
        </div>
      )}
    </div>
  )
}
