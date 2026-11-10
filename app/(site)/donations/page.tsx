import Icon from "@/components/Icon";
import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import GiveCta from "@/components/GiveCta";
import ProgramImpact from "@/components/ProgramImpact";
import { donationTypes, money } from "@/lib/content";

export const metadata: Metadata = { title: "Types of donations", description: "Choose a type of donation: general, scholarships, tools, certifications, student grants or a tribute gift." };

export default function DonationsPage() {
  return (
    <>
      <PageHero image="/assets/img/graduates.jpg" crumbs={[{ href: "/donate", label: "Donate" }, { label: "Types of donations" }]} title="Choose how you give">
        Every type of gift supports one of the Foundation&apos;s four pillars. Pick one and an amount; you can change both before you pay.
      </PageHero>

      <section className="block tint">
        <div className="wrap">
          <div className="give-types">
            {donationTypes.map(t => (
              <article className="give-type reveal" key={t.slug}>
                <i aria-hidden="true"><Icon name={t.icon} /></i>
                <h2>{t.name}</h2>
                <p>{t.text}</p>
                <Link className="btn blue" href={`/donate?type=${t.slug}`}>Give to {t.name.toLowerCase()}</Link>
              </article>
            ))}
          </div>
          <p className="hint center">Want to cover something specific? See the <Link href="/pricing">student giving tiers</Link>.</p>
        </div>
      </section>

      <ProgramImpact />

      <section className="block">
        <div className="wrap"><GiveCta /></div>
      </section>
    </>
  );
}
