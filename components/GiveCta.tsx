import Link from "next/link";
import { ConfettiButton, DonateButton } from "./Actions";

// On the donate page itself `href` points back up to the checkout instead of reloading /donate.
export default function GiveCta({ href }: { href?: string }) {
  return (
    <div className="cta reveal">
      <div>
        <h2>Every gift counts, any size</h2>
        <p>Your gift puts scholarships, tools and certifications in the hands of Lake County students. Give once, monthly or yearly, and every gift gets a little confetti.</p>
      </div>
      <div className="hero-actions" style={{ marginTop: 0 }}>
        {href ? <Link className="btn solid" href={href}>Make your gift today</Link> : <DonateButton className="btn solid">Make your gift today</DonateButton>}
        <ConfettiButton>Throw confetti 🎉</ConfettiButton>
      </div>
    </div>
  );
}
