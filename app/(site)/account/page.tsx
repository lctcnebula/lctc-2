import type { Metadata } from "next";
import Account from "@/components/Account";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default function AccountPage() {
  return <section className="block tint"><div className="wrap"><Account /></div></section>;
}
