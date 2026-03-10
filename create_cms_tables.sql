-- ============================================
-- CMS Tables: Newsroom & Resources
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- 1. News Articles Table
CREATE TABLE IF NOT EXISTS news_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Resources Table
CREATE TABLE IF NOT EXISTS resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  file_url TEXT,
  image_url TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_news_articles_updated_at
  BEFORE UPDATE ON news_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Disable RLS for simplicity (same pattern as existing tables)
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on news_articles" ON news_articles FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on resources" ON resources FOR ALL USING (true) WITH CHECK (true);

-- 5. Seed existing static data into news_articles
INSERT INTO news_articles (slug, title, excerpt, image_url, is_pinned, is_published, published_at) VALUES
  ('new-european-routes-2025', 'OMG Experience Expands European Air Freight Routes', 'OMG Experience announces new direct routes to Zurich, Lisbon, and Warsaw, strengthening our pharmaceutical-grade logistics network across Europe.', 'https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?q=80&w=800&auto=format&fit=crop', true, true, '2025-03-01'),
  ('gdp-compliance-renewal', 'GDP Certification Renewed', 'OMG Experience has successfully renewed its Good Distribution Practice certification, reaffirming our commitment to temperature-controlled logistics excellence.', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop', false, true, '2025-02-15'),
  ('cantrak-integration-update', 'Export Portal: Cantrak Integration Update', 'The Export Portal powered by Cantrak now supports shipment status and documentation updates for specialized air freight. Log in to access document verification and batch processing features.', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop', false, true, '2025-02-01'),
  ('cold-chain-verification', 'Enhanced Cold-Chain Verification for Warehousing', 'New automated verification protocols ensure end-to-end temperature integrity for time-sensitive pharmaceutical shipments.', 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?q=80&w=800&auto=format&fit=crop', false, true, '2025-01-20'),
  ('industry-partnership', 'Partnership with Leading Airlines Strengthens Capacity', 'Leveraging our GSA heritage, OMG Experience has secured priority capacity on key routes for specialized cargo handling.', 'https://images.unsplash.com/photo-1436450412740-6b988f486c6b?q=80&w=800&auto=format&fit=crop', false, true, '2025-01-05')
ON CONFLICT (slug) DO NOTHING;

-- 6. Seed existing static data into resources
INSERT INTO resources (slug, title, excerpt, tags, is_published, published_at) VALUES
  ('compliance-portugal', 'Export Compliance Guide: Portugal', 'Requirements for shipments to Portugal. Covers customs documentation, import permits, and EU compliance for pharmaceutical and specialized cargo.', ARRAY['EU Compliance', 'Destination: Portugal'], true, '2025-01-01'),
  ('switzerland-customs', 'Reading Instructions: Switzerland Customs', 'Guide to Swiss customs clearance, including document templates and verification checklists for time-sensitive air freight.', ARRAY['EU Compliance', 'Destination: Switzerland'], true, '2025-01-01'),
  ('cold-chain-documentation', 'Cold-Chain Documentation Requirements', 'Temperature monitoring, packing verification, and GDP-compliant documentation requirements for pharmaceutical logistics.', ARRAY['GDP Warehousing', 'EU Compliance'], true, '2025-01-01')
ON CONFLICT (slug) DO NOTHING;
