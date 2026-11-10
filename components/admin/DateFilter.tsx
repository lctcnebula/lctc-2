"use client";
import { createContext, useContext, useId, useState } from "react";
import { ALL_DATES, dateRangeError, resolveDateRange, type DatePreset, type DateSelection } from "@/lib/date-range";
const Context = createContext<{ selection: DateSelection; setSelection: (value: DateSelection) => void } | null>(null);
export function AdminDateProvider({ children }: { children: React.ReactNode }) {
  const [selection, setSelection] = useState<DateSelection>(ALL_DATES);
  return <Context.Provider value={{ selection, setSelection }}>{children}</Context.Provider>;
}
export function useAdminDateRange() {
  const context = useContext(Context);
  if (!context) throw new Error("AdminDateProvider is required");
  return { ...context, range: resolveDateRange(context.selection) };
}
const presets: { id: DatePreset; label: string }[] = [{ id: "all", label: "All time" }, { id: "today", label: "Today" }, { id: "7days", label: "Last 7 days" }, { id: "month", label: "Last month" }, { id: "3months", label: "Last 3 months" }, { id: "6months", label: "Last 6 months" }, { id: "custom", label: "Custom range" }];
export default function DateFilter({ basis = "Date submitted or added to the system" }: { basis?: string }) {
  const { selection, setSelection, range } = useAdminDateRange();
  const id = useId(), error = dateRangeError(range);
  return <fieldset className="admin-date-filter">
    <legend>Date range</legend>
    <div className="date-presets" role="group" aria-label="Date presets">{presets.map(p => <button key={p.id} className="chip" type="button" aria-pressed={selection.preset === p.id} onClick={() => setSelection({ ...selection, preset: p.id })}>{p.label}</button>)}</div>
    <div className="date-inputs">
      <label htmlFor={id + "from"}>From<input id={id + "from"} type="date" value={range.from} max={range.to || undefined} aria-invalid={!!error} aria-describedby={id + "hint"} onChange={e => setSelection({ preset: "custom", from: e.target.value, to: range.to })}/></label>
      <label htmlFor={id + "to"}>To<input id={id + "to"} type="date" value={range.to} min={range.from || undefined} aria-invalid={!!error} aria-describedby={id + "hint"} onChange={e => setSelection({ preset: "custom", from: range.from, to: e.target.value })}/></label>
      {selection.preset !== "all" && <button className="link-btn" type="button" onClick={() => setSelection(ALL_DATES)}>Clear dates</button>}
    </div>
    <p id={id + "hint"} className={error ? "err" : "hint"} role={error ? "alert" : undefined}>{error || `${basis}. Central Time; both dates included. Month presets use completed calendar months.`}</p>
  </fieldset>;
}
