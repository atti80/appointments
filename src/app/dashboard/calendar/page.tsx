'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { WeekView } from '@/components/admin/calendar/WeekView'
import { MonthView } from '@/components/admin/calendar/MonthView'
import { DayDetailSheet } from '@/components/admin/calendar/DayDetailSheet'
import { TemplateApplyDialog } from '@/components/admin/calendar/TemplateApplyDialog'
import { deleteSlotAction } from '@/lib/actions/slots'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Practitioner, Slot, SlotType, Template } from '@/lib/types/database.types'

type SlotWithType = Slot & { slot_type: SlotType | null }

export default function CalendarPage() {
  const supabase = createClient()

  const [view, setView] = useState<'week' | 'month'>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [practitioners, setPractitioners] = useState<Practitioner[]>([])
  const [practitionerId, setPractitionerId] = useState<string>('')
  const [slots, setSlots] = useState<SlotWithType[]>([])
  const [slotTypes, setSlotTypes] = useState<SlotType[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [defaultSlotMins, setDefaultSlotMins] = useState(30)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [daySheetOpen, setDaySheetOpen] = useState(false)
  const [templateDate, setTemplateDate] = useState<Date | null>(null)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pending, startTransition] = useTransition()

  // Date range for current view
  const rangeStart = view === 'week'
    ? startOfWeek(currentDate, { weekStartsOn: 1 })
    : startOfMonth(currentDate)

  const rangeEnd = view === 'week'
    ? endOfWeek(currentDate, { weekStartsOn: 1 })
    : endOfMonth(currentDate)

  // Load static data once
  useEffect(() => {
    async function loadStatic() {
      const { data: adminData } = await supabase
        .from('admins')
        .select('office_id, office:offices(default_slot_minutes)')
        .single()

      if (!adminData) return

      const office = Array.isArray(adminData.office) ? adminData.office[0] : adminData.office
      setDefaultSlotMins(office?.default_slot_minutes ?? 30)

      const [{ data: ps }, { data: sts }, { data: ts }] = await Promise.all([
        supabase.from('practitioners').select('*').eq('office_id', adminData.office_id).eq('is_active', true),
        supabase.from('slot_types').select('*').eq('office_id', adminData.office_id).eq('is_active', true),
        supabase.from('templates').select('*').eq('office_id', adminData.office_id),
      ])

      setPractitioners(ps ?? [])
      setSlotTypes(sts ?? [])
      setTemplates(ts ?? [])
      if (ps && ps.length > 0) setPractitionerId(ps[0].id)
      setLoading(false)
    }
    loadStatic()
  }, [])

  // Load slots when practitioner or date range changes
  const loadSlots = useCallback(async () => {
    if (!practitionerId) return
    const { data } = await supabase
      .from('slots')
      .select('*, slot_type:slot_types(*)')
      .eq('practitioner_id', practitionerId)
      .gte('starts_at', rangeStart.toISOString())
      .lte('starts_at', rangeEnd.toISOString())
      .order('starts_at')

    setSlots((data as SlotWithType[]) ?? [])
  }, [practitionerId, rangeStart.toISOString(), rangeEnd.toISOString()])

  useEffect(() => { loadSlots() }, [loadSlots])

  function navigate(dir: 1 | -1) {
    if (view === 'week') {
      setCurrentDate(d => dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1))
    } else {
      setCurrentDate(d => dir === 1 ? addMonths(d, 1) : subMonths(d, 1))
    }
  }

  function handleDayClick(date: Date) {
    setSelectedDay(date)
    setDaySheetOpen(true)
  }

  function handleTemplateClick(date: Date) {
    setTemplateDate(date)
    setTemplateDialogOpen(true)
  }

  function handleDeleteSlot(slotId: string) {
    startTransition(async () => {
      const result = await deleteSlotAction(slotId)
      if (result.success) {
        toast.success('Slot deleted')
        loadSlots()
      } else {
        toast.error(result.error)
      }
    })
  }

  const selectedDaySlots = selectedDay
    ? slots.filter(s => format(new Date(s.starts_at), 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd'))
    : []

  const title = view === 'week'
    ? `${format(rangeStart, 'MMM d')} – ${format(rangeEnd, 'MMM d, yyyy')}`
    : format(currentDate, 'MMMM yyyy')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Loading calendar…
      </div>
    )
  }

  if (practitioners.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2 text-muted-foreground">
        <p className="text-sm">No active practitioners found.</p>
        <p className="text-xs">Add a practitioner in Settings first.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold mr-auto">Calendar</h1>

        {/* Practitioner selector */}
        <Select value={practitionerId} onValueChange={setPractitionerId}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {practitioners.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* View toggle */}
        <Tabs value={view} onValueChange={v => setView(v as 'week' | 'month')}>
          <TabsList>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium min-w-48 text-center">{title}</span>
        <Button variant="outline" size="sm" onClick={() => navigate(1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
          Today
        </Button>
      </div>

      {/* Calendar view */}
      {view === 'week' ? (
        <WeekView
          weekStart={rangeStart}
          slots={slots}
          practitionerId={practitionerId}
          slotTypes={slotTypes}
          defaultSlotMins={defaultSlotMins}
          onTemplateClick={handleTemplateClick}
          onDeleteSlot={handleDeleteSlot}
          onCreated={loadSlots}
        />
      ) : (
        <MonthView
          month={currentDate}
          slots={slots}
          onDayClick={handleDayClick}
        />
      )}

      {/* Day detail sheet (month view) */}
      {selectedDay && (
        <DayDetailSheet
          open={daySheetOpen}
          onOpenChange={setDaySheetOpen}
          date={selectedDay}
          slots={selectedDaySlots}
          practitionerId={practitionerId}
          slotTypes={slotTypes}
          defaultSlotMins={defaultSlotMins}
          onTemplateClick={handleTemplateClick}
          onRefresh={loadSlots}
        />
      )}

      {/* Template apply dialog */}
      {templateDate && (
        <TemplateApplyDialog
          open={templateDialogOpen}
          onOpenChange={setTemplateDialogOpen}
          date={templateDate}
          practitionerId={practitionerId}
          templates={templates}
          onApplied={loadSlots}
        />
      )}

    </div>
  )
}