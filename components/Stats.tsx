"use client";
import Icon from "@/components/Icon";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useData } from "@/lib/store";

const fmt = (n: number) => n.toLocaleString("en-US");

/** Counts up to `value` the first time it scrolls into view, and shows any later change straight away. */
function Count({ value, prefix = "" }: { value: number; prefix?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(value);
  const played = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (played.current || !el || matchMedia("(prefers-reduced-motion: reduce)").matches) { setShown(value); return; }
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      played.current = true;
      const t0 = performance.now(), dur = 1400;
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / dur);
        setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: .6 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value]);

  return <b ref={ref}>{prefix}{fmt(shown)}</b>;
}

/** Figures from the most recent yearly report (Admin → Yearly reports). */
export default function Stats() {
  const reports = useData("reports");
  // School years are named like "2025–26" (US convention: fall to spring); the newest one leads.
  const key = (y: string) => parseInt(y, 10) || 0;
  const r = [...reports].sort((a, b) => key(b.year) - key(a.year) || b.year.localeCompare(a.year))[0];
  if (!r) return null;
  const stats = [
    { value: r.students, label: "students supported" },
    { value: r.scholarships, label: "scholarships & grants" },
    { value: r.granted, prefix: "$", label: "awarded to students" },
    { value: r.donors, label: "donors" },
  ];
  return (
    <div className="stat-strip">
      <div className="wrap">
        <div className="stats">
          {stats.map(s => (
            <div className="stat" key={s.label}>
              <Count value={Number(s.value) || 0} prefix={s.prefix} />
              <span>{s.label}</span>
            </div>
          ))}
        </div>
        <p className="stat-note">
          {r.sample ? <><span className="sample-tag">Sample figures</span> </> : null}
          {r.year} school year · <Link href="/impact">See every year <Icon name="→" /></Link>
        </p>
      </div>
    </div>
  );
}
