"use client";

/*
 * Seasonal "wow factor" layer.
 *  - Season is chosen on the client only (after hydration) from the month, unless the
 *    visitor picked one with the pill (localStorage "lctc-season").
 *  - <html data-season="..."> lets CSS theme things.
 *  - LogoSeason / HeaderLights decorate the header; SeasonAmbient is a ~30s particle
 *    "video" over the page; SeasonSwitcher is the bottom-right pill.
 */

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

export type Season = "winter" | "spring" | "summer" | "fall";
export type SeasonPref = "auto" | Season;

const KEY = "lctc-season";
const SEASONS: Season[] = ["winter", "spring", "summer", "fall"];
const META: Record<Season, { label: string; emoji: string }> = {
  winter: { label: "Winter", emoji: "❄️" },
  spring: { label: "Spring", emoji: "🌸" },
  summer: { label: "Summer", emoji: "☀️" },
  fall: { label: "Fall", emoji: "🍂" },
};

/** Nov–Feb winter (holiday), Mar–May spring, Jun–Aug summer, Sep–Oct fall. */
export function seasonForDate(d = new Date()): Season {
  const m = d.getMonth(); // 0 = Jan
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m === 8 || m === 9) return "fall";
  return "winter";
}

/* ---------- tiny client store (shared by header, ambient layer and pill) ---------- */

type State = { pref: SeasonPref; season: Season; replay: number } | null;
let state: State = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const getSnapshot = () => state;
const getServerSnapshot = (): State => null;

function readPref(): SeasonPref {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "auto" || (SEASONS as string[]).includes(v ?? "")) return v as SeasonPref;
  } catch { /* storage blocked */ }
  return "auto";
}

function apply(pref: SeasonPref, replay: number) {
  const season = pref === "auto" ? seasonForDate() : pref;
  state = { pref, season, replay };
  try { document.documentElement.dataset.season = season; } catch { /* noop */ }
  emit();
}

/** Called from effects only, so the server render and first client render match. */
function init() {
  if (!state) apply(readPref(), 0);
}

export function setSeasonPref(pref: SeasonPref) {
  try { localStorage.setItem(KEY, pref); } catch { /* storage blocked */ }
  apply(pref, (state?.replay ?? 0) + 1);
}

/** Returns null on the server and during hydration; the season once mounted. */
export function useSeason() {
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(init, []);
  return s;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/* ---------- Logo decoration (inside .brand) ---------- */

function SantaHat() {
  return (
    <svg viewBox="0 0 64 64" className="sz-hat">
      <g transform="translate(0 8)">
      <path d="M8 40 C 14 20, 30 6, 46 8 C 54 9, 58 16, 60 26 C 56 22, 52 20, 48 22 C 44 30, 46 38, 50 42 Z" fill="#d42a2f" />
      <path d="M46 8 C 54 9, 58 16, 60 26 C 56 22, 52 20, 48 22 C 47 16, 46 12, 46 8 Z" fill="#a51d24" />
      <path d="M14 30 C 22 18, 32 12, 40 12" stroke="#ff6b6b" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity=".55" />
      <rect x="3" y="37" width="52" height="13" rx="6.5" fill="#fff" stroke="#dfe6ee" strokeWidth="1.2" transform="rotate(-4 29 43)" />
      <circle cx="58" cy="30" r="6.5" fill="#fff" stroke="#dfe6ee" strokeWidth="1.2" className="sz-pom" />
      </g>
    </svg>
  );
}

function Squirrel() {
  return (
    <svg viewBox="0 0 60 64" className="sz-squirrel">
      {/* tail */}
      <path className="sz-tail" d="M40 58 C 58 54, 62 36, 54 22 C 48 12, 36 10, 34 20 C 32 28, 44 30, 46 38 C 48 46, 42 52, 36 54 Z" fill="#b8692c" />
      <path d="M50 24 C 54 32, 54 42, 46 50" stroke="#d98a45" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".7" />
      {/* body */}
      <ellipse cx="28" cy="46" rx="13" ry="14" fill="#a65a22" />
      <ellipse cx="25" cy="49" rx="7" ry="9" fill="#f1c99a" />
      {/* head */}
      <circle cx="21" cy="28" r="10" fill="#a65a22" />
      <path d="M15 20 L 13 11 L 20 17 Z" fill="#a65a22" />
      <path d="M24 19 L 26 10 L 29 18 Z" fill="#8c4a1a" />
      <circle cx="17" cy="27" r="2" fill="#1d1208" />
      <circle cx="17.6" cy="26.4" r=".6" fill="#fff" />
      <circle cx="11.6" cy="31" r="1.6" fill="#3b2412" />
      {/* acorn in paws */}
      <ellipse cx="15" cy="41" rx="4.2" ry="5" fill="#c98a3a" />
      <path d="M10.4 38.6 C 11 34.6, 19 34.6, 19.6 38.6 Z" fill="#6e4520" />
      <path d="M15 34.8 L 15.6 32.6" stroke="#6e4520" strokeWidth="1.3" strokeLinecap="round" />
      <ellipse cx="19" cy="42" rx="3" ry="2.2" fill="#8c4a1a" />
      {/* feet */}
      <ellipse cx="22" cy="60" rx="6" ry="2.6" fill="#8c4a1a" />
      <ellipse cx="34" cy="60" rx="6" ry="2.6" fill="#8c4a1a" />
    </svg>
  );
}

function Leaf({ className, color = "#e8692a", vein = "#a8401a" }: { className: string; color?: string; vein?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className}>
      <path d="M20 3 L 23 11 L 30 8 L 28 16 L 37 17 L 30 23 L 33 29 L 24 27 L 21 36 L 19 36 L 16 27 L 7 29 L 10 23 L 3 17 L 12 16 L 10 8 L 17 11 Z" fill={color} />
      <path d="M20 37 L 20 12 M20 24 L 12 18 M20 24 L 28 18" stroke={vein} strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Blossom({ className, petal = "#f48fb1", center = "#ffd166" }: { className: string; petal?: string; center?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className}>
      {[0, 72, 144, 216, 288].map(r => (
        <ellipse key={r} cx="20" cy="10" rx="6.4" ry="9" fill={petal} transform={`rotate(${r} 20 20)`} />
      ))}
      <circle cx="20" cy="20" r="5.2" fill={center} />
      <circle cx="18.4" cy="18.6" r="1.4" fill="#fff" opacity=".7" />
    </svg>
  );
}

function SpringSprig() {
  return (
    <span className="sz-sprig">
      <svg viewBox="0 0 40 30" className="sz-stem">
        <path d="M4 28 C 12 22, 20 18, 30 10" stroke="#5a9e4b" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <path d="M14 22 C 12 14, 20 10, 24 12 C 22 18, 18 22, 14 22 Z" fill="#7cc26a" />
        <path d="M22 16 C 26 22, 34 22, 36 18 C 32 14, 26 14, 22 16 Z" fill="#6bb35a" />
      </svg>
      <Blossom className="sz-bloom one" />
      <Blossom className="sz-bloom two" petal="#fbd3e0" center="#ffb703" />
    </span>
  );
}

function Sun() {
  return (
    <svg viewBox="0 0 60 60" className="sz-sun">
      <g className="sz-rays" fill="#ffb703">
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d="M30 2 L 33 11 L 27 11 Z" transform={`rotate(${i * 30} 30 30)`} />
        ))}
      </g>
      <circle cx="30" cy="30" r="15" fill="#ffd166" stroke="#ffb703" strokeWidth="2" />
      {/* sunglasses */}
      <path d="M18 27 H 42" stroke="#0a2540" strokeWidth="1.6" />
      <path d="M19 27 h 9 v 3 a 4.5 4 0 0 1 -9 0 Z" fill="#0a2540" />
      <path d="M32 27 h 9 v 3 a 4.5 4 0 0 1 -9 0 Z" fill="#0a2540" />
      <path d="M21 28.4 l 2.6 0" stroke="#5fa8e0" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M34 28.4 l 2.6 0" stroke="#5fa8e0" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M24.5 36 Q 30 40 35.5 36" stroke="#b5651d" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** Drop inside `.brand`. Renders nothing until the season is known on the client. */
export function LogoSeason() {
  const s = useSeason();
  if (!s) return null;
  return (
    <span key={s.season} className={"season-logo is-" + s.season} aria-hidden="true">
      {s.season === "winter" && <SantaHat />}
      {s.season === "fall" && (
        <>
          <Squirrel />
          <Leaf className="sz-leaf a" />
          <Leaf className="sz-leaf b" color="#c8452c" vein="#7d2414" />
        </>
      )}
      {s.season === "spring" && <SpringSprig />}
      {s.season === "summer" && <Sun />}
    </span>
  );
}

/* ---------- A garland along the bottom edge of the header, one per season ----------
 * Winter: Christmas lights. Spring: a vine of flowers. Summer: a beach (waves, sand, shells).
 * Fall: a twine of orange and red leaves. All hang on the same scalloped line. */

const SCALLOPS = 9;
const PER = 4; // items per scallop
const SAG = 10; // px
const PROGRAM_ORNAMENTS = ["🚗", "🔧", "🧬", "🩺", "🔨", "✂️", "⚖️", "🍳", "🛡️", "🧸", "🩺", "🚒", "</>", "⚙️", "🔍", "💉", "🖌️", "🔥"];
const BULB_COLORS = ["#ff4d4d", "#ffd23f", "#3ddc84", "#4dabff", "#ff8a3d"];
const FLOWER_COLORS: [string, string][] = [["#f48fb1", "#ffd166"], ["#ffffff", "#ffc23d"], ["#c3a6ff", "#ffe08a"], ["#ff8fa3", "#fff1a8"], ["#ffd1e0", "#f4a259"]];
const LEAF_COLORS: [string, string][] = [["#e8692a", "#a8401a"], ["#c8452c", "#7d2414"], ["#f2a33a", "#b46a12"], ["#d9572b", "#8f3216"], ["#e9b949", "#a7781a"]];
const WIRE: Record<Season, string> = { winter: "#2f4a35", spring: "#5f9e4f", fall: "#8a5a36", summer: "transparent" };

type Spot = { x: number; y: number; rot: number; i: number };
function spots(): Spot[] {
  const out: Spot[] = [];
  for (let k = 0; k < SCALLOPS; k++) {
    for (let j = 0; j < PER; j++) {
      const t = (j + 0.5) / PER;
      const y = 4 * SAG * t * (1 - t); // quadratic sag; peak = SAG at t=.5
      const slope = (4 * SAG * (1 - 2 * t)) / 120; // tilts each item with the wire
      out.push({ x: ((k + t) / SCALLOPS) * 100, y, rot: Math.atan(slope) * (180 / Math.PI), i: k * PER + j });
    }
  }
  return out;
}
function wirePath() {
  let d = "M0 0";
  for (let k = 0; k < SCALLOPS; k++) {
    const x0 = (k / SCALLOPS) * 1000, x1 = ((k + 1) / SCALLOPS) * 1000;
    d += ` Q ${(x0 + x1) / 2} ${SAG * 2} ${x1} 0`;
  }
  return d;
}

function GFlower({ petal, center }: { petal: string; center: string }) {
  return (
    <svg viewBox="-10 -10 20 20" width="20" height="20">
      {[0, 72, 144, 216, 288].map(a => (
        <ellipse key={a} cx="0" cy="-5" rx="3.6" ry="5" fill={petal} stroke="rgba(150,60,90,.35)" strokeWidth=".6" transform={`rotate(${a})`} />
      ))}
      <circle r="2.9" fill={center} />
    </svg>
  );
}
function GSprigLeaf() {
  return (
    <svg viewBox="0 0 12 8" width="14" height="10">
      <path d="M0 4 C3 0 9 0 12 4 C9 8 3 8 0 4Z" fill="#6cb35a" />
      <path d="M1 4 H11" stroke="#3f7d33" strokeWidth=".7" />
    </svg>
  );
}
function GMaple({ color, vein }: { color: string; vein: string }) {
  return (
    <svg viewBox="0 0 24 26" width="19" height="21">
      <path d="M12 26v-7" stroke={vein} strokeWidth="1.2" />
      <path d="M12 1l2 4.6 3.3-1.6-.9 4.7 4.2-.7-1.8 3.3 3.2 1.8-4.4 1.3.7 3.1-4-1.5L12 21l-2.3-5.1-4 1.5.7-3.1-4.4-1.3 3.2-1.8-1.8-3.3 4.2.7-.9-4.7L10 5.6z" fill={color} />
      <path d="M12 20V6M12 12l-5-3M12 12l5-3" stroke={vein} strokeWidth=".7" fill="none" opacity=".7" />
    </svg>
  );
}
function GOak({ color, vein }: { color: string; vein: string }) {
  return (
    <svg viewBox="0 0 14 24" width="13" height="22">
      <path d="M7 1c2 1 3 3 2 4 2 0 3 2 2 3.5 2 .5 2 3 .5 4 1.5 1 1 3.5-1 3.5.5 2-1 3.5-3.5 3.5-2.5 0-4-1.5-3.5-3.5-2 0-2.5-2.5-1-3.5C1 11.5 1 9 3 8.5 2 7 3 5 5 5 4 4 5 2 7 1z" fill={color} />
      <path d="M7 3v20" stroke={vein} strokeWidth=".8" />
    </svg>
  );
}

/* Summer: a strip of beach under the header, with sand, a gently moving shoreline and a few beach things. */
const BEACH_ITEMS: { x: number; kind: "shell" | "star" | "ball" | "umbrella" | "crab" }[] = [
  { x: 4, kind: "shell" }, { x: 11, kind: "star" }, { x: 19, kind: "umbrella" }, { x: 26, kind: "ball" }, { x: 34, kind: "shell" },
  { x: 42, kind: "crab" }, { x: 50, kind: "star" }, { x: 58, kind: "umbrella" }, { x: 66, kind: "shell" }, { x: 74, kind: "ball" },
  { x: 82, kind: "star" }, { x: 90, kind: "umbrella" }, { x: 97, kind: "shell" },
];
function BeachThing({ kind }: { kind: (typeof BEACH_ITEMS)[number]["kind"] }) {
  if (kind === "star") return (
    <svg viewBox="-10 -10 20 20" width="19" height="19">
      <path d="M0-9 2.4-3.2 8.6-2.8 3.8 1.3 5.3 7.4 0 4.1-5.3 7.4-3.8 1.3-8.6-2.8-2.4-3.2Z" fill="#ff9f68" stroke="#d9673a" strokeWidth=".8" strokeLinejoin="round" />
      <circle cx="0" cy="-1" r=".8" fill="#fff3e6" /><circle cx="2" cy="1" r=".6" fill="#fff3e6" /><circle cx="-2" cy="1" r=".6" fill="#fff3e6" />
    </svg>
  );
  if (kind === "shell") return (
    <svg viewBox="0 0 20 16" width="19" height="15">
      <path d="M10 15 2 6C4 1 16 1 18 6Z" fill="#ffd9c7" stroke="#d99a83" strokeWidth=".8" strokeLinejoin="round" />
      <path d="M10 15 6 3M10 15V2M10 15l4-12M10 15 3.5 5M10 15l6.5-10" stroke="#d99a83" strokeWidth=".6" />
    </svg>
  );
  if (kind === "ball") return (
    <svg viewBox="-10 -10 20 20" width="19" height="19">
      <circle r="9" fill="#fff" stroke="#c9d6e2" strokeWidth=".6" />
      <path d="M0-9A9 9 0 0 1 8.5 3 12 12 0 0 0 0-9Z" fill="#ff5d5d" />
      <path d="M8.5 3A9 9 0 0 1-6 6.8 12 12 0 0 0 8.5 3Z" fill="#3fa9f5" />
      <path d="M-6 6.8A9 9 0 0 1 0-9 12 12 0 0 0-6 6.8Z" fill="#ffd23f" />
      <circle r="2" fill="#fff" />
    </svg>
  );
  if (kind === "crab") return (
    <svg viewBox="0 0 24 16" width="22" height="15">
      <path d="M4 9 1 6M20 9l3-3M5 12l-3 2M19 12l3 2" stroke="#e04f3a" strokeWidth="1.4" strokeLinecap="round" />
      <ellipse cx="12" cy="10" rx="7.5" ry="5" fill="#ff6a50" />
      <circle cx="9.5" cy="5" r="1.6" fill="#fff" /><circle cx="14.5" cy="5" r="1.6" fill="#fff" />
      <circle cx="9.7" cy="5.2" r=".8" fill="#222" /><circle cx="14.7" cy="5.2" r=".8" fill="#222" />
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" width="28" height="28">
      <path d="M12 6v17" stroke="#8a6a4a" strokeWidth="1.3" />
      <path d="M1 9C3 2 21 2 23 9Z" fill="#ff5d73" />
      <path d="M8.3 3.2C7 5 6.4 7 6.5 9h4C10.4 7 9.8 5 8.3 3.2ZM15.7 3.2C17 5 17.6 7 17.5 9h-4c.1-2 .7-4 2.2-5.8Z" fill="#fff" />
    </svg>
  );
}
function Beach() {
  return (
    <div className="season-beach">
      <svg className="sb-water" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 0H400V7C390 7 385 11 375 11S360 7 350 7 335 11 325 11 310 7 300 7 285 11 275 11 260 7 250 7 235 11 225 11 210 7 200 7 185 11 175 11 160 7 150 7 135 11 125 11 110 7 100 7 85 11 75 11 60 7 50 7 35 11 25 11 10 7 0 7Z" fill="#7fd3e6" />
        <path d="M0 4C10 4 15 8 25 8S40 4 50 4 65 8 75 8 90 4 100 4 115 8 125 8 140 4 150 4 165 8 175 8 190 4 200 4 215 8 225 8 240 4 250 4 265 8 275 8 290 4 300 4 315 8 325 8 340 4 350 4 365 8 375 8 390 4 400 4" fill="none" stroke="#fff" strokeWidth="1.4" opacity=".85" />
      </svg>
      {BEACH_ITEMS.map((b, i) => (
        <span key={i} className={"sb-item " + b.kind} style={{ left: b.x + "%", ["--d" as string]: (i * 0.45).toFixed(2) + "s" }}>
          <BeachThing kind={b.kind} />
        </span>
      ))}
    </div>
  );
}

export function HeaderLights() {
  const s = useSeason();
  if (!s) return null;
  const season = s.season;

  return (
    <div className={"season-lights " + season} aria-hidden="true">
      {season === "summer" ? <Beach /> : (
        <>
          <svg className="sl-wire" viewBox={`0 0 1000 ${SAG + 2}`} preserveAspectRatio="none">
            <path d={wirePath()} fill="none" stroke={WIRE[season]} strokeWidth={season === "winter" ? 1.6 : 2} vectorEffect="non-scaling-stroke" />
          </svg>
          {spots().map(b => {
            const style = {
              left: b.x + "%",
              top: b.y + "px",
              transform: `translateX(-50%) rotate(${b.rot.toFixed(1)}deg)`,
              ["--d" as string]: ((b.i * 0.37) % 2.4).toFixed(2) + "s",
            } as React.CSSProperties;
            if (season === "winter") return <span key={b.i} className="sl-program" style={{ ...style, ["--c" as string]: BULB_COLORS[b.i % BULB_COLORS.length] }}>{PROGRAM_ORNAMENTS[b.i % PROGRAM_ORNAMENTS.length]}</span>;
            if (season === "spring") {
              const [petal, center] = FLOWER_COLORS[b.i % FLOWER_COLORS.length];
              return <span key={b.i} className={"sl-hang " + (b.i % 2 ? "leaf" : "flower")} style={style}>{b.i % 2 ? <GSprigLeaf /> : <GFlower petal={petal} center={center} />}</span>;
            }
            const [color, vein] = LEAF_COLORS[b.i % LEAF_COLORS.length];
            return <span key={b.i} className="sl-hang fall-leaf" style={style}>{b.i % 3 === 1 ? <GOak color={color} vein={vein} /> : <GMaple color={color} vein={vein} />}</span>;
          })}
        </>
      )}
    </div>
  );
}

/* ---------- Ambient ~30 second particle "video" ---------- */

const DURATION = 30_000;
const FADE_IN = 1500;
const FADE_OUT = 3500;

type P = { x: number; y: number; r: number; vx: number; vy: number; rot: number; vr: number; ph: number; c: string; k: number };

const PALETTES: Record<Season, string[]> = {
  winter: ["#ffffff", "#f2f8ff", "#dcebfa", "#ffffff"],
  fall: ["#ff8a3d", "#e8692a", "#c8452c", "#a8642c", "#e0a32e"],
  spring: ["#f7a8c4", "#f9c6d6", "#fde2ea", "#e6b8f0", "#fff0f5"],
  summer: ["#ffd166", "#ffb703", "#ffe08a", "#ffc94d"],
};

let leafPath: Path2D | null = null;
let petalPath: Path2D | null = null;
function paths() {
  if (!leafPath) {
    // unit maple-ish leaf centred on 0,0, ~2 units tall
    leafPath = new Path2D("M0 -1 L .15 -.55 L .5 -.7 L .4 -.3 L .9 -.25 L .5 .1 L .65 .45 L .2 .35 L .05 .9 L -.05 .9 L -.2 .35 L -.65 .45 L -.5 .1 L -.9 -.25 L -.4 -.3 L -.5 -.7 L -.15 -.55 Z");
    petalPath = new Path2D("M0 -1 C .7 -.8, .8 .3, 0 1 C -.8 .3, -.7 -.8, 0 -1 Z M0 -1 L -.12 -.7 L .12 -.7 Z");
  }
  return { leaf: leafPath, petal: petalPath! };
}

function spawn(season: Season, w: number, h: number, initial: boolean): P {
  const pal = PALETTES[season];
  const c = pal[(Math.random() * pal.length) | 0];
  const rnd = (a: number, b: number) => a + Math.random() * (b - a);
  const y = initial ? rnd(-h, h) : rnd(-60, -10);
  switch (season) {
    case "winter":
      return { x: rnd(0, w), y, r: rnd(1.2, 3.6), vx: rnd(-.15, .15), vy: rnd(.35, 1.1), rot: rnd(0, 6.28), vr: rnd(-.01, .01), ph: rnd(0, 6.28), c, k: Math.random() < .22 ? 1 : 0 };
    case "fall":
      return { x: rnd(0, w), y, r: rnd(7, 13), vx: rnd(-.3, .5), vy: rnd(.6, 1.3), rot: rnd(0, 6.28), vr: rnd(-.03, .03), ph: rnd(0, 6.28), c, k: 0 };
    case "spring":
      return { x: rnd(0, w), y, r: rnd(4, 7.5), vx: rnd(.1, .6), vy: rnd(.45, 1), rot: rnd(0, 6.28), vr: rnd(-.03, .03), ph: rnd(0, 6.28), c, k: 0 };
    case "summer":
      return { x: rnd(0, w), y: initial ? rnd(0, h) : h + rnd(10, 60), r: rnd(2.5, 6), vx: rnd(-.12, .12), vy: rnd(-.45, -.15), rot: rnd(0, 6.28), vr: rnd(-.01, .01), ph: rnd(0, 6.28), c, k: Math.random() < .35 ? 1 : 0 };
  }
}

function draw(ctx: CanvasRenderingContext2D, season: Season, p: P, t: number) {
  const { leaf, petal } = paths();
  ctx.fillStyle = p.c;
  ctx.strokeStyle = p.c;
  switch (season) {
    case "winter": {
      if (p.k) {
        // six-arm crystal
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.lineWidth = .9;
        ctx.globalAlpha *= .9;
        const L = p.r * 2.2;
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          const a = (i * Math.PI) / 3;
          ctx.moveTo(-Math.cos(a) * L, -Math.sin(a) * L);
          ctx.lineTo(Math.cos(a) * L, Math.sin(a) * L);
        }
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "fall":
    case "spring": {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(p.r * Math.max(.18, Math.abs(Math.cos(t / 900 + p.ph))), p.r); // tumbling flip
      ctx.fill(season === "fall" ? leaf : petal);
      ctx.restore();
      break;
    }
    case "summer": {
      const tw = .55 + .45 * Math.sin(t / 420 + p.ph);
      ctx.save();
      ctx.translate(p.x, p.y);
      if (p.k) {
        // soft bokeh dot
        ctx.globalAlpha *= .35 * tw + .1;
        ctx.beginPath();
        ctx.arc(0, 0, p.r * 1.6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // four-point glint
        ctx.globalAlpha *= tw;
        ctx.rotate(p.rot);
        const R = p.r * (0.8 + tw * .5), r = R * .22;
        ctx.beginPath();
        ctx.moveTo(0, -R); ctx.lineTo(r, -r); ctx.lineTo(R, 0); ctx.lineTo(r, r);
        ctx.lineTo(0, R); ctx.lineTo(-r, r); ctx.lineTo(-R, 0); ctx.lineTo(-r, -r);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      break;
    }
  }
}

const BASE_ALPHA: Record<Season, number> = { winter: .9, fall: .8, spring: .8, summer: .75 };
const DENSITY: Record<Season, number> = { winter: 16000, fall: 52000, spring: 34000, summer: 40000 };
const MAX: Record<Season, number> = { winter: 110, fall: 26, spring: 42, summer: 36 };

/** Fills its banner (the hero at the top of each page); plays ~30s after load (and after each switch), then fades away. */
export function SeasonAmbient() {
  const s = useSeason();
  const reduced = useReducedMotion();
  const ref = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);

  const season = s?.season;
  const replay = s?.replay;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !season || reduced) { setLive(false); return; }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0, raf = 0, last = 0, elapsed = 0, dead = false;
    let parts: P[] = [];

    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const box = canvas.parentElement?.getBoundingClientRect();
      w = Math.round(box?.width || innerWidth); h = Math.round(box?.height || innerHeight);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(MAX[season], Math.max(10, Math.round((w * h) / DENSITY[season])));
      while (parts.length < n) parts.push(spawn(season, w, h, true));
      parts.length = n;
    };
    size();

    const frame = (now: number) => {
      if (dead) return;
      const dt = last ? Math.min(now - last, 50) : 16;
      last = now;
      elapsed += dt;
      const k = dt / 16.67;

      const fade = Math.min(1, elapsed / FADE_IN) * Math.min(1, Math.max(0, (DURATION - elapsed) / FADE_OUT));
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = BASE_ALPHA[season] * fade;
      const base = ctx.globalAlpha;

      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.ph += .012 * k;
        p.x += (p.vx + Math.sin(p.ph) * (season === "winter" ? .35 : .8)) * k;
        p.y += p.vy * k;
        p.rot += p.vr * k;
        const off = season === "summer" ? p.y < -30 : p.y > h + 30;
        if (off || p.x < -40 || p.x > w + 40) parts[i] = spawn(season, w, h, false);
        ctx.globalAlpha = base;
        draw(ctx, season, parts[i], now);
      }

      if (elapsed >= DURATION) { stop(); setLive(false); return; }
      raf = requestAnimationFrame(frame);
    };

    const start = () => { if (!raf && !dead) { last = 0; raf = requestAnimationFrame(frame); } };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    const onVis = () => (document.hidden || !visible ? stop() : start());
    let rt: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => { clearTimeout(rt); rt = setTimeout(size, 150); };

    // Only animate while the banner is on screen.
    let visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !document.hidden) start(); else stop(); });
    io.observe(canvas);

    setLive(true);
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVis);
    addEventListener("resize", onResize);
    return () => {
      dead = true;
      io.disconnect();
      stop();
      clearTimeout(rt);
      document.removeEventListener("visibilitychange", onVis);
      removeEventListener("resize", onResize);
      ctx.clearRect(0, 0, w, h);
    };
  }, [season, replay, reduced]);

  if (!s || reduced) return null;
  return <canvas ref={ref} className={"season-ambient" + (live ? " on" : "")} aria-hidden="true" />;
}

/* ---------- Bottom-right switcher pill ---------- */

const OPTIONS: { value: SeasonPref; label: string; emoji: string }[] = [
  { value: "auto", label: "Auto (by date)", emoji: "🗓️" },
  ...SEASONS.map(v => ({ value: v as SeasonPref, ...META[v] })),
];

export function SeasonSwitcher() {
  const s = useSeason();
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLUListElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const id = useId();

  const focusItem = (i: number) => {
    const items = menu.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]');
    if (!items?.length) return;
    items[(i + items.length) % items.length].focus();
  };

  const close = useCallback((refocus: boolean) => {
    setOpen(false);
    if (refocus) btn.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const cur = OPTIONS.findIndex(o => o.value === s?.pref);
    focusItem(Math.max(0, cur));
    const onDown = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) close(false); };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, close]);

  if (!s) return null;
  const m = META[s.season];

  const onMenuKey = (e: React.KeyboardEvent) => {
    const items = Array.from(menu.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? []);
    const i = items.indexOf(document.activeElement as HTMLElement);
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); focusItem(i + 1); break;
      case "ArrowUp": e.preventDefault(); focusItem(i - 1); break;
      case "Home": e.preventDefault(); focusItem(0); break;
      case "End": e.preventDefault(); focusItem(items.length - 1); break;
      case "Escape": e.preventDefault(); close(true); break;
      case "Tab": close(false); break;
    }
  };

  const pick = (v: SeasonPref) => { setSeasonPref(v); close(true); };

  return (
    <div className="season-switch" ref={wrap}>
      {open && (
        <ul className="season-menu" role="menu" id={id} aria-label="Site season" ref={menu} onKeyDown={onMenuKey}>
          {OPTIONS.map(o => (
            <li key={o.value} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={s.pref === o.value}
                tabIndex={-1}
                onClick={() => pick(o.value)}
              >
                <span className="se" aria-hidden="true">{o.emoji}</span>
                <span>{o.label}</span>
                {o.value === "auto" && <span className="hint">{META[seasonForDate()].label}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        ref={btn}
        type="button"
        className="season-pill"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={`Season theme: ${m.label}${s.pref === "auto" ? " (automatic)" : ""}. Change season`}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => { if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); setOpen(true); } }}
      >
        <span className="se" aria-hidden="true">{m.emoji}</span>
        <span className="sn">{m.label}</span>
      </button>
    </div>
  );
}
