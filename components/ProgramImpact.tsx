import { programImpact } from "@/lib/content";

/** "What your gift funds": what donor money buys in each program area. Used on the home, Get involved and donation pages. */
export default function ProgramImpact({ tint = false }: { tint?: boolean }) {
  return (
    <section className={"block" + (tint ? " tint" : "")} aria-labelledby="gift-funds-title">
      <div className="wrap">
        <div className="head reveal">
          <div>
            <p className="kicker">Program by program</p>
            <h2 id="gift-funds-title">What your gift funds</h2>
            <p>Donor gifts go to the equipment, credentials and experiences each program needs.</p>
          </div>
        </div>
        <div className="program-impact">
          {programImpact.map(p => <div className="reveal" key={p.name}><b>{p.name}</b><span>{p.text}</span></div>)}
        </div>
      </div>
    </section>
  );
}
