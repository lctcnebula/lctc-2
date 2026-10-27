import { permanentRedirect } from "next/navigation";

// The giving tiers now live on the donate page, where each card adds straight to the giving list.
export default function PricingPage() {
  permanentRedirect("/donate#tiers");
}
