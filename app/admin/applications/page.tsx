"use client";

import Manager, { type Row, fmtDateTime } from "@/components/admin/Manager";
import { grantName, programName } from "@/lib/application";
import { useData } from "@/lib/store";

const statuses = ["New", "In review", "Approved", "Declined"];
const isTeacher = (r: Row) => r.applicantType === "teacher";

export default function ApplicationsAdmin() {
  const programs = useData("programs");
  const prog = (v: string) => programName(v, programs);
  const ro = (key: string, label: string, show?: (r: Row) => React.ReactNode, half = true, hide?: (r: Row) => boolean) => ({ key, label, type: "readonly" as const, half, show, hide });
  const studentOnly = (r: Row) => isTeacher(r), teacherOnly = (r: Row) => !isTeacher(r);

  return (
    <Manager
      collection="applications" title="Aid applications" noun="applications" canCreate={false}
      intro="Submitted by students and teachers from the Apply for aid page. Open one to read it and set its status."
      search={r => `${r.firstName} ${r.lastName} ${r.email} ${r.id} ${r.school} ${r.program} ${r.position ?? ""}`}
      sort={(a, b) => b.submittedAt.localeCompare(a.submittedAt)}
      filters={[
        { label: "All", test: () => true },
        { label: "Students", test: r => !isTeacher(r) },
        { label: "Teachers", test: isTeacher },
        ...statuses.map(s => ({ label: s, test: (r: Row) => r.status === s })),
      ]}
      columns={[
        { label: "Submitted", get: r => fmtDateTime(r.submittedAt), csv: r => r.submittedAt },
        { label: "Applicant", get: r => <><b>{r.firstName} {r.lastName}</b><small>{isTeacher(r) ? "🍎 Teacher" : "🎓 Student"} · {r.email}</small></>, csv: r => `${r.firstName} ${r.lastName}` },
        { label: "Type", get: () => null, csv: r => (isTeacher(r) ? "Teacher" : "Student"), className: "hide" },
        { label: "Email", get: () => null, csv: r => r.email, className: "hide" },
        { label: "Program", get: r => prog(r.program), csv: r => prog(r.program) },
        { label: "Request", get: r => <>{grantName(r.grantType)}{r.amount && <small>${r.amount}</small>}</>, csv: r => grantName(r.grantType) },
        { label: "Amount", get: () => null, csv: r => r.amount, className: "hide" },
        { label: "Status", get: r => <span className={"status s-" + r.status.toLowerCase().replace(/\s/g, "")}>{r.status}</span>, csv: r => r.status },
        { label: "Confirmation", get: r => <code>{r.id}</code>, csv: r => r.id },
      ]}
      fields={[
        { key: "status", label: "Status", type: "select", required: true, half: true, options: statuses.map(s => ({ value: s, label: s })) },
        ro("id", "Confirmation"),
        { key: "adminNotes", label: "Internal notes", type: "textarea" },
        ro("applicantType", "Applying as", r => (isTeacher(r) ? "Teacher" : "Student")),
        ro("firstName", "Name", r => `${r.firstName} ${r.lastName}`),
        ro("email", "Email", r => <a href={`mailto:${r.email}`}>{r.email}</a>),
        ro("phone", "Phone"),
        ro("position", "Position", undefined, true, teacherOnly),
        ro("grade", "Grade", undefined, true, studentOnly),
        ro("school", "School"),
        ro("program", "Program", r => (isTeacher(r) ? prog(r.program) : `${prog(r.program)}${r.programYear ? ` (${r.programYear})` : ""}`)),
        ro("grantType", "Applying for", r => grantName(r.grantType)),
        ro("amount", "Amount", r => (r.amount ? "$" + r.amount : "Not specified")),
        ro("studentsImpacted", "Students it helps", undefined, true, teacherOnly),
        ro("purpose", "Pays for", undefined, false),
        ro("plans", "Plans", undefined, true, studentOnly),
        ro("freeLunch", "Free/reduced lunch", undefined, true, studentOnly),
        ro("instructorName", "Reference", r => `${r.instructorName} <${r.instructorEmail}>`),
        ro("guardianName", "Parent/guardian", r => (r.guardianName ? `${r.guardianName} <${r.guardianEmail}>` : "—"), true, studentOnly),
        ro("essay", "Statement", r => <div className="essay">{r.essay}</div>, false),
        ro("submittedAt", "Submitted", r => fmtDateTime(r.submittedAt)),
      ]}
    />
  );
}
