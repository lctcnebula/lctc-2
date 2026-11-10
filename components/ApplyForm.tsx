"use client";
import Icon from "@/components/Icon";

import { useEffect, useRef, useState } from "react";
import { insert, useData } from "@/lib/store";
import {
  emptyApplication, grades, grantName, isAdult, minWords, plansOptions, programYears, stepFields, toText, typesFor, validate, wordCount,
  type Applicant, type Application, type ApplicationInput, type Errors,
} from "@/lib/application";
import { useSite } from "./Providers";

const DRAFT_KEY = "lctc-grant-draft";
const STEPS = ["Who's applying", "About you", "Your request", "Your story", "Review"];
const LAST = STEPS.length - 1;

const who: { id: Applicant; icon: string; name: string; text: string }[] = [
  { id: "student", icon: "🎓", name: "I'm a student", text: "Scholarships, tools, certification fees, program fees or emergency help for you." },
  { id: "teacher", icon: "🍎", name: "I'm a teacher", text: "Equipment, materials, training or experiences for your program and your students." },
];

export default function ApplyForm() {
  const [a, setA] = useState<ApplicationInput>(emptyApplication);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState<Application | null>(null);
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState("");
  const loaded = useRef(false);
  const top = useRef<HTMLDivElement>(null);
  const { getConfetti, say } = useSite();
  const programs = useData("programs");
  const schools = useData("settings").schools;

  // Restore a saved draft (and ?program= / ?as=teacher from links), then keep saving as the applicant types.
  useEffect(() => {
    let draft: Partial<ApplicationInput> = {};
    try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}"); } catch {}
    const q = new URLSearchParams(location.search);
    const slug = q.get("program"), as = q.get("as");
    const prog = programs.find(p => p.slug === slug);
    setA(prev => ({
      ...prev, ...draft,
      ...(prog ? { program: prog.name } : draft.program ? { program: programs.find(p => p.slug === draft.program)?.name ?? draft.program } : {}),
      ...(as === "teacher" || as === "student" ? { applicantType: as } : {}),
    }));
    loaded.current = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!loaded.current || done) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(a)); } catch {}
  }, [a, done]);

  const set = <K extends keyof ApplicationInput>(k: K, v: ApplicationInput[K]) => {
    setA(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }));
  };

  // Switching between student and teacher clears the answers that only made sense for the other.
  function pickType(t: Applicant) {
    if (a.applicantType === t) return;
    setA(p => ({ ...p, applicantType: t, grantType: "", grade: "", position: "", programYear: "", plans: "", studentsImpacted: "", freeLunch: "", guardianName: "", guardianEmail: "" }));
    setErrors({});
  }

  function goTo(n: number) {
    setStep(n);
    setAlert("");
    top.current?.scrollIntoView({ block: "start" });
  }

  function next() {
    const e = validate(a, stepFields[step]);
    setErrors(e);
    const first = stepFields[step].find(k => e[k]);
    if (first) { document.getElementById("f-" + first)?.focus(); return; }
    goTo(step + 1);
  }

  async function submit() {
    const e = validate(a);
    setErrors(e);
    const bad = stepFields.findIndex(fs => fs.some(k => e[k]));
    if (bad >= 0) { if (bad !== step) goTo(bad); return; }
    const app: Application = { ...a, id: "LCTC-G-" + Math.random().toString(36).slice(2, 8).toUpperCase(), submittedAt: new Date().toISOString() };
    setBusy(true); setAlert("");
    try {
      // Goes straight to Admin → Applications.
      await insert("applications", { ...app, status: "New" });
    } catch (x) {
      setAlert((x as Error).message + " Your answers are still here.");
      return;
    } finally { setBusy(false); }
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setDone(app);
    top.current?.scrollIntoView({ block: "start" });
    const fx = await getConfetti();
    fx?.({ particleCount: 140, spread: 90, origin: { y: .4 }, colors: ["#015998", "#ff8a3d", "#5fa8e0", "#ffffff"] });
  }

  function download(app: Application) {
    const url = URL.createObjectURL(new Blob([toText(app, programs)], { type: "text/plain" }));
    Object.assign(document.createElement("a"), { href: url, download: `${app.id}.txt` }).click();
    URL.revokeObjectURL(url);
  }

  function startOver() {
    setA(emptyApplication); setDone(null); setStep(0); setErrors({});
  }

  const err = (k: keyof ApplicationInput) => <p className="err" id={"e-" + k}>{errors[k]}</p>;
  const inv = (k: keyof ApplicationInput) => ({ id: "f-" + k, "aria-invalid": errors[k] ? true : undefined, "aria-describedby": "e-" + k });
  // Every answer is typed; where there are common answers they're offered as suggestions while typing.
  const text = (k: keyof ApplicationInput, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, optional = false, suggest?: string[]) => (
    <div className="field">
      <label htmlFor={"f-" + k}>{label} {optional && <span className="opt">(optional)</span>}</label>
      <input type="text" value={a[k] as string} onChange={e => set(k, e.target.value)} {...inv(k)} {...(suggest && { list: "l-" + k, autoComplete: "off" })} {...props} />
      {suggest && <datalist id={"l-" + k}>{suggest.map(o => <option key={o} value={o} />)}</datalist>}
      {err(k)}
    </div>
  );

  const teacher = a.applicantType === "teacher";
  const minor = !teacher && !isAdult(a.grade);
  const words = wordCount(a.essay), need = minWords(a);
  const types = typesFor(a);
  const programNames = programs.map(p => p.name);

  if (done) {
    return (
      <div className="form-card done-box" ref={top} aria-live="polite">
        <svg className="check" viewBox="0 0 84 84" aria-hidden="true"><circle cx="42" cy="42" r="36" /><path d="m28 43 10 10 18-20" /></svg>
        <p className="pill-ok">Application received</p>
        <h2 className="form-title">Thank you, {done.firstName}!</h2>
        <p className="form-sub" style={{ marginBottom: 0 }}>Your application for <b>{grantName(done.grantType).toLowerCase()}</b> has been sent to the Foundation. Your confirmation number:</p>
        <p className="conf-id">{done.id}</p>
        <p className="form-sub">Keep this number for your records. The Foundation reviews every application and will email you with a decision. You can download or print a copy below.</p>
        <div className="done-actions">
          <button className="btn blue" type="button" onClick={() => download(done)}>Download a copy</button>
          <button className="btn line" type="button" onClick={() => window.print()}>Print</button>
        </div>
        <p style={{ marginTop: 18 }}><button className="back" type="button" onClick={startOver}>Start another application</button></p>
      </div>
    );
  }

  return (
    <div className="form-card" ref={top} style={{ scrollMarginTop: 120 }}>
      <ol className="stepper five">
        {STEPS.map((s, k) => <li key={s} className={k === step ? "on" : k < step ? "done" : ""} aria-current={k === step ? "step" : undefined}>{s}</li>)}
      </ol>

      <form noValidate onSubmit={e => { e.preventDefault(); if (step < LAST) next(); else submit(); }}>

        {step === 0 && (
          <section>
            <h2 className="form-title">Who&apos;s applying?</h2>
            <p className="form-sub">Students and teachers can both ask the Foundation for support. The questions that follow depend on your answer.</p>
            <fieldset>
              <legend className="sr-only">I am applying as</legend>
              <div className="choice-grid who" id="f-applicantType" tabIndex={-1} aria-describedby="e-applicantType">
                {who.map(w => (
                  <label className="choice" key={w.id}>
                    <input type="radio" name="applicantType" value={w.id} checked={a.applicantType === w.id} onChange={() => pickType(w.id)} />
                    <i aria-hidden="true"><Icon name={w.icon} /></i>
                    <div><b>{w.name}</b><span>{w.text}</span></div>
                  </label>
                ))}
              </div>
              {err("applicantType")}
            </fieldset>
          </section>
        )}

        {step === 1 && (
          <section>
            <h2 className="form-title">About you</h2>
            <p className="form-sub">{teacher ? "Tell us who you are and what you teach." : "Tell us who you are and where you train."}</p>
            <div className="row2">
              {text("firstName", "First name", { autoComplete: "given-name" })}
              {text("lastName", "Last name", { autoComplete: "family-name" })}
            </div>
            <div className="row2">
              {text("email", teacher ? "School email" : "Email", { type: "email", autoComplete: "email" })}
              {text("phone", "Phone", { type: "tel", autoComplete: "tel", inputMode: "tel" }, true)}
            </div>
            {teacher ? <>
              <div className="row2">
                {text("position", "Your position", { placeholder: "e.g. Welding instructor" })}
                {text("school", "School or campus", { placeholder: "e.g. Lake County Tech Campus" }, false, ["Lake County Tech Campus", ...schools])}
              </div>
              {text("program", "Program you teach", { placeholder: "e.g. Culinary Arts" }, false, programNames)}
            </> : <>
              <div className="row2">
                {text("grade", "Grade", { placeholder: "e.g. Senior (12th)" }, false, grades)}
                {text("school", "Home high school", { placeholder: "e.g. Grayslake Central" }, false, schools)}
              </div>
              <div className="row2">
                {text("program", "Tech Campus program", { placeholder: "e.g. Welding & Fabrication" }, false, programNames)}
                {text("programYear", "Year in program", { placeholder: "e.g. First year" }, false, programYears)}
              </div>
            </>}
          </section>
        )}

        {step === 2 && (
          <section>
            <h2 className="form-title">Your request</h2>
            <p className="form-sub">{teacher ? "What would help your program? Pick the closest one and explain below." : "Choose the kind of help you need. Not sure? Pick the closest one and explain below."}</p>
            <fieldset>
              <legend>I&apos;m applying for</legend>
              <div className="choice-grid" id="f-grantType" tabIndex={-1} aria-describedby="e-grantType">
                {types.map(g => (
                  <label className="choice" key={g.id}>
                    <input type="radio" name="grantType" value={g.id} checked={a.grantType === g.id} onChange={() => set("grantType", g.id)} />
                    <i aria-hidden="true"><Icon name={g.icon} /></i>
                    <div><b>{g.name}</b><span>{g.text}</span></div>
                  </label>
                ))}
              </div>
              {err("grantType")}
            </fieldset>
            <div className="row2">
              {text("amount", "Amount needed", { inputMode: "decimal", placeholder: "$" }, true)}
              {teacher
                ? text("studentsImpacted", "Students it will help", { inputMode: "numeric", placeholder: "e.g. 24" }, true)
                : text("plans", "Plans after Tech Campus", { placeholder: "e.g. Apprenticeship" }, false, plansOptions)}
            </div>
            <div className="field">
              <label htmlFor="f-purpose">What would this pay for?</label>
              <textarea rows={3} value={a.purpose} onChange={e => set("purpose", e.target.value)} {...inv("purpose")}
                placeholder={teacher ? "For example: two MIG welders so every student gets bench time each class." : "For example: my CNA state exam fee and scrubs for clinicals."} />
              {err("purpose")}
            </div>
            {!teacher && (
              <fieldset>
                <legend>Do you qualify for free or reduced-price lunch? <span className="opt" style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500 }}>(optional, helps us prioritize need)</span></legend>
                <div className="seg" style={{ gridTemplateColumns: "repeat(3, 1fr)", maxWidth: 420 }}>
                  {["Yes", "No", "Prefer not to say"].map(v => (
                    <button key={v} type="button" aria-pressed={a.freeLunch === v} onClick={() => set("freeLunch", a.freeLunch === v ? "" : v)}>{v}</button>
                  ))}
                </div>
              </fieldset>
            )}
          </section>
        )}

        {step === 3 && (
          <section>
            <h2 className="form-title">{teacher ? "The difference it makes" : "Your story"}</h2>
            <p className="form-sub">{teacher ? "Help the committee see what this would change, and tell us who can confirm the request." : "Help the committee get to know you, and tell us who can vouch for your work."}</p>
            <div className="field">
              <label htmlFor="f-essay">{teacher ? "How will this help your students, and what happens without it?" : "Why did you choose your program, and what will this support help you do next?"}</label>
              <textarea rows={8} value={a.essay} onChange={e => set("essay", e.target.value)} {...inv("essay")} />
              <p className={"hint" + (words >= need ? " ok" : "")}>{words} / {need} words minimum{words >= need ? " ✓" : ""}</p>
              {err("essay")}
            </div>
            <div className="row2">
              {text("instructorName", teacher ? "Supervisor or administrator" : "Tech Campus instructor")}
              {text("instructorEmail", teacher ? "Their email" : "Instructor email", { type: "email" })}
            </div>
            {minor && (
              <div className="row2">
                {text("guardianName", "Parent or guardian name", { autoComplete: "off" })}
                {text("guardianEmail", "Parent or guardian email", { type: "email", autoComplete: "off" })}
              </div>
            )}
          </section>
        )}

        {step === 4 && (
          <section>
            <h2 className="form-title">Review &amp; submit</h2>
            <p className="form-sub">Check everything over. You can edit any section.</p>
            {alert && <p className="form-alert" role="alert">{alert}</p>}
            <Review title="Applying as" onEdit={() => goTo(0)} rows={[["Applicant", teacher ? "Teacher" : "Student"]]} />
            <Review title="About you" onEdit={() => goTo(1)} rows={[
              ["Name", `${a.firstName} ${a.lastName}`], ["Email", a.email], ["Phone", a.phone || "—"],
              ...(teacher
                ? [["Position", a.position], ["School / campus", a.school], ["Program taught", a.program]] as [string, string][]
                : [["Grade", a.grade], ["High school", a.school], ["Program", `${a.program} · ${a.programYear}`]] as [string, string][]),
            ]} />
            <Review title="Your request" onEdit={() => goTo(2)} rows={[
              ["Applying for", grantName(a.grantType)], ["Amount", a.amount ? "$" + a.amount.replace(/^\$/, "") : "Not specified"],
              ["Pays for", a.purpose],
              ...(teacher ? [["Students helped", a.studentsImpacted || "—"]] as [string, string][] : [["Plans", a.plans], ["Free/reduced lunch", a.freeLunch || "—"]] as [string, string][]),
            ]} />
            <Review title={teacher ? "The difference it makes" : "Your story"} onEdit={() => goTo(3)} rows={[
              [teacher ? "Statement" : "Essay", `${words} words`], [teacher ? "Supervisor" : "Instructor", `${a.instructorName} (${a.instructorEmail})`],
              ...(minor ? [["Parent/guardian", `${a.guardianName} (${a.guardianEmail})`] as [string, string]] : []),
            ]} />
            <label className="check-row">
              <input type="checkbox" checked={a.certify} onChange={e => set("certify", e.target.checked)} {...inv("certify")} />
              <span>I certify that the information in this application is true and complete.</span>
            </label>
            {err("certify")}
            <label className="check-row">
              <input type="checkbox" checked={a.consent} onChange={e => set("consent", e.target.checked)} {...inv("consent")} />
              <span>{teacher
                ? "The Foundation may contact my supervisor to confirm this request."
                : <>The Foundation may contact my instructor{minor ? " and parent/guardian" : ""} and confirm my enrollment with Tech Campus.</>}</span>
            </label>
            {err("consent")}
          </section>
        )}

        <div className="form-nav">
          {step > 0 ? <button className="btn line" type="button" onClick={() => goTo(step - 1)}><Icon name="←" /> Back</button> : <span className="hint" style={{ alignSelf: "center" }}>Your progress saves on this device.</span>}
          <button className="btn blue" type="submit" disabled={busy}>{step < LAST ? "Continue →" : busy ? "Sending…" : "Submit application"}</button>
        </div>
      </form>
    </div>
  );
}

function Review({ title, rows, onEdit }: { title: string; rows: [string, string][]; onEdit: () => void }) {
  return (
    <div className="review">
      <h3>{title}<button type="button" onClick={onEdit}>Edit</button></h3>
      <dl>{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
    </div>
  );
}
