import Link from "next/link";
import type { FoundationEvent } from "@/lib/seed";
import { SampleTag } from "./Live";

export function eventParts(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return {
    m: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    d: d.getDate(),
    w: d.toLocaleString("en-US", { weekday: "short" }),
    long: d.toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric" }),
    full: d.toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
  };
}

export const timeRange = (e: FoundationEvent) => [e.start, e.end].filter(Boolean).join(" – ");

export default function EventCard({ e }: { e: FoundationEvent }) {
  const p = eventParts(e.date);
  return (
    <article className="card event">
      <div className="media">
        <div className="clip">{e.image && <img src={e.image} alt="" width={1024} height={683} loading="lazy" />}</div>
        <div className="date"><span className="m">{p.m}</span><span className="d">{p.d}</span><span className="w">{p.w}</span></div>
      </div>
      <div className="content">
        <p className="time">{timeRange(e)} <SampleTag show={e.sample} /></p>
        <h3><Link className="stretch" href={`/events/${e.slug}`}>{e.title}</Link></h3>
        <p>{e.summary}</p>
        <span className="more" aria-hidden="true">{e.rsvpOpen ? "Details & RSVP" : "Details"}</span>
      </div>
    </article>
  );
}
