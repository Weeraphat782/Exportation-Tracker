-- 10 Resources: Thai medical cannabis export → EU strategic framework
-- Source synthesis from internal strategic brief (no third-party company names except Cantrak).
-- Cover images: run `npm run upload:resources-r2` to put PNGs on Cloudflare R2 and set Supabase image_url.
-- (Or keep paths under /images/resources/ for local-only.)
-- Safe to re-run: UPSERT by slug

INSERT INTO public.resources (
  slug,
  title,
  excerpt,
  content,
  tags,
  image_url,
  is_published,
  published_at
) VALUES
(
  'thai-controlled-herb-be2568-export-licensing',
  'Thailand B.E. 2568: Controlled Herb Framework & Export Licensing',
  'How medical-only reclassification affects exporters: DTAM oversight, licensing intent, and documentation expectations for international shipments.',
  $$Thailand’s regulatory pivot moves commercial activity—including export—toward a strictly controlled medical and research model. The framework treats inflorescences as a controlled herbal category, with oversight aligned to public-health objectives rather than general retail use.

**What exporters should prepare**
- A clear statement of **medical or research purpose** for every outbound batch
- **Source and quantity traceability** documented before permit applications
- Alignment between your **domestic licence scope** and the stated end-use in the destination market

**Operational takeaway**
Treat export permitting as a continuous compliance process: each shipment should be defensible as a medical-grade movement, with files that can be presented to customs and health authorities without gaps.$$
,
  ARRAY['Thailand Regulatory'],
  '/images/resources/eu-cannabis-res-01.png',
  true,
  NOW()
),
(
  'thc-limits-traceability-dtam-reporting',
  'THC Thresholds, Narcotics Exceptions & Seed-to-Sale Traceability',
  'Practical notes on low-THC export norms, research-only exceptions, and why batch-level reporting to national health structures is now central.',
  $$Most routine medical export pathways expect products that meet commonly cited **low-THC** specifications used in cross-border herbal trade, unless a separate **research authorization** applies explicitly under narcotics control rules.

**Traceability expectations**
- Chain-of-custody from cultivation through release-for-export  
- **Batch identifiers** stable across lab results, packing lists, and customs declarations  
- Timely reporting consistent with national **seed-to-sale** or controlled-herb reporting duties

**Risk control**
Ambiguity between "agricultural commodity" and "controlled medical material" is where delays occur—document the batch as medical from the earliest internal step.$$
,
  ARRAY['Thailand Regulatory'],
  '/images/resources/eu-cannabis-res-04.png',
  true,
  NOW()
),
(
  'thai-gacp-farm-baseline-eu-quality',
  'Thai GACP: Farm-Level Quality as the EU-Readiness Baseline',
  'Good Agricultural and Collection Practices as the foundation for contamination control, genetic traceability, and consistent batches before any GMP upgrade.',
  $$**Thai GACP** is positioned as the on-farm quality backbone: soils, inputs, hygiene, and harvest discipline determine whether later processing can ever reach pharmaceutical expectations.

**Focus areas that EU-oriented buyers scrutinize**
- **Heavy metals and environmental monitoring** (soil, water, and representative plant sampling)  
- **Restricted inputs**: only approved plant protection and handling practices  
- **Cultivation records**: genetics, plot history, harvest windows, and deviation logs  

**Scale reality**
Certified farm capacity remains a bottleneck relative to total licence holders—early GACP maturity is a competitive advantage when negotiating import partnerships.$$
,
  ARRAY['Origin Quality'],
  '/images/resources/eu-cannabis-res-02.png',
  true,
  NOW()
),
(
  'eu-gmp-annex7-post-harvest-manufacturing',
  'EU-GMP & Annex 7: When Post-Harvest Processing Becomes Manufacturing',
  'Why trimming, drying, and curing may fall under GMP—not agriculture—and what validated facility design implies for Thai operators.',
  $$In the European framing, medical cannabis may be handled as an **API** or **finished dosage** depending on product form. **Annex 7** expectations for herbal medicinal products mean post-harvest steps can be treated as the **start of manufacturing**, not farm-only activity.

**Facility implications**
- **Validated rooms and equipment** for defined processing routes  
- Environmental and microbial controls proportionate to claimed product category  
- Change control and batch documentation that match **EU inspector expectations**

**Bridge from GACP**
Operators should map each post-harvest unit operation to a **GMP step** with inputs, outputs, tolerances, and release criteria—before commissioning customer audits.$$
,
  ARRAY['EU GMP & QP'],
  '/images/resources/eu-cannabis-res-03.png',
  true,
  NOW()
),
(
  'qualified-person-eu-batch-release',
  'The Qualified Person (QP) & EU Batch Certification',
  'How the European Qualified Person role gates market entry and why Thai exporters should design dossiers and batch records for QP review early.',
  $$Each batch placed on the European market under the medicinal framework must be supported by a **Qualified Person (QP)** certification chain appropriate to the product class.

**What to design for**
- **Complete batch manufacturing narrative** from GMP steps through packaging and labelling (as applicable)  
- **Analytical package** aligned to monograph-style expectations where invoked  
- Clear **impurity and microbiological narratives** with limits justified for the dosage form  

**Partnering note**
Importers and contract manufacturers often structure QP access—Thai suppliers succeed fastest when their **batch folders** are already inspector-grade at origin.$$
,
  ARRAY['EU GMP & QP'],
  '/images/resources/eu-cannabis-res-05.png',
  true,
  NOW()
),
(
  'gdp-cold-chain-eu-transit-integrity',
  'GDP Cold Chain & Long-Haul Integrity to Europe',
  'Protecting terpene and cannabinoid profiles across international lanes: temperature mapping, contingencies, and documentary evidence.',
  $$**Good Distribution Practice (GDP)** thinking extends beyond a refrigerated truck—it includes **lane qualification**, packaging qualification, and **alarm response** when deviations occur.

**Controls that matter on long routes**
- Pre-defined **temperature ranges** and monitoring device placement  
- **Risk-rated routing** (seasonality, dwell time, ground segments)  
- **Single-batch traceability** inside the thermal shipper or active container record  

**Evidence pack**
Couriers and terminals will challenge ambiguous paperwork—tie each temperature logger ID to **batch number and airwaybill** in one index.$$
,
  ARRAY['GDP Logistics'],
  '/images/resources/eu-cannabis-res-06.png',
  true,
  NOW()
),
(
  'cantrak-digital-traceability-export-evidence',
  'Cantrak: Digital Traceability for Export-Grade Evidence',
  'How a seed-to-sale platform can unify licences, batch genealogy, and lab outcomes into documentation EU partners can rely on—without manual spreadsheet risk.',
  $$**Cantrak** is referenced here as an example of **digital traceability infrastructure**: linking cultivation authorizations, batch IDs, quality measurements, and export paperwork in a coherent audit trail.

**Practical benefits**
- Fewer **transcription errors** between farm, lab, and forwarder  
- Faster responses to **regulator or importer queries** with immutable event history  
- Stronger foundation for **customer due diligence** prior to QP review  

**Adoption tip**
Define mandatory fields at **harvest, processing, and release** so operators cannot mark a step complete without attaching the required evidentiary artifacts.$$
,
  ARRAY['EU Market Strategy'],
  '/images/resources/eu-cannabis-res-07.png',
  true,
  NOW()
),
(
  'ph-eur-alignment-from-thai-gacp-data',
  'European Pharmacopoeia Alignment: From Thai GACP Data to Monograph Thinking',
  'Bridging farm data with Ph. Eur.-style limits—identity, purity, and microbiological control concepts exporters should mirror in specifications.',
  $$Importers often evaluate whether origin **specifications** can meet **monograph-oriented** thinking even when not every parameter is literally identical.

**Build specifications deliberately**
- **Identity** anchors (botanical, analytical fingerprint as agreed)  
- **Process impurities** tracked with trending, not one-off screens  
- **Microbial strategy** tied to manufacturing step and shelf-life claim  

**Documentation habit**
Treat every harvest season as a **stability and trend chapter**: charts that show your process is **in statistical control** resonate in technical meetings.$$
,
  ARRAY['Origin Quality'],
  '/images/resources/eu-cannabis-res-08.png',
  true,
  NOW()
),
(
  'germany-medical-cannabis-market-access-pathways',
  'Germany: Medical Demand, Import Pathways & Partnership Structures',
  'The EU’s largest medical market rewards EU-GMP-grade supply—but entry is partnership-heavy. Generic overview without naming commercial intermediaries.',
  $$Germany continues to anchor European medical demand growth under evolving federal cannabis medicine rules. **Import-oriented pathways** typically require:

- **EU-GMP** manufacturing credibility at the producing or processing site  
- A structured relationship with a **domestic importer** or holder of appropriate authorization  
- **Quota-aware planning**—national procurement volumes shift year to year; forecasts should be stress-tested  

**Thai exporter stance**
Prioritize **technical compatibility**: if your dossier structure matches what German partners already file, you shorten diligence cycles.$$
,
  ARRAY['EU Market Strategy'],
  '/images/resources/eu-cannabis-res-09.png',
  true,
  NOW()
),
(
  'pharmaceutical-mindset-thai-eu-export-roadmap',
  'From Agriculture to Pharmaceutical Mindset: A Thai–EU Export Roadmap',
  'Closing the sophistication gap—why integrated quality, logistics, and traceability (including tools like Cantrak) are prerequisites, not accessories.',
  $$The export window for Thai medical cannabis into the EU favors organizations that behave like **pharmaceutical suppliers**, not commodity growers.

**Roadmap pillars**
1. **Licence-to-lot traceability** end-to-end  
2. **GACP → GMP transition plan** with dated milestones  
3. **Importer-QP-aligned** batch record templates  
4. **GDP-qualified** international logistics evidence  
5. **Digital systems** (e.g., **Cantrak**) that reduce reconciliation time under audit  

**Closing**
Winning bids are won in **document quality** and **batch repeatability**—invest there before scaling hectares alone.$$
,
  ARRAY['EU Market Strategy'],
  '/images/resources/eu-cannabis-res-10.png',
  true,
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  tags = EXCLUDED.tags,
  image_url = EXCLUDED.image_url,
  is_published = EXCLUDED.is_published,
  published_at = COALESCE(resources.published_at, EXCLUDED.published_at),
  updated_at = NOW();
