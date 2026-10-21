import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import AlumniList, { AlumniForm } from "@/components/Alumni";

export const metadata: Metadata = { title: "Alumni", description: "Where Tech Campus students go next, and how alumni stay connected to the Foundation." };

export default function AlumniPage() {
  return (
    <>
      <PageHero image="/assets/img/graduates.jpg" crumbs={[{ label: "Alumni" }]} title="Where our students go next">
        Tech Campus graduates building careers across Lake County and beyond.
      </PageHero>
      <section className="block tint">
        <div className="wrap">
          <div className="head"><div><p className="kicker">Alumni stories</p><h2>In their own words</h2></div></div>
          <AlumniList />
        </div>
      </section>
      <section className="block" id="join">
        <div className="wrap apply-layout">
          <AlumniForm />
          <div className="aside">
            <div className="aside-box">
              <h3>Why join?</h3>
              <ul>
                <li>Hear about alumni events and reunions</li>
                <li>Mentor a current student</li>
                <li>Share your story to inspire the next class</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
