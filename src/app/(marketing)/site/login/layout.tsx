import type { Metadata } from "next";
import { pageMeta } from "@/lib/page-meta";

export const metadata: Metadata = pageMeta({
  title: "Sign in",
  description:
    "Sign in to the OMG Experience customer portal for shipments, quotations, and document workflows.",
  path: "/site/login",
  robots: { index: false, follow: false },
});

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
