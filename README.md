# OMGEXP

This is a [Next.js](https://nextjs.org) project for the **OMGEXP** logistics and export management platform.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Optional analytics env (Phase 2)

**Marketing site (GTM on public pages)**

- `NEXT_PUBLIC_GTM_ID` — Google Tag Manager container ID (e.g. `GTM-XXXXXXX`). When set, GTM loads from `@next/third-parties/google`. Configure GA4 / tags inside GTM.
- Vercel Analytics and Speed Insights are enabled in `src/app/layout.tsx` when deployed on Vercel (no extra env required).

**Website Analytics dashboard (`/analytics` — GA4 Data API, server-side)**

Required:

- `GA4_PROPERTY_ID` — numeric GA4 property ID (Admin → Property settings)
- `GA_SERVICE_ACCOUNT_EMAIL` — service account email from Google Cloud
- `GA_SERVICE_ACCOUNT_PRIVATE_KEY` — PEM private key (use `\n` for newlines in env; quotes optional)

Optional filters (defaults shown):

- `MARKETING_GA_HOSTNAME` — default `www.omgcargo.tech`
- `GA_PUBLIC_PATH_PREFIX` — legacy marketing paths under the staff app, default `/site`

Setup: enable **Google Analytics Data API** in Google Cloud, grant the service account **Viewer** on the GA4 property (Admin → Property access management). Register custom dimension `form_name` (event scope) in GA4 if you want lead breakdown by form.

Self-check date ranges: `node --experimental-strip-types scripts/ga-range.test.mjs`
