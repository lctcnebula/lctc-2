"use client";

import Link from "next/link";
import Manager, { fmtDate } from "@/components/admin/Manager";
import { upcoming, useData } from "@/lib/store";

export default function EventsAdmin() {
  const rsvps = useData("rsvps");
  const posts = useData("posts");
  const count = (id: string) => rsvps.filter(r => r.eventId === id).reduce((n, r) => n + 1 + r.guests, 0);
  const isUpcoming = (r: { date: string; published: boolean }) => upcoming([{ ...r, published: true } as never]).length > 0;

  return (
    <Manager
      collection="events" title="Events" noun="events" newLabel="New event"
      intro="Foundation events. Each published event gets its own page with an RSVP form."
      search={r => `${r.title} ${r.location} ${r.summary}`}
      sort={(a, b) => b.date.localeCompare(a.date)}
      filters={[
        { label: "All", test: () => true },
        { label: "Upcoming", test: r => isUpcoming(r as never) },
        { label: "Past", test: r => !isUpcoming(r as never) },
        { label: "Drafts", test: r => !r.published },
      ]}
      rowActions={r => (
        <>
          <Link className="link-btn" href={`/admin/rsvps?event=${r.id}`}>RSVPs</Link>
          {posts.some(p => p.eventId === r.id)
            ? <Link className="link-btn" href="/admin/blog">Post</Link>
            : <Link className="link-btn" href={`/admin/blog?event=${r.id}`}>Write post</Link>}
          {r.published && <Link className="link-btn" href={`/events/${r.slug}`} target="_blank">View ↗</Link>}
        </>
      )}
      columns={[
        { label: "Date", get: r => fmtDate(r.date), csv: r => r.date },
        { label: "Event", get: r => <><b>{r.title}</b><small>{[r.start, r.end].filter(Boolean).join(" – ")}{r.location && " · " + r.location}</small></>, csv: r => r.title },
        { label: "RSVPs", get: r => r.rsvpOpen || count(r.id) ? <>{count(r.id)}{r.capacity ? ` / ${r.capacity}` : ""}</> : "Off", csv: r => count(r.id), className: "num" },
        { label: "Status", get: r => <span className={"status " + (r.published ? "s-approved" : "s-draft")}>{r.published ? (isUpcoming(r as never) ? "Upcoming" : "Past") : "Draft"}</span>, csv: r => (r.published ? "Published" : "Draft") },
      ]}
      blank={() => ({ title: "", slug: "", date: "", start: "6:00 PM", end: "8:00 PM", location: "", summary: "", body: "", image: "", capacity: 0, rsvpOpen: true, published: false })}
      fields={[
        { key: "title", label: "Title", required: true },
        { key: "slug", label: "URL", type: "slug", from: "title" },
        { key: "date", label: "Date", type: "date", required: true, half: true },
        { key: "location", label: "Location", half: true },
        { key: "start", label: "Starts", half: true, help: "e.g. 6:00 PM" },
        { key: "end", label: "Ends", half: true },
        { key: "summary", label: "Short summary", type: "textarea", required: true, help: "Shown on event cards." },
        { key: "body", label: "Full description", type: "long", help: "Blank line = new paragraph. Start a line with ## for a heading or - for a bullet." },
        { key: "image", label: "Image", type: "image" },
        { key: "capacity", label: "Capacity", type: "number", half: true, help: "Total people incl. guests. 0 = no limit." },
        { key: "rsvpOpen", label: "Accept RSVPs", type: "checkbox", half: true },
        { key: "published", label: "Published (visible on the site)", type: "checkbox" },
      ]}
    />
  );
}
