import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import UpcomingEvents from "@/components/UpcomingEvents";
import PastEvents from "@/components/PastEvents";
import EventSubscribe from "@/components/EventSubscribe";

export const metadata: Metadata = { title: "Events", description: "Upcoming Lake County Tech Campus Foundation events. RSVP online." };

export default function EventsPage() {
  return (
    <>
      <PageHero image="/assets/img/nails.jpg" crumbs={[{ label: "Events" }]} title="We are stronger together">
        Foundation gatherings for donors, alumni, families and friends. Open any event to RSVP.
      </PageHero>
      <section className="block tint">
        <div className="wrap">
          <div className="head">
            <div>
              <p className="kicker">Upcoming</p>
              <h2>Coming up</h2>
            </div>
          </div>
          <UpcomingEvents />
          <div className="cta" style={{ marginTop: "clamp(56px, 8vw, 96px)" }}>
            <div>
              <h2>Never miss an event</h2>
              <p>Subscribe for Foundation receptions, drives and celebrations. A short note before each one, nothing else.</p>
            </div>
            <EventSubscribe />
          </div>
        </div>
      </section>
      <PastEvents />
    </>
  );
}
