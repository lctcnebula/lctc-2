import { permanentRedirect } from "next/navigation";

// Types of donations now live on the donate page: the checkout lists every type, with pillars and tiers below it.
export default function DonationsPage() {
  permanentRedirect("/donate");
}
