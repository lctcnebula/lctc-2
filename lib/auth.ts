"use client";

// Demo login with four access levels. Front-end only: accounts and the session live in this
// browser, so this keeps honest people on the right screens but is not real security.
// Swap for a real auth provider before storing anything sensitive.

import { useSyncExternalStore } from "react";
import { getAll, insert, now, useData } from "./store";
import type { Role, User } from "./seed";

const SESSION = "lctc-session";
const listeners = new Set<() => void>();

export const roleLabels: Record<Role, string> = { superadmin: "Super admin", admin: "Admin", accountant: "Accountant", user: "Member" };

export type Section =
  | "dashboard" | "donations" | "applications" | "messages" | "rsvps" | "subscribers"
  | "events" | "blog" | "programs" | "board" | "alumni" | "reports" | "scholarships" | "users" | "settings";

const access: Record<Role, Section[] | "all"> = {
  superadmin: "all",
  admin: ["dashboard", "donations", "applications", "messages", "rsvps", "subscribers", "events", "blog", "programs", "board", "alumni", "reports", "scholarships", "settings"],
  accountant: ["dashboard", "donations", "reports"],
  user: [],
};

export const can = (role: Role | undefined, s: Section) => !!role && (access[role] === "all" || (access[role] as Section[]).includes(s));
export const isStaff = (role: Role | undefined) => can(role, "dashboard");

export const demoAccounts: { email: string; role: Role; what: string }[] = [
  { email: "superadmin@lctc.demo", role: "superadmin", what: "Everything, plus managing staff accounts" },
  { email: "admin@lctc.demo", role: "admin", what: "All content and all submissions" },
  { email: "accountant@lctc.demo", role: "accountant", what: "Donations and yearly reports only" },
  { email: "member@lctc.demo", role: "user", what: "Public account: RSVPs and giving history" },
];
export const DEMO_PASSWORD = "demo1234";

export async function hash(email: string, password: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email.trim().toLowerCase() + ":" + password));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function readSession() {
  try { return localStorage.getItem(SESSION); } catch { return null; }
}
function setSession(id: string | null) {
  try { id ? localStorage.setItem(SESSION, id) : localStorage.removeItem(SESSION); } catch {}
  listeners.forEach(l => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => { if (e.key === SESSION) l(); };
  addEventListener("storage", onStorage);
  return () => { listeners.delete(l); removeEventListener("storage", onStorage); };
}

/** The signed-in user, or null. `ready` is false during server render and hydration. */
export function useUser(): { user: User | null; ready: boolean } {
  const id = useSyncExternalStore(subscribe, readSession, () => undefined as unknown as string | null);
  const users = useData("users");
  if (id === undefined) return { user: null, ready: false };
  return { user: users.find(u => u.id === id) ?? null, ready: true };
}

export async function signIn(email: string, password: string) {
  const e = email.trim().toLowerCase();
  const u = getAll("users").find(x => x.email.toLowerCase() === e);
  if (!u || u.pass !== await hash(e, password)) throw new Error("That email and password don't match.");
  setSession(u.id);
  return u;
}

export async function register(name: string, email: string, password: string) {
  const e = email.trim().toLowerCase();
  if (getAll("users").some(x => x.email.toLowerCase() === e)) throw new Error("An account with that email already exists. Try signing in.");
  const u = insert("users", { name: name.trim(), email: e, role: "user", pass: await hash(e, password), createdAt: now() });
  setSession(u.id);
  return u;
}

export const signOut = () => setSession(null);
