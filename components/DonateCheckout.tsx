"use client";

import { useEffect, useRef, useState } from "react";
import { palette, useSite } from "./Providers";
import { ConfettiButton } from "./Actions";
import { ADD_MORE, CHECKOUT, GivingLines, openGivingList } from "./CartButton";
import { getAll, insert, money, now } from "@/lib/store";
import { useUser } from "@/lib/auth";
import { addToCart, cartItems, clearCart, dedicationLine, describe, MAX_QTY, occasions, purposes, repeats, totals, useCart, type CartItem, type Purpose } from "@/lib/cart";
import { donationTypes, findDonationType, givingTiers, tiersFor } from "@/lib/content";
import { frequencies, type Freq } from "@/lib/seed";

// Demo checkout, shop style: build a gift, add it to the giving list (the cart), add more, then pay once. Nothing is charged, but each line
// is recorded in Admin → Donations (all under one receipt number). Swap the submit handler for a hosted payment page
// (Stripe Checkout, PayPal...) to take real gifts. No upper limit on gift size.

export const funds = donationTypes.map(t => t.name);
const TEST: Record<string, "ok" | "decline"> = { "4242424242424242": "ok", "5555555555554444": "ok", "378282246310005": "ok", "6011111111111117": "ok", "4000000000000002": "decline" };
const brandNames = { visa: "Visa", mastercard: "Mastercard", amex: "Amex", discover: "Discover" } as const;
type Brand = keyof typeof brandNames | "";

const brandOf = (d: string): Brand => /^4/.test(d) ? "visa" : /^(5[1-5]|2[2-7])/.test(d) ? "mastercard" : /^3[47]/.test(d) ? "amex" : /^6(011|5)/.test(d) ? "discover" : "";
const formatCard = (raw: string) => {
  const d = raw.replace(/\D/g, "").slice(0, 16), b = brandOf(d), dd = d.slice(0, b === "amex" ? 15 : 16);
  return b === "amex" ? dd.replace(/^(\d{0,4})(\d{0,6})(\d{0,5}).*/, (_m, a, c, f) => [a, c, f].filter(Boolean).join(" ")) : dd.replace(/(\d{4})(?=\d)/g, "$1 ");
};
const formatExp = (raw: string) => {
  let d = raw.replace(/\D/g, "").slice(0, 4);
  if (d.length === 1 && d > "1") d = "0" + d;
  return d.length > 2 ? d.slice(0, 2) + " / " + d.slice(2) : d;
};

const blank = { name: "", email: "", card: "", exp: "", cvc: "", zip: "" };
type Fields = typeof blank;
const blankDedication = { who: "", why: "", note: "" };
type Receipt = { first: string; id: string; items: CartItem[]; card: string; date: string; email: string; keep: boolean };

// Steps: 1 build a gift → 2 payment → 3 thank-you. Reviewing the giving list happens in the sidebar (GivingSidebar).
// Donors see "giving list", never "cart".
export default function DonateCheckout() {
  const top = useRef<HTMLDivElement>(null);
  const { getConfetti, say } = useSite();
  const cart = useCart();
  const [step, setStep] = useState(1);
  const [type, setType] = useState(donationTypes[0]);
  const [amount, setAmount] = useState(type.default);
  const [tier, setTier] = useState("");
  const [qty, setQty] = useState(1);
  const [custom, setCustom] = useState("");
  const [freq, setFreq] = useState<Freq>("once");
  const [amountErr, setAmountErr] = useState("");
  const [purpose, setPurpose] = useState<Purpose>("general");
  const [ded, setDed] = useState(blankDedication);
  const [dedErr, setDedErr] = useState("");
  const [keep, setKeep] = useState(true);
  const [f, setF] = useState<Fields>(blank);
  const [errs, setErrs] = useState<Partial<Fields>>({});
  const [alert, setAlert] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  // Signed-in members get their name and email filled in, so the gift shows in their account.
  const { user } = useUser();
  useEffect(() => {
    if (user) setF(p => ({ ...p, name: p.name || user.name, email: p.email || user.email }));
  }, [user]);

  // Links elsewhere preselect the gift: /donate?type=scholarships&amount=1000&freq=monthly (or yearly), or
  // /donate?tier=The%20Toolkit&qty=2 for a giving tier; &other=1 jumps to the "any other amount" box. ?fund=Scholarships (the type's name) still works for older links.
  // /donate?pay=1 (the sidebar's "Continue to payment" from another page) goes straight to payment; ?cart=1 opens the sidebar.
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.get("pay")) setStep(2);
    if (q.get("cart")) setTimeout(openGivingList, 300);
    const gt = givingTiers.find(x => x.name === q.get("tier"));
    const t = findDonationType(gt?.type ?? q.get("type") ?? q.get("fund"));
    if (t) pickType(t);
    const fq = q.get("freq");
    if (fq === "monthly" || fq === "yearly") setFreq(fq);
    if (gt && t) return pickTier(gt.name, t, parseInt(q.get("qty") ?? "1"));
    const n = parseFloat(q.get("amount") ?? "");
    if (n >= 5) pickAmount(n, t ?? donationTypes[0]);
    if (q.get("other")) setTimeout(() => { const el = document.getElementById("d-custom"); el?.scrollIntoView({ block: "center" }); el?.focus(); }, 300);
  }, []);

  // The sidebar's buttons, clicked while already on this page.
  useEffect(() => {
    const pay = () => setStep(2), more = () => setStep(1);
    addEventListener(CHECKOUT, pay); addEventListener(ADD_MORE, more);
    return () => { removeEventListener(CHECKOUT, pay); removeEventListener(ADD_MORE, more); };
  }, []);
  // Paying needs something on the list (e.g. everything removed in the sidebar mid-payment).
  useEffect(() => { if (step === 2 && !cartItems().length) setStep(1); }, [step, cart.length]);

  // Switching type swaps in that type's presets and tiers, so the old amount (preset or typed) is replaced by its default.
  function pickType(t: typeof type) {
    setType(t); setTier(""); setQty(1); setAmount(t.default); setCustom(""); setAmountErr("");
    if (t.slug === "tribute") setPurpose(p => p === "general" ? "honor" : p);
  }

  // A giving tier locks the price: amount = price × how many. A `min` tier starts at its price and can go higher.
  function pickTier(name: string, t = type, n = 1) {
    const gt = tiersFor(t.slug).find(x => x.name === name);
    const q = Math.min(MAX_QTY, Math.max(1, n || 1));
    setTier(gt ? gt.name : ""); setQty(q); setCustom(""); setAmountErr("");
    setAmount(gt ? gt.amount * (gt.min ? 1 : q) : t.default);
  }
  // One list holds both: a type ("general") gives presets + any amount, a giving tier ("tier:The Toolkit") a fixed price.
  function choose(v: string) {
    const gt = givingTiers.find(x => "tier:" + x.name === v);
    const t = findDonationType(gt ? gt.type : v);
    if (!t) return;
    pickType(t);
    if (gt) pickTier(gt.name, t);
  }
  function changeQty(n: number) {
    if (!chosenTier) return;
    const q = Math.min(MAX_QTY, Math.max(1, n));
    setQty(q); setAmount(chosenTier.amount * q);
  }

  // An amount that isn't one of the type's presets goes in the "other amount" box so it stays visible.
  function pickAmount(n: number, t = type) {
    setAmount(n); setAmountErr("");
    setCustom(t.presets.includes(n) ? "" : String(n));
  }
  const tiers = tiersFor(type.slug), chosenTier = tiers.find(x => x.name === tier);
  const fixed = chosenTier && !chosenTier.min;

  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const r = top.current?.getBoundingClientRect();
    if (r && r.top < 80) top.current?.scrollIntoView({ block: "start" });
    if (step === 2) setTimeout(() => document.getElementById("d-name")?.focus(), 50);
  }, [step]);

  // After adding to the giving list (or paying) the builder starts fresh on the same type.
  function resetBuilder() {
    setPurpose("general"); setDed(blankDedication); setDedErr("");
    pickType(type); setFreq("once");
  }
  function giveAgain() {
    resetBuilder(); setKeep(true);
    setF(p => ({ ...blank, name: p.name, email: p.email })); setErrs({}); setAlert(""); setReceipt(null);
    setStep(1);
  }

  const dedication = dedicationLine(purpose, ded);
  const sum = totals(cart);
  const brand = brandOf(f.card.replace(/\D/g, ""));
  const set = (k: keyof Fields, v: string) => setF(p => ({ ...p, [k]: v }));

  function add() {
    const least = chosenTier?.min ? chosenTier.amount : 5;
    if (!(amount >= least)) { setAmountErr(`Please enter at least ${money(least)}.`); document.getElementById("d-custom")?.focus(); return; }
    if (purpose !== "general" && ded.who.trim().length < 2) { setDedErr("Tell us who this gift is for."); document.getElementById("d-who")?.focus(); return; }
    addToCart({ type: type.slug, ...(chosenTier && { tier: chosenTier.name }), qty: fixed ? qty : 1, amount, freq, purpose, ...(purpose === "general" ? blankDedication : ded) });
    say(`Added ${money(amount)} to your giving list`);
    resetBuilder();
    setTimeout(() => document.getElementById("review")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function fill(num: string) {
    if (step !== 2) return;
    setF(p => ({
      ...p, card: formatCard(num),
      exp: p.exp || "12 / " + String((new Date().getFullYear() + 3) % 100).padStart(2, "0"),
      cvc: p.cvc || (brandOf(num) === "amex" ? "1234" : "123"),
      zip: p.zip || "60030",
    }));
  }

  function validate() {
    const e: Partial<Fields> = {};
    const card = f.card.replace(/\D/g, ""), exp = f.exp.replace(/\D/g, ""), now = new Date();
    if (f.name.trim().length < 2) e.name = "Enter the name on the card.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = "Enter a valid email address.";
    if (card.length < 15) e.card = "Enter the full card number.";
    else if (!TEST[card]) e.card = "Demo mode only accepts test cards. Use 4242 4242 4242 4242.";
    const mm = +exp.slice(0, 2), yy = +exp.slice(2, 4);
    if (exp.length !== 4 || mm < 1 || mm > 12) e.exp = "Use MM / YY.";
    else if (2000 + yy < now.getFullYear() || (2000 + yy === now.getFullYear() && mm < now.getMonth() + 1)) e.exp = "This card has expired.";
    const need = brandOf(card) === "amex" ? 4 : 3;
    if (f.cvc.length !== need) e.cvc = need + " digits.";
    if (f.zip.length !== 5) e.zip = "5-digit ZIP.";
    setErrs(e);
    const first = (["name", "email", "card", "exp", "cvc", "zip"] as const).find(k => e[k]);
    if (first) document.getElementById("d-" + first)?.focus();
    return !first;
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setAlert("");
    if (!cart.length) return setStep(1);
    if (!validate()) return;
    const card = f.card.replace(/\D/g, ""), items = cart;
    setBusy(true);
    setTimeout(async () => {
      setBusy(false);
      if (TEST[card] === "decline") {
        setAlert("Your card was declined. Try a different card.");
        setErrs({ card: " " }); document.getElementById("d-card")?.focus();
        return;
      }
      const b = brandOf(card) as keyof typeof brandNames;
      const id = "LCTC-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      const name = f.name.trim(), email = f.email.trim(), paidWith = `${brandNames[b]} ending ${card.slice(-4)}`;
      for (const i of items) {
        const d = describe(i);
        insert("donations", {
          receipt: id, name, email, amount: i.amount, freq: i.freq, fund: d.type.name, ...(d.tierLabel && { tier: d.tierLabel }),
          ...(d.dedication && { dedication: d.dedication, ...(i.note.trim() && { note: i.note.trim() }) }), keepInTouch: keep,
          card: paidWith, createdAt: now(),
        });
      }
      if (keep && !getAll("subscribers").some(s => s.email.toLowerCase() === email.toLowerCase())) insert("subscribers", { email, name, createdAt: now() });
      setReceipt({
        first: name.split(/\s+/)[0], id, items, card: paidWith, email, keep,
        date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      });
      clearCart();
      setF(p => ({ ...p, card: "", exp: "", cvc: "" }));
      setStep(3);
      const fx = await getConfetti();
      if (!fx) return;
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const fire = (o: object) => fx({ colors: [...palette, "#ffd166"], ...o });
      setTimeout(() => {
        fire({ particleCount: reduce ? 60 : 160, spread: 100, startVelocity: 50, origin: { y: .55 } });
        if (!reduce) setTimeout(() => {
          fire({ particleCount: 90, angle: 60, spread: 70, origin: { x: 0, y: .8 } });
          fire({ particleCount: 90, angle: 120, spread: 70, origin: { x: 1, y: .8 } });
        }, 250);
      }, 350);
    }, 1700);
  }

  const field = (k: keyof Fields, label: string, props: React.InputHTMLAttributes<HTMLInputElement>, fmt?: (v: string) => string, extra?: React.ReactNode) => (
    <div className={"field" + (k === "card" ? " cardnum" : "")}>
      <label htmlFor={"d-" + k}>{label}</label>
      <input id={"d-" + k} type="text" autoComplete="off" value={f[k]} aria-invalid={errs[k] ? true : undefined} aria-describedby={"e-" + k}
        onChange={e => set(k, fmt ? fmt(e.target.value) : e.target.value)} {...props} />
      {extra}
      <p className="err" id={"e-" + k}>{errs[k]?.trim()}</p>
    </div>
  );

  const cartCount = `${cart.length} ${cart.length === 1 ? "gift" : "gifts"}`;

  return (
    <div className="form-card donate-card" ref={top}>
      <div>
        <p className="demo-note" role="note">
          <span aria-hidden="true">⚠️</span>
          <span><b>Demo mode.</b> No card is charged. Completed gifts show up in the admin dashboard. Pay with test card <code title="Click to fill" onClick={() => fill("4242424242424242")}>4242 4242 4242 4242</code> or <code title="Click to fill" onClick={() => fill("5555555555554444")}>5555 5555 5555 4444</code>, any future date and any CVC. <code title="Click to fill" onClick={() => fill("4000000000000002")}>4000 0000 0000 0002</code> shows a decline.</span>
        </p>
        <ol className="steps" aria-label="Checkout steps">
          {["Choose", "Pay", "Done"].map((l, n) => <li key={l} className={n + 1 <= step ? "on" : ""} aria-current={n + 1 === step ? "step" : undefined}><span>{l}</span></li>)}
        </ol>

        {step === 1 && (
          <section>
            {cart.length > 0 && (
              <div className="review" id="review">
                <h3>🎁 Your giving list · {cartCount}</h3>
                <GivingLines />
                <button className="btn blue pay" type="button" onClick={() => setStep(2)}>Continue to payment · {money(sum.today)}</button>
                <p className="hint">Or add another gift below, from the pillars or a giving tier.</p>
              </div>
            )}
            <h2 className="dm-title" id="dm-title">Choose a gift</h2>
            <p className="dm-sub">Pick what your gift supports, set an amount, then add it to your giving list. Add as many gifts as you like and pay for them together.</p>
            {/* Fixed-price items come first; a general or pillar gift of any amount is the fallback below them. */}
            <fieldset className="contribs">
              <legend>Fund something specific</legend>
              {givingTiers.map(x => (
                <label className="choice" key={x.name}>
                  <input type="radio" name="contrib" checked={chosenTier?.name === x.name} onChange={() => choose("tier:" + x.name)} />
                  <div><b>{x.item}</b><span>{x.impact}</span></div>
                  <em>{money(x.amount)}{x.min ? "+" : ""}</em>
                </label>
              ))}
              <p className="contribs-or">Or give any amount to</p>
              {donationTypes.map(t => (
                <label className="choice" key={t.slug}>
                  <input type="radio" name="contrib" checked={!chosenTier && type.slug === t.slug} onChange={() => choose(t.slug)} />
                  <i aria-hidden="true">{t.icon}</i>
                  <div><b>{t.name}</b><span>{t.text}</span></div>
                </label>
              ))}
            </fieldset>
            <div className="seg" role="group" aria-label="Gift frequency">
              {(Object.keys(frequencies) as Freq[]).map(k => (
                <button key={k} type="button" aria-pressed={freq === k} onClick={() => setFreq(k)}>{frequencies[k].label}</button>
              ))}
            </div>
            {fixed ? (
              <div className="fixed-gift">
                <div>
                  <b>{chosenTier.item}</b>
                  <span>{money(chosenTier.amount)} each</span>
                </div>
                <div className="qty" role="group" aria-label="How many">
                  <button type="button" aria-label="One fewer" disabled={qty <= 1} onClick={() => changeQty(qty - 1)}>−</button>
                  <output aria-live="polite">{qty}</output>
                  <button type="button" aria-label="One more" disabled={qty >= MAX_QTY} onClick={() => changeQty(qty + 1)}>+</button>
                </div>
                <p className="fixed-total">Total <b>{money(amount)}</b></p>
              </div>
            ) : <>
            {!chosenTier && <div className="amounts" role="group" aria-label="Gift amount">
              {type.presets.map(a => (
                <button key={a} className="amt" type="button" aria-pressed={!custom && amount === a} onClick={() => pickAmount(a)}>{money(a)}</button>
              ))}
            </div>}
            <div className="field custom">
              <label htmlFor="d-custom" className="sr-only">Other amount</label>
              <span aria-hidden="true">$</span>
              <input id="d-custom" type="text" inputMode="decimal" placeholder={chosenTier ? `${money(chosenTier.amount)} or more` : "Any other amount"} autoComplete="off" value={custom}
                onChange={e => {
                  const v = e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1").replace(/(\.\d{2}).+/, "$1");
                  setCustom(v); setAmountErr("");
                  const n = parseFloat(v);
                  if (n > 0) setAmount(n);
                  else if (!v) setAmount(chosenTier ? chosenTier.amount : type.default);
                }} />
              <p className="err">{amountErr}</p>
            </div>
            </>}

            <h3 className="dm-h3">Who is this gift for?</h3>
            <fieldset>
              <legend className="sr-only">Purpose of your gift</legend>
              <div className="choice-grid">
                {(Object.keys(purposes) as Purpose[]).map(k => (
                  <label className="choice" key={k}>
                    <input type="radio" name="purpose" checked={purpose === k} onChange={() => { setPurpose(k); setDedErr(""); }} />
                    <i aria-hidden="true">{purposes[k].icon}</i>
                    <div><b>{purposes[k].label}</b><span>{purposes[k].text}</span></div>
                  </label>
                ))}
              </div>
            </fieldset>
            {purpose !== "general" && <>
              <div className="field">
                <label htmlFor="d-who">Their name</label>
                <input id="d-who" type="text" autoComplete="off" placeholder="e.g. Rosa Diaz, the Class of 2026, Acme Builders" value={ded.who} aria-invalid={dedErr ? true : undefined} aria-describedby="e-who"
                  onChange={e => { setDed(d => ({ ...d, who: e.target.value })); setDedErr(""); }} />
                <p className="err" id="e-who">{dedErr}</p>
              </div>
              <div className="field">
                <label htmlFor="d-why">Occasion or reason <span className="opt">optional</span></label>
                <input id="d-why" type="text" autoComplete="off" placeholder="e.g. their birthday, her love of cooking" value={ded.why} onChange={e => setDed(d => ({ ...d, why: e.target.value }))} />
                <div className="chips occasions" role="group" aria-label="Common occasions">
                  {occasions.map(o => <button key={o} type="button" className="chip" aria-pressed={ded.why === o} onClick={() => setDed(d => ({ ...d, why: d.why === o ? "" : o }))}>{o.replace(/^(their|an|the) /, "")}</button>)}
                </div>
              </div>
              <div className="field">
                <label htmlFor="d-note">A note for them <span className="opt">optional</span></label>
                <textarea id="d-note" rows={2} maxLength={300} placeholder="Happy birthday, Mom. This one's for the next generation of chefs." value={ded.note} onChange={e => setDed(d => ({ ...d, note: e.target.value }))} />
              </div>
              <blockquote className="dedication" aria-live="polite">
                {dedication || <>I am donating {purposes[purpose].phrase} <u>their name</u> because of <u>the occasion</u>.</>}
              </blockquote>
            </>}
            <button className="btn blue pay" type="button" onClick={add}>Add to giving list · {money(amount)}{frequencies[freq].per}</button>
          </section>
        )}

        {step === 2 && (
          <section>
            <button className="back" type="button" onClick={() => setStep(1)}>← Add another gift</button>
            <div className="review">
              <h3>Review your giving list</h3>
              <GivingLines />
              <p className="review-total"><span>Total today</span><b>{money(sum.today)}</b></p>
              {(sum.monthly > 0 || sum.yearly > 0) && <p className="hint">Then {repeats(sum)}, until you cancel.</p>}
            </div>
            <form onSubmit={submit} noValidate autoComplete="off">
              {alert && <p className="form-alert" role="alert">{alert}</p>}
              <div className="row2">
                {field("name", "Full name", {})}
                {field("email", "Email for receipt", { type: "email" })}
              </div>
              <div className="test-cards" role="group" aria-label="Fill a test card">
                <span>Test cards:</span>
                <button type="button" onClick={() => fill("4242424242424242")}>Visa ✓</button>
                <button type="button" onClick={() => fill("5555555555554444")}>Mastercard ✓</button>
                <button type="button" className="bad" onClick={() => fill("4000000000000002")}>Declined ✕</button>
              </div>
              <div className="cardbox">
                {field("card", "Card number", { inputMode: "numeric", placeholder: "1234 1234 1234 1234" }, formatCard,
                  <span className={"brand-tag " + brand}>{brand ? brandNames[brand] : "Card"}</span>)}
                <div className="row3">
                  {field("exp", "Expiry", { inputMode: "numeric", placeholder: "MM / YY" }, formatExp)}
                  {field("cvc", "CVC", { inputMode: "numeric", placeholder: brand === "amex" ? "1234" : "123" }, v => v.replace(/\D/g, "").slice(0, 4))}
                  {field("zip", "ZIP", { inputMode: "numeric", placeholder: "60030" }, v => v.replace(/\D/g, "").slice(0, 5))}
                </div>
              </div>
              <label className="check-row">
                <input type="checkbox" checked={keep} onChange={e => setKeep(e.target.checked)} />
                <span>Keep in touch. Send me stories from the students my gift helps, a few times a year.</span>
              </label>
              <button className="btn blue pay" type="submit" disabled={busy || !cart.length}>
                {busy ? <><span className="spinner" aria-hidden="true" /> Processing…</> : `Donate ${money(sum.today)}`}
              </button>
              <p className="secure">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                Demo checkout. Card details never leave this page.
              </p>
            </form>
          </section>
        )}

        {step === 3 && receipt && (() => {
          const t = totals(receipt.items);
          return (
            <section className="done-box" aria-live="polite">
              <svg className="check" viewBox="0 0 84 84" aria-hidden="true"><circle cx="42" cy="42" r="36" /><path d="m28 43 10 10 18-20" /></svg>
              <p className="pill-ok">Donation complete</p>
              <h2 className="dm-title">Congratulations, {receipt.first}!</h2>
              <p className="dm-sub" style={{ marginBottom: 0 }}>Your {receipt.items.length > 1 ? `${receipt.items.length} gifts are` : "gift is"} on their way to Lake County Tech Campus students. A receipt would go to {receipt.email}.</p>
              {receipt.items.map(i => { const d = dedicationLine(i.purpose, i); return d && <blockquote className="dedication" key={i.id}>{d}</blockquote>; })}
              <p className="keep-note">{receipt.keep
                ? <>💌 We&apos;ll keep in touch at <b>{receipt.email}</b> with stories from the students you&apos;re helping.</>
                : <>💌 Want to hear how your gift is used? Tick &ldquo;Keep in touch&rdquo; next time and we&apos;ll send student stories.</>}</p>
              <dl className="receipt">
                <div><dt>Confirmation</dt><dd>{receipt.id}</dd></div>
                {receipt.items.map(i => { const d = describe(i); return <div key={i.id}><dt>{d.tierLabel || d.title}</dt><dd>{d.price}</dd></div>; })}
                <div><dt>Total today</dt><dd>{money(t.today)}</dd></div>
                {(t.monthly > 0 || t.yearly > 0) && <div><dt>Repeats</dt><dd>{repeats(t)}</dd></div>}
                <div><dt>Payment</dt><dd>{receipt.card}</dd></div>
                <div><dt>Date</dt><dd>{receipt.date}</dd></div>
              </dl>
              <p className="dm-sub" style={{ fontSize: ".78rem" }}>This is a demo receipt. No money was charged and no email was sent.</p>
              <div className="done-actions">
                <button className="btn blue" type="button" onClick={giveAgain}>Give again</button>
                <ConfettiButton className="btn line">More confetti 🎉</ConfettiButton>
              </div>
            </section>
          );
        })()}
      </div>
    </div>
  );
}
