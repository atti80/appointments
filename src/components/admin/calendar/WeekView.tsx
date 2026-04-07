'use client'

import { useMemo } from 'react'
import { SlotCreatePopover } from './SlotCreatePopover'
import { cn } from '@/lib/utils'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import { Trash2 } from 'lucide-react'
import type { Slot, SlotType } from '@/lib/types/database.types'

const HOUR_HEIGHT = 64 // px per hour
const START_HOUR = 7  // calendar starts at 7am
const END_HOUR = 21 // calendar ends at 9pm
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR)

interface WeekViewProps {
    weekStart: Date
    slots: (Slot & { slot_type: SlotType | null })[]
    practitionerId: string
    slotTypes: SlotType[]
    defaultSlotMins: number
    onTemplateClick: (date: Date) => void
    onDeleteSlot: (slotId: string) => void
    onCreated: () => void
}

function slotTop(startsAt: string) {
    const d = new Date(startsAt)
    const mins = (d.getHours() - START_HOUR) * 60 + d.getMinutes()
    return (mins / 60) * HOUR_HEIGHT
}

function slotHeight(startsAt: string, endsAt: string) {
    const diff = (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60000
    return (diff / 60) * HOUR_HEIGHT
}

const STATUS_COLORS: Record<string, string> = {
    available: 'bg-primary/10 border-primary/30 text-primary',
    pending: 'bg-amber-50 border-amber-200 text-amber-700',
    booked: 'bg-emerald-50 border-emerald-200 text-emerald-700',
}

export function WeekView({
    weekStart,
    slots,
    practitionerId,
    slotTypes,
    defaultSlotMins,
    onTemplateClick,
    onDeleteSlot,
    onCreated,
}: WeekViewProps) {
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    const slotsByDay = useMemo(() => {
        const map = new Map<string, (Slot & { slot_type: SlotType | null })[]>()
        for (const slot of slots) {
            const key = format(new Date(slot.starts_at), 'yyyy-MM-dd')
            if (!map.has(key)) map.set(key, [])
            map.get(key)!.push(slot)
        }
        return map
    }, [slots])

    return (
        <div className="flex overflow-auto border rounded-xl bg-background">

            {/* Time gutter */}
            <div className="w-14 shrink-0 border-r">
                <div className="h-10 border-b" /> {/* header spacer */}
                {HOURS.map(h => (
                    <div
                        key={h}
                        className="border-b text-right pr-2 text-xs text-muted-foreground"
                        style={{ height: HOUR_HEIGHT }}
                    >
                        <span className="-translate-y-2 block">
                            {String(h).padStart(2, '0')}:00
                        </span>
                    </div>
                ))}
            </div>

            {/* Day columns */}
            <div className="flex flex-1 min-w-0">
                {days.map(day => {
                    const key = format(day, 'yyyy-MM-dd')
                    const daySlots = slotsByDay.get(key) ?? []
                    const isToday = isSameDay(day, new Date())

                    return (
                        <div key={key} className="flex-1 min-w-0 border-r last:border-r-0">
                            {/* Day header */}
                            <div className={cn(
                                'h-10 border-b flex flex-col items-center justify-center',
                                isToday && 'bg-primary/5'
                            )}>
                                <span className="text-xs text-muted-foreground">
                                    {format(day, 'EEE')}
                                </span>
                                <span className={cn(
                                    'text-sm font-medium',
                                    isToday && 'text-primary'
                                )}>
                                    {format(day, 'd')}
                                </span>
                            </div>

                            {/* Time grid */}
                            <div
                                className="relative"
                                style={{ height: HOUR_HEIGHT * HOURS.length }}
                            >
                                {/* Hour lines */}
                                {HOURS.map(h => (
                                    <div
                                        key={h}
                                        className="absolute w-full border-b border-dashed border-border/40"
                                        style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
                                    />
                                ))}

                                {/* Clickable cells — one per hour */}
                                {HOURS.map(h => (
                                    <SlotCreatePopover
                                        key={h}
                                        date={day}
                                        practitionerId={practitionerId}
                                        slotTypes={slotTypes}
                                        defaultSlotMins={defaultSlotMins}
                                        onTemplateClick={onTemplateClick}
                                        onCreated={onCreated}
                                    >
                                        <div
                                            className="absolute w-full hover:bg-primary/5 cursor-pointer transition-colors"
                                            style={{ top: (h - START_HOUR) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                                        />
                                    </SlotCreatePopover>
                                ))}

                                {/* Slot blocks */}
                                {daySlots.map(slot => (
                                    <div
                                        key={slot.id}
                                        className={cn(
                                            'absolute left-0.5 right-0.5 rounded border text-xs px-1 py-0.5 overflow-hidden group',
                                            STATUS_COLORS[slot.status] ?? STATUS_COLORS.available
                                        )}
                                        style={{
                                            top: slotTop(slot.starts_at),
                                            height: Math.max(slotHeight(slot.starts_at, slot.ends_at), 20),
                                        }}
                                    >
                                        <span className="font-medium">
                                            {format(new Date(slot.starts_at), 'HH:mm')}
                                        </span>
                                        {slot.slot_type && (
                                            <span className="ml-1 opacity-70">{slot.slot_type.name}</span>
                                        )}
                                        {slot.status === 'available' && (
                                            <button
                                                onClick={e => { e.stopPropagation(); onDeleteSlot(slot.id) }}
                                                className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>

        </div>
    )
}