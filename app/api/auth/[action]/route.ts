import { NextResponse, type NextRequest } from "next/server";
import { emailRe } from "@/lib/roles";
import { hashPassword, load, mutate, newId } from "@/lib/server/db";
import { clearSession, publicUser, setSession, userFrom } from "@/lib/server/session";

// GET /api/auth/me · POST /api/auth/login {email,password} · POST /api/auth/register {name,email,password} · POST /api/auth/logout

export async function GET(req: NextRequest, ctx: { params: Promise<{ action: string }> }) {
  if ((await ctx.params).action !== "me") return NextResponse.json({ error: "Not found" }, { status: 404 });
  const db = await load();
  return NextResponse.json({ user: publicUser(userFrom(req, db)) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;
  const body = await req.json().catch(() => ({})) as { name?: string; email?: string; password?: string };
  const email = String(body.email ?? "").trim().toLowerCase(), password = String(body.password ?? "");

  if (action === "logout") {
    const res = NextResponse.json({ ok: true });
    clearSession(res);
    return res;
  }

  if (action === "login") {
    const db = await load();
    const u = db.users.find(x => x.email.toLowerCase() === email);
    if (!u || u.pass !== hashPassword(email, password)) return NextResponse.json({ error: "That email and password don't match." }, { status: 401 });
    const res = NextResponse.json({ user: publicUser(u) });
    setSession(res, db, u.id);
    return res;
  }

  if (action === "register") {
    const name = String(body.name ?? "").trim().slice(0, 120);
    if (name.length < 2) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    if (!emailRe.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: "Use at least 8 characters for your password." }, { status: 400 });
    try {
      const u = await mutate(db => {
        if (db.users.some(x => x.email.toLowerCase() === email)) throw new Error("An account with that email already exists. Try signing in.");
        const user = { id: newId(), name, email, role: "user" as const, pass: hashPassword(email, password), createdAt: new Date().toISOString() };
        db.users.push(user);
        return user;
      });
      const res = NextResponse.json({ user: publicUser(u) });
      setSession(res, await load(), u.id);
      return res;
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
