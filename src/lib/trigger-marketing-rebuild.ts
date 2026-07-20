/**
 * Fire-and-forget rebuild for Astro marketing site (GitHub Actions).
 * ponytail: no retry queue — failure means stale site until next deploy.
 */
export function triggerMarketingRebuild(reason?: string): void {
  const pat = process.env.MARKETING_GITHUB_PAT;
  const repo = process.env.MARKETING_GITHUB_REPO ?? 'Weeraphat782/CargoWebsiteAstro';
  const workflow = process.env.MARKETING_GITHUB_WORKFLOW ?? 'deploy-marketing.yml';

  if (!pat) {
    console.warn('[marketing-rebuild] MARKETING_GITHUB_PAT not set:', reason ?? 'unknown');
    return;
  }

  fetch(`https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${pat}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ref: 'master' }),
  }).catch((err) => {
    console.warn('[marketing-rebuild] github dispatch failed:', reason ?? 'unknown', err);
  });
}
