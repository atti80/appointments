'use client'

import { useTransition } from 'react'
import { deleteSlotAction } from '@/lib/actions/slots'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SlotCreatePopover } from './SlotCreatePopover'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Trash2, Plus, Clock } from 'lucide-react'
import type { Slot, SlotType } from '@/lib/types/database.types';

interface DayDetailSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    date: Date
    slots: (Slot & { slot_type: SlotType | null })[]
    practitionerId: string
    slotTypes: SlotType[]
    defaultSlotMins: number
    onTemplateClick: (date: Date) => void
    onRefresh: () => void
}

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'outline'> = {
    available: 'default',
    pending: 'secondary',
    booked: 'outline',
}

export function DayDetailSheet({
    open,
    onOpenChange,
    date,
    slots,
    practitionerId,
    slotTypes,
    defaultSlotMins,
    onTemplateClick,
    onRefresh,
}: DayDetailSheetProps) {
    const [pending, startTransition] = useTransition()

    function handleDelete(slotId: string) {
        startTransition(async () => {
            const result = await deleteSlotAction(slotId)
            if (result.success) {
                toast.success('Slot deleted')
                onRefresh()
            } else {
                toast.error(result.error)
            }
        })
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>{format(date, 'EEEE, MMMM d')}</SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-4 mt-6">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            {slots.length} slot{slots.length !== 1 ? 's' : ''}
                        </p>
                        <SlotCreatePopover
                            date={date}
                            practitionerId={practitionerId}
                            slotTypes={slotTypes}
                            defaultSlotMins={defaultSlotMins}
                            onTemplateClick={onTemplateClick}
                            onCreated={() => { onRefresh(); }}
                        >
                            <Button size="sm">
                                <Plus className="w-4 h-4" />
                                Add slot
                            </Button>
                        </SlotCreatePopover>
                    </div>

                    {slots.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No slots on this day.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {slots
                                .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
                                .map(slot => (
                                    <div
                                        key={slot.id}
                                        className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
                                    >
                                        <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">
                                                {format(new Date(slot.starts_at), 'HH:mm')}
                                                {' – '}
                                                {format(new Date(slot.ends_at), 'HH:mm')}
                                            </p>
                                            {slot.slot_type && (
                                                <p className="text-xs text-muted-foreground">{slot.slot_type.name}</p>
                                            )}
                                        </div>
                                        <Badge variant={STATUS_BADGE[slot.status] ?? 'outline'}>
                                            {slot.status}
                                        </Badge>
                                        {slot.status === 'available' && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDelete(slot.id)}
                                                disabled={pending}
                                            >
                                                <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}