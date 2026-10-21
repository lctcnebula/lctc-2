"use client";

import Manager, { type Row, fmtDate, fmtDateTime } from "@/components/admin/Manager";
import { useQuery } from "@/components/admin/useQuery";
import { now, useData } from "@/lib/store";

export default function RsvpsAdmin() {
  const events = [...useData("events")].sort((a, b) => b.date.localeCompare(a.date));
  const eventId = useQuery("event");
  const ev = (id: string) => events.find(e => e.id === id);
  const filters = [
    { label: "All events", test: () => true },
    ...events.filter(e => e.rsvpOpen || e.id === eventId).map(e => ({ label: e.title, test: (r: Row) => r.eventId === e.id })),
  ];
  const where = eventId ? (r: Row) => r.eventId === eventId : undefined;
  const focus = eventId ? ev(eventId) : undefined;

  return (
    <Manager
      key={eventId ?? "all"}
      collection="rsvps" title={focus ? `RSVPs: ${focus.title}` : "Event RSVPs"} noun="RSVPs" newLabel="Add RSVP"
      intro={focus ? <>{fmtDate(focus.date)} · <a href="/admin/rsvps">Show all events</a></> : "Everyone who RSVP'd on an event page. Admins can add people by hand too."}
      search={r => `${r.name} ${r.email} ${ev(r.eventId)?.title ?? ""}`}
      sort={(a, b) => b.createdAt.localeCompare(a.createdAt)}
      where={where}
      filters={focus ? undefined : filters}
      headerExtra={<Headcount eventId={eventId} />}
      columns={[
        { label: "Event", get: r => ev(r.eventId)?.title ?? "Removed event", csv: r => ev(r.eventId)?.title ?? "" },
        { label: "Name", get: r => <><b>{r.name}</b><small>{r.email}</small></>, csv: r => r.name },
        { label: "Email", get: () => null, csv: r => r.email, className: "hide" },
        { label: "Party", get: r => 1 + r.guests, csv: r => 1 + r.guests, className: "num" },
        { label: "Note", get: r => <span className="clip-text">{r.note}</span>, csv: r => r.note },
        { label: "RSVP'd", get: r => fmtDateTime(r.createdAt), csv: r => r.createdAt },
      ]}
      blank={() => ({ eventId: eventId ?? events[0]?.id ?? "", name: "", email: "", guests: 0, note: "", createdAt: now() })}
      fields={[
        { key: "eventId", label: "Event", type: "select", required: true, options: events.map(e => ({ value: e.id, label: `${e.title} (${fmtDate(e.date)})` })) },
        { key: "name", label: "Name", required: true, half: true },
        { key: "email", label: "Email", type: "email", required: true, half: true },
        { key: "guests", label: "Extra guests", type: "number", half: true },
        { key: "createdAt", label: "RSVP'd", type: "readonly", half: true, show: r => fmtDateTime(r.createdAt) },
        { key: "note", label: "Note", type: "textarea" },
      ]}
    />
  );
}

function Headcount({ eventId }: { eventId: string | null }) {
  const rsvps = useData("rsvps").filter(r => !eventId || r.eventId === eventId);
  return <span className="totals"><b>{rsvps.reduce((n, r) => n + 1 + r.guests, 0)}</b> people</span>;
}
