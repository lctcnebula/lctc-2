"use client";

import Manager from "@/components/admin/Manager";
import { useSite } from "@/components/Providers";
import { getAll, insert, money, update } from "@/lib/store";

// US school / fiscal year: July 1 to June 30, named like "2026–27".
function schoolYear(d = new Date()) {
  const start = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
  return { label: `${start}–${String(start + 1).slice(2)}`, from: new Date(start, 6, 1), to: new Date(start + 1, 6, 1) };
}

/** Totals this school year from the database: gifts and donors from Donations, awards from approved applications. */
function LiveFill() {
  const { say } = useSite();
  async function fill() {
    const y = schoolYear();
    const inYear = (iso: string) => { const t = new Date(iso); return t >= y.from && t < y.to; };
    const gifts = getAll("donations").filter(d => inYear(d.createdAt) && !d.sample);
    const awards = getAll("applications").filter(a => a.status === "Approved" && inYear(a.submittedAt));
    const figures = {
      raised: Math.round(gifts.reduce((n, d) => n + d.amount, 0)),
      donors: new Set(gifts.map(d => d.email.toLowerCase())).size,
      scholarships: awards.length,
      granted: Math.round(awards.reduce((n, a) => n + (Number(String(a.amount).replace(/[$,]/g, "")) || 0), 0)),
      students: new Set(awards.filter(a => a.applicantType !== "teacher").map(a => a.email.toLowerCase())).size,
    };
    const existing = getAll("reports").find(r => r.year === y.label);
    if (existing && !confirm(`Replace the ${y.label} figures with live totals from the database?`)) return;
    try {
      if (existing) await update("reports", existing.id, figures);
      else await insert("reports", { year: y.label, ...figures, highlights: [] });
      say(`${y.label} updated from live data`);
    } catch {}
  }
  return <button className="btn line sm" type="button" onClick={fill} title="Donations and approved applications from July 1 to June 30">Fill {schoolYear().label} from live data</button>;
}

export default function ReportsAdmin() {
  return (
    <Manager
      collection="reports" title="Yearly reports" noun="years" newLabel="Add year"
      intro={<>One entry per school year. The newest year feeds the numbers on the home page; all years show on the <a href="/impact" target="_blank">Impact page</a>.</>}
      headerExtra={<LiveFill />}
      search={r => r.year}
      sort={(a, b) => (parseInt(b.year, 10) || 0) - (parseInt(a.year, 10) || 0) || b.year.localeCompare(a.year)}
      columns={[
        { label: "Year", get: r => <b>{r.year}</b>, csv: r => r.year },
        { label: "Students", get: r => r.students.toLocaleString(), csv: r => r.students, className: "num" },
        { label: "Awards", get: r => r.scholarships.toLocaleString(), csv: r => r.scholarships, className: "num" },
        { label: "Awarded", get: r => money(r.granted), csv: r => r.granted, className: "num" },
        { label: "Raised", get: r => money(r.raised), csv: r => r.raised, className: "num" },
        { label: "Donors", get: r => r.donors.toLocaleString(), csv: r => r.donors, className: "num" },
      ]}
      blank={() => ({ year: "", students: 0, scholarships: 0, granted: 0, raised: 0, donors: 0, highlights: [] })}
      fields={[
        { key: "year", label: "School year", required: true, half: true, help: "e.g. 2026–27" },
        { key: "students", label: "Students supported", type: "number", half: true },
        { key: "scholarships", label: "Scholarships & grants awarded", type: "number", half: true },
        { key: "granted", label: "Dollars awarded", type: "number", half: true },
        { key: "raised", label: "Dollars raised", type: "number", half: true },
        { key: "donors", label: "Donors", type: "number", half: true },
        { key: "highlights", label: "Highlights", type: "lines" },
      ]}
      validate={(r, all) => all.some(x => x.id !== r.id && x.year === r.year.trim()) ? "That year already has a report." : null}
    />
  );
}
