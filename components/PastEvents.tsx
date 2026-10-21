"use client";

import Link from "next/link";
import { past, useData } from "@/lib/store";
import { eventParts } from "./EventCard";

export default function PastEvents() {
  const events = past(useData("events")).slice(0, 8);
  const posts = useData("posts").filter(p => p.published);
  if (!events.length) return null;
  return (
    <section className="block">
      <div className="wrap">
        <div className="head"><div><p className="kicker">Looking back</p><h2>Past events</h2></div></div>
        <ul className="past-list">
          {events.map(e => {
            const recap = posts.find(p => p.eventId === e.id);
            return (
              <li key={e.id}>
                <span className="past-date">{eventParts(e.date).full}</span>
                <Link href={`/events/${e.slug}`}>{e.title}</Link>
                {recap && <Link className="text-link" href={`/blog/${recap.slug}`}>Read the recap →</Link>}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
