/**
 * Upload public/images/news-covers/<slug>.png → Cloudflare R2 (keys: news/pharma/<slug>.png)
 * and set news_articles.image_url in Supabase to the public R2 URL.
 *
 * Does not touch SerpAPI seed / .news-seed-manifest.json.
 *
 * Usage: npm run upload:pharma-news-r2
 * .env.local: R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL,
 * R2_PUBLIC_BUCKET_NAME (optional), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadDotEnvLocal() {
  const envPath = join(__dirname, "..", ".env.local");
  if (!existsSync(envPath)) {
    console.error("Missing .env.local");
    process.exit(1);
  }
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadDotEnvLocal();

const endpoint = process.env.R2_ENDPOINT;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_PUBLIC_BUCKET_NAME || "omgexp-public-assets";
const publicBase = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!endpoint || !accessKeyId || !secretAccessKey) {
  console.error("Set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY");
  process.exit(1);
}
if (!publicBase) {
  console.error("Set R2_PUBLIC_URL");
  process.exit(1);
}
if (!supabaseUrl || !supabaseKey) {
  console.error("Set Supabase URL and service role key");
  process.exit(1);
}

const BATCH_DIR = join(__dirname, "data", "news-batch-02");
const manifestPath = join(BATCH_DIR, "manifest.json");
if (!existsSync(manifestPath)) {
  console.error("Missing", manifestPath);
  process.exit(1);
}

/** @type {{ slug: string }[]} */
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const EXTRA_SLUG = "pharma-airfreight-gdp-ceiv-global-networks";
const slugs = [...new Set([...manifest.map((e) => e.slug), EXTRA_SLUG])];

const localDir = join(__dirname, "..", "public", "images", "news-covers");
const r2 = new S3Client({
  region: "auto",
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: true,
});

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

for (const slug of slugs) {
  const filename = `${slug}.png`;
  const fp = join(localDir, filename);
  if (!existsSync(fp)) {
    console.error("Missing cover file:", fp);
    process.exit(1);
  }
  const key = `news/pharma/${filename}`;
  const body = readFileSync(fp);

  await r2.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "image/png",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  const imageUrl = `${publicBase}/${key}`;
  const { error } = await supabase
    .from("news_articles")
    .update({ image_url: imageUrl })
    .eq("slug", slug);

  if (error) {
    console.error("Supabase update failed", slug, error.message);
    process.exit(1);
  }
  console.log("OK", slug, "→", imageUrl);
}

console.log("Done: pharma news covers on R2 + image_url updated in Supabase.");
