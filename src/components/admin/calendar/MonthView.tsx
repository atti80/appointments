'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    isSameMonth,
    isSameDay,
} from 'date-fns'
import type { Slot } from '@/lib/types/database.types'

interface MonthViewProps {
    month: Date
    slots: Slot[]
    onDayClick: (date: Date) => void
}

export function MonthView({ month, slots, onDayClick }: MonthViewProps) {
    const weeks = useMemo(() => {
        const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
        const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
        const days: Date[] = []
        let current = start
        while (current <= end) {
            days.push(current)
            current = addDays(current, 1)
        }
        // chunk into weeks
        const result: Date[][] = []
        for (let i = 0; i < days.length; i += 7) {
            result.push(days.slice(i, i + 7))
        }
        return result
    }, [month])

    const slotCountByDay = useMemo(() => {
        const map = new Map<string, number>()
        for (const slot of slots) {
            const key = format(new Date(slot.starts_at), 'yyyy-MM-dd')
            map.set(key, (map.get(key) ?? 0) + 1)
        }
        return map
    }, [slots])

    const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    return (
        <div className="border rounded-xl overflow-hidden bg-background">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b">
                {DAY_HEADERS.map(d => (
                    <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
                        {d}
                    </div>
                ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7">
                    {week.map((day, di) => {
                        const key = format(day, 'yyyy-MM-dd')
                        const count = slotCountByDay.get(key) ?? 0
                        const inMonth = isSameMonth(day, month)
                        const isToday = isSameDay(day, new Date())

                        return (
                            <button
                                key={key}
                                onClick={() => onDayClick(day)}
                                className={cn(
                                    'min-h-20 p-2 text-left border-b border-r last:border-r-0 flex flex-col gap-1',
                                    'hover:bg-muted/50 transition-colors',
                                    !inMonth && 'opacity-40',
                                    isToday && 'bg-primary/5',
                                    wi === weeks.length - 1 && 'border-b-0'
                                )}
                            >
                                <span className={cn(
                                    'text-sm w-7 h-7 flex items-center justify-center rounded-full',
                                    isToday && 'bg-primary text-primary-foreground font-medium'
                                )}>
                                    {format(day, 'd')}
                                </span>
                                {count > 0 && (
                                    <span className="text-xs text-primary font-medium">
                                        {count} slot{count !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
            ))}
        </div>
    )
}