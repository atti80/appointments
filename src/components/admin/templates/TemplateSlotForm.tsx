"use client";

import { useState, useTransition } from "react";
import { upsertTemplateSlotAction } from "@/lib/actions/templates";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimeInput } from "@/components/admin/calendar/TimeSpinner";
import { toast } from "sonner";
import type { SlotType, TemplateSlot } from "@/lib/types/database.types";

const DAY_NAMES: Record<string, string> = {
  "0": "Sunday",
  "1": "Monday",
  "2": "Tuesday",
  "3": "Wednesday",
  "4": "Thursday",
  "5": "Friday",
  "6": "Saturday",
};

interface TemplateSlotFormProps {
  templateId: string;
  templateType: "daily" | "weekly";
  slotTypes: SlotType[];
  editing?: TemplateSlot;
  onDone: () => void;
  onCancel: () => void;
}

function totalMinutes(h: number, m: number) {
  return h * 60 + m;
}
function fromMinutes(t: number) {
  return { h: Math.floor(t / 60) % 24, m: t % 60 };
}

export function TemplateSlotForm({
  templateId,
  templateType,
  slotTypes,
  editing,
  onDone,
  onCancel,
}: TemplateSlotFormProps) {
  const parseTime = (t?: string) => {
    if (!t) return { h: 9, m: 0 };
    const [h, m] = t.split(":").map(Number);
    return { h, m };
  };

  const startInit = parseTime(editing?.start_time);
  const endInit = parseTime(editing?.end_time);

  const [startH, setStartH] = useState(startInit.h);
  const [startM, setStartM] = useState(startInit.m);
  const [endH, setEndH] = useState(endInit.h);
  const [endM, setEndM] = useState(endInit.m);
  const [slotTypeId, setSlotTypeId] = useState(editing?.slot_type_id ?? "");
  const [dayOfWeek, setDayOfWeek] = useState(editing?.day_of_week ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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

  function handleSlotTypeChange(id: string) {
    setSlotTypeId(id);
    const st = slotTypes.find((s) => s.id === id);
    if (st) {
      const { h, m } = fromMinutes(
        totalMinutes(startH, startM) + st.duration_minutes
      );
      setEndH(h);
      setEndM(m);
    }
  }

  function handleSubmit() {
    setError(null);
    if (totalMinutes(endH, endM) <= totalMinutes(startH, startM)) {
      setError("End time must be after start time");
      return;
    }

    const formData = new FormData();
    if (editing) formData.set("id", editing.id);
    formData.set("template_id", templateId);
    formData.set(
      "start_time",
      `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`
    );
    formData.set(
      "end_time",
      `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`
    );
    if (slotTypeId) formData.set("slot_type_id", slotTypeId);
    if (dayOfWeek) formData.set("day_of_week", dayOfWeek);

    startTransition(async () => {
      const result = await upsertTemplateSlotAction(formData);
      if (result.success) {
        toast.success(editing ? "Slot updated" : "Slot added");
        onDone();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4 bg-muted/30">
      <div className="flex items-end gap-4 flex-wrap">
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

        {/* Day of week — always shown for weekly, optional for daily */}
        {templateType === "weekly" ? (
          <div className="flex flex-col gap-1.5">
            <Label>Day</Label>
            <Select value={dayOfWeek} onValueChange={setDayOfWeek} required>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DAY_NAMES).map(([val, label]) => (
                  <SelectItem key={val} value={val}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Label>
              Day{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Select
              value={dayOfWeek}
              onValueChange={(v) => setDayOfWeek(v === "none" ? "" : v)}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Any day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Any day</SelectItem>
                {Object.entries(DAY_NAMES).map(([val, label]) => (
                  <SelectItem key={val} value={val}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {slotTypes.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Label>
              Slot type{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Select value={slotTypeId} onValueChange={handleSlotTypeChange}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {slotTypes.map((st) => (
                  <SelectItem key={st.id} value={st.id}>
                    {st.name} ({st.duration_minutes} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={pending}>
          {pending ? "Saving…" : editing ? "Save changes" : "Add slot"}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
