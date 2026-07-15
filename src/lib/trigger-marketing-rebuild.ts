/**
 * Fire-and-forget POST to Vercel Deploy Hook for the Astro marketing site.
 * ponytail: no retry queue — hook failure means stale site until next manual deploy.
 */
export function triggerMarketingRebuild(reason?: string): void {
  const url = process.env.MARKETING_DEPLOY_HOOK_URL;
  if (!url) return;
  fetch(url, { method: 'POST' }).catch((err) => {
    console.warn('[marketing-rebuild] hook failed:', reason ?? 'unknown', err);
  });
}
