// Sign-in sessions: an httpOnly cookie holding the user id and an expiry, signed with a secret
// (SESSION_SECRET, or one generated and kept in the database), so it can't be forged in the browser.

import crypto from "crypto";
import type { NextRequest, NextResponse } from "next/server";
import type { User } from "../seed";
import { load, type ServerDB } from "./db";

const COOKIE = "lctc_session";
const DAYS = 30;

const secretOf = (db: ServerDB) => process.env.SESSION_SECRET || db._meta.secret;
const sign = (v: string, secret: string) => crypto.createHmac("sha256", secret).update(v).digest("base64url");

export function setSession(res: NextResponse, db: ServerDB, userId: string) {
  const v = `${userId}.${Date.now() + DAYS * 864e5}`;
  res.cookies.set(COOKIE, `${v}.${sign(v, secretOf(db))}`, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: DAYS * 86400,
  });
}

export function clearSession(res: NextResponse) {
  res.cookies.set(COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}

/** The signed-in user (with password hash) for this request, or null. */
export function userFrom(req: NextRequest, db: ServerDB): User | null {
  const raw = req.cookies.get(COOKIE)?.value;
  if (!raw) return null;
  const [id, exp, sig] = raw.split(".");
  if (!id || !exp || !sig || +exp < Date.now()) return null;
  const want = sign(`${id}.${exp}`, secretOf(db));
  if (want.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(want), Buffer.from(sig))) return null;
  return db.users.find(u => u.id === id) ?? null;
}

export async function viewerOf(req: NextRequest) {
  const db = await load();
  return { db, viewer: userFrom(req, db) };
}

export const publicUser = (u: User | null) => u && { id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt };
