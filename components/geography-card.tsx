import { Globe, Languages } from 'lucide-react'

interface GeographyCardProps {
  name: string
  officialName: string
  flag: string
  flagImage: string
  languages: string[]
}

export function GeographyCard({
  name,
  officialName,
  flag,
  flagImage,
  languages,
}: GeographyCardProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-primary/10 rounded-xl">
          <Globe className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Geography
        </h3>
      </div>

      <div className="space-y-5">
        {/* Flag and Country Name */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={flagImage}
              alt={`${name} flag`}
              className="w-16 h-12 object-cover rounded-lg shadow-md"
            />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{name}</p>
            {name !== officialName && (
              <p className="text-sm text-muted-foreground">{officialName}</p>
            )}
          </div>
        </div>

        {/* Languages */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <Languages className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Official Language{languages.length > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-foreground font-medium">
            {languages.length > 0 ? languages.slice(0, 3).join(', ') : 'N/A'}
            {languages.length > 3 && (
              <span className="text-muted-foreground"> +{languages.length - 3} more</span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
