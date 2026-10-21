"use client";

import { money, useData } from "@/lib/store";
import { SampleTag } from "./Live";

export default function YearlyReports() {
  const reports = [...useData("reports")].sort((a, b) => b.year.localeCompare(a.year));
  if (!reports.length) return <p className="empty">Our first yearly report is on its way.</p>;
  return (
    <div className="years">
      {reports.map(r => (
        <article className="year" key={r.id}>
          <header><h2>{r.year}</h2><SampleTag show={r.sample}>Sample figures</SampleTag></header>
          <dl className="year-stats">
            <div><dt>Students supported</dt><dd>{r.students.toLocaleString("en-US")}</dd></div>
            <div><dt>Scholarships &amp; grants</dt><dd>{r.scholarships.toLocaleString("en-US")}</dd></div>
            <div><dt>Awarded</dt><dd>{money(r.granted)}</dd></div>
            <div><dt>Raised</dt><dd>{money(r.raised)}</dd></div>
            <div><dt>Donors</dt><dd>{r.donors.toLocaleString("en-US")}</dd></div>
          </dl>
          {r.highlights.length > 0 && <ul className="year-highlights">{r.highlights.map(h => <li key={h}>{h}</li>)}</ul>}
        </article>
      ))}
    </div>
  );
}
