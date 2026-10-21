"use client";

import Manager, { type Row, fmtDateTime } from "@/components/admin/Manager";

const statuses = ["New", "Replied", "Closed"];

export default function MessagesAdmin() {
  return (
    <Manager
      collection="messages" title="Messages" noun="messages" canCreate={false}
      intro="Sent from the contact form."
      search={r => `${r.name} ${r.email} ${r.topic} ${r.message}`}
      sort={(a, b) => b.createdAt.localeCompare(a.createdAt)}
      filters={[{ label: "All", test: () => true }, ...statuses.map(s => ({ label: s, test: (r: Row) => r.status === s }))]}
      rowActions={r => <a className="link-btn" href={`mailto:${r.email}?subject=${encodeURIComponent("Re: " + r.topic)}`}>Reply</a>}
      columns={[
        { label: "Received", get: r => fmtDateTime(r.createdAt), csv: r => r.createdAt },
        { label: "From", get: r => <><b>{r.name}</b><small>{r.email}</small></>, csv: r => r.name },
        { label: "Email", get: () => null, csv: r => r.email, className: "hide" },
        { label: "Topic", get: r => r.topic, csv: r => r.topic },
        { label: "Message", get: r => <span className="clip-text">{r.message}</span>, csv: r => r.message },
        { label: "Status", get: r => <span className={"status s-" + r.status.toLowerCase()}>{r.status}</span>, csv: r => r.status },
      ]}
      fields={[
        { key: "status", label: "Status", type: "select", required: true, half: true, options: statuses.map(s => ({ value: s, label: s })) },
        { key: "createdAt", label: "Received", type: "readonly", half: true, show: r => fmtDateTime(r.createdAt) },
        { key: "name", label: "From", type: "readonly", half: true },
        { key: "email", label: "Email", type: "readonly", half: true, show: r => <a href={`mailto:${r.email}`}>{r.email}</a> },
        { key: "topic", label: "Topic", type: "readonly" },
        { key: "message", label: "Message", type: "readonly", show: r => <div className="essay">{r.message}</div> },
        { key: "adminNotes", label: "Internal notes", type: "textarea" },
      ]}
    />
  );
}
