/**
 * Parses an ISO date string (e.g. "2026-05-05" or "2026-05-05T00:00:00Z")
 * by extracting the date parts directly, avoiding UTC-to-local conversion.
 *
 * new Date("2026-05-05T00:00:00Z") in UTC-6 → 4 may at 18:00 → wrong day.
 * This helper keeps the calendar date as-is regardless of timezone.
 */
export function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number) as [number, number, number]
  return { year: y, month: m - 1, day: d } // month is 0-indexed like Date.getMonth()
}

/**
 * Formats a transaction/API date string for display without timezone shift.
 * Consistent between SSR and client hydration.
 */
export function fmtDateLocal(
  dateStr: string,
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "2-digit" },
  locale = "es-MX",
): string {
  const { year, month, day } = parseDateParts(dateStr)
  return new Date(year, month, day).toLocaleDateString(locale, options)
}
