"use client";

import Link from "next/link";
import { useData } from "@/lib/store";
import { categories } from "@/lib/seed";
import { DonateButton } from "./Actions";
import { Missing } from "./Missing";
import { SampleTag } from "./Live";

export default function ProgramDetail({ slug }: { slug: string }) {
  const programs = useData("programs");
  const i = programs.findIndex(x => x.slug === slug);
  if (i < 0) return <Missing what="program" back="/programs" />;
  const p = programs[i];
  const cat = categories.find(c => c.id === p.cat)?.label ?? "";
  const next = programs[(i + 1) % programs.length];

  return (
    <>
      <section className="page-hero">
        {p.image && <img src={p.image} alt="" width={1024} height={683} />}
        <div className="wrap">
          <p className="crumbs"><Link href="/">Home</Link> / <Link href="/programs">Programs</Link> / {cat}</p>
          <h1>{p.name}</h1>
          <p>{p.summary}</p>
        </div>
      </section>

      <section className="block">
        <div className="wrap detail">
          <div>
            <p className="kicker">What students learn <SampleTag show={p.sample} /></p>
            <h2>Inside the program</h2>
            {p.learn.length > 0 && <ul className="learn">{p.learn.map(l => <li key={l}>{l}</li>)}</ul>}
            {p.outcome && <div className="outcome"><b>Where it leads</b>{p.outcome}</div>}
            {next.id !== p.id && (
              <p style={{ marginTop: 32 }}>
                <Link className="text-link" href={`/programs/${next.slug}`}>Next program: {next.name} →</Link>
              </p>
            )}
          </div>
          <aside className="side-card">
            <dl style={{ display: "grid", gap: 14 }}>
              <div><dt>Pathway</dt><dd>{cat}</dd></div>
              {p.length && <div><dt>Length</dt><dd>{p.length}</dd></div>}
            </dl>
            <Link className="btn blue" href={`/apply?program=${p.slug}`}>Apply for a grant</Link>
            <DonateButton className="btn line">Support this program</DonateButton>
          </aside>
        </div>
      </section>
    </>
  );
}
