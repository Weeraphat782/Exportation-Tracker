/**
 * Upserts 5 editorial news articles from scripts/data/news-batch-02/ (manifest.json + .md files).
 *
 * Usage: npm run insert:news-batch-02
 * Requires: .env.local — SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BATCH_DIR = join(__dirname, "data", "news-batch-02");

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

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(join(BATCH_DIR, "manifest.json"), "utf8"));
if (!Array.isArray(manifest) || manifest.length === 0) {
  console.error("manifest.json must be a non-empty array");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const publishedAt = new Date().toISOString();

for (const entry of manifest) {
  const { slug, title, excerpt, image_url, file } = entry;
  if (!slug || !title || !file) {
    console.error("Invalid manifest entry:", entry);
    process.exit(1);
  }
  const bodyPath = join(BATCH_DIR, file);
  if (!existsSync(bodyPath)) {
    console.error("Missing body file:", bodyPath);
    process.exit(1);
  }
  const content = readFileSync(bodyPath, "utf8");

  const row = {
    slug,
    title,
    excerpt: excerpt || "",
    content,
    image_url: image_url || null,
    is_pinned: false,
    is_published: true,
    published_at: publishedAt,
  };

  const { data, error } = await supabase
    .from("news_articles")
    .upsert(row, { onConflict: "slug" })
    .select("id, slug")
    .single();

  if (error) {
    console.error("Upsert failed for", slug, error.message);
    process.exit(1);
  }
  console.log("OK", data.slug, "→ /site/newsroom/" + data.slug);
}

console.log("Done —", manifest.length, "articles.");
