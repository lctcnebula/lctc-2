"use client";

import Link from "next/link";
import Manager from "@/components/admin/Manager";
import { categories } from "@/lib/seed";

export default function ProgramsAdmin() {
  const cat = (id: string) => categories.find(c => c.id === id)?.label ?? id;
  return (
    <Manager
      collection="programs" title="Programs" noun="programs" newLabel="New program"
      intro="Programs shown on the site and offered in the grant application."
      search={r => `${r.name} ${r.summary} ${cat(r.cat)}`}
      sort={(a, b) => a.name.localeCompare(b.name)}
      rowActions={r => <Link className="link-btn" href={`/programs/${r.slug}`} target="_blank">View ↗</Link>}
      columns={[
        { label: "Program", get: r => <><b>{r.icon} {r.name}</b><small>{r.summary}</small></>, csv: r => r.name },
        { label: "Pathway", get: r => cat(r.cat), csv: r => cat(r.cat) },
        { label: "Length", get: r => r.length, csv: r => r.length },
      ]}
      blank={() => ({ name: "", slug: "", cat: categories[0].id, icon: "", image: "", length: "", summary: "", learn: [], outcome: "" })}
      fields={[
        { key: "name", label: "Name", required: true },
        { key: "slug", label: "URL", type: "slug", from: "name" },
        { key: "cat", label: "Pathway", type: "select", required: true, half: true, options: categories.map(c => ({ value: c.id, label: c.label })) },
        { key: "icon", label: "Icon", half: true, help: "A single emoji or symbol." },
        { key: "length", label: "Length", half: true, help: "e.g. Two years" },
        { key: "summary", label: "Summary", type: "textarea", required: true },
        { key: "learn", label: "What students learn", type: "lines" },
        { key: "outcome", label: "Where it leads", type: "textarea" },
        { key: "image", label: "Image", type: "image" },
      ]}
    />
  );
}
