import { Banknote, ArrowRightLeft, AlertCircle } from 'lucide-react'

interface FinancialsCardProps {
  currencyCode: string
  currencyName: string
  currencySymbol: string
  exchangeRate: number | null
}

export function FinancialsCard({
  currencyCode,
  currencyName,
  currencySymbol,
  exchangeRate,
}: FinancialsCardProps) {
  // Check if we have valid exchange rate data
  const hasValidRate = exchangeRate !== null && typeof exchangeRate === 'number' && !isNaN(exchangeRate)
  
  return (
    <div className="bg-card border border-border rounded-2xl p-6 h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-chart-4/20 rounded-xl">
          <Banknote className="h-5 w-5 text-chart-4" />
        </div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Financials
        </h3>
      </div>

      <div className="space-y-5">
        {/* Currency Info */}
        <div>
          <p className="text-sm text-muted-foreground mb-1">Local Currency</p>
          <p className="text-xl font-semibold text-foreground">
            {currencyName}
            {currencySymbol && (
              <span className="text-muted-foreground ml-2">({currencySymbol})</span>
            )}
          </p>
          <p className="text-sm text-muted-foreground">{currencyCode}</p>
        </div>

        {/* Exchange Rate */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Exchange Rate</span>
          </div>
          
          {hasValidRate ? (
            <div className="bg-secondary rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <span className="text-primary font-bold">$</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">1 USD</p>
                    <p className="text-xs text-muted-foreground">US Dollar</p>
                  </div>
                </div>
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    {exchangeRate.toFixed(2)}{' '}
                    <span className="text-primary">{currencyCode}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{currencyName}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-secondary/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Exchange rate data temporarily unavailable
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    The {currencyCode} currency may not be supported or the service is unavailable
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
