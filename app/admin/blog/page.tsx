"use client";

import Link from "next/link";
import Manager, { fmtDate } from "@/components/admin/Manager";
import { useQuery } from "@/components/admin/useQuery";
import { useUser } from "@/lib/auth";
import { useData } from "@/lib/store";

export default function BlogAdmin() {
  const { user } = useUser();
  const events = [...useData("events")].sort((a, b) => b.date.localeCompare(a.date));
  const forEvent = useQuery("event");
  const ev = events.find(e => e.id === forEvent);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Manager
      collection="posts" title="Blog" noun="posts" newLabel="New post"
      intro="Write a post after any event. Link it to the event and it shows on that event's page too."
      search={r => `${r.title} ${r.author} ${r.excerpt}`}
      sort={(a, b) => b.date.localeCompare(a.date)}
      startNew={ev ? { title: `${ev.title} recap`, eventId: ev.id, image: ev.image } : null}
      filters={[{ label: "All", test: () => true }, { label: "Published", test: r => r.published }, { label: "Drafts", test: r => !r.published }]}
      rowActions={r => r.published ? <Link className="link-btn" href={`/blog/${r.slug}`} target="_blank">View ↗</Link> : null}
      columns={[
        { label: "Date", get: r => fmtDate(r.date), csv: r => r.date },
        { label: "Title", get: r => <><b>{r.title}</b><small>{r.author}</small></>, csv: r => r.title },
        { label: "Event", get: r => events.find(e => e.id === r.eventId)?.title ?? "—", csv: r => events.find(e => e.id === r.eventId)?.title ?? "" },
        { label: "Status", get: r => <span className={"status " + (r.published ? "s-approved" : "s-draft")}>{r.published ? "Published" : "Draft"}</span>, csv: r => (r.published ? "Published" : "Draft") },
      ]}
      blank={() => ({ title: "", slug: "", date: today, author: user?.name ?? "", eventId: "", excerpt: "", body: "", image: "", published: false })}
      fields={[
        { key: "title", label: "Title", required: true },
        { key: "slug", label: "URL", type: "slug", from: "title" },
        { key: "date", label: "Date", type: "date", required: true, half: true },
        { key: "author", label: "Author", half: true },
        { key: "eventId", label: "Related event", type: "select", options: events.map(e => ({ value: e.id, label: `${e.title} (${fmtDate(e.date)})` })) },
        { key: "excerpt", label: "Summary", type: "textarea", required: true, help: "One or two sentences for the blog list." },
        { key: "body", label: "Post", type: "long", required: true, help: "Blank line = new paragraph. Start a line with ## for a heading or - for a bullet." },
        { key: "image", label: "Cover image", type: "image" },
        { key: "published", label: "Published (visible on the site)", type: "checkbox" },
      ]}
    />
  );
}
