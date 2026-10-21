"use client";

import { useData } from "@/lib/store";

/** Managed in Admin → Outside scholarships; hidden while the list is empty. */
export default function OutsideScholarships() {
  const list = useData("scholarships");
  if (!list.length) return null;
  return (
    <section className="block" id="outside-scholarships">
      <div className="wrap">
        <div className="head">
          <div>
            <p className="kicker">Beyond the Foundation</p>
            <h2>Outside scholarships</h2>
            <p>Scholarships from other organizations. Deadlines change every year, so check each provider for current dates.</p>
          </div>
        </div>
        <div className="sch-list">
          {list.map(s => (
            <div className="sch" key={s.id}>
              <div><b>{s.name}</b><small>{s.who}</small></div>
              <span className="award">{s.award}</span>
              <a className="btn line" href={s.url} target="_blank" rel="noopener">{s.how || "Learn more"} →</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
