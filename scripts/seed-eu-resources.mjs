/**
 * Seed 10 EU–Thai medical cannabis resources (upsert by slug).
 * Body copy lives in scripts/data/eu-resources/{slug}.md (long-form for SEO + FAQ JSON-LD).
 * Manifest: scripts/data/eu-resources/manifest.json
 *
 * Reads ../../Tr/.env.local — needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * (or NEXT_PUBLIC_* equivalents). Never commit secrets.
 *
 * Cover art (public/images/resources/eu-cannabis-res-NN.png):
 * 01 B.E.2568 licensing | 02 GACP farm | 03 EU-GMP facility
 * 04 traceability chain | 05 QP / batch release | 06 GDP cold chain
 * 07 digital traceability (Cantrak) | 08 Ph.Eur. lab | 09 Germany hub | 10 roadmap
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadDotEnvLocal() {
  const envPath = join(__dirname, '..', '.env.local');
  if (!existsSync(envPath)) {
    console.error('Missing .env.local at', envPath);
    process.exit(1);
  }
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i <= 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1);
    if (!process.env[key]) process.env[key] = val;
  }
}

loadDotEnvLocal();

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const publishedAt = new Date().toISOString();
const dataDir = join(__dirname, 'data', 'eu-resources');
const manifestPath = join(dataDir, 'manifest.json');

if (!existsSync(manifestPath)) {
  console.error('Missing manifest at', manifestPath);
  process.exit(1);
}

/** Prefer Cloudflare R2 public URL when R2_PUBLIC_URL is set (after upload-resource-covers-to-r2.mjs). */
function resourceCoverUrl(file) {
  const r2 = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
  if (r2) return `${r2}/resources/${file}`;
  return `/images/resources/${file}`;
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const rows = manifest.map((entry) => {
  const mdPath = join(dataDir, `${entry.slug}.md`);
  if (!existsSync(mdPath)) {
    console.error('Missing markdown for', entry.slug, 'expected', mdPath);
    process.exit(1);
  }
  const content = readFileSync(mdPath, 'utf8').trim();
  return {
    slug: entry.slug,
    title: entry.title,
    excerpt: entry.excerpt,
    content,
    tags: entry.tags,
    image_url: resourceCoverUrl(entry.image),
    is_published: true,
    published_at: publishedAt,
  };
});

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data, error } = await supabase.from('resources').upsert(rows, {
  onConflict: 'slug',
  ignoreDuplicates: false,
});

if (error) {
  console.error('Upsert failed:', error.message);
  process.exit(1);
}

console.log('OK: upserted', rows.length, 'resources (slug conflict updated).');
if (data?.length) console.log('Returned rows:', data.length);
