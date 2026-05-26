import { Compass, AlertCircle } from 'lucide-react'

interface ErrorStateProps {
  message: string
}

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-destructive/20 rounded-full mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Destination not found
        </h3>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

export function EmptyState() {
  return (
    <div className="w-full max-w-3xl mx-auto text-center">
      <div className="bg-card border border-border rounded-2xl p-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
          <Compass className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-3">
          Discover Your Next Destination
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
          Enter a country name above to get an instant snapshot of its geography,
          current climate, and financial context.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {['Japan', 'France', 'Brazil', 'Australia', 'Kenya'].map((country) => (
            <span
              key={country}
              className="px-3 py-1.5 bg-secondary text-secondary-foreground text-sm rounded-lg"
            >
              Try &quot;{country}&quot;
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
