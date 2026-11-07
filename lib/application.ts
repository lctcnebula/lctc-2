import { grantTypes, teacherGrantTypes } from "./content";

// Validation and formatting for the Foundation aid application. Students and teachers both apply
// here; the first step asks which, and the fields that follow change to match.

export type Applicant = "student" | "teacher";

export type ApplicationInput = {
  applicantType: Applicant | "";
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  // Students: grade and home high school. Teachers: their position, and school / campus.
  grade: string;
  school: string;
  position: string;
  // Students: the program they're in. Teachers: the program they teach.
  program: string;
  programYear: string;
  grantType: string;
  amount: string;
  purpose: string;
  plans: string;
  studentsImpacted: string;
  freeLunch: string;
  essay: string;
  // Students: an instructor reference. Teachers: a supervisor / administrator who can confirm the request.
  instructorName: string;
  instructorEmail: string;
  guardianName: string;
  guardianEmail: string;
  certify: boolean;
  consent: boolean;
};

export type Application = ApplicationInput & { id: string; submittedAt: string };

export const emptyApplication: ApplicationInput = {
  applicantType: "", firstName: "", lastName: "", email: "", phone: "", grade: "", school: "", position: "", program: "", programYear: "",
  grantType: "", amount: "", purpose: "", plans: "", studentsImpacted: "", freeLunch: "",
  essay: "", instructorName: "", instructorEmail: "", guardianName: "", guardianEmail: "",
  certify: false, consent: false,
};

// Suggestions shown under the text fields (anything can still be typed).
export const grades = ["Junior (11th)", "Senior (12th)", "Adult learner"];
export const programYears = ["First year", "Second year"];
export const plansOptions = ["Two-year college", "Four-year college", "Apprenticeship", "Straight into the workforce", "Military", "Not sure yet"];
export const ESSAY_MIN_WORDS = 75;
export const TEACHER_ESSAY_MIN_WORDS = 50;

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const wordCount = (s: string) => (s.trim().match(/\S+/g) || []).length;
export const isAdult = (grade: string) => /adult/i.test(grade);
export const typesFor = (a: Pick<ApplicationInput, "applicantType">) => a.applicantType === "teacher" ? teacherGrantTypes : grantTypes;
export const minWords = (a: Pick<ApplicationInput, "applicantType">) => a.applicantType === "teacher" ? TEACHER_ESSAY_MIN_WORDS : ESSAY_MIN_WORDS;

export type Errors = Partial<Record<keyof ApplicationInput, string>>;

export const stepFields: (keyof ApplicationInput)[][] = [
  ["applicantType"],
  ["firstName", "lastName", "email", "phone", "grade", "school", "position", "program", "programYear"],
  ["grantType", "amount", "purpose", "plans", "studentsImpacted"],
  ["essay", "instructorName", "instructorEmail", "guardianName", "guardianEmail"],
  ["certify", "consent"],
];

export function validate(a: ApplicationInput, fields?: (keyof ApplicationInput)[]): Errors {
  const e: Errors = {};
  const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const teacher = a.applicantType === "teacher";
  if (a.applicantType !== "student" && !teacher) e.applicantType = "Choose whether you're a student or a teacher.";
  if (s(a.firstName).length < 1) e.firstName = "Enter your first name.";
  if (s(a.lastName).length < 1) e.lastName = "Enter your last name.";
  if (!emailRe.test(s(a.email))) e.email = "Enter a valid email address.";
  if (s(a.phone) && s(a.phone).replace(/\D/g, "").length < 10) e.phone = "Enter a 10-digit phone number.";
  if (s(a.program).length < 2) e.program = teacher ? "Enter the program you teach." : "Enter your Tech Campus program.";
  if (s(a.school).length < 2) e.school = teacher ? "Enter your school or campus." : "Enter your home high school.";
  if (teacher) {
    if (s(a.position).length < 2) e.position = "Enter your position, e.g. Welding instructor.";
  } else {
    if (s(a.grade).length < 2) e.grade = "Enter your grade, e.g. Senior (12th).";
    if (s(a.programYear).length < 2) e.programYear = "Enter your year in the program, e.g. First year.";
    if (s(a.plans).length < 2) e.plans = "Tell us your plans after Tech Campus.";
  }
  if (!typesFor(a).some(g => g.id === a.grantType)) e.grantType = "Choose what you're applying for.";
  if (s(a.amount)) {
    const n = Number(s(a.amount).replace(/[$,]/g, ""));
    if (!(n > 0)) e.amount = "Enter a dollar amount, or leave it blank.";
  }
  if (s(a.purpose).length < 15) e.purpose = "Tell us briefly what this would pay for.";
  if (teacher && s(a.studentsImpacted) && !(Number(s(a.studentsImpacted)) > 0)) e.studentsImpacted = "Enter a number, or leave it blank.";
  if (wordCount(s(a.essay)) < minWords(a)) e.essay = `Write at least ${minWords(a)} words.`;
  const ref = teacher ? "supervisor or administrator" : "Tech Campus instructor";
  if (s(a.instructorName).length < 2) e.instructorName = `Name a ${ref} who can vouch for this.`;
  if (!emailRe.test(s(a.instructorEmail))) e.instructorEmail = `Enter your ${teacher ? "supervisor's" : "instructor's"} email.`;
  if (!teacher && !isAdult(a.grade)) {
    if (s(a.guardianName).length < 2) e.guardianName = "Enter a parent or guardian's name.";
    if (!emailRe.test(s(a.guardianEmail))) e.guardianEmail = "Enter a parent or guardian's email.";
  }
  if (a.certify !== true) e.certify = "Please confirm your information is accurate.";
  if (a.consent !== true) e.consent = "Please agree so we can contact your references.";
  if (!fields) return e;
  return Object.fromEntries(Object.entries(e).filter(([k]) => fields.includes(k as keyof ApplicationInput)));
}

/** Older applications stored a program slug; newer ones store what the applicant typed. */
export const programName = (v: string, programs: { slug: string; name: string }[] = []) => programs.find(p => p.slug === v)?.name ?? v;
export const grantName = (id: string) => [...grantTypes, ...teacherGrantTypes].find(g => g.id === id)?.name ?? id;

// Plain-text version of a finished application, used for the downloadable copy.
export function toText(a: Application, programs: { slug: string; name: string }[] = []) {
  const teacher = a.applicantType === "teacher";
  const lines: [string, string][] = [
    ["Confirmation", a.id],
    ["Submitted", new Date(a.submittedAt).toLocaleString("en-US")],
    ["Applying as", teacher ? "Teacher" : "Student"],
    ["Name", `${a.firstName} ${a.lastName}`],
    ["Email", a.email],
    ["Phone", a.phone || "-"],
    ...(teacher
      ? [["Position", a.position], ["School / campus", a.school], ["Program taught", programName(a.program, programs)]] as [string, string][]
      : [["Grade", a.grade], ["High school", a.school], ["Program", `${programName(a.program, programs)} (${a.programYear})`]] as [string, string][]),
    ["Applying for", grantName(a.grantType)],
    ["Amount", a.amount ? "$" + a.amount.replace(/^\$/, "") : "Not specified"],
    ["Pays for", a.purpose],
    ...(teacher ? [["Students helped", a.studentsImpacted || "-"]] as [string, string][] : [["Plans", a.plans], ["Free/reduced lunch", a.freeLunch || "-"]] as [string, string][]),
    [teacher ? "Supervisor" : "Instructor", `${a.instructorName} <${a.instructorEmail}>`],
  ];
  if (a.guardianName) lines.push(["Parent/guardian", `${a.guardianName} <${a.guardianEmail}>`]);
  return "LCTC FOUNDATION AID APPLICATION\n\n" + lines.map(([k, v]) => `${k}: ${v}`).join("\n") + "\n\n" + (teacher ? "HOW THIS HELPS STUDENTS" : "ESSAY") + "\n" + a.essay.trim() + "\n";
}
