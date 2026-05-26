'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

interface LocalTimeCardProps {
  timezone: string | null
  capital: string
}

export function LocalTimeCard({ timezone, capital }: LocalTimeCardProps) {
  const [currentTime, setCurrentTime] = useState<string>('')
  const [currentDate, setCurrentDate] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      if (!timezone) {
        setCurrentTime('N/A')
        setCurrentDate('')
        return
      }

      try {
        const now = new Date()
        
        const timeFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
        
        const dateFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })

        setCurrentTime(timeFormatter.format(now))
        setCurrentDate(dateFormatter.format(now))
      } catch {
        setCurrentTime('N/A')
        setCurrentDate('')
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [timezone])

  return (
    <div className="bg-card border border-border rounded-2xl p-6 h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-chart-4/20 rounded-xl">
          <Clock className="h-5 w-5 text-chart-4" />
        </div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Local Time
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Time in {capital}</p>
          <p className="text-4xl font-bold text-foreground tracking-tight font-mono">
            {currentTime || 'Loading...'}
          </p>
        </div>

        {currentDate && (
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-1">Date</p>
            <p className="text-lg font-medium text-foreground">{currentDate}</p>
          </div>
        )}

        {timezone && (
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-1">Timezone</p>
            <p className="text-sm font-medium text-foreground">{timezone.replace(/_/g, ' ')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
