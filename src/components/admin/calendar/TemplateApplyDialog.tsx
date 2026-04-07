'use client'

import { useState, useTransition } from 'react'
import { applyTemplateAction, applyTemplateSkipConflictsAction } from '@/lib/actions/slots'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { AlertTriangle } from 'lucide-react'
import type { Template } from '@/lib/types/database.types';

interface ConflictData {
    conflicts: { conflict_starts_at: string; conflict_ends_at: string }[]
    proposed: { starts_at: string; ends_at: string; slot_type_id: string | null }[]
}

interface TemplateApplyDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    date: Date
    practitionerId: string
    templates: Template[]
    onApplied: () => void
}

export function TemplateApplyDialog({
    open,
    onOpenChange,
    date,
    practitionerId,
    templates,
    onApplied,
}: TemplateApplyDialogProps) {
    const [selectedId, setSelectedId] = useState('')
    const [conflicts, setConflicts] = useState<ConflictData | null>(null)
    const [pending, startTransition] = useTransition()

    const dailyTemplates = templates.filter(t => t.type === 'daily')
    const weeklyTemplates = templates.filter(t => t.type === 'weekly')

    const selected = templates.find(t => t.id === selectedId)

    const weekStart = startOfWeek(date, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 })

    function handleApply() {
        if (!selectedId) return
        startTransition(async () => {
            const result = await applyTemplateAction(selectedId, practitionerId, format(date, 'yyyy-MM-dd'))

            if (result.success) {
                toast.success(`Template applied — ${result.data?.created} slot${result.data?.created !== 1 ? 's' : ''} created`)
                onOpenChange(false)
                setSelectedId('')
                setConflicts(null)
                onApplied()
                return
            }

            // Check if it's a conflict error
            try {
                const parsed = JSON.parse(result.error)
                if (parsed.type === 'conflicts') {
                    setConflicts({ conflicts: parsed.conflicts, proposed: parsed.proposed })
                    return
                }
            } catch { }

            toast.error(result.error)
        })
    }

    function handleSkipConflicts() {
        if (!conflicts || !selectedId) return
        const conflictingStartTimes = conflicts.conflicts.map(c => c.conflict_starts_at)
        startTransition(async () => {
            const result = await applyTemplateSkipConflictsAction(
                selectedId,
                practitionerId,
                conflicts.proposed,
                conflictingStartTimes
            )
            if (result.success) {
                toast.success(`Done — ${result.data?.created} created, ${result.data?.skipped} skipped`)
                onOpenChange(false)
                setSelectedId('')
                setConflicts(null)
                onApplied()
            } else {
                toast.error(result.error)
            }
        })
    }

    function handleClose() {
        onOpenChange(false)
        setSelectedId('')
        setConflicts(null)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Apply template</DialogTitle>
                </DialogHeader>

                {conflicts ? (
                    // Conflict warning screen
                    <div className="flex flex-col gap-4 mt-2">
                        <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-amber-800">
                                    {conflicts.conflicts.length} conflict{conflicts.conflicts.length !== 1 ? 's' : ''} found
                                </p>
                                <p className="text-xs text-amber-700 mt-0.5">
                                    The following slots already exist and will be skipped:
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                            {conflicts.conflicts.map((c, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                                    <span>{format(new Date(c.conflict_starts_at), 'EEE d MMM, HH:mm')}</span>
                                    <span>→</span>
                                    <span>{format(new Date(c.conflict_ends_at), 'HH:mm')}</span>
                                </div>
                            ))}
                        </div>

                        <p className="text-sm text-muted-foreground">
                            {conflicts.proposed.length - conflicts.conflicts.length} slot{conflicts.proposed.length - conflicts.conflicts.length !== 1 ? 's' : ''} will be created. Do you want to continue?
                        </p>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={handleClose}>Cancel</Button>
                            <Button onClick={handleSkipConflicts} disabled={pending}>
                                {pending ? 'Applying…' : 'Skip conflicts & apply'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    // Template selection screen
                    <div className="flex flex-col gap-4 mt-2">
                        <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
                            {selected?.type === 'weekly' ? (
                                <span>Applying to week of <strong>{format(weekStart, 'MMM d')}</strong> – <strong>{format(weekEnd, 'MMM d')}</strong></span>
                            ) : (
                                <span>Applying to <strong>{format(date, 'EEEE, MMMM d')}</strong></span>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Select value={selectedId} onValueChange={setSelectedId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a template…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {dailyTemplates.length > 0 && (
                                        <>
                                            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Daily</div>
                                            {dailyTemplates.map(t => (
                                                <SelectItem key={t.id} value={t.id}>
                                                    {t.name}
                                                </SelectItem>
                                            ))}
                                        </>
                                    )}
                                    {weeklyTemplates.length > 0 && (
                                        <>
                                            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Weekly</div>
                                            {weeklyTemplates.map(t => (
                                                <SelectItem key={t.id} value={t.id}>
                                                    {t.name}
                                                </SelectItem>
                                            ))}
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {selected?.type === 'weekly' && (
                            <p className="text-xs text-muted-foreground">
                                This weekly template will generate slots for the entire week.
                            </p>
                        )}

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={handleClose}>Cancel</Button>
                            <Button onClick={handleApply} disabled={!selectedId || pending}>
                                {pending ? 'Applying…' : 'Apply template'}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}