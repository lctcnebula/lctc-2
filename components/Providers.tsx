"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { Options } from "canvas-confetti";

export const palette = ["#015998", "#013f6c", "#a7aab0", "#ffffff", "#5fa8e0", "#ff8a3d"];

type Fire = (o: Options) => void;
type Site = {
  say: (msg: string) => void;
  throwConfetti: (el: HTMLElement) => void;
  getConfetti: () => Promise<Fire | null>;
};

const SiteContext = createContext<Site | null>(null);
export const useSite = () => {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite must be used inside <Providers>");
  return ctx;
};

const prefersReduced = () => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function Providers({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState({ msg: "", show: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pathname = usePathname();

  const say = useCallback((msg: string) => {
    setToast({ msg, show: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2400);
  }, []);

  const getConfetti = useCallback(async (): Promise<Fire | null> => {
    try {
      const confetti = (await import("canvas-confetti")).default;
      return o => void confetti(o);
    } catch {
      return null;
    }
  }, []);

  const throwConfetti = useCallback(async (el: HTMLElement) => {
    const fx = await getConfetti();
    if (!fx) return say("🎉 Thanks for celebrating with us!");
    const r = el.getBoundingClientRect();
    const origin = { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight };
    if (prefersReduced()) fx({ particleCount: 60, spread: 70, origin, colors: palette, ticks: 80 });
    else {
      fx({ particleCount: 130, spread: 85, startVelocity: 45, origin, colors: palette });
      setTimeout(() => {
        fx({ particleCount: 80, angle: 60, spread: 60, origin: { x: 0, y: .75 }, colors: palette });
        fx({ particleCount: 80, angle: 120, spread: 60, origin: { x: 1, y: .75 }, colors: palette });
      }, 220);
    }
    say("🎉 Here's to Lake County students!");
  }, [getConfetti, say]);

  // Every new page opens at the top, instantly (no animated scroll from where you clicked).
  useEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  // Reveal-on-scroll for any element with .reveal, including ones rendered later from stored data.
  useEffect(() => {
    document.documentElement.classList.add("js");
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -8% 0px" });
    const seen = new WeakSet<Element>();
    const scan = () => document.querySelectorAll<HTMLElement>(".reveal:not(.in)").forEach(el => {
      if (seen.has(el)) return;
      seen.add(el);
      const inGrid = el.parentElement?.classList.contains("grid");
      el.style.transitionDelay = (inGrid ? [...el.parentElement!.children].indexOf(el) * 90 : 0) + "ms";
      io.observe(el);
    });
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, [pathname]);

  const site: Site = { say, throwConfetti, getConfetti };

  return (
    <SiteContext.Provider value={site}>
      {children}
      <div className={"toast" + (toast.show ? " show" : "")} role="status" aria-live="polite">{toast.msg}</div>
    </SiteContext.Provider>
  );
}
