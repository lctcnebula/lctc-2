import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function LoginPage() {
  return (
    <section className="block tint login-page">
      <div className="wrap"><LoginForm /></div>
    </section>
  );
}
