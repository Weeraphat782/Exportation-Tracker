-- Run in Supabase SQL Editor (or apply as migration).
-- Stores marketing site contact form submissions. RLS on with no policies:
-- only service_role (API route) can insert/select.

create table if not exists contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  inquiry_type text,
  message text not null,
  created_at timestamptz default now() not null
);

alter table contact_submissions enable row level security;

comment on table contact_submissions is 'Contact Us form submissions from /site/contact';
