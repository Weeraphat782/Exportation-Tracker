import { Suspense } from 'react';
import SocialArtworkWizard from '@/components/social-artwork/SocialArtworkWizard';

export default function SocialArtworkPage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-muted-foreground">Loading…</p>}>
      <SocialArtworkWizard />
    </Suspense>
  );
}
