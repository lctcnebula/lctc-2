"use client";

import { useData } from "@/lib/store";

const funding: Record<string, string> = {
  "automotive-collision-repair": "Body repair tools, refinishing materials and frame measurement equipment.",
  "automotive-service": "Diagnostic tools, shop equipment and automotive certification fees.",
  "biomedical-science": "Laboratory supplies, research equipment and biomedical learning experiences.",
  "certified-nurse-assisting": "Patient care simulators, clinical supplies and nurse assisting certification fees.",
  "construction-skills-management": "Framing tools, protective equipment and construction safety credentials.",
  "cosmetology": "Styling kits, salon supplies and licensing preparation.",
  "intro-criminal-justice-policing": "Public safety training equipment, scenario materials and career experiences.",
  "culinary-arts": "Commercial kitchen tools, ingredients and food safety certifications.",
  "cybersecurity": "Network equipment, security lab environments and certification exams.",
  "early-education-teaching": "Classroom materials, preschool learning resources and teaching credentials.",
  "emergency-medical-services": "Emergency care simulators, medical equipment and first responder licensing exams.",
  "firefighting": "Protective gear, rescue equipment and fire safety training.",
  "game-programming-virtualization": "Development workstations, programming software and student game showcases.",
  "industrial-technology": "Manufacturing equipment, automation tools and industry credentials.",
  "criminal-justice-forensic-investigation": "Evidence collection kits, forensic lab supplies and investigation training.",
  "medical-assisting": "Clinical practice supplies, phlebotomy models and medical assisting credentials.",
  "multimedia": "Cameras, creative software, production equipment and portfolio showcases.",
  "welding-fabrication": "Welding machines, protective equipment, metals and welding certifications."
};

/** "What your gift funds": what donor money buys in each program area. Used on the Get involved and donation pages. */
export default function ProgramImpact({ tint = false }: { tint?: boolean }) {
  const programs = useData("programs");
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
          {programs.map(p => <div className="reveal" key={p.id}><b>{p.name}</b><span>{funding[p.slug] || `Equipment, learning materials and career experiences for ${p.name} students.`}</span></div>)}
        </div>
      </div>
    </section>
  );
}
