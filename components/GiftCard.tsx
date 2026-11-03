"use client";

import { useState } from "react";
import { AddTierToCart } from "./CartButton";
import { MAX_QTY } from "@/lib/cart";
import { money, type GivingTier } from "@/lib/content";

// Shop-style card for one giving opportunity: photo, title, what it pays for, price, how many, add to the giving list.
// The major gift (`min`) has no quantity; donors set its amount at checkout.
export default function GiftCard({ t }: { t: GivingTier }) {
  const [qty, setQty] = useState(1);
  return (
    <article className="gift-card reveal">
      <div className="gift-card-img"><img src={t.image} alt="" width={600} height={450} loading="lazy" /></div>
      <h3>{t.item}</h3>
      <p className="gift-card-text">{t.impact}</p>
      <p className="gift-card-price">{money(t.amount)}{t.min ? "+" : <small> each</small>}</p>
      {!t.min && (
        <div className="qty" role="group" aria-label={`How many: ${t.item}`}>
          <button type="button" aria-label="One fewer" disabled={qty <= 1} onClick={() => setQty(q => q - 1)}>−</button>
          <output aria-live="polite">{qty}</output>
          <button type="button" aria-label="One more" disabled={qty >= MAX_QTY} onClick={() => setQty(q => q + 1)}>+</button>
        </div>
      )}
      <AddTierToCart name={t.name} qty={qty} className="btn blue" />
    </article>
  );
}
