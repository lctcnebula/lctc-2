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
                      <div className="qty sm" role="group" aria-label={`How many: ${d.title}`}>
                        <button type="button" aria-label="One fewer" disabled={i.qty <= 1} onClick={() => setQty(i.id, i.qty - 1)}>−</button>
                        <output aria-live="polite">{i.qty}</output>
                        <button type="button" aria-label="One more" disabled={i.qty >= MAX_QTY} onClick={() => setQty(i.id, i.qty + 1)}>+</button>
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

// "Add to giving list" for a giving tier, used on the pricing page.
export function AddTierToCart({ name, className = "btn line" }: { name: string; className?: string }) {
  const { say } = useSite();
  const t = givingTiers.find(x => x.name === name);
  if (!t) return null;
  return (
    <button type="button" className={className} onClick={() => {
      addToCart({ type: t.type, tier: t.name, qty: 1, amount: t.amount, freq: "once", purpose: "general", who: "", why: "", note: "" });
      say(`Added ${t.item.toLowerCase()} to your giving list`);
      openGivingList();
    }}>Add to giving list</button>
  );
}
