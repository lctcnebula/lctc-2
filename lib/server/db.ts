// The site's database. Every form on the site writes here and the admin dashboard reads from here,
// so a submission made on one computer shows up on every other.
//
// Storage, picked automatically:
// - Postgres (Neon / Vercel Postgres) when DATABASE_URL or POSTGRES_URL is set. This is what the Vercel
//   project uses: one row per environment (production, preview…) in the table lctc_site_store.
// - Upstash Redis / Vercel KV when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL +
//   KV_REST_API_TOKEN) are set.
// - Otherwise a JSON file in DATA_DIR (default ./.data/db.json), for local use and any normal Node host.
// Set LCTC_STORE=file to force the local file even when a database URL is present.
//
// The whole database is one JSON document, loaded per request and written back after each change.
// Writes are queued in this process, and in Postgres each save only succeeds if nobody else saved
// since it was read (otherwise the change is re-applied to the fresh copy), so two submissions
// arriving together can never overwrite each other, even on different servers.

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { neon } from "@neondatabase/serverless";
import { seed, type CollectionKey, type DB } from "../seed";

type Meta = { seen: Record<string, string[]>; secret: string; version: number };
export type ServerDB = DB & { _meta: Meta };

const KV_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const KV_KEY = "lctc:db";
export const DATA_DIR = process.env.DATA_DIR || (process.env.VERCEL ? "/tmp/lctc-data" : path.join(process.cwd(), ".data"));
const FILE = path.join(DATA_DIR, "db.json");
const PG_URL = process.env.LCTC_STORE === "file" ? "" : process.env.DATABASE_URL || process.env.POSTGRES_URL;
export const usesPG = !!PG_URL;
export const usesKV = !usesPG && !!(KV_URL && KV_TOKEN) && process.env.LCTC_STORE !== "file";
const PG_KEY = "site:" + (process.env.VERCEL_ENV || process.env.NODE_ENV || "local");

let pgClient: ReturnType<typeof neon<false, false>> | null = null;
async function pg() {
  if (!pgClient) {
    const c = neon(PG_URL!);
    await c`create table if not exists lctc_site_store (key text primary key, value jsonb not null, version bigint not null default 0, updated_at timestamptz not null default now())`;
    pgClient = c;
  }
  return pgClient;
}

export const collections = (Object.keys(seed) as (keyof DB)[]).filter(k => k !== "settings") as CollectionKey[];

let mem: { db: ServerDB; mtime: number } | null = null;
let queue: Promise<unknown> = Promise.resolve();

// `stamp` identifies the stored copy: a Postgres save only goes through if the stamp still matches.
async function loadRaw(): Promise<{ data: Partial<ServerDB> | null; mtime: number }> {
  if (usesPG) {
    const sql = await pg();
    // Only download the document when it changed since this server last saw it.
    const have = mem?.mtime ?? -2;
    const rows = await sql`select version, case when version = ${have} then null else value end as value from lctc_site_store where key = ${PG_KEY}` as { value: Partial<ServerDB> | null; version: string }[];
    if (!rows.length) return { data: null, mtime: -1 };
    const v = Number(rows[0].version);
    return { data: rows[0].value ?? (mem && mem.mtime === v ? mem.db : null), mtime: v };
  }
  if (usesKV) {
    const r = await fetch(`${KV_URL}/get/${KV_KEY}`, { headers: { Authorization: `Bearer ${KV_TOKEN}` }, cache: "no-store" });
    if (!r.ok) throw new Error("Couldn't reach the database.");
    const j = await r.json() as { result: string | null };
    return { data: j.result ? JSON.parse(j.result) : null, mtime: 0 };
  }
  try {
    const st = await fs.stat(FILE);
    if (mem && mem.mtime === st.mtimeMs) return { data: mem.db, mtime: st.mtimeMs };
    return { data: JSON.parse(await fs.readFile(FILE, "utf8")), mtime: st.mtimeMs };
  } catch {
    return { data: null, mtime: 0 };
  }
}

/** Returns false if someone else saved first (Postgres only); the caller then retries on fresh data. */
async function saveRaw(db: ServerDB, stamp: number): Promise<boolean> {
  if (usesPG) {
    const sql = await pg();
    const next = stamp < 0 ? 1 : stamp + 1;
    const rows = stamp < 0
      ? await sql`insert into lctc_site_store (key, value, version) values (${PG_KEY}, ${JSON.stringify(db)}::jsonb, ${next}) on conflict (key) do nothing returning version`
      : await sql`update lctc_site_store set value = ${JSON.stringify(db)}::jsonb, version = ${next}, updated_at = now() where key = ${PG_KEY} and version = ${stamp} returning version`;
    if (!(rows as unknown[]).length) return false;
    mem = { db, mtime: next };
    return true;
  }
  const body = JSON.stringify(db);
  if (usesKV) {
    const r = await fetch(`${KV_URL}/set/${KV_KEY}`, { method: "POST", headers: { Authorization: `Bearer ${KV_TOKEN}` }, body });
    if (!r.ok) throw new Error("Couldn't save to the database.");
    mem = { db, mtime: 0 };
    return true;
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, body);
  await fs.rename(tmp, FILE);
  mem = { db, mtime: (await fs.stat(FILE)).mtimeMs };
  return true;
}

// Seed items added to lib/seed.ts after the database was created are added once; ones an admin
// deleted stay deleted (meta.seen remembers which seed ids each collection has already been given).
function withSeed(raw: Partial<ServerDB> | null): { db: ServerDB; changed: boolean } {
  const db = { ...(raw ?? {}) } as ServerDB;
  let changed = !raw;
  db._meta = { seen: {}, secret: crypto.randomBytes(32).toString("hex"), version: 1, ...(raw?._meta ?? {}) };
  if (!raw?._meta?.secret) changed = true;
  db.settings = { ...seed.settings, ...(raw?.settings ?? {}) };
  for (const k of collections) {
    const fresh = seed[k] as { id: string }[];
    const list = (Array.isArray(raw?.[k]) ? raw![k] : []) as { id: string }[];
    const known = new Set([...(db._meta.seen[k] ?? []), ...list.map(x => x.id)]);
    const added = fresh.filter(x => !known.has(x.id));
    if (added.length || !raw?.[k]) changed = true;
    (db as Record<string, unknown>)[k] = [...list, ...added];
    db._meta.seen[k] = [...new Set([...(db._meta.seen[k] ?? []), ...fresh.map(x => x.id)])];
  }
  return { db, changed };
}

async function loadStamped(): Promise<{ db: ServerDB; stamp: number }> {
  for (let i = 0; i < 4; i++) {
    const { data, mtime } = await loadRaw();
    if (usesPG && data && mem && mem.mtime === mtime) return { db: mem.db, stamp: mtime };
    if (!usesPG && data && data === mem?.db) return { db: mem.db, stamp: mtime };
    const { db, changed } = withSeed(data);
    if (!changed) { mem = { db, mtime }; return { db, stamp: mtime }; }
    if (await saveRaw(db, mtime)) return { db, stamp: mem!.mtime };
  }
  throw new Error("The database is busy. Please try again.");
}

export async function load(): Promise<ServerDB> {
  return (await loadStamped()).db;
}

/** Runs one change against the latest data and saves it. Changes run one at a time. */
export function mutate<T>(fn: (db: ServerDB) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    for (let attempt = 0; attempt < 6; attempt++) {
      const { db: base, stamp } = await loadStamped();
      const db = structuredClone(base);
      const out = await fn(db);
      db._meta.version++;
      if (await saveRaw(db, stamp)) return out;
      await new Promise(r => setTimeout(r, 40 + Math.random() * 120)); // someone else saved first: retry on their copy
    }
    throw new Error("The database is busy. Please try again.");
  });
  queue = run.catch(() => {});
  return run;
}

/** Back to the seed data (Admin → Settings → Reset). Keeps the session secret so nobody is signed out. */
export function reset() {
  return mutate(db => {
    const { db: fresh } = withSeed(null);
    for (const k of Object.keys(fresh) as (keyof ServerDB)[]) if (k !== "_meta") (db as Record<string, unknown>)[k] = fresh[k];
    db._meta.seen = fresh._meta.seen;
  });
}

export const newId = () => Date.now().toString(36) + crypto.randomBytes(4).toString("hex");
export const code = (prefix: string) => prefix + crypto.randomBytes(4).toString("hex").slice(0, 6).toUpperCase();

// Passwords: sha256 of "email:password", matching the demo accounts in lib/seed.ts.
export const hashPassword = (email: string, password: string) =>
  crypto.createHash("sha256").update(email.trim().toLowerCase() + ":" + password).digest("hex");
