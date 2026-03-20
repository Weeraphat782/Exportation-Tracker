-- Master data for marketing CarrierBoard (Live Shipping Status)
-- Public SELECT; INSERT/UPDATE/DELETE only for staff/admin (profiles.role)

CREATE TABLE IF NOT EXISTS public.carrier_board_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  carrier_code TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT carrier_board_routes_dest_carrier_unique UNIQUE (country, city, carrier_code)
);

CREATE INDEX IF NOT EXISTS idx_carrier_board_routes_sort
  ON public.carrier_board_routes(sort_order);

ALTER TABLE public.carrier_board_routes ENABLE ROW LEVEL SECURITY;

-- Marketing site (anon) + logged-in users can read all rows (active + inactive)
CREATE POLICY "carrier_board_routes_select_public"
  ON public.carrier_board_routes
  FOR SELECT
  USING (true);

CREATE POLICY "carrier_board_routes_insert_staff"
  ON public.carrier_board_routes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "carrier_board_routes_update_staff"
  ON public.carrier_board_routes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "carrier_board_routes_delete_staff"
  ON public.carrier_board_routes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'staff')
    )
  );

GRANT SELECT ON public.carrier_board_routes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.carrier_board_routes TO authenticated;

-- Seed (idempotent: preserve is_active if row already exists — only refresh sort_order / labels on conflict)
INSERT INTO public.carrier_board_routes (country, city, carrier_code, sort_order, is_active)
VALUES
  ('Switzerland', 'Zurich', 'TG', 0, true),
  ('Macedonia', 'Skopje', 'LH', 1, true),
  ('Germany', 'Munich, Frankfurt', 'LH', 2, true),
  ('Australia', 'Melbourne, Sydney', 'TG', 3, true),
  ('Czech', 'Prague', 'QR', 4, true),
  ('Portugal', 'Lisbon', 'QR', 5, true),
  ('New Zealand', 'Auckland', 'Qantas', 6, true)
ON CONFLICT (country, city, carrier_code) DO UPDATE SET
  city = EXCLUDED.city,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();
