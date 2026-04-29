-- Google OAuth signup: Supabase puts provider in raw_app_meta_data.provider and/or providers array (jsonb array of strings).
-- Email/password customer signup sends role via raw_user_meta_data.role = 'customer'.
-- This migration: default OAuth Google signups to role 'customer'; respect explicit meta role when valid.

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
  IF _meta_role IS NOT NULL AND _meta_role NOT IN ('admin', 'staff', 'customer') THEN
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
    role = EXCLUDED.role,
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

-- Dashboard checklist (manual):
-- Authentication → Providers → Google: enable + Google Cloud OAuth Client ID + Secret.
-- URL Configuration → Redirect URLs include: https://YOUR_DOMAIN/site/auth/callback and http://localhost:3001/site/auth/callback
