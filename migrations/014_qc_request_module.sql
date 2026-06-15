-- QC Request module: lab_admin role, allowlist, templates, requests

-- 1. Extend profiles.role to include lab_admin
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'staff', 'customer', 'lab_admin'));

-- 2. Lab admin email allowlist (managed by system admin)
CREATE TABLE IF NOT EXISTS public.qc_lab_admin_allowlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS qc_lab_admin_allowlist_email_lower_idx
  ON public.qc_lab_admin_allowlist (lower(trim(email)));

-- 3. QC test templates
CREATE TABLE IF NOT EXISTS public.qc_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. QC test items (hierarchical)
CREATE TABLE IF NOT EXISTS public.qc_test_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.qc_templates(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.qc_test_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  group_label TEXT,
  price NUMERIC(15, 2),
  unit_label TEXT,
  min_sample_qty NUMERIC(15, 2),
  test_duration TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS qc_test_items_template_id_idx ON public.qc_test_items(template_id);
CREATE INDEX IF NOT EXISTS qc_test_items_parent_id_idx ON public.qc_test_items(parent_id);

-- 5. QC requests
CREATE TABLE IF NOT EXISTS public.qc_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.qc_templates(id) ON DELETE RESTRICT,
  qc_code TEXT NOT NULL UNIQUE,
  share_token TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'processing', 'complete')),
  company_name_address TEXT,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  sample_name TEXT,
  lot_no TEXT,
  manufacturer TEXT,
  sample_qty TEXT,
  production_date DATE,
  expiry_date DATE,
  sampling_date DATE,
  sample_type TEXT CHECK (sample_type IS NULL OR sample_type IN ('solid', 'liquid', 'other')),
  sample_type_other TEXT,
  test_method TEXT CHECK (test_method IS NULL OR test_method IN ('lab', 'customer', 'other')),
  test_method_other TEXT,
  selected_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(15, 2) DEFAULT 0,
  vat NUMERIC(15, 2) DEFAULT 0,
  grand_total NUMERIC(15, 2) DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'verified')),
  payment_slip_path TEXT,
  coa_path TEXT,
  lab_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS qc_requests_customer_user_id_idx ON public.qc_requests(customer_user_id);
CREATE INDEX IF NOT EXISTS qc_requests_status_idx ON public.qc_requests(status);
CREATE INDEX IF NOT EXISTS qc_requests_template_id_idx ON public.qc_requests(template_id);

-- 6. Helper functions
CREATE OR REPLACE FUNCTION public.is_lab_admin_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'lab_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 7. RLS
ALTER TABLE public.qc_lab_admin_allowlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qc_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qc_test_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qc_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage qc allowlist" ON public.qc_lab_admin_allowlist;
CREATE POLICY "Admin manage qc allowlist" ON public.qc_lab_admin_allowlist
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Lab admin manage qc templates" ON public.qc_templates;
CREATE POLICY "Lab admin manage qc templates" ON public.qc_templates
  FOR ALL TO authenticated
  USING (public.is_lab_admin_or_admin())
  WITH CHECK (public.is_lab_admin_or_admin());

DROP POLICY IF EXISTS "Customers read active qc templates" ON public.qc_templates;
CREATE POLICY "Customers read active qc templates" ON public.qc_templates
  FOR SELECT TO authenticated
  USING (
    is_active = true
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'customer')
  );

DROP POLICY IF EXISTS "Lab admin manage qc test items" ON public.qc_test_items;
CREATE POLICY "Lab admin manage qc test items" ON public.qc_test_items
  FOR ALL TO authenticated
  USING (public.is_lab_admin_or_admin())
  WITH CHECK (public.is_lab_admin_or_admin());

DROP POLICY IF EXISTS "Customers read qc test items" ON public.qc_test_items;
CREATE POLICY "Customers read qc test items" ON public.qc_test_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.qc_templates t
      WHERE t.id = qc_test_items.template_id AND t.is_active = true
    )
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'customer')
  );

DROP POLICY IF EXISTS "Customers manage own qc requests" ON public.qc_requests;
CREATE POLICY "Customers manage own qc requests" ON public.qc_requests
  FOR ALL TO authenticated
  USING (
    customer_user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'customer')
  )
  WITH CHECK (
    customer_user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'customer')
  );

DROP POLICY IF EXISTS "Lab admin manage all qc requests" ON public.qc_requests;
CREATE POLICY "Lab admin manage all qc requests" ON public.qc_requests
  FOR ALL TO authenticated
  USING (public.is_lab_admin_or_admin())
  WITH CHECK (public.is_lab_admin_or_admin());

-- 8. Update handle_new_user (lab_admin set via callback after allowlist check)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _meta_role TEXT;
  _role TEXT;
  _full_name TEXT;
  _has_google BOOLEAN;
BEGIN
  _meta_role := NULLIF(trim(NEW.raw_user_meta_data->>'role'), '');
  IF _meta_role IS NOT NULL AND _meta_role NOT IN ('admin', 'staff', 'customer', 'lab_admin') THEN
    _meta_role := NULL;
  END IF;

  _full_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''),
    ''
  );

  _has_google := (
    COALESCE(NEW.raw_app_meta_data->>'provider', '') = 'google'
    OR EXISTS (
      SELECT 1
      FROM jsonb_array_elements_text(COALESCE(NEW.raw_app_meta_data->'providers', '[]'::jsonb)) AS elem
      WHERE elem = 'google'
    )
  );

  IF _meta_role IS NOT NULL THEN
    _role := _meta_role;
  ELSIF _has_google THEN
    _role := 'customer';
  ELSE
    _role := 'staff';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, company, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    _full_name,
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'company'), ''), ''),
    _role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE WHEN EXCLUDED.full_name = '' THEN profiles.full_name ELSE EXCLUDED.full_name END,
    company = CASE WHEN EXCLUDED.company = '' THEN profiles.company ELSE EXCLUDED.company END,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user trigger error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
