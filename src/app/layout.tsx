import type { Metadata, Viewport } from "next";
import { GoogleTagManager } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter, Dancing_Script } from "next/font/google";
import "./globals.css";
import ScrollToTop from "@/components/ScrollToTop";
import { Toaster } from "sonner";
import { JsonLd } from "@/components/seo/JsonLd";
import { jsonLdScript, organizationSchema, websiteSchema } from "@/lib/json-ld";
import {
  absoluteUrl,
  BRAND_NAME,
  getDefaultOgImageUrl,
  getSiteUrl,
} from "@/lib/site";

const inter = Inter({ subsets: ["latin"], display: "swap", preload: true });

/** Cursive style for quotation issuer line (Shivek Sachdev) — use `[font-family:var(--font-quotation-signature)]` */
const quotationSignatureFont = Dancing_Script({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
  variable: "--font-quotation-signature",
});

const siteUrl = getSiteUrl();
const defaultOg = getDefaultOgImageUrl();

const supabaseOrigin =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ??
  "https://olcjmlvjtykcariimjbz.supabase.co";

const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${BRAND_NAME} — Air Freight & Pharmaceutical Logistics`,
    template: `%s | ${BRAND_NAME}`,
  },
  description:
    "Specialized air freight, GDP warehousing, and compliance-focused logistics for pharma and time-sensitive cargo across global networks.",
  keywords: [
    "air freight",
    "pharmaceutical logistics",
    "GDP warehousing",
    "cold chain",
    "customs documents",
    "OMG Experience",
  ],
  authors: [{ name: BRAND_NAME, url: siteUrl }],
  creator: BRAND_NAME,
  publisher: BRAND_NAME,
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: BRAND_NAME,
    title: `${BRAND_NAME} — Air Freight & Pharmaceutical Logistics`,
    description:
      "Specialized air freight, GDP warehousing, and compliance-focused logistics for pharma and time-sensitive cargo.",
    images: [
      {
        url: defaultOg,
        width: 1200,
        height: 630,
        alt: `${BRAND_NAME} — logistics and air freight`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_NAME} — Air Freight & Pharmaceutical Logistics`,
    description:
      "Specialized air freight, GDP warehousing, and compliance-focused logistics.",
    images: [defaultOg],
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      "en-US": siteUrl,
      "x-default": siteUrl,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
  },
  other: {
    "application-name": BRAND_NAME,
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

const rootLd = jsonLdScript([websiteSchema(), organizationSchema()]);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <head>
        <link rel="preconnect" href={supabaseOrigin} />
        <link rel="dns-prefetch" href={supabaseOrigin} />
        <link rel="dns-prefetch" href="https://vitals.vercel-insights.com" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${BRAND_NAME} — Newsroom`}
          href={absoluteUrl("/feed.xml")}
        />
      </head>
      <body
        className={`${inter.className} ${quotationSignatureFont.variable} min-w-0 overflow-x-hidden`}
      >
        {gtmId ? <GoogleTagManager gtmId={gtmId} /> : null}
        {gtmId ? (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        ) : null}
        <JsonLd data={rootLd} />
        <ScrollToTop />
        <Toaster position="top-right" expand richColors />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
