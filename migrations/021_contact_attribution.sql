-- Contact form: store UTM / click-id attribution captured at submit time.
alter table public.contact_submissions
  add column if not exists attribution jsonb;
