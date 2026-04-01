/**
 * Upserts the editorial pharma / air cargo / GDP article into Supabase news_articles.
 *
 * Usage: npm run insert:pharma-news
 * Requires: .env.local with SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

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

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local");
  process.exit(1);
}

const SLUG = "pharma-airfreight-gdp-ceiv-global-networks";
const TITLE =
  "Why Pharmaceutical Air Cargo Depends on GDP, CEIV Pharma, and Smarter Global Networks";
const EXCERPT =
  "From IATA CEIV Pharma to cold-chain hubs in Europe and Asia: how airlines, handlers, and forwarders keep temperature-sensitive medicines compliant—and what shippers should expect in 2026.";
const IMAGE_URL =
  "/images/news-covers/pharma-airfreight-gdp-ceiv-global-networks.png";

const bodyPath = join(__dirname, "data", "pharma-airfreight-editorial.body.md");
const content = readFileSync(bodyPath, "utf8");

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const publishedAt = new Date().toISOString();

const row = {
  slug: SLUG,
  title: TITLE,
  excerpt: EXCERPT,
  content,
  image_url: IMAGE_URL,
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
  console.error("Upsert failed:", error.message);
  process.exit(1);
}

console.log("OK — news_articles upserted:", data);
console.log("Public URL path: /site/newsroom/" + SLUG);
