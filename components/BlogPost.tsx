"use client";

import Link from "next/link";
import { useData } from "@/lib/store";
import { Missing } from "./Missing";
import { SampleTag } from "./Live";
import { Prose } from "./Prose";
import { postDate } from "./BlogList";

export default function BlogPost({ slug }: { slug: string }) {
  const posts = useData("posts");
  const events = useData("events");
  const p = posts.find(x => x.slug === slug && x.published);
  if (!p) return <Missing what="post" back="/blog" />;
  const ev = events.find(e => e.id === p.eventId && e.published);

  return (
    <>
      <section className="page-hero">
        {p.image && <img src={p.image} alt="" width={1024} height={683} />}
        <div className="wrap">
          <p className="crumbs"><Link href="/">Home</Link> / <Link href="/blog">Blog</Link></p>
          <h1>{p.title}</h1>
          <p>{postDate(p.date)}{p.author && <> · {p.author}</>}</p>
        </div>
      </section>
      <section className="block">
        <div className="wrap article">
          <SampleTag show={p.sample}>Sample post</SampleTag>
          {p.excerpt && <p className="article-lede">{p.excerpt}</p>}
          <Prose text={p.body} />
          {ev && <p className="article-event">From the event <Link href={`/events/${ev.slug}`}>{ev.title}</Link></p>}
          <p style={{ marginTop: 32 }}><Link className="text-link" href="/blog">← All posts</Link></p>
        </div>
      </section>
    </>
  );
}
