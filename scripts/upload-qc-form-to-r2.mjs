/**
 * Upload the static FM-QC-019 QC request form (public/forms/FM-QC-019.pdf) → Cloudflare R2.
 * Key: forms/FM-QC-019.pdf
 *
 * After running, copy the printed URL into .env.local (and your deploy env) as:
 *   NEXT_PUBLIC_QC_FORM_URL=<printed url>
 *
 * .env.local requires: R2_ENDPOINT (or R2_ACCOUNT_ID), R2_ACCESS_KEY_ID,
 *   R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL, R2_PUBLIC_BUCKET_NAME (optional)
 *
 * Run: node scripts/upload-qc-form-to-r2.mjs
 */
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

const endpoint =
  process.env.R2_ENDPOINT ||
  (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : '');
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_PUBLIC_BUCKET_NAME || 'omgexp-public-assets';
const publicBase = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

if (!endpoint || !accessKeyId || !secretAccessKey) {
  console.error('Set R2_ENDPOINT (or R2_ACCOUNT_ID), R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
  process.exit(1);
}
if (!publicBase) {
  console.error('Set R2_PUBLIC_URL');
  process.exit(1);
}

const filePath = join(__dirname, '..', 'public', 'forms', 'FM-QC-019.pdf');
if (!existsSync(filePath)) {
  console.error('Missing form file:', filePath);
  process.exit(1);
}

const key = 'forms/FM-QC-019.pdf';
const body = readFileSync(filePath);

const r2 = new S3Client({
  region: 'auto',
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: true,
});

await r2.send(
  new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: 'application/pdf',
    CacheControl: 'public, max-age=86400',
  })
);

const url = `${publicBase}/${key}`;
console.log('OK uploaded:', url);
console.log('\nAdd this to .env.local and your deploy env:');
console.log(`NEXT_PUBLIC_QC_FORM_URL=${url}`);
