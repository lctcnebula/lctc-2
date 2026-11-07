"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSite } from "./Providers";
import { addToCart, describe, MAX_QTY, removeFromCart, repeats, setQty, totals, useCart } from "@/lib/cart";
import { givingTiers, money } from "@/lib/content";
import { frequencies } from "@/lib/seed";

// The giving list (the donation cart) is a sidebar that slides in from the right on every page. Anything can open it
// with openGivingList(); the donate page listens for CHECKOUT / ADD_MORE to switch step without reloading.
const OPEN = "lctc:open-giving-list";
export const CHECKOUT = "lctc:checkout";
export const ADD_MORE = "lctc:add-more";
export const openGivingList = () => dispatchEvent(new Event(OPEN));

export function HeaderCart() {
  const n = useCart().length;
  return (
    <button type="button" className="cart-btn" onClick={openGivingList} aria-haspopup="dialog"
      aria-label={n ? `Giving list, ${n} ${n === 1 ? "gift" : "gifts"}` : "Giving list, empty"} title="Giving list">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8M12 8v13M12 8S10.5 3 8 3a2.5 2.5 0 0 0 0 5M12 8s1.5-5 4-5a2.5 2.5 0 0 1 0 5" /></svg>
      {n > 0 && <span className="cart-count">{n}</span>}
    </button>
  );
}

export function GivingSidebar() {
  const cart = useCart(), pathname = usePathname(), router = useRouter();
  const { say } = useSite();
  const [open, setOpen] = useState(false);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    const show = () => { opener.current = document.activeElement; setOpen(true); };
    addEventListener(OPEN, show);
    return () => removeEventListener(OPEN, show);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  // While open: Esc closes, the page behind doesn't scroll, focus starts on the close button and goes back after.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    setTimeout(() => closeBtn.current?.focus(), 50);
    return () => {
      removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [open]);

  // On /donate the checkout just changes step; anywhere else it goes there first.
  const go = (event: string, url: string) => {
    setOpen(false);
    if (pathname === "/donate") dispatchEvent(new Event(event));
    else router.push(url);
  };

  const sum = totals(cart);
  return (
    <>
      <div className={"gl-backdrop" + (open ? " open" : "")} onClick={() => setOpen(false)} aria-hidden="true" />
      <aside className={"giving-sidebar" + (open ? " open" : "")} role="dialog" aria-modal="true" aria-labelledby="gl-title" inert={!open}>
        <header>
          <div>
            <h2 id="gl-title">Your giving list</h2>
            <p>{cart.length ? `${cart.length} ${cart.length === 1 ? "gift" : "gifts"} for Lake County Tech Campus students` : "Nothing here yet"}</p>
          </div>
          <button ref={closeBtn} type="button" className="gl-close" aria-label="Close giving list" onClick={() => setOpen(false)}>×</button>
        </header>

        {cart.length ? <>
          <ul className="cart-lines">
            {cart.map(i => {
              const d = describe(i);
              return (
                <li key={i.id}>
                  <i aria-hidden="true">{d.icon}</i>
                  <div className="cart-info">
                    <b>{d.title}</b>
                    <span>{frequencies[i.freq].label} · {d.tierLabel ? d.type.name : "Any amount"}</span>
                    {d.dedication && <span className="cart-ded">🕊️ {d.dedication}</span>}
                    {d.fixed && (
                      <div className="qty-field sm">
                        <QtyInput id={"q-" + i.id} value={i.qty} onChange={n => setQty(i.id, n)} label={`How many: ${d.title}`} />
                        <small>× {money(d.unit!)}</small>
                      </div>
                    )}
                    <div className="cart-price">
                      <b>{d.price}</b>
                      <button type="button" className="link-btn" onClick={() => { removeFromCart(i.id); say(`Removed ${d.title.toLowerCase()} from your giving list`); }}>Remove</button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <footer>
            <dl className="cart-total">
              <div><dt>Total today</dt><dd>{money(sum.today)}</dd></div>
              {(sum.monthly > 0 || sum.yearly > 0) && <p className="hint">Then {repeats(sum)}, until you cancel.</p>}
            </dl>
            <button className="btn blue pay" type="button" onClick={() => go(CHECKOUT, "/donate?pay=1")}>Continue to payment · {money(sum.today)}</button>
            <button className="btn line pay" type="button" onClick={() => go(ADD_MORE, "/donate")}>+ Add another gift</button>
          </footer>
        </> : (
          <div className="cart-empty">
            <p>🎁 Your giving list is empty.</p>
            <p className="hint">Choose a scholarship, a toolkit or any amount, and it&apos;ll wait here until you&apos;re ready to give.</p>
            <button className="btn blue" type="button" onClick={() => go(ADD_MORE, "/donate")}>Choose a gift</button>
          </div>
        )}
      </aside>
    </>
  );
}

// "Add to giving list" for a giving tier, used on the pricing and Get Involved pages.
export function AddTierToCart({ name, className = "btn line", label = "Add to giving list" }: { name: string; className?: string; label?: string }) {
  const { say } = useSite();
  const t = givingTiers.find(x => x.name === name);
  if (!t) return null;
  return (
    <button type="button" className={className} onClick={() => {
      addToCart({ type: t.type, tier: t.name, qty: 1, amount: t.amount, freq: "once", purpose: "general", who: "", why: "", note: "" });
      say(`Added ${t.item.toLowerCase()} to your giving list`);
      openGivingList();
    }}>{label}</button>
  );
}

/** A typed quantity (1 to MAX_QTY). Bad or empty input snaps back when the field loses focus. */
export function QtyInput({ id, value, onChange, label }: { id: string; value: number; onChange: (n: number) => void; label: string }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  return (
    <span className="qty-input">
      <label htmlFor={id}>Qty</label>
      <input id={id} type="text" inputMode="numeric" pattern="[0-9]*" aria-label={label} value={text} maxLength={2}
        onChange={e => {
          const v = e.target.value.replace(/\D/g, "").slice(0, 2);
          setText(v);
          const n = parseInt(v, 10);
          if (n >= 1) onChange(Math.min(MAX_QTY, n));
        }}
        onBlur={() => setText(String(value))} />
    </span>
  );
}

/** "General donation" on the Get involved page: the donor types any amount and adds it to their giving list. */
export function GeneralGiftCard() {
  const { say } = useSite();
  const [amt, setAmt] = useState("50");
  const [err, setErr] = useState("");
  const n = parseFloat(amt);
  function give() {
    if (!(n >= 5)) { setErr("Please enter at least $5."); document.getElementById("gen-amt")?.focus(); return; }
    addToCart({ type: "general", qty: 1, amount: Math.round(n * 100) / 100, freq: "once", purpose: "general", who: "", why: "", note: "" });
    say(`Added ${money(n)} to your giving list`);
    openGivingList();
  }
  return (
    <article className="reveal general-gift">
      <p className="gift-tag"><i aria-hidden="true">💙</i>General donation</p>
      <h3>Give any amount</h3>
      <p className="gift-item">Wherever students need it most</p>
      <p className="gift-impact">Not sure what to fund? A general gift goes to the scholarships, tools and credentials students need most this year.</p>
      <footer>
        <div className="amount-field">
          <label htmlFor="gen-amt">Your amount</label>
          <span><b aria-hidden="true">$</b><input id="gen-amt" type="text" inputMode="decimal" value={amt} aria-invalid={err ? true : undefined}
            onChange={e => { setErr(""); setAmt(e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1").replace(/(\.\d{2}).+/, "$1").slice(0, 9)); }}
            onKeyDown={e => { if (e.key === "Enter") give(); }} /></span>
          {err && <small className="err">{err}</small>}
        </div>
        <button type="button" className="btn sm blue" onClick={give}>Give {n >= 5 ? money(n) : "this gift"}</button>
      </footer>
    </article>
  );
}
