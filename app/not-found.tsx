import Link from "next/link";
import SiteLayout from "./(site)/layout";

export default function NotFound() {
  return (
    <SiteLayout>
    <section className="block" style={{ textAlign: "center", minHeight: "60vh" }}>
      <div className="wrap">
        <p className="kicker" style={{ justifyContent: "center" }}>Page not found</p>
        <h2>This page took a different career path</h2>
        <p style={{ color: "var(--muted)", margin: "18px auto 30px", maxWidth: "46ch" }}>The page you were looking for doesn&apos;t exist or has moved.</p>
        <Link className="btn blue" href="/">Back home</Link>
      </div>
    </section>
    </SiteLayout>
  );
}
