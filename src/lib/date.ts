/**
 * Builds a local ISO datetime string (no UTC offset) for storage in the database.
 * e.g. "2024-12-15T14:30:00"
 */
export function toLocalISO(date: Date, h: number, m: number): string {
  const y = date.getFullYear();
  const mon = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${y}-${mon}-${d}T${hh}:${mm}:00`;
}

/**
 * Formats a stored local ISO datetime string for display.
 * e.g. "2024-12-15T14:30:00" → "14:30"
 */
export function formatTime(isoString: string): string {
  return isoString.slice(11, 16);
}

/**
 * Formats a stored local ISO datetime string as a full date.
 * e.g. "2024-12-15T14:30:00" → Date object with correct local time
 */
export function parseLocalISO(isoString: string): Date {
  return new Date(isoString);
}
