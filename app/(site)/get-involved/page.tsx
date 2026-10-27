import { permanentRedirect } from "next/navigation";

// Get involved now lives on the donate page, below the checkout. Old links land on its "ways to help" sections.
export default function GetInvolvedPage() {
  permanentRedirect("/donate#pillars");
}
