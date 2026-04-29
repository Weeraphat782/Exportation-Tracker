import type { Metadata } from 'next';
import { pageMeta } from '@/lib/page-meta';

export const metadata: Metadata = pageMeta({
  title: 'Signing in',
  description: 'Completing customer sign-in.',
  path: '/site/auth/callback',
  robots: { index: false, follow: false },
});

export default function SiteAuthCallbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
