"use client";

import Manager, { fmtDateTime } from "@/components/admin/Manager";
import { now, useData } from "@/lib/store";

export default function SubscribersAdmin() {
  const subs = useData("subscribers");
  return (
    <Manager
      collection="subscribers" title="Event subscribers" noun="subscribers" newLabel="Add subscriber"
      intro="People who asked to hear about events. Use “Copy emails” to paste them into your email tool's BCC."
      search={r => `${r.email} ${r.name}`}
      sort={(a, b) => b.createdAt.localeCompare(a.createdAt)}
      headerExtra={<button className="btn line sm" type="button" onClick={() => navigator.clipboard?.writeText(subs.map(s => s.email).join(", "))}>Copy emails</button>}
      columns={[
        { label: "Email", get: r => <b>{r.email}</b>, csv: r => r.email },
        { label: "Name", get: r => r.name, csv: r => r.name },
        { label: "Subscribed", get: r => fmtDateTime(r.createdAt), csv: r => r.createdAt },
      ]}
      blank={() => ({ email: "", name: "", createdAt: now() })}
      fields={[
        { key: "email", label: "Email", type: "email", required: true, half: true },
        { key: "name", label: "Name", half: true },
      ]}
      validate={(r, all) => all.some(x => x.id !== r.id && x.email.toLowerCase() === r.email.trim().toLowerCase()) ? "That email is already subscribed." : null}
      beforeSave={r => ({ ...r, email: r.email.trim().toLowerCase() })}
    />
  );
}
