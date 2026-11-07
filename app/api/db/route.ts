import { NextResponse, type NextRequest } from "next/server";
import { can, emailRe, sectionOf } from "@/lib/roles";
import { code, collections, hashPassword, mutate, newId, reset, type ServerDB } from "@/lib/server/db";
import { userFrom, viewerOf } from "@/lib/server/session";
import { view } from "@/lib/server/view";
import type { CollectionKey, User } from "@/lib/seed";

// GET  /api/db            → everything this visitor may see, plus a version number
// GET  /api/db?v=<n>      → { unchanged: true } when nothing changed since version n
// POST /api/db            → { op: "insert" | "update" | "remove", k, item | id + patch } or { op: "settings", patch } or { op: "reset" }

type Row = Record<string, unknown> & { id: string };
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
const nowIso = () => new Date().toISOString();
const str = (v: unknown, max = 5000) => String(v ?? "").trim().slice(0, max);

export async function GET(req: NextRequest) {
  const { db, viewer } = await viewerOf(req);
  const v = req.nextUrl.searchParams.get("v");
  if (v && +v === db._meta.version) return NextResponse.json({ unchanged: true, version: db._meta.version });
  return NextResponse.json({ data: view(db, viewer), version: db._meta.version }, { headers: { "Cache-Control": "no-store" } });
}

// Forms anyone can submit. Each returns the row to save, with server-controlled fields set here,
// or a string explaining why it was refused.
const publicInsert: Partial<Record<CollectionKey, (x: Row, db: ServerDB) => Row | string>> = {
  donations: x => {
    const amount = Number(x.amount);
    if (!(amount >= 1)) return "Enter an amount of at least $1.";
    if (!emailRe.test(str(x.email))) return "Enter a valid email address.";
    return { ...pick(x, ["receipt", "name", "email", "freq", "fund", "tier", "card", "dedication", "note", "keepInTouch"]), amount, id: newId(), createdAt: nowIso() };
  },
  applications: x => {
    if (!emailRe.test(str(x.email))) return "Enter a valid email address.";
    const { status: _s, adminNotes: _n, ...rest } = x;
    return { ...rest, id: code("LCTC-G-"), status: "New", submittedAt: nowIso() };
  },
  messages: x => {
    if (!emailRe.test(str(x.email))) return "Enter a valid email address.";
    return { ...pick(x, ["name", "email", "topic", "message"]), id: newId(), status: "New", createdAt: nowIso() };
  },
  rsvps: (x, db) => {
    const email = str(x.email).toLowerCase(), guests = Math.max(0, Math.min(10, Math.floor(Number(x.guests) || 0)));
    const e = db.events.find(ev => ev.id === x.eventId && ev.published);
    if (!e || !e.rsvpOpen) return "RSVPs aren't open for this event.";
    if (!emailRe.test(email)) return "Enter a valid email address.";
    if (db.rsvps.some(r => r.eventId === e.id && r.email.toLowerCase() === email)) return "You've already RSVP'd with this email.";
    const taken = db.rsvps.filter(r => r.eventId === e.id).reduce((n, r) => n + 1 + r.guests, 0);
    if (e.capacity > 0 && taken + 1 + guests > e.capacity) return `Only ${Math.max(0, e.capacity - taken)} spots left.`;
    return { ...pick(x, ["eventId", "name", "note"]), email, guests, id: newId(), createdAt: nowIso() };
  },
  subscribers: (x, db) => {
    const email = str(x.email).toLowerCase();
    if (!emailRe.test(email)) return "Enter a valid email address.";
    if (db.subscribers.some(s => s.email.toLowerCase() === email)) return "__duplicate";
    return { email, name: str(x.name, 200), id: newId(), createdAt: nowIso() };
  },
  alumni: x => {
    if (str(x.name).length < 2) return "Please enter your name.";
    if (!emailRe.test(str(x.email))) return "Enter a valid email address.";
    return { ...pick(x, ["name", "email", "program", "year", "now", "story"]), photo: "", id: newId(), published: false, createdAt: nowIso() };
  },
};

function pick(x: Row, keys: string[]) {
  const o: Row = { id: "" };
  for (const k of keys) if (x[k] !== undefined) o[k] = typeof x[k] === "string" ? str(x[k]) : x[k];
  return o;
}

// Accounts: the browser sends `newPassword`, the server stores only its hash.
function prepareUser(x: Row, db: ServerDB, me: User, existing?: User): Row | string {
  const email = str(x.email ?? existing?.email).toLowerCase();
  if (!emailRe.test(email)) return "Enter a valid email.";
  if (db.users.some(u => u.id !== (existing?.id ?? x.id) && u.email.toLowerCase() === email)) return "Another account uses that email.";
  const pw = str(x.newPassword, 200);
  if (pw && pw.length < 8) return "Passwords need at least 8 characters.";
  if (!existing && !pw) return "Set a password for the new account.";
  if (existing && email !== existing.email && !pw) return "Changing the email resets the password. Set a new password too.";
  if (existing?.id === me.id && x.role && x.role !== "superadmin") return "You can't remove your own super admin access.";
  const { newPassword: _n, pass: _p, ...rest } = x;
  return { ...rest, email, pass: pw ? hashPassword(email, pw) : existing!.pass };
}

export async function POST(req: NextRequest) {
  let body: { op?: string; k?: CollectionKey; item?: Row; items?: Row[]; id?: string; patch?: Row };
  try { body = await req.json(); } catch { return fail("Bad request."); }
  const { op, k } = body;
  if (op !== "settings" && op !== "reset" && (!k || !collections.includes(k))) return fail("Unknown list.");

  try {
    const result = await mutate(db => {
      const me = userFrom(req, db);
      const staffCan = (key: CollectionKey) => !!me && can(me.role, sectionOf[key]);

      if (op === "reset") {
        if (!me || !can(me.role, "users")) throw new Err("Only a super admin can reset the data.", 403);
        return "reset";
      }
      if (op === "settings") {
        if (!me || !can(me.role, "settings")) throw new Err("You can't change settings.", 403);
        const p = (body.patch ?? {}) as Row & { schools?: unknown[] };
        db.settings = { ...db.settings, ...pick(p as Row, ["email", "phone", "address"]), ...(Array.isArray(p.schools) && { schools: p.schools.map((s: unknown) => str(s, 200)).filter(Boolean) }) };
        return;
      }

      const list = db[k!] as unknown as Row[];
      if (op === "insert" && Array.isArray(body.items)) {
        // Several rows at once (e.g. every gift in one checkout): all saved, or none.
        if (body.items.length > 50) throw new Err("Too many items.");
        for (const it of body.items) insertOne({ ...it } as Row);
        return;
      }
      if (op === "insert") { insertOne({ ...(body.item ?? {}) } as Row); return; }

      function insertOne(item: Row) {
        if (staffCan(k!)) {
          let row: Row | string = { ...item, id: str(item.id, 60) || newId() };
          if (k === "users") row = prepareUser(row, db, me!);
          if (typeof row === "string") throw new Err(row);
          if (list.some(x => x.id === row.id)) row.id = newId();
          list.unshift(row as Row);
          return;
        }
        const make = publicInsert[k!];
        if (!make) throw new Err("You need to sign in to do that.", 401);
        const row = make({ ...item, id: "" }, db);
        if (row === "__duplicate") return;
        if (typeof row === "string") throw new Err(row);
        // Keep the browser's id so its optimistic copy lines up, unless it clashes.
        if (typeof item.id === "string" && /^[\w-]{4,60}$/.test(item.id) && !list.some(x => x.id === item.id)) row.id = item.id;
        list.unshift(row);
      }

      if (!staffCan(k!)) throw new Err(me ? "Your role can't change this." : "You need to sign in to do that.", me ? 403 : 401);
      const i = list.findIndex(x => x.id === body.id);
      if (i < 0) throw new Err("That item no longer exists. It may have been deleted.", 404);
      if (op === "remove") {
        if (k === "users" && body.id === me!.id) throw new Err("You can't delete your own account.");
        list.splice(i, 1);
        return;
      }
      if (op === "update") {
        const { id: _id, taken: _t, ...patch } = (body.patch ?? {}) as Row;
        let next: Row | string = { ...list[i], ...patch, id: list[i].id, sample: false };
        if (k === "users") next = prepareUser(next, db, me!, list[i] as unknown as User);
        if (typeof next === "string") throw new Err(next);
        list[i] = next;
        return;
      }
      throw new Err("Unknown action.");
    });
    if (result === "reset") await reset();
    const { db, viewer } = await viewerOf(req);
    return NextResponse.json({ ok: true, data: view(db, viewer), version: db._meta.version });
  } catch (e) {
    if (e instanceof Err) return fail(e.message, e.status);
    console.error(e);
    return fail("Something went wrong saving that. Please try again.", 500);
  }
}

class Err extends Error { constructor(msg: string, public status = 400) { super(msg); } }

