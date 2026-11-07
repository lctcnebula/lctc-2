"use client";

import { upcoming, useData } from "@/lib/store";
import EventCard from "./EventCard";
import Pager, { usePages } from "./Pager";

export function useUpcomingEvents() {
  return upcoming(useData("events"));
}

const Empty = () => <p className="empty">No upcoming events right now. Subscribe below and we&apos;ll let you know when the next one is announced.</p>;

/** With `limit`, just the next few (home page). With `pageSize`, every upcoming event, a page at a time (events page). */
export default function UpcomingEvents({ limit, pageSize }: { limit?: number; pageSize?: number }) {
  const all = useUpcomingEvents();
  const p = usePages(all, pageSize ?? (all.length || 1), "upcoming");
  const events = limit ? all.slice(0, limit) : p.slice;
  if (!all.length) return <Empty />;
  return (
    <>
      <div className="grid three" key={p.page}>{events.map(e => <EventCard key={e.id} e={e} />)}</div>
      {pageSize && <Pager {...p} noun="upcoming events" />}
    </>
  );
}
