import type { Metadata } from "next";
import { pageMeta } from "@/lib/page-meta";

export const metadata: Metadata = pageMeta({
  title: "Create account",
  description:
    "Register for the OMG Experience platform to manage logistics, documents, and bookings.",
  path: "/site/register",
  robots: { index: false, follow: false },
});

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
