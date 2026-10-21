import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import WaysToHelp from "@/components/WaysToHelp";
import GiveCta from "@/components/GiveCta";
import { DonateButton } from "@/components/Actions";

export const metadata: Metadata = { title: "Get involved", description: "Donate, mentor, partner or sponsor to support Lake County Tech Campus students." };

const funds = [
  { icon: "🎓", name: "Scholarships", text: "Help graduates head to college, an apprenticeship or their first job." },
  { icon: "🧰", name: "Tools & Equipment", text: "Starter kits, uniforms and protective gear for students who need them." },
  { icon: "📜", name: "Certifications", text: "Exam and licensing fees for industry credentials." },
  { icon: "🤝", name: "Student grants", text: "Fees and emergency help that keep students in their program." },
];

export default function GetInvolvedPage() {
  return (
    <>
      <PageHero image="/assets/img/catering.jpg" crumbs={[{ label: "Get involved" }]} title="Brighter futures start with you">
        Give your time, your expertise or your company&apos;s support. Pick the way that fits and we&apos;ll take it from there.
      </PageHero>

      <section className="block">
        <div className="wrap">
          <div className="head reveal">
            <div>
              <p className="kicker">Give</p>
              <h2>Choose where your gift goes</h2>
              <p>Every gift, any size, goes straight to students. Give once or monthly.</p>
            </div>
            <Link className="text-link" href="/donations">All types of donations →</Link>
          </div>
          <div className="aid-list fund-list">
            {funds.map(f => (
              <div className="aid-item reveal" key={f.name}>
                <i aria-hidden="true">{f.icon}</i>
                <b>{f.name}</b>
                <span>{f.text}</span>
                <DonateButton className="more" fund={f.name}>Give to {f.name.toLowerCase()}</DonateButton>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="block tint">
        <div className="wrap">
          <div className="head reveal">
            <div>
              <p className="kicker">Volunteer &amp; partner</p>
              <h2>More ways to help</h2>
            </div>
            <Link className="text-link" href="/contact">Contact the Foundation →</Link>
          </div>
          <WaysToHelp />
        </div>
      </section>

      <section className="block">
        <div className="wrap"><GiveCta /></div>
      </section>
    </>
  );
}
