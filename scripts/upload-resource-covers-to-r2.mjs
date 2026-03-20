/**
 * Upload public/images/resources/eu-cannabis-res-*.png → Cloudflare R2
 * Keys: resources/eu-cannabis-res-NN.png
 * Then update Supabase resources.image_url to R2_PUBLIC_URL + key
 *
 * Requires in .env.local: R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 * R2_PUBLIC_BUCKET_NAME (optional), R2_PUBLIC_URL,
 * plus Supabase URL + service role for updates.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadDotEnvLocal() {
  const envPath = join(__dirname, '..', '.env.local');
  if (!existsSync(envPath)) {
    console.error('Missing .env.local');
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

const endpoint = process.env.R2_ENDPOINT;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_PUBLIC_BUCKET_NAME || 'omgexp-public-assets';
const publicBase = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!endpoint || !accessKeyId || !secretAccessKey) {
  console.error('Set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
  process.exit(1);
}
if (!publicBase) {
  console.error('Set R2_PUBLIC_URL (public bucket URL for browser access)');
  process.exit(1);
}
if (!supabaseUrl || !supabaseKey) {
  console.error('Set Supabase URL and service role key');
  process.exit(1);
}

const r2 = new S3Client({
  region: 'auto',
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: true,
});

/** Same order as seed-eu-resources.mjs image files */
const map = [
  { file: 'eu-cannabis-res-01.png', slug: 'thai-controlled-herb-be2568-export-licensing' },
  { file: 'eu-cannabis-res-04.png', slug: 'thc-limits-traceability-dtam-reporting' },
  { file: 'eu-cannabis-res-02.png', slug: 'thai-gacp-farm-baseline-eu-quality' },
  { file: 'eu-cannabis-res-03.png', slug: 'eu-gmp-annex7-post-harvest-manufacturing' },
  { file: 'eu-cannabis-res-05.png', slug: 'qualified-person-eu-batch-release' },
  { file: 'eu-cannabis-res-06.png', slug: 'gdp-cold-chain-eu-transit-integrity' },
  { file: 'eu-cannabis-res-07.png', slug: 'cantrak-digital-traceability-export-evidence' },
  { file: 'eu-cannabis-res-08.png', slug: 'ph-eur-alignment-from-thai-gacp-data' },
  { file: 'eu-cannabis-res-09.png', slug: 'germany-medical-cannabis-market-access-pathways' },
  { file: 'eu-cannabis-res-10.png', slug: 'pharmaceutical-mindset-thai-eu-export-roadmap' },
];

const localDir = join(__dirname, '..', 'public', 'images', 'resources');
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

for (const { file, slug } of map) {
  const fp = join(localDir, file);
  if (!existsSync(fp)) {
    console.error('Missing file:', fp);
    process.exit(1);
  }
  const body = readFileSync(fp);
  const key = `resources/${file}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: 'image/png',
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  const imageUrl = `${publicBase}/${key}`;
  const { error } = await supabase.from('resources').update({ image_url: imageUrl }).eq('slug', slug);

  if (error) {
    console.error('Supabase update failed', slug, error.message);
    process.exit(1);
  }
  console.log('OK', slug, '→', imageUrl);
}

console.log('Done: 10 covers on R2 + Supabase image_url updated.');
