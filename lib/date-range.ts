/** Calendar-day filters use the Foundation's Illinois time zone, including DST. */
export const REPORT_TIME_ZONE = "America/Chicago";
export type DatePreset = "all" | "today" | "7days" | "month" | "3months" | "6months" | "custom";
export type DateSelection = { preset: DatePreset; from: string; to: string };
export type DateRange = { from: string; to: string };
export const ALL_DATES: DateSelection = { preset: "all", from: "", to: "" };
export function calendarDay(value: string | number | Date): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return validDay(value) ? value : "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: REPORT_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
function day(date: Date) { return date.toISOString().slice(0, 10); }
export function validDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && day(date) === value;
}
export function resolveDateRange(selection: DateSelection, now: Date = new Date()): DateRange {
  if (selection.preset === "custom") return { from: selection.from, to: selection.to };
  if (selection.preset === "all") return { from: "", to: "" };
  const today = calendarDay(now);
  if (selection.preset === "today") return { from: today, to: today };
  const anchor = new Date(today + "T00:00:00Z");
  if (selection.preset === "7days") {
    anchor.setUTCDate(anchor.getUTCDate() - 6);
    return { from: day(anchor), to: today };
  }
  // Month presets cover the previous complete calendar month(s).
  const months = selection.preset === "month" ? 1 : selection.preset === "3months" ? 3 : 6;
  return { from: day(new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - months, 1))), to: day(new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 0))) };
}
export function dateRangeError(range: DateRange): string {
  if ((range.from && !validDay(range.from)) || (range.to && !validDay(range.to))) return "Enter valid dates.";
  if (range.from && range.to && range.from > range.to) return "From must be on or before To.";
  return "";
}
export function withinDateRange(value: string, range: DateRange): boolean {
  if (dateRangeError(range)) return false;
  if (!range.from && !range.to) return true;
  const date = calendarDay(value);
  return !!date && (!range.from || date >= range.from) && (!range.to || date <= range.to);
}
export function recordDate(row: object): string {
  const fields = row as Record<string, unknown>;
  return [fields.submittedAt, fields.createdAt, fields.recordedAt].find((v): v is string => typeof v === "string" && !!calendarDay(v)) || "";
}
