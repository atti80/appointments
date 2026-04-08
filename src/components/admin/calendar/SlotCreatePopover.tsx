"use client";

import { useState, useTransition } from "react";
import { createSlotAction, updateSlotAction } from "@/lib/actions/slots";
import { TimeInput } from "./TimeSpinner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { format } from "date-fns";
import { LayoutTemplate } from "lucide-react";
import type { Slot, SlotType } from "@/lib/types/database.types";
import { toLocalISO } from "@/lib/date";

interface SlotCreatePopoverProps {
  children: React.ReactNode;
  date: Date;
  initialHour?: number;
  initialMinute?: number;
  editSlot?: Slot; // if provided, we're in edit mode
  practitionerId: string;
  slotTypes: SlotType[];
  defaultSlotMins: number;
  onTemplateClick?: (date: Date) => void; // optional — hidden in edit mode
  onCreated: () => void;
}

function totalMinutes(h: number, m: number) {
  return h * 60 + m;
}
function fromMinutes(total: number) {
  return { h: Math.floor(total / 60) % 24, m: total % 60 };
}

export function SlotCreatePopover({
  children,
  date,
  initialHour,
  initialMinute,
  editSlot,
  practitionerId,
  slotTypes,
  defaultSlotMins,
  onTemplateClick,
  onCreated,
}: SlotCreatePopoverProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [startH, setStartH] = useState(9);
  const [startM, setStartM] = useState(0);
  const [endH, setEndH] = useState(() => {
    const { h, m } = fromMinutes(9 * 60 + defaultSlotMins);
    return h;
  });
  const [endM, setEndM] = useState(() => {
    const { h, m } = fromMinutes(9 * 60 + defaultSlotMins);
    return m;
  });
  const [slotTypeId, setSlotTypeId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // When start changes, shift end by the same duration
  function handleStartHChange(h: number) {
    const duration = totalMinutes(endH, endM) - totalMinutes(startH, startM);
    setStartH(h);
    if (duration > 0) {
      const { h: eh, m: em } = fromMinutes(totalMinutes(h, startM) + duration);
      setEndH(eh);
      setEndM(em);
    }
  }

  function handleStartMChange(m: number) {
    const duration = totalMinutes(endH, endM) - totalMinutes(startH, startM);
    setStartM(m);
    if (duration > 0) {
      const { h: eh, m: em } = fromMinutes(totalMinutes(startH, m) + duration);
      setEndH(eh);
      setEndM(em);
    }
  }

  // When slot type selected, update end based on its duration
  function handleSlotTypeChange(id: string) {
    setSlotTypeId(id);
    if (id) {
      const st = slotTypes.find((s) => s.id === id);
      if (st) {
        const { h, m } = fromMinutes(
          totalMinutes(startH, startM) + st.duration_minutes
        );
        setEndH(h);
        setEndM(m);
      }
    }
  }

  function handleOpenChange(val: boolean) {
    if (val) {
      if (editSlot) {
        const start = new Date(editSlot.starts_at);
        const end = new Date(editSlot.ends_at);
        setStartH(start.getHours());
        setStartM(start.getMinutes());
        setEndH(end.getHours());
        setEndM(end.getMinutes());
        setSlotTypeId(editSlot.slot_type_id ?? "");
      } else {
        const h = initialHour ?? 9;
        const m = initialMinute ?? 0;
        setStartH(h);
        setStartM(m);
        const { h: eh, m: em } = fromMinutes(h * 60 + m + defaultSlotMins);
        setEndH(eh);
        setEndM(em);
        setSlotTypeId("");
      }
      setError(null);
    }
    setOpen(val);
  }

  function handleSubmit() {
    setError(null);
    if (totalMinutes(endH, endM) <= totalMinutes(startH, startM)) {
      setError("End time must be after start time");
      return;
    }

    const formData = new FormData();
    formData.set("starts_at", toLocalISO(date, startH, startM));
    formData.set("ends_at", toLocalISO(date, endH, endM));
    formData.set("practitioner_id", practitionerId);
    if (slotTypeId) formData.set("slot_type_id", slotTypeId);

    if (editSlot) {
      formData.set("id", editSlot.id);
    }

    startTransition(async () => {
      const result = editSlot
        ? await updateSlotAction(formData)
        : await createSlotAction(formData);

      if (result.success) {
        toast.success(editSlot ? "Slot updated" : "Slot created");
        setOpen(false);
        onCreated();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium">
              {editSlot ? "Edit" : "Create"} slot
            </p>
            <p className="text-xs text-muted-foreground">
              {format(date, "EEEE, MMMM d")}
            </p>
          </div>

          <div className="flex items-end gap-4">
            <TimeInput
              label="Start"
              hours={startH}
              minutes={startM}
              onHoursChange={handleStartHChange}
              onMinutesChange={handleStartMChange}
            />
            <TimeInput
              label="End"
              hours={endH}
              minutes={endM}
              onHoursChange={setEndH}
              onMinutesChange={setEndM}
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
                  {slotTypes.map((st) => (
                    <SelectItem key={st.id} value={st.id}>
                      {st.name} ({st.duration_minutes} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex flex-col gap-2">
            <Button onClick={handleSubmit} disabled={pending} size="sm">
              {pending
                ? editSlot
                  ? "Saving…"
                  : "Creating…"
                : editSlot
                  ? "Save changes"
                  : "Create slot"}
            </Button>
            {!editSlot && onTemplateClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setOpen(false);
                  onTemplateClick(date);
                }}
              >
                <LayoutTemplate className="w-4 h-4" />
                Use template
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
