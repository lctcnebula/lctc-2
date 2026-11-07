"use client";

import { useState } from "react";
import Manager, { fmtDateTime } from "@/components/admin/Manager";
import { Donors, exportDonors, exportSubmissions, Submissions } from "@/components/admin/DonationGroups";
import { funds } from "@/components/DonateCheckout";
import { money, now, useData } from "@/lib/store";
import { frequencies, type Freq } from "@/lib/seed";

const tabs = [
  { id: "subs", label: "Submissions", hint: "One row per checkout. Gifts paid together share one receipt.", filters: ["All", "Several gifts", "Recurring", "Dedicated"] },
  { id: "donors", label: "Donors", hint: "Everyone who has given, with every donation and receipt.", filters: ["All", "Gave more than once", "Recurring", "Wants updates"] },
  { id: "lines", label: "Gift lines", hint: "Each gift on its own line. Record checks and offline gifts here.", filters: [] },
] as const;

export default function DonationsAdmin() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("subs");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState(0);
  const donations = useData("donations");
  const t = tabs.find(x => x.id === tab)!;
  const switchTo = (id: typeof tab) => { setTab(id); setFilter(0); };

  if (tab === "lines") return <><DonationTabs tab={tab} onTab={switchTo} /><Lines /></>;
  return (
    <div className="admin-page">
      <header className="admin-head">
        <div><h1>Donations</h1><p className="hint">{t.hint}</p></div>
        <div className="admin-actions">
          <DonationTotals />
          <button className="btn line sm" type="button" disabled={!donations.length}
            onClick={() => (tab === "subs" ? exportSubmissions : exportDonors)(donations)}>Export CSV</button>
          <button className="btn blue sm" type="button" onClick={() => switchTo("lines")}>Record a gift</button>
        </div>
      </header>
      <DonationTabs tab={tab} onTab={switchTo} />
      <div className="admin-tools">
        <input type="search" placeholder="Search name, email, receipt…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search" />
        <div className="filters" role="group" aria-label="Filter">
          {t.filters.map((f, k) => <button key={f} className="chip" type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>{f}</button>)}
        </div>
      </div>
      {tab === "subs" ? <Submissions q={q} filter={filter} /> : <Donors q={q} filter={filter} />}
    </div>
  );
}

function DonationTabs({ tab, onTab }: { tab: string; onTab: (id: (typeof tabs)[number]["id"]) => void }) {
  return (
    <div className="admin-tabs" role="tablist" aria-label="Donation views">
      {tabs.map(x => <button key={x.id} type="button" role="tab" aria-selected={tab === x.id} onClick={() => onTab(x.id)}>{x.label}</button>)}
    </div>
  );
}

function Lines() {
  return (
    <Manager
      collection="donations" title="Donations" noun="donations" newLabel="Record a gift"
      intro="Each gift on its own line. Record checks and offline gifts with “Record a gift”; use the same receipt number to group gifts into one submission."
      search={r => `${r.name} ${r.email} ${r.fund} ${r.receipt} ${r.dedication ?? ""}`}
      sort={(a, b) => b.createdAt.localeCompare(a.createdAt)}
      filters={[
        { label: "All", test: () => true },
        { label: "One-time", test: r => r.freq === "once" },
        { label: "Monthly", test: r => r.freq === "monthly" },
        { label: "Yearly", test: r => r.freq === "yearly" },
      ]}
      headerExtra={<DonationTotals />}
      columns={[
        { label: "Date", get: r => fmtDateTime(r.createdAt), csv: r => r.createdAt },
        { label: "Donor", get: r => <><b>{r.name}</b><small>{r.email}</small></>, csv: r => r.name },
        { label: "Email", get: () => null, csv: r => r.email, className: "hide" },
        { label: "Amount", get: r => <b>{money(r.amount)}{frequencies[r.freq as Freq]?.short}</b>, csv: r => r.amount, className: "num" },
        { label: "Frequency", get: () => null, csv: r => r.freq, className: "hide" },
        { label: "Fund", get: r => <>{r.fund}{r.tier && <small>{r.tier}</small>}{r.dedication && <small>🕊️ {r.dedication}</small>}</>, csv: r => r.tier ? `${r.fund} · ${r.tier}` : r.fund },
        { label: "Dedication", get: () => null, csv: r => [r.dedication, r.note].filter(Boolean).join(" Note: "), className: "hide" },
        { label: "Keep in touch", get: () => null, csv: r => (r.keepInTouch ? "yes" : "no"), className: "hide" },
        { label: "Method", get: r => r.card, csv: r => r.card },
        { label: "Receipt", get: r => <code>{r.receipt}</code>, csv: r => r.receipt },
      ]}
      blank={() => ({ name: "", email: "", amount: 0, freq: "once", fund: funds[0], card: "Check", receipt: "LCTC-" + Math.random().toString(36).slice(2, 8).toUpperCase(), createdAt: now() })}
      fields={[
        { key: "name", label: "Donor name", required: true, half: true },
        { key: "email", label: "Email", type: "email", half: true },
        { key: "amount", label: "Amount ($)", type: "number", required: true, half: true },
        { key: "freq", label: "Frequency", type: "select", required: true, half: true, options: (Object.keys(frequencies) as Freq[]).map(k => ({ value: k, label: frequencies[k].label })) },
        { key: "fund", label: "Fund", type: "select", required: true, half: true, options: funds.map(f => ({ value: f, label: f })) },
        { key: "dedication", label: "Dedication", type: "textarea", help: "e.g. I am donating in memory of Rosa Diaz because of her love of cooking." },
        { key: "note", label: "Note for the honoree", type: "textarea" },
        { key: "keepInTouch", label: "Donor wants updates", type: "checkbox", half: true },
        { key: "card", label: "Payment method", half: true, help: "e.g. Check #1042, Cash, Visa ending 4242" },
        { key: "receipt", label: "Receipt number", required: true, half: true },
        { key: "createdAt", label: "Received", type: "readonly", half: true, show: r => fmtDateTime(r.createdAt) },
      ]}
      validate={r => (+r.amount > 0 ? null : "Enter an amount above $0.")}
    />
  );
}

function DonationTotals() {
  const d = useData("donations");
  const total = d.reduce((n, x) => n + x.amount, 0);
  const sum = (f: Freq) => d.filter(x => x.freq === f).reduce((n, x) => n + x.amount, 0);
  return <span className="totals"><b>{money(total)}</b> recorded · <b>{money(sum("monthly"))}</b>/mo and <b>{money(sum("yearly"))}</b>/yr recurring</span>;
}
