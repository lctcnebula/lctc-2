"use client";

import Link from "next/link";
import { useData } from "@/lib/store";
import { SampleTag } from "./Live";

export const postDate = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

export default function BlogList({ limit }: { limit?: number }) {
  const events = useData("events");
  const posts = useData("posts").filter(p => p.published).sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
  if (!posts.length) return <p className="empty">No posts yet. Check back after our next event.</p>;
  return (
    <div className="grid three">
      {posts.map(p => {
        const ev = events.find(e => e.id === p.eventId);
        return (
          <article className="card post-card" key={p.id}>
            {p.image && <div className="media"><img src={p.image} alt="" width={1024} height={683} loading="lazy" />{ev && <span className="badge">{ev.title}</span>}</div>}
            <div className="content">
              <p className="time">{postDate(p.date)} <SampleTag show={p.sample} /></p>
              <h3><Link className="stretch" href={`/blog/${p.slug}`}>{p.title}</Link></h3>
              <p>{p.excerpt}</p>
              <span className="more" aria-hidden="true">Read more</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
