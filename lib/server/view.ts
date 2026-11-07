// What each visitor is allowed to see. Staff see the collections their role manages; signed-in
// members see their own gifts and RSVPs; everyone sees published site content.

import { can, isStaff, sectionOf } from "../roles";
import type { CollectionKey, DB, User } from "../seed";
import { collections, type ServerDB } from "./db";

type AnyRow = Record<string, unknown> & { id: string };

const published = (x: AnyRow) => x.published !== false;

// Public, read-only versions of content collections.
const publicView: Partial<Record<CollectionKey, (rows: AnyRow[], db: ServerDB) => AnyRow[]>> = {
  programs: rows => rows,
  board: rows => rows,
  reports: rows => rows,
  scholarships: rows => rows,
  posts: rows => rows.filter(published),
  alumni: rows => rows.filter(x => x.published).map(({ email: _e, ...x }) => x as AnyRow),
  events: (rows, db) => rows.filter(published).map(e => ({ ...e, taken: going(db, e.id) })),
};

// Collections a member can see their own rows of (matched on email).
const own: CollectionKey[] = ["donations", "rsvps"];

const going = (db: ServerDB, eventId: string) => db.rsvps.filter(r => r.eventId === eventId).reduce((n, r) => n + 1 + (r.guests || 0), 0);

export function view(db: ServerDB, viewer: User | null): Partial<DB> {
  const staff = isStaff(viewer?.role);
  const out: Record<string, unknown> = { settings: db.settings };
  for (const k of collections) {
    const rows = db[k] as unknown as AnyRow[];
    if (staff && can(viewer!.role, sectionOf[k])) {
      out[k] = k === "users" ? rows.map(({ pass: _p, ...u }) => u)
        : k === "events" ? rows.map(e => ({ ...e, taken: going(db, e.id) }))
        : rows;
    } else if (publicView[k]) {
      out[k] = publicView[k]!(rows, db);
    } else if (viewer && own.includes(k)) {
      out[k] = rows.filter(x => String(x.email ?? "").toLowerCase() === viewer.email.toLowerCase());
    } else {
      out[k] = [];
    }
  }
  return out as Partial<DB>;
}
