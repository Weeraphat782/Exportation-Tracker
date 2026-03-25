/**
 * 1) Google News via SerpAPI (engine=google_news) — cannabis export / logistics / airlines
 * 2) Score & pick 10 items (TG, QR, LH, Thai Airways, Qatar, Lufthansa boost)
 * 3) Build 10 DISTINCT original English articles (no LLM): cannabis export + air logistics + TG/QR/LH
 * 4) Cover images:
 *    - NEWS_IMAGE_MODE=agent-r2 → image_url = R2_PUBLIC_URL/news/article-NN.png (run agent Gen images +
 *      npm run upload:news-r2). Writes scripts/.news-seed-manifest.json with illustration briefs.
 *    - Default: Imagen (optional) → Unsplash / Serp / placeholder → local public/images/news/
 * 5) Upsert news_articles (onConflict: slug)
 *
 * .env.local: SERPAPI_API_KEY, SUPABASE_* ; for agent-r2 also R2_PUBLIC_URL (+ upload needs R2_* keys)
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

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

const serpKey = process.env.SERPAPI_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!serpKey) {
  console.error('Add SERPAPI_API_KEY to .env.local (https://serpapi.com/)');
  process.exit(1);
}
if (!supabaseUrl || !supabaseKey) {
  console.error('Add Supabase URL and service role key to .env.local');
  process.exit(1);
}

const PLACEHOLDER_REMOTE =
  'https://images.unsplash.com/photo-1570710891683-160e2223f8b9?q=80&w=1200&auto=format&fit=crop';

const geminiKeyForImages = process.env.GEMINI_API_KEY;
const newsImageModel = process.env.NEWS_IMAGE_MODEL || 'imagen-3.0-generate-002';

/** Theme-keyed stock (editorial air cargo / pharma logistics) — picked to match article angle */
const UNSPLASH_BY_THEME = {
  cold_chain: [
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1604719314766-9043aed2302c?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=1200&q=80&auto=format&fit=crop',
  ],
  hub_cargo: [
    'https://images.unsplash.com/photo-1574482620526-3f5d9912307d?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1604719314766-9043aed2302c?w=1200&q=80&auto=format&fit=crop',
  ],
  aircraft_cargo: [
    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518834348508-27bef8fc0c0d?w=1200&q=80&auto=format&fit=crop',
  ],
  logistics_tech: [
    'https://images.unsplash.com/photo-1553413077-190dd305871c?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1540969788891-9e0d4f7dabc2?w=1200&q=80&auto=format&fit=crop',
  ],
  documentation: [
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&q=80&auto=format&fit=crop',
  ],
  air_cargo_general: [
    'https://images.unsplash.com/photo-1474302774227-641ca0f4bd6e?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80&auto=format&fit=crop',
  ],
};

const UNSPLASH_FALLBACKS = Object.values(UNSPLASH_BY_THEME).flat();

function flattenNewsResults(data) {
  const out = [];
  const results = data.news_results || [];
  for (const item of results) {
    const push = (row) => {
      if (row?.title && row?.link && !out.some((x) => x.link === row.link)) {
        out.push({
          title: row.title,
          link: row.link,
          thumbnail: row.thumbnail || row.thumbnail_small,
          source: row.source?.name || row.source,
          date: row.iso_date || row.date,
        });
      }
    };
    push({
      title: item.title,
      link: item.link,
      thumbnail: item.thumbnail,
      source: item.source,
      date: item.iso_date,
    });
    if (item.highlight?.title) {
      push({
        title: item.highlight.title,
        link: item.highlight.link,
        thumbnail: item.highlight.thumbnail,
        source: item.highlight.source,
        date: item.highlight.iso_date,
      });
    }
    if (Array.isArray(item.stories)) {
      for (const st of item.stories) {
        push({
          title: st.title,
          link: st.link,
          thumbnail: st.thumbnail,
          source: st.source,
          date: st.iso_date,
        });
      }
    }
  }
  return out;
}

async function fetchSerpNews(q) {
  const params = new URLSearchParams({
    engine: 'google_news',
    q,
    api_key: serpKey,
    hl: 'en',
    gl: 'us',
  });
  const res = await fetch(`https://serpapi.com/search.json?${params}`);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`SerpAPI error ${res.status}: ${text.slice(0, 500)}`);
  }
  return JSON.parse(text);
}

function scoreArticle(a) {
  const s = `${a.title} ${a.source || ''}`.toLowerCase();
  let score = 0;
  if (/cannabis|hemp|marijuana|thc|cbd|medical.?cannabis|medcan/.test(s)) score += 6;
  if (/export|import|shipment|cross.?border|trade|logistics|freight|cargo|air.?freight|pharma|gmp|gdp|cold.?chain/.test(s))
    score += 4;
  if (/\btg\b|thai airways|thai airway/.test(s)) score += 5;
  if (/\bqr\b|qatar airways|qatar cargo/.test(s)) score += 5;
  if (/\blh\b|lufthansa/.test(s)) score += 5;
  if (/airline|aviation|belly.?hold|freighter|widebody/.test(s)) score += 2;
  if (/germany|eu\b|europe|thailand|bangkok/.test(s)) score += 1;
  return score;
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 72);
}

function inferThemes(hint) {
  const s = String(hint).toLowerCase();
  const tags = [];
  if (/cannabis|hemp|marijuana|cbd|thc|medical|botanical|medcan/.test(s))
    tags.push('licensed medical-cannabis exports');
  if (/export|shipment|trade/.test(s)) tags.push('international export programs');
  if (/import|customs|clearance/.test(s)) tags.push('import gateway clearance');
  if (/cold|temp|gdp|chain|gel.?pack/.test(s)) tags.push('cold-chain air movements');
  if (/thailand|bangkok|chiang mai/.test(s)) tags.push('Southeast Asia manufacturing hubs');
  if (/germany|eu\b|europe|frankfurt|amsterdam/.test(s)) tags.push('EU distribution demand');
  if (/air|cargo|freight|airline|belly|freighter/.test(s)) tags.push('scheduled air cargo capacity');
  if (!tags.length) tags.push('regulated botanical air logistics');
  return tags;
}

function carrierBlurb(i) {
  const blurbs = [
    'Bangkok–Doha–Frankfurt-style routings often stitch together **Thai Airways (TG)** long-haul, **Qatar Airways (QR)** middle-mile, and **Lufthansa (LH)** hub feeds—each leg audited for hand-off clarity, not logo appeal.',
    'Shippers compare **QR**’s Gulf connectivity, **LH**’s European truck-to-tarmac programs, and **TG**’s Asia–Europe pairs when designing **medical cannabis** charters and allotment-based belly capacity.',
    'Capacity reviews now name **TG**, **QR**, and **LH** alongside integrators: for temperature-sensitive **export bookings**, the decisive factor is repeatable dwell-time caps and named backup flights.',
    'Interline teams model **LH** hub windows, **QR** bank structures, and **TG** origin cut-offs so **GMP-style batches** do not sit untracked between warehouse release and aircraft acceptance.',
    'Where **EU import rules** tighten, planners still reach for network airlines—**QR**, **LH**, **TG**—but only after lane risk registers list contingency pairs and responsible booking offices.',
    'Medical-only **cannabis export** programs push airlines to document who signs for each segment; **TG**, **QR**, and **LH** become shorthand for specific terminal pairs and SLA templates.',
    'Freighter vs. belly decisions for **high-value botanical** pallets hinge on whether **TG** / **QR** / **LH** can offer contiguous temperature logs—not generic marketing claims.',
    'Ground handlers pairing with **LH** in Germany, **QR** in Qatar, or **TG** in Thailand must align with exporters’ batch narratives so customs see one coherent custody story.',
    'PeakSeason dashboards for **legal export** lanes now include “airline trio” scenarios: reroute via **QR**, extend on **LH**, or recover through **TG**—each pre-cleared in QA playbooks.',
    'Investor decks aside, operators know **TG**, **QR**, and **LH** as operational variables: fuel, payload, and pharmaceutical handling contracts determine viability.',
  ];
  return blurbs[i % blurbs.length];
}

/**
 * 10 unique editorial variants — original copy; Serp headline is NOT reused as title.
 */
function buildOriginalArticle(item, index) {
  const themes = inferThemes(item.title);
  const t0 = themes[0];
  const t1 = themes[1] || 'cross-border compliance';
  const t2 = themes[2] || 'lane documentation';
  const carriers = carrierBlurb(index);
  const hashSlice = createHash('sha256')
    .update(item.link || String(index))
    .digest('hex')
    .slice(0, 6);

  const variants = [
    {
      title: `Medical cannabis export paperwork keeps pace with ${t0.split(' ').slice(-2).join(' ')}`,
      content: `**Licensed medical-cannabis exports** are no longer a “farm-only” story: international **${t0}** and **${t1}** now force air logistics leads to treat every uplift like a pharma movement.

${carriers}

**Practical focus**
- Align **batch release language** with what health and customs authorities expect on landing  
- Pre-stage **QR code / serial references** where jurisdictions require traceability snapshots  
- Lock **named airline pairs** (e.g. **TG**, **QR**, **LH**) into SOPs instead of improvising after disruption  

Editorial note: Industry framing only (${hashSlice}); not legal, medical, or investment advice.`,
    },
    {
      title: `EU-bound botanical cargo: ${t2} under the microscope`,
      content: `European demand continues to pull **regulated botanical** volumes through major hubs. Shippers report that **${t2}** is the bottleneck—not finding a truck at origin, but proving an unbroken story from vault to aircraft.

${carriers}

Teams building **export programs** pair **GDP** discipline with airline acceptance rules, especially where **medical cannabis** categories trigger extra declaration checks.

**Checkpoint**
- Standardize **MSDS / CoA packs** per lane, not per forwarder improvisation  
- rehearse **IRROPS** with alternate **TG / QR / LH** routings documented  

Editorial note: Industry patterns (${hashSlice}); verify rules with qualified counsel.`,
    },
    {
      title: `Freighter vs belly: cannabis export economics still favour discipline`,
      content: `Whether pallets ride dedicated freighters or **belly-hold** on widebodies, **${t0}** economics hinge on dwell time and documentation—not headline spot rates.

${carriers}

**Cold-chain air** choices for **medical cannabis** exports should assume inspections: the winning lanes pre-clear paperwork with handlers aligned to **GMP-minded** exporters.

- Model **LH**-centric Europe recovery days  
- Map **QR** connection banks for APAC–EU hand-offs  
- Keep **TG** options for certain Asia–Europe direct pairs  

Note: Operational commentary (${hashSlice}) only.`,
    },
    {
      title: `Southeast Asia origins sync with EU import reality on ${t1}`,
      content: `Origin teams in **${t0.includes('Asia') ? 'Southeast Asia' : 'key export regions'}** increasingly mirror EU expectations: **${t1}** becomes the shared language between growers, QPs, and airline cargo desks.

${carriers}

**Medical cannabis export** scheduling must assume that **TG**, **QR**, and **LH** represent different cut-off cultures—missing one can void a temperature logger’s narrative.

Actions:
- Publish **cut-off matrices** per airline code  
- Assign **owner** for each segment’s POD signature  

Editorial note (${hashSlice}): not carrier endorsement.`,
    },
    {
      title: `Airline cargo desks see more "pharma-grade" cannabis dossiers`,
      content: `Forwarders say airline acceptance teams now ask for **pharma-grade** dossiers even when the product is **botanical**—because **${t2}** crosses both agricultural and health regimes.

${carriers}

For exporters, spelling out **TG** / **QR** / **LH** handling agreements prevents last-minute offload when commodity templates do not fit.

**List**
- **Digital dossier** + print kit  
- **24/7 escalation** names per hub  
- **Humidity / temp** alarm thresholds agreed in writing  

Industry brief (${hashSlice}).`,
    },
    {
      title: `Traceability chains stress-test hub connectivity via major network carriers`,
      content: `Traceability is only as strong as the weakest hub scan. **${t0}** programs that survive audits tie scans to airline events—uplift, transfer, recovery.

${carriers}

**Cannabis exports** moving under medical frameworks should treat **QR**, **LH**, and **TG** as part of the validation graph, not “black box” transport.

Editorial (${hashSlice}).`,
    },
    {
      title: `Cold-chain monitors outlive marketing claims on long-haul pairs`,
      content: `Data loggers do not care about brand slogans. For **${t1}**, reliability means **cold-chain** monitors that survive **${t0}** reality: tarmac heat, rework, and re-icing.

${carriers}

**Export logistics** leads benchmark **medical cannabis** lanes against pharma peers—same LOGGER discipline, different harmonized codes.

Tips:
- Prefer **direct** or **minimal-touch** pairs when stability budgets are thin  
- Pre-approve **reroute trees** referencing **TG**, **QR**, **LH** where feasible  

Note (${hashSlice}).`,
    },
    {
      title: `Regulators watch hand-offs: forwarders tighten airline playbooks`,
      content: `Forwarder playbooks now read like audit trails: who signs at warehouse, who signs at **ULD** build-up, who releases to **TG**, **QR**, or **LH**.

${carriers}

**Cannabis export** clients are asked to prove **${t2}** before payment triggers—air logistics becomes a compliance product.

Editorial (${hashSlice}).`,
    },
    {
      title: `Capacity churn pushes backup routings into export SOPs`,
      content: `Peak-season cancellations make **${t0}** exports vulnerable unless backup routings are contractual, not verbal. Teams pre-book **QR** / **LH** / **TG** alternates with handler alignment.

${carriers}

**Medical cannabis** remains sensitive cargo: offload risk is reputational for airlines and financial for shippers.

Editorial (${hashSlice}).`,
    },
    {
      title: `Integration outlook: data + air cargo for licensed botanical trade`,
      content: `Licensed **botanical trade** will keep leaning on **data integrations**—ERP, track-and-trace, and airline messaging—so **${t1}** matches physical flow.

${carriers}

**Export logistics** success stories cite boring reliability: repeated **TG**, **QR**, **LH** pairs with known dwell stats.

Editorial (${hashSlice}).`,
    },
  ];

  const v = variants[index % variants.length];
  const title = v.title;
  const content = v.content.trim();
  const plain = content.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\n+/g, ' ');
  const excerpt = plain.slice(0, 218).trim() + (plain.length > 218 ? '…' : '');

  return { title, excerpt, content };
}

/** Visual bucket for stock / Imagen prompt — derived from written article, not raw Serp headline */
function inferVisualTheme(parsed) {
  const blob = `${parsed.title} ${parsed.content}`.toLowerCase();
  if (/cold|temperature|logger|gel.?pack|monitor/.test(blob)) return 'cold_chain';
  if (/hub|transfer|connect|interline|bank|recovery|pair/.test(blob)) return 'hub_cargo';
  if (/freighter|belly|widebody|uld|uplift|payload|aircraft/.test(blob)) return 'aircraft_cargo';
  if (/traceability|scan|data|integration|erp|digital/.test(blob)) return 'logistics_tech';
  if (/customs|clearance|dossier|documentation|declaration|paperwork|permit/.test(blob))
    return 'documentation';
  return 'air_cargo_general';
}

/** Brief for human/ agent illustration (EU-resource style: editorial, abstract logistics) */
function buildAgentCoverBrief(parsed, visualTheme, index) {
  const title = parsed.title.replace(/\*\*/g, '');
  const mood = [
    'dramatic dusk runway lighting with teal and amber accent palette',
    'clean daylight documentary feel, soft mist and cool blues',
    'high-contrast night operations, sodium lights and deep shadows',
  ][index % 3];
  const scene = {
    cold_chain:
      'insulated air cargo containers and digital temperature icons, abstract cold-chain network lines connecting continents',
    hub_cargo:
      'busy cargo hub abstract: sorting conveyors, neutral ULD shapes, flight-path arcs between Bangkok–Doha–Frankfurt (no readable airline logos)',
    aircraft_cargo:
      'widebody cargo door and loading silhouette, high-loader geometry, emphasis on precision and scale',
    logistics_tech:
      'abstract data ribbons merging with shipping labels and barcode motifs, warehouse depth of field',
    documentation:
      'stacks of binders and tablet checklist UI mockup, all text as generic lorem bars — compliance office calm',
    air_cargo_general:
      'sealed neutral shipping cartons on a tarmac with distant aircraft silhouette, export corridor metaphor',
  }[visualTheme] || 'pharmaceutical-style export logistics, global air corridors';
  return `Editorial illustration for a B2B logistics news article titled: "${title}". Theme: licensed medical product export, air freight, compliance. Visual: ${scene}. Style: modern flat-vector meets soft 3D, same premium family as EU pharmaceutical resource covers — sophisticated, not cartoonish. Colour: corporate teal, graphite, warm gold accents. ${mood}. CRITICAL: no cannabis leaves or buds, no marijuana imagery, no pills scattered, no real airline logos or IATA trademarks, no photorealistic faces, no legible text or watermarks. Horizontal 16:9 hero composition.`;
}

function buildImagePrompt(parsed, visualTheme, index) {
  const angles = [
    'Wide cinematic editorial photograph, 16:9 composition',
    'Documentary-style medium shot, muted colour grade',
    'High-contrast blue-hour airport scene, realistic photography',
  ];
  const angle = angles[index % angles.length];
  const scenes = {
    cold_chain:
      'insulated air cargo cartons and temperature-monitoring gear on an airport cargo apron, focus on logistics hardware not brands',
    hub_cargo:
      'busy international air cargo hub with neutral ULDs and roller system, shallow depth of field, no readable signage',
    aircraft_cargo:
      'nighttime cargo loading: high-loader at a widebody freighter door, safety markings visible, anonymous equipment',
    logistics_tech:
      'modern logistics desk with barcode scanner and sealed shipping labels in soft focus, cool professional lighting',
    documentation:
      'organised compliance binders and a tablet showing a checklist on a clean desk, shallow DOF, no legible text',
    air_cargo_general:
      'neutral pharmaceutical-style shipping boxes on an airport warehouse dock with aircraft silhouette in foggy background',
  };
  const scene = scenes[visualTheme] || scenes.air_cargo_general;
  const topic = parsed.title.slice(0, 120).replace(/\*\*/g, '');
  return `${angle}. ${scene}. Context: regulated international air freight and pharmaceutical-style export compliance (inspired by themes around: ${topic}). Absolutely no cannabis plants, no marijuana, no loose botanical product, no pills overflow, no readable airline logos or trademark liveries, no identifiable people or faces, no text overlays, no watermark. Photorealistic supply-chain journalism style.`;
}

function pickThemedUnsplashUrl(visualTheme, index) {
  const list = UNSPLASH_BY_THEME[visualTheme] || UNSPLASH_BY_THEME.air_cargo_general;
  return list[index % list.length];
}

function saveBufferToPublic(index, buf, ext) {
  const dir = join(__dirname, '..', 'public', 'images', 'news');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const num = String(index + 1).padStart(2, '0');
  const filename = `article-${num}.${ext}`;
  const filepath = join(dir, filename);
  writeFileSync(filepath, buf);
  return `/images/news/${filename}`;
}

async function tryImagenCover(index, parsed, visualTheme) {
  if (!geminiKeyForImages || process.env.NEWS_SKIP_IMAGEN === '1') return null;
  let GoogleGenAI;
  try {
    ({ GoogleGenAI } = await import('@google/genai'));
  } catch (e) {
    console.warn('  [img] @google/genai not available:', e.message);
    return null;
  }
  const prompt = buildImagePrompt(parsed, visualTheme, index);
  const modelsToTry = [
    newsImageModel,
    'imagen-4.0-generate-001',
    'imagen-3.0-generate-002',
  ].filter((m, i, a) => a.indexOf(m) === i);

  const ai = new GoogleGenAI({ apiKey: geminiKeyForImages });
  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateImages({
        model,
        prompt,
        config: {
          numberOfImages: 1,
          aspectRatio: '16:9',
          outputMimeType: 'image/jpeg',
          personGeneration: 'DONT_ALLOW',
        },
      });
      const first = response?.generatedImages?.[0];
      const b64 = first?.image?.imageBytes;
      if (!b64) {
        const rai = first?.raiFilteredReason;
        if (rai) console.warn(`  [img] Imagen (${model}) filtered:`, rai);
        continue;
      }
      const buf = Buffer.from(b64, 'base64');
      if (buf.length < 3000) continue;
      const url = saveBufferToPublic(index, buf, 'jpg');
      console.log(`  [img] Imagen ${model} → ${url}`);
      return url;
    } catch (e) {
      const msg = e?.message || String(e);
      console.warn(`  [img] Imagen (${model})`, msg.slice(0, 180));
    }
  }
  return null;
}

async function downloadImageToPublic(index, remoteUrl) {
  const dir = join(__dirname, '..', 'public', 'images', 'news');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const num = String(index + 1).padStart(2, '0');
  try {
    const res = await fetch(remoteUrl, {
      redirect: 'follow',
      headers: { 'User-Agent': 'OMGExp-NewsSeed/1.0' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    let ext = 'jpg';
    if (ct.includes('png')) ext = 'png';
    else if (ct.includes('webp')) ext = 'webp';
    else if (ct.includes('gif')) ext = 'gif';
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 2000) throw new Error('too small');
    const filename = `article-${num}.${ext}`;
    const filepath = join(dir, filename);
    writeFileSync(filepath, buf);
    return `/images/news/${filename}`;
  } catch (e) {
    console.warn(`  [img] #${num} failed (${remoteUrl.slice(0, 60)}…): ${e.message}`);
    return null;
  }
}

/**
 * Order: Imagen (optional) → theme Unsplash → Serp thumbnail → generic remote
 */
async function resolveCoverImageAligned(index, parsed, thumbnail) {
  const visualTheme = inferVisualTheme(parsed);

  const gen = await tryImagenCover(index, parsed, visualTheme);
  if (gen) return gen;

  const themedUrl = pickThemedUnsplashUrl(visualTheme, index);
  const stock = await downloadImageToPublic(index, themedUrl);
  if (stock) {
    console.log(`  [img] theme=${visualTheme} Unsplash → ${stock}`);
    return stock;
  }

  if (thumbnail && String(thumbnail).startsWith('https://')) {
    const serp = await downloadImageToPublic(index, thumbnail);
    if (serp) {
      console.log(`  [img] Serp thumbnail → ${serp}`);
      return serp;
    }
  }

  const fallbackUrl = UNSPLASH_FALLBACKS[index % UNSPLASH_FALLBACKS.length];
  const last = await downloadImageToPublic(index, fallbackUrl);
  if (last) {
    console.log(`  [img] generic Unsplash → ${last}`);
    return last;
  }
  console.warn(`  [img] remote placeholder #${index + 1}`);
  return PLACEHOLDER_REMOTE;
}

async function main() {
  console.log('1) SerpAPI Google News…');
  const queries = [
    'cannabis export air cargo logistics TG QR Lufthansa',
    'medical cannabis pharmaceutical freight Thailand Germany airline',
    'Qatar Airways cargo medical cannabis Europe import',
    'Thai Airways freighter cargo pharmaceutical logistics',
    'Germany cannabis import air freight cold chain',
  ];

  const merged = [];
  for (const q of queries) {
    const data = await fetchSerpNews(q);
    merged.push(...flattenNewsResults(data));
    await new Promise((r) => setTimeout(r, 1100));
  }

  const seen = new Set();
  const unique = [];
  for (const x of merged) {
    if (seen.has(x.link)) continue;
    seen.add(x.link);
    unique.push(x);
  }

  unique.sort((a, b) => scoreArticle(b) - scoreArticle(a));
  const picked = unique.slice(0, 12);
  if (picked.length < 5) {
    console.warn('Few hits; broadening query…');
    const extra = flattenNewsResults(
      await fetchSerpNews('cannabis export logistics airline 2025'),
    );
    for (const x of extra) {
      if (seen.has(x.link)) continue;
      seen.add(x.link);
      picked.push(x);
      if (picked.length >= 12) break;
    }
  }

  const finalTen = picked.slice(0, 10);
  if (finalTen.length < 10) {
    console.error('Not enough SerpAPI results:', finalTen.length);
    process.exit(1);
  }

  const newsImageMode = (process.env.NEWS_IMAGE_MODE || 'stock').toLowerCase();
  const r2PublicBase = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
  if (newsImageMode === 'agent-r2' && !r2PublicBase) {
    console.error('NEWS_IMAGE_MODE=agent-r2 requires R2_PUBLIC_URL in .env.local');
    process.exit(1);
  }

  const rows = [];
  const manifestItems = [];
  const usedSlugs = new Set();

  for (let i = 0; i < finalTen.length; i++) {
    const item = finalTen[i];
    console.log(`\n[${i + 1}/10] Content ← hint: ${item.title.slice(0, 70)}…`);
    const parsed = buildOriginalArticle(item, i);
    const visualTheme = inferVisualTheme(parsed);

    let slug = slugify(parsed.title);
    let n = 2;
    while (usedSlugs.has(slug)) {
      slug = `${slugify(parsed.title)}-${n++}`;
    }
    usedSlugs.add(slug);

    let imageUrl;
    if (newsImageMode === 'agent-r2') {
      const num = String(i + 1).padStart(2, '0');
      imageUrl = `${r2PublicBase}/news/article-${num}.png`;
      console.log(`  [img] agent-r2 → ${imageUrl} (upload PNG as public/images/news/r2-agent-${num}.png then npm run upload:news-r2)`);
      manifestItems.push({
        order: i + 1,
        slug,
        title: parsed.title,
        excerpt: parsed.excerpt,
        visualTheme,
        coverIllustrationBrief: buildAgentCoverBrief(parsed, visualTheme, i),
        r2Key: `news/article-${num}.png`,
        localFile: `r2-agent-${num}.png`,
      });
    } else {
      console.log(`  [img] resolving cover (theme: ${visualTheme})…`);
      imageUrl = await resolveCoverImageAligned(i, parsed, item.thumbnail);
      await new Promise((r) => setTimeout(r, 350));
    }

    rows.push({
      slug,
      title: parsed.title,
      excerpt: parsed.excerpt.slice(0, 500),
      content: parsed.content,
      image_url: imageUrl,
      is_pinned: i === 0,
      is_published: true,
      published_at: new Date().toISOString(),
    });
  }

  if (newsImageMode === 'agent-r2') {
    const manifestPath = join(__dirname, '.news-seed-manifest.json');
    writeFileSync(
      manifestPath,
      JSON.stringify({ generatedAt: new Date().toISOString(), mode: 'agent-r2', items: manifestItems }, null, 2),
      'utf8'
    );
    console.log('\nWrote', manifestPath, '— generate covers then run: npm run upload:news-r2');
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  const { error } = await supabase.from('news_articles').upsert(rows, {
    onConflict: 'slug',
    ignoreDuplicates: false,
  });

  if (error) {
    console.error('Supabase upsert failed:', error.message);
    process.exit(1);
  }

  console.log('\nOK: upserted', rows.length, 'articles.');
  rows.forEach((r) => console.log(' -', r.slug, '→', r.image_url));
}

await main();
