"use client";

import { upcoming, useData } from "@/lib/store";
import EventCard from "./EventCard";

export function useUpcomingEvents() {
  return upcoming(useData("events"));
}

export default function UpcomingEvents({ limit }: { limit?: number }) {
  const events = useUpcomingEvents().slice(0, limit);
  if (!events.length) return <p className="empty">No upcoming events right now. Subscribe below and we&apos;ll let you know when the next one is announced.</p>;
  return <div className="grid three">{events.map(e => <EventCard key={e.id} e={e} />)}</div>;
}
