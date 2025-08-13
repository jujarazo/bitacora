import { useMemo, useRef, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface ContributionDay {
  date: string // ISO date string (YYYY-MM-DD)
  count: number
  weekday: number // 0-6 (Sun-Sat), computed in local time to avoid TZ drift
  month: number // 0-11
  dayOfMonth: number // 1-31
}

interface ContributionsCalendarProps {
  className?: string
}

const ContributionsCalendar = ({ className }: ContributionsCalendarProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [maxWeeks, setMaxWeeks] = useState(32)

  useEffect(() => {
    const updateMaxWeeks = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        // Account for day labels (width + margin), gaps, and some padding
        const dayLabelsWidth = 60 // Approximate width of day labels + margin
        const availableWidth = containerWidth - dayLabelsWidth
        // Each week column is 16px (w-4) + 6px gap (gap-1.5) = 22px total
        const weekWidth = 22
        const calculatedMaxWeeks = Math.floor(availableWidth / weekWidth)
        // Ensure we have at least 4 weeks and at most 52 weeks
        setMaxWeeks(Math.max(4, Math.min(52, calculatedMaxWeeks)))
      }
    }

    updateMaxWeeks()
    window.addEventListener('resize', updateMaxWeeks)
    return () => window.removeEventListener('resize', updateMaxWeeks)
  }, [])

  const contributionData = useMemo(() => {
    const data: ContributionDay[] = []
    const today = new Date()
    const totalDays = maxWeeks * 7
    
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - totalDays + 1)

    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)

      const weekday = date.getDay()
      const month = date.getMonth()
      const dayOfMonth = date.getDate()

      // Generate random contribution count (0-4)
      const count = Math.floor(Math.random() * 5)

      data.push({
        date: date.toISOString().split('T')[0],
        count,
        weekday,
        month,
        dayOfMonth,
      })
    }

    return data
  }, [maxWeeks])

  const weeks = useMemo(() => {
    const weeksArray: ContributionDay[][] = []
    const tempWeek: ContributionDay[] = []

    // Group days into weeks (weeks start on Sunday)
    contributionData.forEach((day, index) => {
      if (day.weekday === 0 && tempWeek.length > 0) {
        weeksArray.push([...tempWeek])
        tempWeek.length = 0
      }

      tempWeek.push(day)

      if (index === contributionData.length - 1) {
        weeksArray.push([...tempWeek])
      }
    })

    return weeksArray
  }, [contributionData])

  const months = useMemo(() => {
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]
    const monthsArray: { name: string; weekIndex: number }[] = []

    weeks.forEach((week, weekIndex) => {
      const firstDay = week[0]
      if (firstDay) {
        if (firstDay.dayOfMonth <= 7) {
          monthsArray.push({
            name: monthNames[firstDay.month],
            weekIndex,
          })
        }
      }
    })

    return monthsArray
  }, [weeks])

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-gray-800'
    if (count === 1) return 'bg-emerald-900'
    if (count === 2) return 'bg-emerald-700'
    if (count === 3) return 'bg-emerald-600'
    return 'bg-emerald-500'
  }

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div ref={containerRef} className={cn('space-y-3', className)}>
      <div className="flex">
        {/* Day labels */}
        <div className="flex flex-col gap-1.5 mr-3 text-xs text-gray-400">
          <div className="h-4 mb-1" />
          {dayLabels.map((day, index) => (
            <div key={day} className="h-4 flex items-center">
              {index % 2 === 1 && day}
            </div>
          ))}
        </div>

        <div className="flex-1">
          {/* Month labels aligned by week using the same gap/width as the grid */}
          <div className="flex mb-1 text-xs text-gray-400 gap-1.5 select-none">
            {weeks.map((_, weekIndex) => {
              const monthLabel = months.find((m) => m.weekIndex === weekIndex)?.name
              return (
                <div key={`month-${weekIndex}`} className="w-4 text-left">
                  {monthLabel || ''}
                </div>
              )
            })}
          </div>

          {/* Calendar grid */}
          <div className="flex gap-1.5">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1.5">
                {Array.from({ length: 7 }, (_, dayIndex) => {
                  const day = week.find((d) => d.weekday === dayIndex)
                  return (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={cn(
                        'w-4 h-4 rounded-sm',
                        day ? getIntensityClass(day.count) : 'bg-transparent',
                      )}
                      title={day ? `${day.count} contributions on ${day.date}` : ''}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContributionsCalendar