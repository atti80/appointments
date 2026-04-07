'use client'

import { ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimeSpinnerProps {
    hours: number
    minutes: number
    onHoursChange: (h: number) => void
    onMinutesChange: (m: number) => void
    label?: string
    className?: string
}

function SpinnerUnit({
    value,
    min,
    max,
    step = 1,
    pad = 2,
    onIncrement,
    onDecrement,
}: {
    value: number
    min: number
    max: number
    step?: number
    pad?: number
    onIncrement: () => void
    onDecrement: () => void
}) {
    return (
        <div className="flex flex-col items-center">
            <button
                type="button"
                onClick={onIncrement}
                className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
                <ChevronUp className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-sm font-mono font-medium tabular-nums">
                {String(value).padStart(pad, '0')}
            </span>
            <button
                type="button"
                onClick={onDecrement}
                className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
                <ChevronDown className="w-4 h-4" />
            </button>
        </div>
    )
}

export function TimeSpinner({
    hours,
    minutes,
    onHoursChange,
    onMinutesChange,
    label,
    className,
}: TimeSpinnerProps) {
    function incrementHours() { onHoursChange(hours === 23 ? 0 : hours + 1) }
    function decrementHours() { onHoursChange(hours === 0 ? 23 : hours - 1) }
    function incrementMinutes() { onMinutesChange(minutes >= 55 ? 0 : minutes + 5) }
    function decrementMinutes() { onMinutesChange(minutes <= 0 ? 55 : minutes - 5) }

    return (
        <div className={cn('flex flex-col gap-1', className)}>
            {label && (
                <span className="text-xs text-muted-foreground font-medium">{label}</span>
            )}
            <div className="flex items-center gap-1 border rounded-lg px-3 py-1 bg-background w-fit">
                <SpinnerUnit
                    value={hours}
                    min={0}
                    max={23}
                    onIncrement={incrementHours}
                    onDecrement={decrementHours}
                />
                <span className="text-sm font-mono font-medium text-muted-foreground mb-0.5">:</span>
                <SpinnerUnit
                    value={minutes}
                    min={0}
                    max={55}
                    step={5}
                    onIncrement={incrementMinutes}
                    onDecrement={decrementMinutes}
                />
            </div>
        </div>
    )
}