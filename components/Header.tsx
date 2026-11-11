"use client";
import Icon from "@/components/Icon";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HeaderCart } from "./CartButton";
import { HeaderLights, LogoSeason } from "./Seasons";

const links = [
  { href: "/about", label: "About" },
  { href: "/programs", label: "Programs" },
  { href: "/events", label: "Events" },
  { href: "/blog", label: "Blog" },
  { href: "/get-involved", label: "Get involved" },
  { href: "/contact", label: "Contact" },
  { href: "/apply", label: "Apply for aid", className: "apply-link" },
];

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(scrollY > 10);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const isOn = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className={"site" + (scrolled ? " scrolled" : "")}>
      <HeaderLights />
      <div className="wrap bar">
        <Link className="brand" href="/" aria-label="LCTC Foundation home">
          <img src="/assets/logo.png" alt="Lake County Tech Campus Foundation" width={1781} height={483} />
          <LogoSeason />
        </Link>
        <nav className={"main" + (open ? " open" : "")} id="nav" aria-label="Main">
          <ul>
            {links.map(l => (
              <li key={l.href}>
                <Link href={l.href} className={[l.className, isOn(l.href) && "on"].filter(Boolean).join(" ")} aria-current={isOn(l.href) ? "page" : undefined} onClick={() => setOpen(false)}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link className={"pill-btn" + (isOn("/donate") ? " on" : "")} href="/donate">
          <Icon name="heart" />
          <span className="pill-label">Donate</span>
        </Link>
        <HeaderCart />
        <button className="menu-toggle" type="button" aria-controls="nav" aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(o => !o)}>
          <span /><span /><span />
        </button>
      </div>
    </header>
  );
}
