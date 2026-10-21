import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import YearlyReports from "@/components/YearlyReports";

export const metadata: Metadata = { title: "Yearly impact", description: "Year-by-year results of the Lake County Tech Campus Foundation." };

export default function ImpactPage() {
  return (
    <>
      <PageHero image="/assets/img/sparks.jpg" crumbs={[{ href: "/about", label: "About" }, { label: "Impact" }]} title="Our impact, year by year">
        How many students we reached, what we awarded and who made it possible.
      </PageHero>
      <section className="block tint"><div className="wrap"><YearlyReports /></div></section>
    </>
  );
}
