import type { Metadata } from "next";
import Link from "next/link";
import ProgramExplorer from "@/components/ProgramExplorer";

export const metadata: Metadata = { title: "Programs", description: "The career and technical programs Foundation gifts support." };

export default function ProgramsPage() {
  return (
    <>
      <section className="page-hero">
        <img src="/assets/img/construction.jpg" alt="" width={1024} height={683} />
        <div className="wrap">
          <p className="crumbs"><Link href="/">Home</Link> / Programs</p>
          <h1>Ways to build a career</h1>
          <p>Hands-on training on real equipment, during the school day. Foundation grants help students in every one of these programs.</p>
        </div>
      </section>
      <section className="block tint">
        <div className="wrap">
          <ProgramExplorer />
        </div>
      </section>
    </>
  );
}
