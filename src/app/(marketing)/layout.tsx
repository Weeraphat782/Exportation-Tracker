'use client';

import { DM_Sans } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import TopBar from '@/components/marketing/TopBar';
import Header from '@/components/marketing/Header';
import Footer from '@/components/marketing/Footer';
import { MarketingBreadcrumbNav } from '@/components/marketing/MarketingBreadcrumbNav';
import { BRAND_NAME } from '@/lib/site';

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
});

/** Logo on auth pages links back to the Astro marketing site when set. */
const marketingHomeUrl =
  process.env.NEXT_PUBLIC_MARKETING_URL?.replace(/\/$/, '') ?? '/site';

function isAuthPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith('/site/login') ||
    pathname.startsWith('/site/register') ||
    pathname.startsWith('/site/auth')
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${dmSans.variable} font-sans min-h-screen flex flex-col bg-white`}>
      <header className="border-b border-neutral-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl justify-center">
          <Link href={marketingHomeUrl} className="inline-flex shrink-0 items-center">
            <Image
              src="/logo.png"
              alt={`${BRAND_NAME} logo`}
              width={200}
              height={62}
              className="h-10 w-auto sm:h-12"
              priority
            />
          </Link>
        </div>
      </header>
      <main className="flex-1 overflow-x-hidden">{children}</main>
      <footer className="border-t border-neutral-100 px-6 py-6 text-center">
        <p className="text-xs text-neutral-500">
          &copy; {new Date().getFullYear()} OMG Experience Co., Ltd. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isAuthPath(pathname)) {
    return <AuthShell>{children}</AuthShell>;
  }

  return (
    <div className={`${dmSans.variable} font-sans min-h-screen flex flex-col`}>
      <div className="sticky top-0 z-50">
        <TopBar />
        <Header />
      </div>
      <main className="flex-1 overflow-x-hidden bg-white">
        <MarketingBreadcrumbNav />
        {children}
      </main>
      <Footer />
    </div>
  );
}
