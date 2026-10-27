"use client";

import { useState } from "react";
import { useSite } from "./Providers";
import { CHECKOUT } from "./CartButton";
import { addToCart, MAX_QTY, type CartItem } from "@/lib/cart";
import { donationTypes, givingTiers, majorGift, money, pillars } from "@/lib/content";

// Everything on the donate page fills the same giving list in place: pick how many (starting at 1), then
// "Give" adds it and opens payment, or "Add to giving list" adds it and lets the donor keep choosing.
// The list itself is reviewed and edited inside the checkout at the top, not in the sidebar.
type Gift = Pick<CartItem, "type" | "tier" | "unit">;
const once = { freq: "once", purpose: "general", who: "", why: "", note: "" } as const;
const clamp = (n: number) => Math.min(MAX_QTY, Math.max(1, n));
const typeName = (slug: string) => donationTypes.find(t => t.slug === slug)?.name ?? slug;
const toPayment = () => {
  dispatchEvent(new Event(CHECKOUT));
  document.querySelector(".donate-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

function Qty({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="qty sm" role="group" aria-label={`How many: ${label}`}>
      <button type="button" aria-label="One fewer" disabled={value <= 1} onClick={() => onChange(clamp(value - 1))}>−</button>
      <output aria-live="polite">{value}</output>
      <button type="button" aria-label="One more" disabled={value >= MAX_QTY} onClick={() => onChange(clamp(value + 1))}>+</button>
    </div>
  );
}

// Quantity, then the two buttons. Used by every pillar and giving tier card.
function GiveButtons({ gift, unit, label }: { gift: Gift; unit: number; label: string }) {
  const { say } = useSite();
  const [n, setN] = useState(1);
  const [added, setAdded] = useState(false);
  const total = unit * n;
  function add() {
    addToCart({ ...gift, qty: n, amount: total, ...once });
    say(`Added ${money(total)} for ${label.toLowerCase()} to your giving list`);
    setN(1);
  }
  return (
    <>
      <div className="gift-qty">
        <Qty value={n} label={label} onChange={setN} />
        <small>{money(unit)} each</small>
      </div>
      <button type="button" className="btn blue" onClick={() => { add(); toPayment(); }}>Give {money(total)}</button>
      <button type="button" className="btn line" onClick={() => { add(); setAdded(true); setTimeout(() => setAdded(false), 1600); }}>
        {added ? "Added ✓" : "Add to giving list"}
      </button>
    </>
  );
}

// A pillar gift is that type's default amount, times how many.
export function PillarCards() {
  return (
    <div className="pillars">
      {pillars.map(p => {
        const unit = donationTypes.find(t => t.slug === p.type)?.default ?? 50;
        return (
          <article className="reveal" key={p.name}>
            <i aria-hidden="true">{p.icon}</i>
            <b>{p.name}</b>
            <span>{p.text}</span>
            <GiveButtons gift={{ type: p.type, unit }} unit={unit} label={p.name} />
          </article>
        );
      })}
    </div>
  );
}

// The nine fixed-price giving tiers, as cards.
export function TierCards() {
  return (
    <div className="tiers">
      {givingTiers.filter(t => !t.min).map(t => (
        <article className="tier reveal" key={t.name}>
          <h3>{t.name}</h3>
          <p className="tier-price"><b>{money(t.amount)}</b></p>
          <p className="tier-item">{t.item}</p>
          <p className="tier-impact"><span>The impact:</span> {t.impact}</p>
          <p className="hint">Goes to {typeName(t.type)}</p>
          <GiveButtons gift={{ type: t.type, tier: t.name }} unit={t.amount} label={t.item} />
        </article>
      ))}
    </div>
  );
}

// The Innovation Catalyst starts at $10,000. It goes on the list at that amount and opens payment right here
// (a ?tier= link back to this same page did nothing, because the checkout only reads the URL when it first loads).
export function MajorGiftButton() {
  const { say } = useSite();
  const t = givingTiers.find(x => x.name === majorGift.name);
  if (!t) return null;
  return (
    <button type="button" className="btn spark" onClick={() => {
      addToCart({ type: t.type, tier: t.name, qty: 1, amount: t.amount, ...once });
      say(`Added ${money(t.amount)} for ${t.item.toLowerCase()} to your giving list`);
      toPayment();
    }}>Give {money(majorGift.amount)}+</button>
  );
}
