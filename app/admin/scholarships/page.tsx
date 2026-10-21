"use client";

import Manager from "@/components/admin/Manager";

export default function ScholarshipsAdmin() {
  return (
    <Manager
      collection="scholarships" title="Outside scholarships" noun="scholarships" newLabel="Add scholarship"
      intro="Scholarships from other organizations, listed on the Apply page. The section is hidden while this list is empty."
      search={r => `${r.name} ${r.who}`}
      columns={[
        { label: "Name", get: r => <><b>{r.name}</b><small>{r.who}</small></>, csv: r => r.name },
        { label: "Award", get: r => r.award, csv: r => r.award },
        { label: "Link", get: r => r.url ? <a href={r.url} target="_blank" rel="noopener" onClick={e => e.stopPropagation()}>Open ↗</a> : "—", csv: r => r.url },
      ]}
      blank={() => ({ name: "", who: "", award: "", how: "Apply online", url: "" })}
      fields={[
        { key: "name", label: "Name", required: true },
        { key: "who", label: "Who can apply", required: true },
        { key: "award", label: "Award", half: true },
        { key: "how", label: "Button text", half: true },
        { key: "url", label: "Link", required: true },
      ]}
    />
  );
}
