import Link from "next/link";
import { ShareButton } from "./Actions";

export default function WaysToHelp() {
  return (
    <div className="grid four">
      <article className="card reveal">
        <div className="media"><img src="/assets/img/mentoring.jpg" alt="A mentor helping students working on laptops" width={1024} height={683} loading="lazy" /></div>
        <div className="content"><h3>Mentor a student</h3><p>Share what your career is really like through mock interviews, job shadows and classroom visits.</p><Link className="more" href="/contact?topic=Volunteering">Volunteer</Link></div>
      </article>
      <article className="card reveal">
        <div className="media"><img src="/assets/img/auto.jpg" alt="Students working underneath a car on a lift" width={1024} height={683} loading="lazy" /></div>
        <div className="content"><h3>Partner as a business</h3><p>Offer internships, host a site visit or hire graduates who arrive certified and ready.</p><Link className="more" href="/contact?topic=Business%20partnership">Offer an internship</Link></div>
      </article>
      <article className="card reveal">
        <div className="media"><img src="/assets/img/catering.jpg" alt="Three culinary students in chef coats serving at an event" width={1024} height={732} loading="lazy" /></div>
        <div className="content"><h3>Donate equipment</h3><p>Have tools, materials or equipment a program could use? Tell us what you&apos;d like to give.</p><Link className="more" href="/contact?topic=Donating%20equipment">Donate items</Link></div>
      </article>
      <article className="card reveal">
        <div className="media"><img src="/assets/img/salon.jpg" alt="Cosmetology students laughing while giving manicures" width={1024} height={729} loading="lazy" /></div>
        <div className="content"><h3>Spread the word</h3><p>Tell a student, parent or employer about the Foundation. Every introduction counts.</p><ShareButton className="more">Copy site link</ShareButton></div>
      </article>
    </div>
  );
}
