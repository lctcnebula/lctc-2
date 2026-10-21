import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import GiveCta from "@/components/GiveCta";
import { donationTypes, money } from "@/lib/content";

export const metadata: Metadata = { title: "Types of donations", description: "Choose a type of donation: general, scholarships, tools, certifications, student grants or a tribute gift." };

export default function DonationsPage() {
  return (
    <>
      <PageHero image="/assets/img/graduates.jpg" crumbs={[{ href: "/donate", label: "Donate" }, { label: "Types of donations" }]} title="Choose how you give">
        Pick a type of donation and an amount. You can change both on the next page before you pay.
      </PageHero>

      <section className="block tint">
        <div className="wrap">
          <div className="give-types">
            {donationTypes.map(t => (
              <article className="give-type reveal" key={t.slug}>
                <i aria-hidden="true">{t.icon}</i>
                <h2>{t.name}</h2>
                <p>{t.text}</p>
                <div className="chips" aria-label={`Suggested amounts for ${t.name.toLowerCase()}`}>
                  {t.presets.map(a => <Link key={a} href={`/donate?type=${t.slug}&amount=${a}`}>{money(a)}</Link>)}
                </div>
                <Link className="btn blue" href={`/donate?type=${t.slug}`}>Give to {t.name.toLowerCase()}</Link>
              </article>
            ))}
          </div>
          <p className="hint center">Looking for yearly giving levels? See <Link href="/pricing">giving levels and pricing</Link>.</p>
        </div>
      </section>

      <section className="block">
        <div className="wrap"><GiveCta /></div>
      </section>
    </>
  );
}
