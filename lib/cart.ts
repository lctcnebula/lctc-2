"use client";

// The donation cart, shown to donors as their "giving list". Each line is one gift: a type of donation (or a giving tier × how many), how often,
// and who it's for. It lives in this browser's localStorage until checkout turns every line into a
// donation record (all sharing one receipt number), then it's emptied.

import { useSyncExternalStore } from "react";
import { donationTypes, findDonationType, givingTiers, money } from "./content";
import { frequencies, type Freq } from "./seed";

export const purposes = {
  general: { icon: "💙", label: "Just from me", text: "A general gift, no dedication.", phrase: "" },
  honor: { icon: "🎉", label: "In honor of someone", text: "Celebrate a person who matters to you.", phrase: "in honor of" },
  memory: { icon: "🕊️", label: "In memory of someone", text: "Remember a loved one with a gift in their name.", phrase: "in memory of" },
  behalf: { icon: "🤝", label: "On behalf of someone", text: "Give for a person, family, class or company.", phrase: "on behalf of" },
} as const;
export type Purpose = keyof typeof purposes;
export const occasions = ["their birthday", "their graduation", "their wedding", "their retirement", "an anniversary", "the holidays"];

// A general gift has no dedication; the others read back as one sentence, saved on the donation record:
// "I am donating in memory of Rosa Diaz because of her love of cooking."
export type Dedication = { who: string; why: string; note: string };
export const dedicationLine = (p: Purpose, d: Dedication) =>
  p === "general" || !d.who.trim() ? "" : `I am donating ${purposes[p].phrase} ${d.who.trim()}${d.why.trim() ? " because of " + d.why.trim() : ""}.`;

// `amount` is the line total (unit price × qty). A fixed tier has its own price; a pillar gift from the donate page carries `unit`.
export type CartItem = { id: string; type: string; tier?: string; unit?: number; qty: number; amount: number; freq: Freq; purpose: Purpose } & Dedication;

export const MAX_QTY = 20;
const KEY = "lctc-cart";
let cache: CartItem[] | null = null;
const listeners = new Set<() => void>();
const empty: CartItem[] = [];

function read(): CartItem[] {
  if (cache) return cache;
  try { cache = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { cache = []; }
  return cache!;
}
function write(items: CartItem[]) {
  cache = items;
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  listeners.forEach(l => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) { cache = null; l(); } };
  addEventListener("storage", onStorage);
  return () => { listeners.delete(l); removeEventListener("storage", onStorage); };
}

export const useCart = () => useSyncExternalStore(subscribe, read, () => empty);
// The stored list right now. useCart() is empty for the first render after a page load, so checks that run on mount use this.
export const cartItems = () => read();

export const tierOf = (i: Pick<CartItem, "tier">) => givingTiers.find(t => t.name === i.tier);
// The price of one, for lines the donor can change the quantity of.
const unitOf = (i: Pick<CartItem, "tier" | "unit">) => { const t = tierOf(i); return t ? (t.min ? undefined : t.amount) : i.unit; };

// The same fixed-price gift, same frequency and no dedication just bumps the quantity.
export function addToCart(item: Omit<CartItem, "id">) {
  const items = read(), unit = unitOf(item);
  const same = unit && item.purpose === "general" && items.find(x => x.type === item.type && x.tier === item.tier && unitOf(x) === unit && x.freq === item.freq && x.purpose === "general");
  if (same && unit) {
    const qty = Math.min(MAX_QTY, same.qty + item.qty);
    return write(items.map(x => x === same ? { ...x, qty, amount: unit * qty } : x));
  }
  write([...items, { ...item, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) }]);
}
export function setQty(id: string, n: number) {
  write(read().map(x => {
    const unit = x.id === id && unitOf(x);
    if (!unit) return x;
    const qty = Math.min(MAX_QTY, Math.max(1, n));
    return { ...x, qty, amount: unit * qty };
  }));
}
export const removeFromCart = (id: string) => write(read().filter(x => x.id !== id));
export const clearCart = () => write([]);

export function describe(i: CartItem) {
  const type = findDonationType(i.type) ?? donationTypes[0], t = tierOf(i);
  return {
    type,
    title: t ? t.item : type.name,
    sub: t ? `${t.name} · ${type.name}` : type.text,
    icon: type.icon,
    tierLabel: t && (!t.min && i.qty > 1 ? `${t.name} × ${i.qty}` : t.name),
    fixed: !!unitOf(i),
    unit: unitOf(i),
    dedication: dedicationLine(i.purpose, i),
    price: money(i.amount) + frequencies[i.freq].per,
  };
}

// What the card is charged today, plus what repeats each month / year.
export function totals(items: CartItem[]) {
  const sum = (f?: Freq) => items.filter(i => !f || i.freq === f).reduce((n, i) => n + i.amount, 0);
  return { today: sum(), monthly: sum("monthly"), yearly: sum("yearly") };
}
export const repeats = (t: { monthly: number; yearly: number }) =>
  [t.monthly && `${money(t.monthly)} every month`, t.yearly && `${money(t.yearly)} every year`].filter(Boolean).join(" and ");
