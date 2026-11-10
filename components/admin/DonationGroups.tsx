"use client";

// Donations as people think of them. A checkout can hold several gifts (a toolkit, a scholarship,
// a monthly gift…); each gift is stored as its own line, all sharing one receipt number.
// "Submissions" clubs those lines back into one row per checkout; "Donors" clubs every checkout per person.

import { useEffect, useRef, useState } from "react";
import { money, useLoaded } from "@/lib/store";
import { frequencies, type Donation, type Freq } from "@/lib/seed";
import { csvDownload, fmtDate, fmtDateTime, type Row } from "./Manager";

export type Submission = {
  id: string; receipt: string; name: string; email: string; createdAt: string; card: string; keepInTouch: boolean;
  lines: Donation[]; today: number; monthly: number; yearly: number; sample: boolean;
};

export type Donor = {
  id: string; name: string; email: string; submissions: Submission[]; lifetime: number; monthly: number; yearly: number;
  first: string; last: string; keepInTouch: boolean;
};

const sum = (ls: Donation[], f?: Freq) => ls.filter(l => !f || l.freq === f).reduce((n, l) => n + l.amount, 0);

export function groupSubmissions(donations: Donation[]): Submission[] {
  const by = new Map<string, Donation[]>();
  for (const d of donations) {
    const key = d.receipt?.trim() || d.id; // gifts recorded by hand without a receipt stand alone
    by.set(key, [...(by.get(key) ?? []), d]);
  }
  return [...by.entries()].map(([receipt, lines]) => {
    const first = [...lines].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
    return {
      id: receipt, receipt, name: first.name, email: first.email, createdAt: first.createdAt, card: first.card,
      keepInTouch: lines.some(l => l.keepInTouch), lines, today: sum(lines), monthly: sum(lines, "monthly"), yearly: sum(lines, "yearly"),
      sample: lines.every(l => l.sample),
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function groupDonors(subs: Submission[]): Donor[] {
  const by = new Map<string, Submission[]>();
  for (const s of subs) {
    const key = (s.email || s.name).trim().toLowerCase();
    by.set(key, [...(by.get(key) ?? []), s]);
  }
  return [...by.entries()].map(([key, list]) => {
    const latest = list[0], oldest = list[list.length - 1];
    return {
      id: key, name: latest.name, email: latest.email, submissions: list,
      lifetime: list.reduce((n, s) => n + s.today, 0), monthly: list.reduce((n, s) => n + s.monthly, 0), yearly: list.reduce((n, s) => n + s.yearly, 0),
      first: oldest.createdAt, last: latest.createdAt, keepInTouch: list.some(s => s.keepInTouch),
    };
  }).sort((a, b) => b.lifetime - a.lifetime || b.last.localeCompare(a.last));
}

const lineLabel = (l: Donation) => l.tier || l.fund;
const recurring = (x: { monthly: number; yearly: number }) =>
  [x.monthly > 0 && `${money(x.monthly)}/mo`, x.yearly > 0 && `${money(x.yearly)}/yr`].filter(Boolean).join(" + ");

/** A right-hand panel, like the editor in Manager. */
function Panel({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const d = ref.current; if (d && !d.open) d.showModal(); }, []);
  return (
    <dialog ref={ref} className="drawer" onClose={onClose} aria-label={title}>
      <form method="dialog">
        <header><h2>{title}</h2><button type="submit" className="x" aria-label="Close">×</button></header>
        <div className="drawer-body">{children}</div>
        <footer><span style={{ flex: 1 }} /><button type="submit" className="btn line sm">Close</button></footer>
      </form>
    </dialog>
  );
}

function ReceiptCard({ s }: { s: Submission }) {
  return (
    <div className="sub-receipt">
      <header>
        <div><small>Receipt</small><code>{s.receipt}</code></div>
        <div><small>Date</small><b>{fmtDateTime(s.createdAt)}</b></div>
        <div><small>Paid with</small><b>{s.card || "—"}</b></div>
      </header>
      <ul>
        {s.lines.map(l => (
          <li key={l.id}>
            <div>
              <b>{lineLabel(l)}</b>
              {l.tier && <small>{l.fund}</small>}
              {l.dedication && <small className="ded">🕊️ {l.dedication}</small>}
              {l.note && <small>Note: “{l.note}”</small>}
            </div>
            <span>{money(l.amount)}{frequencies[l.freq]?.per}</span>
          </li>
        ))}
      </ul>
      <footer>
        <span>Total today</span><b>{money(s.today)}</b>
      </footer>
      {(s.monthly > 0 || s.yearly > 0) && <p className="hint">Repeats {recurring(s)} until cancelled.</p>}
    </div>
  );
}

export function filterSubmissions(all: Submission[], q: string, filter: number) {
  const tests = [() => true, (s: Submission) => s.lines.length > 1, (s: Submission) => s.monthly + s.yearly > 0, (s: Submission) => s.lines.some(l => l.dedication)];
  const needle = q.trim().toLowerCase();
  return all.filter(s => (tests[filter] ?? tests[0])(s) && (!needle || `${s.name} ${s.email} ${s.receipt} ${s.lines.map(l => `${l.fund} ${l.tier ?? ""} ${l.dedication ?? ""}`).join(" ")}`.toLowerCase().includes(needle)));
}
export function filterDonors(all: Donor[], q: string, filter: number) {
  const tests = [() => true, (d: Donor) => d.submissions.length > 1, (d: Donor) => d.monthly + d.yearly > 0, (d: Donor) => d.keepInTouch];
  const needle = q.trim().toLowerCase();
  return all.filter(d => (tests[filter] ?? tests[0])(d) && (!needle || `${d.name} ${d.email} ${d.submissions.map(s => s.receipt).join(" ")}`.toLowerCase().includes(needle)));
}

export function Submissions({ rows }: { rows: Submission[] }) {
  const loaded = useLoaded("donations");
  const [open, setOpen] = useState<Submission | null>(null);

  return (
    <>
      <p className="hint tab-count">{rows.length} submissions · {money(rows.reduce((n, s) => n + s.today, 0))}</p>
      <div className="table-wrap">
        <table className="admin-table">
          <thead><tr><th>Date</th><th>Donor</th><th>Gifts</th><th className="num">Total</th><th>Payment</th><th>Receipt</th></tr></thead>
          <tbody>
            {rows.map(s => (
              <tr key={s.id} tabIndex={0} onClick={() => setOpen(s)} onKeyDown={e => { if (e.key === "Enter") setOpen(s); }}>
                <td>{fmtDateTime(s.createdAt)}</td>
                <td><b>{s.name}</b><small>{s.email}</small></td>
                <td>
                  <span className="gift-count">{s.lines.length} {s.lines.length === 1 ? "gift" : "gifts"}</span>
                  <small>{s.lines.map(lineLabel).join(" · ")}</small>
                  {s.lines.some(l => l.dedication) && <small>🕊️ Dedicated gift</small>}
                </td>
                <td className="num"><b>{money(s.today)}</b>{recurring(s) && <small>{recurring(s)}</small>}</td>
                <td>{s.card}</td>
                <td><code>{s.receipt}</code>{s.sample && <small><span className="sample-tag">Sample</span></small>}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={6} className="table-empty">{loaded ? "No donations match the selected filters." : "Loading…"}</td></tr>}
          </tbody>
        </table>
      </div>
      {open && (
        <Panel title="Donation" onClose={() => setOpen(null)}>
          <dl className="sub-donor">
            <div><dt>Donor</dt><dd>{open.name}</dd></div>
            <div><dt>Email</dt><dd>{open.email ? <a href={`mailto:${open.email}`}>{open.email}</a> : "—"}</dd></div>
            <div><dt>Keep in touch</dt><dd>{open.keepInTouch ? "Yes, wants updates" : "No"}</dd></div>
          </dl>
          <ReceiptCard s={open} />
          <p className="hint">To correct a single gift line, use the <b>Gift lines</b> tab.</p>
        </Panel>
      )}
    </>
  );
}

export function Donors({ rows }: { rows: Donor[] }) {
  const loaded = useLoaded("donations");
  const [open, setOpen] = useState<Donor | null>(null);

  return (
    <>
      <p className="hint tab-count">{rows.length} donors · {money(rows.reduce((n, d) => n + d.lifetime, 0))} given</p>
      <div className="table-wrap">
        <table className="admin-table">
          <thead><tr><th>Donor</th><th className="num">Donations</th><th className="num">Total given</th><th>Recurring</th><th>First gift</th><th>Latest gift</th></tr></thead>
          <tbody>
            {rows.map(d => (
              <tr key={d.id} tabIndex={0} onClick={() => setOpen(d)} onKeyDown={e => { if (e.key === "Enter") setOpen(d); }}>
                <td><b>{d.name}</b><small>{d.email}{d.keepInTouch ? " · 💌 wants updates" : ""}</small></td>
                <td className="num">{d.submissions.length}</td>
                <td className="num"><b>{money(d.lifetime)}</b></td>
                <td>{recurring(d) || "—"}</td>
                <td>{fmtDate(d.first)}</td>
                <td>{fmtDate(d.last)}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={6} className="table-empty">{loaded ? "No donors match the selected filters." : "Loading…"}</td></tr>}
          </tbody>
        </table>
      </div>
      {open && (
        <Panel title={open.name} onClose={() => setOpen(null)}>
          <dl className="sub-donor">
            <div><dt>Email</dt><dd>{open.email ? <a href={`mailto:${open.email}`}>{open.email}</a> : "—"}</dd></div>
            <div><dt>Total given</dt><dd>{money(open.lifetime)}</dd></div>
            <div><dt>Recurring</dt><dd>{recurring(open) || "None"}</dd></div>
            <div><dt>Donations</dt><dd>{open.submissions.length}, since {fmtDate(open.first)}</dd></div>
          </dl>
          <h3 className="sub-h">Donations and receipts</h3>
          {open.submissions.map(s => <ReceiptCard key={s.id} s={s} />)}
        </Panel>
      )}
    </>
  );
}

/** CSV rows for the two grouped views. */
export function exportSubmissions(submissions: Submission[]) {
  const rows = submissions as unknown as Row[];
  csvDownload("donation-submissions", [
    { label: "Date", get: () => null, csv: r => r.createdAt },
    { label: "Receipt", get: () => null, csv: r => r.receipt },
    { label: "Donor", get: () => null, csv: r => r.name },
    { label: "Email", get: () => null, csv: r => r.email },
    { label: "Gifts", get: () => null, csv: r => (r.lines as Donation[]).map(l => `${lineLabel(l)} ${money(l.amount)}${frequencies[l.freq]?.short ?? ""}`).join("; ") },
    { label: "Total today", get: () => null, csv: r => r.today },
    { label: "Monthly", get: () => null, csv: r => r.monthly },
    { label: "Yearly", get: () => null, csv: r => r.yearly },
    { label: "Payment", get: () => null, csv: r => r.card },
    { label: "Keep in touch", get: () => null, csv: r => (r.keepInTouch ? "yes" : "no") },
  ], rows);
}

export function exportDonors(donors: Donor[]) {
  const rows = donors as unknown as Row[];
  csvDownload("donors", [
    { label: "Donor", get: () => null, csv: r => r.name },
    { label: "Email", get: () => null, csv: r => r.email },
    { label: "Donations", get: () => null, csv: r => (r.submissions as Submission[]).length },
    { label: "Total given", get: () => null, csv: r => r.lifetime },
    { label: "Monthly", get: () => null, csv: r => r.monthly },
    { label: "Yearly", get: () => null, csv: r => r.yearly },
    { label: "First gift", get: () => null, csv: r => r.first },
    { label: "Latest gift", get: () => null, csv: r => r.last },
    { label: "Receipts", get: () => null, csv: r => (r.submissions as Submission[]).map(s => s.receipt).join("; ") },
    { label: "Keep in touch", get: () => null, csv: r => (r.keepInTouch ? "yes" : "no") },
  ], rows);
}
