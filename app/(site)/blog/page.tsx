import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import BlogList from "@/components/BlogList";

export const metadata: Metadata = { title: "Blog", description: "Stories and event recaps from the Lake County Tech Campus Foundation." };

export default function BlogPage() {
  return (
    <>
      <PageHero image="/assets/img/catering.jpg" crumbs={[{ label: "Blog" }]} title="Stories from the Foundation">
        Event recaps, student milestones and news from the people who make it happen.
      </PageHero>
      <section className="block tint"><div className="wrap"><BlogList /></div></section>
    </>
  );
}
