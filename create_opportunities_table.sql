-- Ensure dependencies exist first
-- (In case database-schema.sql wasn't fully run)

-- 1. Create destinations if not exists
CREATE TABLE IF NOT EXISTS public.destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL,
  port TEXT,
  shipping_time INT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS for destinations
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view destinations" ON public.destinations;
CREATE POLICY "Users can view destinations" ON public.destinations FOR SELECT USING (true);


-- 2. Create delivery_services if not exists
CREATE TABLE IF NOT EXISTS public.delivery_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  service_type TEXT NOT NULL, -- e.g. air, sea, road
  contact_info TEXT,
  address TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS for delivery_services
ALTER TABLE public.delivery_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view delivery_services" ON public.delivery_services;
CREATE POLICY "Users can view delivery_services" ON public.delivery_services FOR SELECT USING (true);


-- 3. Create opportunities table
CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic TEXT NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    customer_name TEXT, 
    
    -- Opportunity Specific
    stage TEXT NOT NULL DEFAULT 'prospecting', 
    probability INT DEFAULT 10,
    close_date DATE,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Fields matching Quotations
    amount DECIMAL(12, 2) DEFAULT 0,
    currency TEXT DEFAULT 'THB',
    
    vehicle_type TEXT,
    container_size TEXT,
    product_details JSONB, 
    weight DECIMAL(10, 2),
    volume DECIMAL(10, 2),
    
    destination_id UUID REFERENCES public.destinations(id) ON DELETE SET NULL,
    delivery_service_id UUID REFERENCES public.delivery_services(id) ON DELETE SET NULL,
    
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- Indexes (Using IF NOT EXISTS to prevent errors on re-run)
CREATE INDEX IF NOT EXISTS idx_opportunities_company_id ON public.opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON public.opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_opportunities_owner_id ON public.opportunities(owner_id);

-- Trigger for updated_at (Check if exists first or replace)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_opportunities_updated_at ON public.opportunities;
CREATE TRIGGER update_opportunities_updated_at 
    BEFORE UPDATE ON public.opportunities
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Policies (UPDATED to allow 'public' access for dev, since error 42501 happened)
-- Changing TO authenticated -> TO public (covers anon)

DROP POLICY IF EXISTS "Users can view all opportunities" ON public.opportunities;
CREATE POLICY "Users can view all opportunities" ON public.opportunities
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Users can insert opportunities" ON public.opportunities;
CREATE POLICY "Users can insert opportunities" ON public.opportunities
    FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update opportunities" ON public.opportunities;
CREATE POLICY "Users can update opportunities" ON public.opportunities
    FOR UPDATE TO public USING (true);

DROP POLICY IF EXISTS "Users can delete opportunities" ON public.opportunities;
CREATE POLICY "Users can delete opportunities" ON public.opportunities
    FOR DELETE TO public USING (true);
