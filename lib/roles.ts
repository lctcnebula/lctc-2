// Who can open which part of the admin dashboard. Shared by the browser (to hide screens) and the
// server (to decide what data each visitor may read or change), so the two can never disagree.

import type { CollectionKey, Role } from "./seed";

export type Section =
  | "dashboard" | "donations" | "applications" | "messages" | "rsvps" | "subscribers"
  | "events" | "blog" | "programs" | "board" | "alumni" | "reports" | "scholarships" | "users" | "settings";

const access: Record<Role, Section[] | "all"> = {
  superadmin: "all",
  admin: ["dashboard", "donations", "applications", "messages", "rsvps", "subscribers", "events", "blog", "programs", "board", "alumni", "reports", "scholarships", "settings"],
  accountant: ["dashboard", "donations", "reports"],
  user: [],
};

export const roleLabels: Record<Role, string> = { superadmin: "Super admin", admin: "Admin", accountant: "Accountant", user: "Member" };

export const can = (role: Role | undefined, s: Section) => !!role && (access[role] === "all" || (access[role] as Section[]).includes(s));
export const isStaff = (role: Role | undefined) => can(role, "dashboard");

/** The admin section that manages each collection. */
export const sectionOf: Record<CollectionKey, Section> = {
  programs: "programs", events: "events", rsvps: "rsvps", posts: "blog", subscribers: "subscribers",
  donations: "donations", applications: "applications", messages: "messages", board: "board", alumni: "alumni",
  reports: "reports", scholarships: "scholarships", users: "users",
};

export const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
