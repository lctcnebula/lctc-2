"use client";

import Manager from "@/components/admin/Manager";
import { useData } from "@/lib/store";

export default function BoardAdmin() {
  const n = useData("board").length;
  return (
    <Manager
      collection="board" title="Board members" noun="members" newLabel="Add member"
      intro={<>Shown on the <a href="/board" target="_blank">Board page</a>, in order.</>}
      search={r => `${r.name} ${r.role}`}
      sort={(a, b) => a.order - b.order}
      columns={[
        { label: "#", get: r => r.order, csv: r => r.order, className: "num" },
        { label: "Name", get: r => <b>{r.name}</b>, csv: r => r.name },
        { label: "Role", get: r => r.role, csv: r => r.role },
      ]}
      blank={() => ({ name: "", role: "Board Member", bio: "", photo: "", order: n + 1 })}
      fields={[
        { key: "name", label: "Name", required: true, half: true },
        { key: "role", label: "Role", required: true, half: true },
        { key: "order", label: "Order", type: "number", half: true, help: "Lower numbers show first." },
        { key: "bio", label: "Short bio", type: "textarea" },
        { key: "photo", label: "Photo", type: "image" },
      ]}
    />
  );
}
