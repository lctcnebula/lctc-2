"use client";

import Manager, { type Row, fmtDateTime } from "@/components/admin/Manager";
import { grantTypes } from "@/lib/content";
import { useData } from "@/lib/store";

const statuses = ["New", "In review", "Approved", "Declined"];

export default function ApplicationsAdmin() {
  const programs = useData("programs");
  const prog = (slug: string) => programs.find(p => p.slug === slug)?.name ?? slug;
  const grant = (id: string) => grantTypes.find(g => g.id === id)?.name ?? id;
  const ro = (key: string, label: string, show?: (r: Record<string, string>) => React.ReactNode, half = true) => ({ key, label, type: "readonly" as const, half, show });

  return (
    <Manager
      collection="applications" title="Grant applications" noun="applications" canCreate={false}
      intro="Submitted from the Apply for aid page. Open one to read it and set its status."
      search={r => `${r.firstName} ${r.lastName} ${r.email} ${r.id} ${r.school}`}
      sort={(a, b) => b.submittedAt.localeCompare(a.submittedAt)}
      filters={[{ label: "All", test: () => true }, ...statuses.map(s => ({ label: s, test: (r: Row) => r.status === s }))]}
      columns={[
        { label: "Submitted", get: r => fmtDateTime(r.submittedAt), csv: r => r.submittedAt },
        { label: "Student", get: r => <><b>{r.firstName} {r.lastName}</b><small>{r.email}</small></>, csv: r => `${r.firstName} ${r.lastName}` },
        { label: "Email", get: () => null, csv: r => r.email, className: "hide" },
        { label: "Program", get: r => prog(r.program), csv: r => prog(r.program) },
        { label: "Request", get: r => <>{grant(r.grantType)}{r.amount && <small>${r.amount}</small>}</>, csv: r => grant(r.grantType) },
        { label: "Amount", get: () => null, csv: r => r.amount, className: "hide" },
        { label: "Status", get: r => <span className={"status s-" + r.status.toLowerCase().replace(/\s/g, "")}>{r.status}</span>, csv: r => r.status },
        { label: "Confirmation", get: r => <code>{r.id}</code>, csv: r => r.id },
      ]}
      fields={[
        { key: "status", label: "Status", type: "select", required: true, half: true, options: statuses.map(s => ({ value: s, label: s })) },
        ro("id", "Confirmation"),
        { key: "adminNotes", label: "Internal notes", type: "textarea" },
        ro("firstName", "Name", r => `${r.firstName} ${r.lastName}`),
        ro("email", "Email", r => <a href={`mailto:${r.email}`}>{r.email}</a>),
        ro("phone", "Phone"),
        ro("grade", "Grade"),
        ro("school", "High school"),
        ro("program", "Program", r => `${prog(r.program)} (${r.programYear})`),
        ro("grantType", "Applying for", r => grant(r.grantType)),
        ro("amount", "Amount", r => (r.amount ? "$" + r.amount : "Not specified")),
        ro("purpose", "Pays for", undefined, false),
        ro("plans", "Plans"),
        ro("freeLunch", "Free/reduced lunch"),
        ro("instructorName", "Instructor", r => `${r.instructorName} <${r.instructorEmail}>`),
        ro("guardianName", "Parent/guardian", r => (r.guardianName ? `${r.guardianName} <${r.guardianEmail}>` : "—")),
        ro("essay", "Essay", r => <div className="essay">{r.essay}</div>, false),
        ro("submittedAt", "Submitted", r => fmtDateTime(r.submittedAt)),
      ]}
    />
  );
}
