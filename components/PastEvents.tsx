"use client";
import Icon from "@/components/Icon";

import Link from "next/link";
import { past, useData } from "@/lib/store";
import { eventParts } from "./EventCard";
import Pager, { usePages } from "./Pager";

export default function PastEvents() {
  const events = past(useData("events"));
  const posts = useData("posts").filter(p => p.published);
  const p = usePages(events, 8, "past");
  if (!events.length) return null;
  return (
    <section className="block" id="past" style={{ scrollMarginTop: 110 }}>
      <div className="wrap">
        <div className="head"><div><p className="kicker">Looking back</p><h2>Past events</h2></div></div>
        <ul className="past-list">
          {p.slice.map(e => {
            const recap = posts.find(x => x.eventId === e.id);
            return (
              <li key={e.id}>
                <span className="past-date">{eventParts(e.date).full}</span>
                <Link href={`/events/${e.slug}`}>{e.title}</Link>
                {recap && <Link className="text-link" href={`/blog/${recap.slug}`}>Read the recap <Icon name="→" /></Link>}
              </li>
            );
          })}
        </ul>
        <Pager {...p} noun="past events" />
      </div>
    </section>
  );
}
