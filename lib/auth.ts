"use client";

// Sign-in for the site. Passwords are checked on the server, which keeps the session in an
// httpOnly cookie; this file just asks the server who is signed in and tells pages when it changes.

import { useSyncExternalStore } from "react";
import { refresh } from "./store";
import type { Role, User } from "./seed";

export { can, isStaff, roleLabels, type Section } from "./roles";

type Session = { user: User | null };
let session: Session | undefined;
let started = false;
const listeners = new Set<() => void>();

function set(user: User | null) {
  session = { user };
  listeners.forEach(l => l());
}

async function loadMe() {
  try {
    const r = await fetch("/api/auth/me", { cache: "no-store" });
    set(r.ok ? (await r.json()).user : null);
  } catch { set(null); }
}

function subscribe(l: () => void) {
  if (!started) { started = true; loadMe(); }
  listeners.add(l);
  return () => { listeners.delete(l); };
}

/** The signed-in user, or null. `ready` is false until the server has answered. */
export function useUser(): { user: User | null; ready: boolean } {
  const s = useSyncExternalStore(subscribe, () => session, () => undefined);
  return s ? { user: s.user, ready: true } : { user: null, ready: false };
}

export const demoAccounts: { email: string; role: Role; what: string }[] = [
  { email: "superadmin@lctc.demo", role: "superadmin", what: "Everything, plus managing staff accounts" },
  { email: "admin@lctc.demo", role: "admin", what: "All content and all submissions" },
  { email: "accountant@lctc.demo", role: "accountant", what: "Donations and yearly reports only" },
  { email: "member@lctc.demo", role: "user", what: "Public account: RSVPs and giving history" },
];
export const DEMO_PASSWORD = "demo1234";

async function post(path: string, body: object) {
  const r = await fetch("/api/auth/" + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Something went wrong. Please try again.");
  return j as { user: User };
}

export async function signIn(email: string, password: string) {
  const { user } = await post("login", { email, password });
  set(user);
  await refresh(true);
  return user;
}

export async function register(name: string, email: string, password: string) {
  const { user } = await post("register", { name, email, password });
  set(user);
  await refresh(true);
  return user;
}

export async function signOut() {
  await post("logout", {}).catch(() => {});
  set(null);
  await refresh(true);
}
