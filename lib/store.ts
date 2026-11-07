"use client";

// The browser's view of the site database (see lib/server/db.ts and app/api/db).
// Pages read with useData() and write with insert / update / remove. Changes show instantly here,
// are saved on the server, and reach every other open browser within a few seconds.

import { useSyncExternalStore } from "react";
import { seed, type CollectionKey, type DB, type FoundationEvent } from "./seed";

// Visitors never get these from the server unless signed in with the right role, so the
// server render and first paint use an empty list instead of the sample data.
const PRIVATE = new Set<keyof DB>(["donations", "applications", "messages", "rsvps", "subscribers", "users"]);
const EMPTY: never[] = [];

const cache: Partial<DB> = {};
const listeners = new Set<() => void>();
let version = 0;
let loaded = false;
let started = false;
const loadListeners = new Set<() => void>();

const fallback = <K extends keyof DB>(k: K): DB[K] => (PRIVATE.has(k) ? EMPTY : seed[k]) as DB[K];
const read = <K extends keyof DB>(k: K): DB[K] => (cache[k] ?? fallback(k)) as DB[K];
const emit = () => listeners.forEach(l => l());

// Keep the old object for collections that didn't change, so only pages using changed data re-render.
function apply(data: Partial<DB>, v?: number) {
  let changed = false;
  for (const k of Object.keys(data) as (keyof DB)[]) {
    if (JSON.stringify(cache[k]) !== JSON.stringify(data[k])) { (cache as Record<string, unknown>)[k] = data[k]; changed = true; }
  }
  if (v) version = v;
  if (!loaded) { loaded = true; loadListeners.forEach(l => l()); changed = true; }
  if (changed) emit();
}

let inflight: Promise<void> | null = null;
/** Fetches the latest data. `force` ignores the version check (e.g. after signing in or out). */
export function refresh(force = false): Promise<void> {
  if (inflight && !force) return inflight;
  const run = (async () => {
    try {
      const r = await fetch("/api/db" + (version && !force ? `?v=${version}` : ""), { cache: "no-store" });
      if (!r.ok) return;
      const j = await r.json() as { unchanged?: boolean; data?: Partial<DB>; version: number };
      if (j.data) apply(j.data, j.version);
      else if (!loaded) apply({}, j.version);
    } catch {}
  })();
  const tracked: Promise<void> = run.finally(() => { if (inflight === tracked) inflight = null; });
  inflight = tracked;
  return tracked;
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  refresh(true);
  setInterval(() => { if (document.visibilityState === "visible") refresh(); }, 8000);
  addEventListener("focus", () => refresh());
}

function subscribe(l: () => void) {
  start();
  listeners.add(l);
  return () => { listeners.delete(l); };
}

/** Live view of a collection (or settings). */
export function useData<K extends keyof DB>(k: K): DB[K] {
  return useSyncExternalStore(subscribe, () => read(k), () => fallback(k));
}

/** False until the first answer from the server (so admin lists can say "Loading…" rather than "Nothing yet"). */
export function useLoaded() {
  return useSyncExternalStore(l => { start(); loadListeners.add(l); return () => { loadListeners.delete(l); }; }, () => loaded, () => false);
}

type Item<K extends CollectionKey> = DB[K][number];

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const now = () => new Date().toISOString();

export function getAll<K extends CollectionKey>(k: K): DB[K] { return read(k); }

/** Shown as a toast by <Providers> when a save fails. */
export const STORE_ERROR = "lctc:store-error";

async function send(body: object) {
  let j: { error?: string; data?: Partial<DB>; version?: number } = {};
  try {
    const r = await fetch("/api/db", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "Couldn't save. Please try again.");
  } catch (e) {
    const msg = e instanceof TypeError ? "You seem to be offline. Nothing was saved." : (e as Error).message;
    refresh(true); // put back what the server really has
    dispatchEvent(new CustomEvent(STORE_ERROR, { detail: msg }));
    throw new Error(msg);
  }
  if (j.data) apply(j.data, j.version);
}

export async function insert<K extends CollectionKey>(k: K, item: Omit<Item<K>, "id"> & { id?: string }): Promise<Item<K>> {
  const full = { ...item, id: item.id || uid() } as Item<K>;
  (cache as Record<string, unknown>)[k] = [full, ...(read(k) as Item<K>[])];
  emit();
  await send({ op: "insert", k, item: full });
  return full;
}

/** Saves several items in one request; either all are saved or none. */
export async function insertMany<K extends CollectionKey>(k: K, items: (Omit<Item<K>, "id"> & { id?: string })[]): Promise<Item<K>[]> {
  const full = items.map(item => ({ ...item, id: item.id || uid() }) as Item<K>);
  (cache as Record<string, unknown>)[k] = [...full, ...(read(k) as Item<K>[])];
  emit();
  await send({ op: "insert", k, items: full });
  return full;
}

/** Editing an item clears its "sample" flag, since the content is now the admin's own. */
export async function update<K extends CollectionKey>(k: K, id: string, patch: Partial<Item<K>>) {
  (cache as Record<string, unknown>)[k] = (read(k) as Item<K>[]).map(x => (x as { id: string }).id === id ? { ...x, ...patch, sample: false } : x);
  emit();
  await send({ op: "update", k, id, patch });
}

export async function remove<K extends CollectionKey>(k: K, id: string) {
  (cache as Record<string, unknown>)[k] = (read(k) as Item<K>[]).filter(x => (x as { id: string }).id !== id);
  emit();
  await send({ op: "remove", k, id });
}

export async function saveSettings(patch: Partial<DB["settings"]>) {
  cache.settings = { ...read("settings"), ...patch };
  emit();
  await send({ op: "settings", patch });
}

/** Wipes every change and submission and returns to the seed data (super admins only). */
export async function resetAll() {
  await send({ op: "reset" });
  await refresh(true);
}

export function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

/** A board member's profile URL part. Members saved before slugs existed fall back to their name. */
export const boardSlug = (m: { slug?: string; name: string }) => m.slug || slugify(m.name.replace(/^(dr|mr|ms|mrs)\.\s+/i, ""));

export function upcoming(events: FoundationEvent[], at = new Date()) {
  const today = new Date(at.getFullYear(), at.getMonth(), at.getDate());
  return events.filter(e => e.published && new Date(e.date + "T00:00:00") >= today).sort((a, b) => a.date.localeCompare(b.date));
}

export function past(events: FoundationEvent[], at = new Date()) {
  const today = new Date(at.getFullYear(), at.getMonth(), at.getDate());
  return events.filter(e => e.published && new Date(e.date + "T00:00:00") < today).sort((a, b) => b.date.localeCompare(a.date));
}

export { money } from "./content";
