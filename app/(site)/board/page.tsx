import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import BoardGrid from "@/components/BoardGrid";

export const metadata: Metadata = { title: "Board of directors", description: "The volunteer board that leads the Lake County Tech Campus Foundation." };

export default function BoardPage() {
  return (
    <>
      <PageHero image="/assets/img/mentoring.jpg" crumbs={[{ href: "/about", label: "About" }, { label: "Board" }]} title="Our board of directors">
        Volunteers from business, education and the community who guide the Foundation&apos;s work.
      </PageHero>
      <section className="block tint"><div className="wrap"><BoardGrid /></div></section>
    </>
  );
}
