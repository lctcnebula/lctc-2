import type { Metadata } from "next";
import Shell from "@/components/admin/Shell";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · LCTC Foundation" }, robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
