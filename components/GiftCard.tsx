"use client";

import { useState } from "react";
import { AddTierToCart, QtyInput } from "./CartButton";
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
        <QtyInput id={"gq-" + t.name.replace(/\W+/g, "-")} value={qty} onChange={setQty} label={`How many: ${t.item}`} />
      )}
      <AddTierToCart name={t.name} qty={qty} className="btn blue" />
    </article>
  );
}
