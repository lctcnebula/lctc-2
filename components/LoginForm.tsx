"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DEMO_PASSWORD, demoAccounts, isStaff, register, roleLabels, signIn, useUser } from "@/lib/auth";

export default function LoginForm() {
  const router = useRouter();
  const { user, ready } = useUser();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const home = (role: string | undefined) => isStaff(role as never) ? "/admin" : "/account";
  useEffect(() => { if (ready && user) router.replace(home(user.role)); }, [ready, user, router]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (mode === "up" && f.name.trim().length < 2) return setErr("Please enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) return setErr("Please enter a valid email address.");
    if (f.password.length < (mode === "up" ? 8 : 1)) return setErr(mode === "up" ? "Use at least 8 characters for your password." : "Enter your password.");
    setBusy(true);
    try {
      const u = mode === "in" ? await signIn(f.email, f.password) : await register(f.name, f.email, f.password);
      router.replace(home(u.role));
    } catch (x) { setErr((x as Error).message); }
    finally { setBusy(false); }
  }

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="login-grid">
      <form className="form-card" onSubmit={send} noValidate>
        <div className="seg" role="group" aria-label="Sign in or create an account">
          <button type="button" aria-pressed={mode === "in"} onClick={() => { setMode("in"); setErr(""); }}>Sign in</button>
          <button type="button" aria-pressed={mode === "up"} onClick={() => { setMode("up"); setErr(""); }}>Create account</button>
        </div>
        <h1 className="form-title">{mode === "in" ? "Welcome back" : "Join the Foundation"}</h1>
        <p className="form-sub">{mode === "in" ? "Staff and members sign in here." : "A free account fills in your RSVPs and keeps your giving history in one place."}</p>
        {err && <p className="form-alert" role="alert">{err}</p>}
        {mode === "up" && <div className="field"><label htmlFor="l-name">Name</label><input id="l-name" value={f.name} onChange={set("name")} autoComplete="name" /></div>}
        <div className="field"><label htmlFor="l-email">Email</label><input id="l-email" type="email" value={f.email} onChange={set("email")} autoComplete="email" /></div>
        <div className="field"><label htmlFor="l-pass">Password</label><input id="l-pass" type="password" value={f.password} onChange={set("password")} autoComplete={mode === "in" ? "current-password" : "new-password"} /></div>
        <button className="btn blue" type="submit" disabled={busy} style={{ width: "100%" }}>{mode === "in" ? "Sign in" : "Create account"}</button>
        <p className="hint" style={{ marginTop: 14, textAlign: "center" }}><Link href="/">← Back to the site</Link></p>
      </form>

      <aside className="aside-box demo-box">
        <h2>Demo accounts</h2>
        <p className="hint">One for each access level. Password for all: <code>{DEMO_PASSWORD}</code>. Click one to fill the form.</p>
        <ul>
          {demoAccounts.map(a => (
            <li key={a.email}>
              <button type="button" onClick={() => { setMode("in"); setErr(""); setF({ name: "", email: a.email, password: DEMO_PASSWORD }); }}>
                <b>{roleLabels[a.role]}</b>
                <span>{a.email}</span>
                <small>{a.what}</small>
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
