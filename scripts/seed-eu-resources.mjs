/**
 * Seed 10 EU–Thai medical cannabis resources (upsert by slug).
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

const rows = [
  {
    slug: 'thai-controlled-herb-be2568-export-licensing',
    title: 'Thailand B.E. 2568: Controlled Herb Framework & Export Licensing',
    excerpt:
      'How medical-only reclassification affects exporters: DTAM oversight, licensing intent, and documentation expectations for international shipments.',
    content: `Thailand's regulatory pivot moves commercial activity—including export—toward a strictly controlled medical and research model. The framework treats inflorescences as a controlled herbal category, with oversight aligned to public-health objectives rather than general retail use.

**What exporters should prepare**
- A clear statement of **medical or research purpose** for every outbound batch
- **Source and quantity traceability** documented before permit applications
- Alignment between your **domestic licence scope** and the stated end-use in the destination market

**Operational takeaway**
Treat export permitting as a continuous compliance process: each shipment should be defensible as a medical-grade movement, with files that can be presented to customs and health authorities without gaps.`,
    tags: ['Thailand', 'EU Export', 'Regulatory', 'Medical Cannabis'],
    image_url: '/images/resources/eu-cannabis-res-01.png',
    is_published: true,
    published_at: publishedAt,
  },
  {
    slug: 'thc-limits-traceability-dtam-reporting',
    title: 'THC Thresholds, Narcotics Exceptions & Seed-to-Sale Traceability',
    excerpt:
      'Practical notes on low-THC export norms, research-only exceptions, and why batch-level reporting to national health structures is now central.',
    content: `Most routine medical export pathways expect products that meet commonly cited **low-THC** specifications used in cross-border herbal trade, unless a separate **research authorization** applies explicitly under narcotics control rules.

**Traceability expectations**
- Chain-of-custody from cultivation through release-for-export  
- **Batch identifiers** stable across lab results, packing lists, and customs declarations  
- Timely reporting consistent with national **seed-to-sale** or controlled-herb reporting duties

**Risk control**
Ambiguity between "agricultural commodity" and "controlled medical material" is where delays occur—document the batch as medical from the earliest internal step.`,
    tags: ['Compliance', 'Traceability', 'Medical Cannabis', 'EU Export'],
    image_url: '/images/resources/eu-cannabis-res-04.png',
    is_published: true,
    published_at: publishedAt,
  },
  {
    slug: 'thai-gacp-farm-baseline-eu-quality',
    title: 'Thai GACP: Farm-Level Quality as the EU-Readiness Baseline',
    excerpt:
      'Good Agricultural and Collection Practices as the foundation for contamination control, genetic traceability, and consistent batches before any GMP upgrade.',
    content: `**Thai GACP** is positioned as the on-farm quality backbone: soils, inputs, hygiene, and harvest discipline determine whether later processing can ever reach pharmaceutical expectations.

**Focus areas that EU-oriented buyers scrutinize**
- **Heavy metals and environmental monitoring** (soil, water, and representative plant sampling)  
- **Restricted inputs**: only approved plant protection and handling practices  
- **Cultivation records**: genetics, plot history, harvest windows, and deviation logs  

**Scale reality**
Certified farm capacity remains a bottleneck relative to total licence holders—early GACP maturity is a competitive advantage when negotiating import partnerships.`,
    tags: ['GACP', 'Quality', 'Medical Cannabis', 'Thailand'],
    image_url: '/images/resources/eu-cannabis-res-02.png',
    is_published: true,
    published_at: publishedAt,
  },
  {
    slug: 'eu-gmp-annex7-post-harvest-manufacturing',
    title: 'EU-GMP & Annex 7: When Post-Harvest Processing Becomes Manufacturing',
    excerpt:
      'Why trimming, drying, and curing may fall under GMP—not agriculture—and what validated facility design implies for Thai operators.',
    content: `In the European framing, medical cannabis may be handled as an **API** or **finished dosage** depending on product form. **Annex 7** expectations for herbal medicinal products mean post-harvest steps can be treated as the **start of manufacturing**, not farm-only activity.

**Facility implications**
- **Validated rooms and equipment** for defined processing routes  
- Environmental and microbial controls proportionate to claimed product category  
- Change control and batch documentation that match **EU inspector expectations**

**Bridge from GACP**
Operators should map each post-harvest unit operation to a **GMP step** with inputs, outputs, tolerances, and release criteria—before commissioning customer audits.`,
    tags: ['EU-GMP', 'Manufacturing', 'Medical Cannabis', 'Compliance'],
    image_url: '/images/resources/eu-cannabis-res-03.png',
    is_published: true,
    published_at: publishedAt,
  },
  {
    slug: 'qualified-person-eu-batch-release',
    title: 'The Qualified Person (QP) & EU Batch Certification',
    excerpt:
      'How the European Qualified Person role gates market entry and why Thai exporters should design dossiers and batch records for QP review early.',
    content: `Each batch placed on the European market under the medicinal framework must be supported by a **Qualified Person (QP)** certification chain appropriate to the product class.

**What to design for**
- **Complete batch manufacturing narrative** from GMP steps through packaging and labelling (as applicable)  
- **Analytical package** aligned to monograph-style expectations where invoked  
- Clear **impurity and microbiological narratives** with limits justified for the dosage form  

**Partnering note**
Importers and contract manufacturers often structure QP access—Thai suppliers succeed fastest when their **batch folders** are already inspector-grade at origin.`,
    tags: ['EU', 'QP', 'Quality', 'Medical Cannabis'],
    image_url: '/images/resources/eu-cannabis-res-05.png',
    is_published: true,
    published_at: publishedAt,
  },
  {
    slug: 'gdp-cold-chain-eu-transit-integrity',
    title: 'GDP Cold Chain & Long-Haul Integrity to Europe',
    excerpt:
      'Protecting terpene and cannabinoid profiles across international lanes: temperature mapping, contingencies, and documentary evidence.',
    content: `**Good Distribution Practice (GDP)** thinking extends beyond a refrigerated truck—it includes **lane qualification**, packaging qualification, and **alarm response** when deviations occur.

**Controls that matter on long routes**
- Pre-defined **temperature ranges** and monitoring device placement  
- **Risk-rated routing** (seasonality, dwell time, ground segments)  
- **Single-batch traceability** inside the thermal shipper or active container record  

**Evidence pack**
Couriers and terminals will challenge ambiguous paperwork—tie each temperature logger ID to **batch number and airwaybill** in one index.`,
    tags: ['GDP', 'Logistics', 'Cold Chain', 'EU Export'],
    image_url: '/images/resources/eu-cannabis-res-06.png',
    is_published: true,
    published_at: publishedAt,
  },
  {
    slug: 'cantrak-digital-traceability-export-evidence',
    title: 'Cantrak: Digital Traceability for Export-Grade Evidence',
    excerpt:
      'How a seed-to-sale platform can unify licences, batch genealogy, and lab outcomes into documentation EU partners can rely on—without manual spreadsheet risk.',
    content: `**Cantrak** is referenced here as an example of **digital traceability infrastructure**: linking cultivation authorizations, batch IDs, quality measurements, and export paperwork in a coherent audit trail.

**Practical benefits**
- Fewer **transcription errors** between farm, lab, and forwarder  
- Faster responses to **regulator or importer queries** with immutable event history  
- Stronger foundation for **customer due diligence** prior to QP review  

**Adoption tip**
Define mandatory fields at **harvest, processing, and release** so operators cannot mark a step complete without attaching the required evidentiary artifacts.`,
    tags: ['Cantrak', 'Traceability', 'Digital', 'Medical Cannabis'],
    image_url: '/images/resources/eu-cannabis-res-07.png',
    is_published: true,
    published_at: publishedAt,
  },
  {
    slug: 'ph-eur-alignment-from-thai-gacp-data',
    title: 'European Pharmacopoeia Alignment: From Thai GACP Data to Monograph Thinking',
    excerpt:
      'Bridging farm data with Ph. Eur.-style limits—identity, purity, and microbiological control concepts exporters should mirror in specifications.',
    content: `Importers often evaluate whether origin **specifications** can meet **monograph-oriented** thinking even when not every parameter is literally identical.

**Build specifications deliberately**
- **Identity** anchors (botanical, analytical fingerprint as agreed)  
- **Process impurities** tracked with trending, not one-off screens  
- **Microbial strategy** tied to manufacturing step and shelf-life claim  

**Documentation habit**
Treat every harvest season as a **stability and trend chapter**: charts that show your process is **in statistical control** resonate in technical meetings.`,
    tags: ['Ph. Eur.', 'Specifications', 'Quality', 'EU'],
    image_url: '/images/resources/eu-cannabis-res-08.png',
    is_published: true,
    published_at: publishedAt,
  },
  {
    slug: 'germany-medical-cannabis-market-access-pathways',
    title: 'Germany: Medical Demand, Import Pathways & Partnership Structures',
    excerpt:
      "The EU's largest medical market rewards EU-GMP-grade supply—but entry is partnership-heavy. Generic overview without naming commercial intermediaries.",
    content: `Germany continues to anchor European medical demand growth under evolving federal cannabis medicine rules. **Import-oriented pathways** typically require:

- **EU-GMP** manufacturing credibility at the producing or processing site  
- A structured relationship with a **domestic importer** or holder of appropriate authorization  
- **Quota-aware planning**—national procurement volumes shift year to year; forecasts should be stress-tested  

**Thai exporter stance**
Prioritize **technical compatibility**: if your dossier structure matches what German partners already file, you shorten diligence cycles.`,
    tags: ['Germany', 'Market Access', 'EU Export', 'Medical Cannabis'],
    image_url: '/images/resources/eu-cannabis-res-09.png',
    is_published: true,
    published_at: publishedAt,
  },
  {
    slug: 'pharmaceutical-mindset-thai-eu-export-roadmap',
    title: 'From Agriculture to Pharmaceutical Mindset: A Thai–EU Export Roadmap',
    excerpt:
      'Closing the sophistication gap—why integrated quality, logistics, and traceability (including tools like Cantrak) are prerequisites, not accessories.',
    content: `The export window for Thai medical cannabis into the EU favors organizations that behave like **pharmaceutical suppliers**, not commodity growers.

**Roadmap pillars**
1. **Licence-to-lot traceability** end-to-end  
2. **GACP → GMP transition plan** with dated milestones  
3. **Importer-QP-aligned** batch record templates  
4. **GDP-qualified** international logistics evidence  
5. **Digital systems** (e.g., **Cantrak**) that reduce reconciliation time under audit  

**Closing**
Winning bids are won in **document quality** and **batch repeatability**—invest there before scaling hectares alone.`,
    tags: ['Strategy', 'EU Export', 'Medical Cannabis', 'Thailand'],
    image_url: '/images/resources/eu-cannabis-res-10.png',
    is_published: true,
    published_at: publishedAt,
  },
];

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
