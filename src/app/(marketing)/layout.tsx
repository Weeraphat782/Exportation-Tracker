'use client';

import { DM_Sans } from "next/font/google";
import TopBar from "@/components/marketing/TopBar";
import Header from "@/components/marketing/Header";
import Footer from "@/components/marketing/Footer";
import { MarketingBreadcrumbNav } from "@/components/marketing/MarketingBreadcrumbNav";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${dmSans.variable} font-sans min-h-screen flex flex-col`}>
      <div className="sticky top-0 z-50">
        <TopBar />
        <Header />
      </div>
      <main className="flex-1 bg-white">
        <MarketingBreadcrumbNav />
        {children}
      </main>
      <Footer />
    </div>
  );
}
