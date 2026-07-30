-- Social Artwork Generator: photo album (uploads) + exported artwork history.
-- Binary files live in Cloudflare R2 (public assets bucket); this table is the index.

create table if not exists public.social_artwork_images (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('photo', 'artwork')),
  r2_key text not null,
  url text not null,
  label text,
  template text,
  format text,
  created_at timestamptz not null default now()
);

create index if not exists social_artwork_images_kind_created_idx
  on public.social_artwork_images (kind, created_at desc);

-- Only the server API (service role) touches this table; RLS with no policies
-- blocks direct anon/browser access.
alter table public.social_artwork_images enable row level security;
