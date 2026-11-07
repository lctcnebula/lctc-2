import Link from "next/link";
import { SeasonAmbient } from "./Seasons";

type Props = { image: string; crumbs: { href?: string; label: string }[]; title: string; children?: React.ReactNode };

export default function PageHero({ image, crumbs, title, children }: Props) {
  return (
    <section className="page-hero">
      <img src={image} alt="" width={1024} height={683} />
      <SeasonAmbient />
      <div className="wrap">
        <p className="crumbs">
          <Link href="/">Home</Link>
          {crumbs.map(c => <span key={c.label}> / {c.href ? <Link href={c.href}>{c.label}</Link> : c.label}</span>)}
        </p>
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
    </section>
  );
}
