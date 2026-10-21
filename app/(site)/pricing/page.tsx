import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import { donationTypes, givingLevels, money } from "@/lib/content";

export const metadata: Metadata = { title: "Giving levels and pricing", description: "Yearly giving levels and what common student needs cost at Lake County Tech Campus." };

const costs = [
  { item: "Safety glasses and gloves", amount: 25, type: "tools" },
  { item: "Industry certification exam", amount: 100, type: "certifications" },
  { item: "Starter tool kit", amount: 250, type: "tools" },
  { item: "Emergency grant for a student", amount: 300, type: "grants" },
  { item: "Scholarship toward college or an apprenticeship", amount: 1000, type: "scholarships" },
];

const typeName = (slug: string) => donationTypes.find(t => t.slug === slug)?.name ?? slug;

export default function PricingPage() {
  return (
    <>
      <PageHero image="/assets/img/welding.jpg" crumbs={[{ href: "/donate", label: "Donate" }, { label: "Pricing" }]} title="Giving levels and pricing">
        Choose a yearly level, or see what a specific need costs and cover it directly.
      </PageHero>

      <section className="block">
        <div className="wrap">
          <div className="head reveal">
            <div>
              <p className="kicker">Giving levels</p>
              <h2>Give yearly, or spread it out monthly</h2>
              <p>Every level goes straight to students. Pick one and you&apos;ll go to checkout with the amount filled in.</p>
            </div>
          </div>
          <div className="tiers">
            {givingLevels.map(l => {
              const monthly = Math.ceil(l.amount / 12);
              return (
                <article className={"tier reveal" + (l.featured ? " featured" : "")} key={l.name}>
                  {l.featured && <span className="tier-tag">Most chosen</span>}
                  <h3>{l.name}</h3>
                  <p className="tier-price"><b>{money(l.amount)}</b><span>/ year</span></p>
                  <p className="hint">Goes to {typeName(l.type).toLowerCase()}</p>
                  <ul>{l.perks.map(p => <li key={p}>{p}</li>)}</ul>
                  <Link className={"btn " + (l.featured ? "spark" : "blue")} href={`/donate?type=${l.type}&amount=${l.amount}`}>Give {money(l.amount)}</Link>
                  <Link className="text-link" href={`/donate?type=${l.type}&amount=${monthly}&freq=monthly`}>or {money(monthly)} / month</Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="block tint">
        <div className="wrap">
          <div className="head reveal">
            <div>
              <p className="kicker">What things cost</p>
              <h2>Cover a specific need</h2>
            </div>
            <Link className="text-link" href="/donations">All types of donations →</Link>
          </div>
          <ul className="cost-list">
            {costs.map(c => (
              <li key={c.item} className="reveal">
                <b>{money(c.amount)}</b>
                <span>{c.item}<small>{typeName(c.type)}</small></span>
                <Link className="btn line sm" href={`/donate?type=${c.type}&amount=${c.amount}`}>Cover this</Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
