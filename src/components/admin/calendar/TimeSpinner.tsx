"use client";

import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeInputProps {
  hours: number;
  minutes: number;
  onHoursChange: (h: number) => void;
  onMinutesChange: (m: number) => void;
  label?: string;
  className?: string;
}

export function TimeInput({
  hours,
  minutes,
  onHoursChange,
  onMinutesChange,
  label,
  className,
}: TimeInputProps) {
  const [hourText, setHourText] = useState(String(hours).padStart(2, "0"));
  const [minuteText, setMinuteText] = useState(
    String(minutes).padStart(2, "0")
  );

  useEffect(() => {
    setHourText(String(hours).padStart(2, "0"));
  }, [hours]);

  useEffect(() => {
    setMinuteText(String(minutes).padStart(2, "0"));
  }, [minutes]);

  function commitHour(raw: string) {
    const n = parseInt(raw);
    if (!isNaN(n) && n >= 0 && n <= 23) {
      onHoursChange(n);
      setHourText(String(n).padStart(2, "0"));
    } else {
      setHourText(String(hours).padStart(2, "0"));
    }
  }

  function commitMinute(raw: string) {
    const n = parseInt(raw);
    if (!isNaN(n) && n >= 0 && n <= 59) {
      // snap to nearest 5
      const snapped = Math.round(n / 5) * 5 === 60 ? 55 : Math.round(n / 5) * 5;
      onMinutesChange(snapped);
      setMinuteText(String(snapped).padStart(2, "0"));
    } else {
      setMinuteText(String(minutes).padStart(2, "0"));
    }
  }

  function incrementHour() {
    onHoursChange(hours === 23 ? 0 : hours + 1);
  }
  function decrementHour() {
    onHoursChange(hours === 0 ? 23 : hours - 1);
  }
  function incrementMinute() {
    onMinutesChange(minutes >= 55 ? 0 : minutes + 5);
  }
  function decrementMinute() {
    onMinutesChange(minutes <= 0 ? 55 : minutes - 5);
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && (
        <span className="text-xs text-muted-foreground font-medium">
          {label}
        </span>
      )}
      <div className="flex items-center gap-0.5 border rounded-lg px-2 py-1 bg-background w-fit">
        {/* Hours */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={incrementHour}
            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <input
            type="text"
            inputMode="numeric"
            value={hourText}
            onChange={(e) => setHourText(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={(e) => commitHour(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitHour(hourText);
            }}
            className="w-7 text-center text-sm font-mono font-medium bg-transparent focus:outline-none focus:bg-muted rounded"
          />
          <button
            type="button"
            onClick={decrementHour}
            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <span className="text-sm font-mono font-medium text-muted-foreground mb-0.5">
          :
        </span>

        {/* Minutes */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={incrementMinute}
            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <input
            type="text"
            inputMode="numeric"
            value={minuteText}
            onChange={(e) => setMinuteText(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={(e) => commitMinute(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitMinute(minuteText);
            }}
            className="w-7 text-center text-sm font-mono font-medium bg-transparent focus:outline-none focus:bg-muted rounded"
          />
          <button
            type="button"
            onClick={decrementMinute}
            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
