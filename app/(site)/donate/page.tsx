import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import DonateCheckout from "@/components/DonateCheckout";
import { EmailLink } from "@/components/Live";

export const metadata: Metadata = { title: "Donate", description: "Give to scholarships, tools, certifications and grants for Lake County Tech Campus students." };

const impact = [
  { amt: "$25", text: "covers safety glasses and gloves for a first-week shop student" },
  { amt: "$100", text: "helps pay an industry certification exam fee" },
  { amt: "$250", text: "puts a starter tool kit in a student's hands" },
  { amt: "$1,000", text: "funds a scholarship toward college or an apprenticeship" },
];

export default function DonatePage() {
  return (
    <>
      <PageHero image="/assets/img/graduates.jpg" crumbs={[{ label: "Donate" }]} title="Give a student their start">
        Any amount, once or monthly. Every dollar goes to Lake County Tech Campus students.
      </PageHero>

      <section className="block tint" style={{ paddingTop: "clamp(48px, 6vw, 72px)" }}>
        <div className="wrap apply-layout">
          <DonateCheckout />
          <div className="aside">
            <div className="aside-box">
              <h3>What your gift can do</h3>
              <ul className="impact">
                {impact.map(i => <li key={i.amt}><b>{i.amt}</b><span>{i.text}</span></li>)}
              </ul>
            </div>
            <div className="aside-box">
              <h3>Other ways to give</h3>
              <ul>
                <li><Link href="/donations">See every type of donation</Link></li>
                <li><Link href="/pricing">Yearly giving levels</Link></li>
                <li><Link href="/contact?topic=Donating%20equipment">Donate tools or equipment</Link></li>
                <li><Link href="/get-involved">Mentor or partner with us</Link></li>
                <li><Link href="/contact?topic=Donating">Give by check or stock</Link></li>
              </ul>
            </div>
            <div className="aside-box tinted">
              <h3>Questions about giving?</h3>
              <p className="hint">Email <EmailLink /> and we&apos;ll get back to you.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
