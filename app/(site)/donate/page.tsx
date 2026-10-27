import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import DonateCheckout from "@/components/DonateCheckout";
import WaysToHelp from "@/components/WaysToHelp";
import GiveCta from "@/components/GiveCta";
import { MajorGiftButton, PillarCards, TierCards } from "@/components/GiftPicker";
import { EmailLink } from "@/components/Live";
import { majorGift, money, partnerRoadmap, programImpact } from "@/lib/content";

// Donate, Get involved, Types of donations and Pricing are all this one page now (the old URLs redirect here).
// Every pillar and giving tier adds straight to the giving list, which is reviewed and paid for in the checkout at the top.
export const metadata: Metadata = { title: "Donate", description: "Give to scholarships, tools, certifications and grants for Lake County Tech Campus students, or mentor and partner with the Foundation." };

const impact = [
  { amt: "$50", text: "gives a student their baseline safety credential" },
  { amt: "$200", text: "pays a state board exam, fingerprinting and licensing fees" },
  { amt: "$500", text: "buys a professional toolkit a student keeps after graduation" },
  { amt: "$1,100", text: "sponsors one student's entire year at Tech Campus" },
];

export default function DonatePage() {
  return (
    <>
      <PageHero image="/assets/img/graduates.jpg" crumbs={[{ label: "Donate" }]} title="Give a student their start">
        Any amount, once, monthly or yearly. Every dollar goes to Lake County Tech Campus students.
      </PageHero>

      <section className="block tint" id="give" style={{ paddingTop: "clamp(48px, 6vw, 72px)" }}>
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
              <h3>More on this page</h3>
              <ul>
                <li><Link href="#pillars">Give to a pillar</Link></li>
                <li><Link href="#tiers">Student giving tiers</Link></li>
                <li><Link href="#major">Major gifts of {money(majorGift.amount)}+</Link></li>
                <li><Link href="#partner">Partner as a business</Link></li>
                <li><Link href="#volunteer">Mentor or volunteer</Link></li>
              </ul>
            </div>
            <div className="aside-box">
              <h3>Other ways to give</h3>
              <ul>
                <li><Link href="/contact?topic=Donating%20equipment">Donate tools or equipment</Link></li>
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

      <section className="block" id="pillars">
        <div className="wrap">
          <div className="head reveal">
            <div>
              <p className="kicker">Give</p>
              <h2>Choose a pillar to support</h2>
              <p>The Foundation&apos;s work rests on four pillars. Choose how many, then give now or add it to your list and pay for everything together.</p>
            </div>
          </div>
          <PillarCards />
        </div>
      </section>

      <section className="block tint" id="tiers">
        <div className="wrap">
          <div className="head reveal">
            <div>
              <p className="kicker">CTE Month campaign · February 2027</p>
              <h2>Student-level giving tiers</h2>
              <p>Each tier has a fixed price and pays for something specific a student needs. Choose how many, for example two $500 toolkits.</p>
            </div>
          </div>
          <TierCards />
        </div>
      </section>

      <section className="block" id="major">
        <div className="wrap">
          <div className="major reveal">
            <div>
              <p className="kicker">{money(majorGift.amount)}+ major investments</p>
              <h2>{majorGift.name}</h2>
              <p>{majorGift.text}</p>
              <div className="hero-actions">
                <MajorGiftButton />
                <Link className="btn line" href="/contact?topic=Donating">Talk to us about a major gift</Link>
              </div>
            </div>
            <ul>
              {majorGift.areas.map(a => <li key={a.name}><b>{a.name}</b><small>{a.sub}</small><span>{a.text}</span></li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="block tint" id="programs">
        <div className="wrap">
          <div className="head reveal">
            <div>
              <p className="kicker">Program by program</p>
              <h2>What your gift funds</h2>
              <p>Donor gifts go to the equipment, credentials and experiences each program needs.</p>
            </div>
          </div>
          <div className="program-impact">
            {programImpact.map(p => <div className="reveal" key={p.name}><b>{p.name}</b><span>{p.text}</span></div>)}
          </div>
        </div>
      </section>

      <section className="block" id="partner">
        <div className="wrap">
          <div className="head reveal">
            <div>
              <p className="kicker">For businesses</p>
              <h2>T.E.C.H. Industry Partner Roadmap</h2>
              <p>Empowering students through industry collaboration. Start anywhere: following us online is a first step, and funding scholarships is the last.</p>
            </div>
            <Link className="text-link" href="/contact?topic=Business%20partnership">Become a partner →</Link>
          </div>
          <div className="roadmap">
            {partnerRoadmap.map(r => (
              <article className="road reveal" key={r.name}>
                <header><i aria-hidden="true">{r.letter}</i><h3>{r.name}</h3><small>{r.sub}</small></header>
                <ol>{r.steps.map(x => <li key={x}>{x}</li>)}</ol>
              </article>
            ))}
          </div>
          <p className="hint center"><b>Give Me Ten + TECH 50:</b> students start with ten hours of workplace exposure, then can earn up to fifty hours of paid, skill-based experience with a training-site partner.</p>
        </div>
      </section>

      <section className="block tint" id="volunteer">
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
        <div className="wrap"><GiveCta href="#give" /></div>
      </section>
    </>
  );
}
