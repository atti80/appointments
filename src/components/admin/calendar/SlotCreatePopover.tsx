'use client'

import { useState, useTransition, useEffect } from 'react'
import { createSlotAction } from '@/lib/actions/slots'
import { TimeSpinner } from './TimeSpinner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { LayoutTemplate } from 'lucide-react'
import type { SlotType } from '@/lib/types/database.types';

interface SlotCreatePopoverProps {
    children: React.ReactNode
    date: Date
    practitionerId: string
    slotTypes: SlotType[]
    defaultSlotMins: number
    onTemplateClick: (date: Date) => void
    onCreated: () => void
}

function totalMinutes(h: number, m: number) { return h * 60 + m }
function fromMinutes(total: number) { return { h: Math.floor(total / 60) % 24, m: total % 60 } }

export function SlotCreatePopover({
    children,
    date,
    practitionerId,
    slotTypes,
    defaultSlotMins,
    onTemplateClick,
    onCreated,
}: SlotCreatePopoverProps) {
    const [open, setOpen] = useState(false)
    const [pending, startTransition] = useTransition()

    const [startH, setStartH] = useState(9)
    const [startM, setStartM] = useState(0)
    const [lenH, setLenH] = useState(Math.floor(defaultSlotMins / 60))
    const [lenM, setLenM] = useState(defaultSlotMins % 60)
    const [endH, setEndH] = useState(9)
    const [endM, setEndM] = useState(defaultSlotMins)
    const [slotTypeId, setSlotTypeId] = useState<string>('')
    const [error, setError] = useState<string | null>(null)

    // When start or length changes → recalculate end
    useEffect(() => {
        const endTotal = totalMinutes(startH, startM) + totalMinutes(lenH, lenM)
        const { h, m } = fromMinutes(endTotal)
        setEndH(h)
        setEndM(m)
    }, [startH, startM, lenH, lenM])

    // When end changes → recalculate length
    function handleEndChange(h: number, m: number, field: 'h' | 'm') {
        const newEndH = field === 'h' ? h : endH
        const newEndM = field === 'm' ? m : endM
        if (field === 'h') setEndH(h)
        if (field === 'm') setEndM(m)

        const lenTotal = totalMinutes(newEndH, newEndM) - totalMinutes(startH, startM)
        if (lenTotal > 0) {
            const { h: lh, m: lm } = fromMinutes(lenTotal)
            setLenH(lh)
            setLenM(lm)
        }
    }

    // When a slot type is selected, update length to match
    function handleSlotTypeChange(id: string) {
        setSlotTypeId(id)
        if (id) {
            const st = slotTypes.find(s => s.id === id)
            if (st) {
                setLenH(Math.floor(st.duration_minutes / 60))
                setLenM(st.duration_minutes % 60)
            }
        }
    }

    function handleSubmit() {
        setError(null)
        const endTotal = totalMinutes(endH, endM)
        const startTotal = totalMinutes(startH, startM)

        if (endTotal <= startTotal) {
            setError('End time must be after start time')
            return
        }

        const starts_at = new Date(date)
        starts_at.setHours(startH, startM, 0, 0)

        const ends_at = new Date(date)
        ends_at.setHours(endH, endM, 0, 0)

        const formData = new FormData()
        formData.set('practitioner_id', practitionerId)
        formData.set('starts_at', starts_at.toISOString())
        formData.set('ends_at', ends_at.toISOString())
        if (slotTypeId) formData.set('slot_type_id', slotTypeId)

        startTransition(async () => {
            const result = await createSlotAction(formData)
            if (result.success) {
                toast.success('Slot created')
                setOpen(false)
                onCreated()
            } else {
                setError(result.error)
            }
        })
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent className="w-72" align="start">
                <div className="flex flex-col gap-4">

                    <div>
                        <p className="text-sm font-medium">New slot</p>
                        <p className="text-xs text-muted-foreground">{format(date, 'EEEE, MMMM d')}</p>
                    </div>

                    <div className="flex items-end gap-3">
                        <TimeSpinner
                            label="Start"
                            hours={startH}
                            minutes={startM}
                            onHoursChange={setStartH}
                            onMinutesChange={setStartM}
                        />
                        <TimeSpinner
                            label="Length"
                            hours={lenH}
                            minutes={lenM}
                            onHoursChange={setLenH}
                            onMinutesChange={setLenM}
                        />
                        <TimeSpinner
                            label="End"
                            hours={endH}
                            minutes={endM}
                            onHoursChange={h => handleEndChange(h, endM, 'h')}
                            onMinutesChange={m => handleEndChange(endH, m, 'm')}
                        />
                    </div>

                    {slotTypes.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                            <Label>Slot type</Label>
                            <Select value={slotTypeId} onValueChange={handleSlotTypeChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="None (default length)" />
                                </SelectTrigger>
                                <SelectContent>
                                    {slotTypes.map(st => (
                                        <SelectItem key={st.id} value={st.id}>
                                            {st.name} ({st.duration_minutes} min)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {error && (
                        <p className="text-xs text-destructive">{error}</p>
                    )}

                    <div className="flex flex-col gap-2">
                        <Button onClick={handleSubmit} disabled={pending} size="sm">
                            {pending ? 'Creating…' : 'Create slot'}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setOpen(false); onTemplateClick(date) }}
                        >
                            <LayoutTemplate className="w-4 h-4" />
                            Use template
                        </Button>
                    </div>

                </div>
            </PopoverContent>
        </Popover>
    )
}