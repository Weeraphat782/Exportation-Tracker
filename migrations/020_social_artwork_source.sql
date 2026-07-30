-- Social Artwork: store editable source (content + layout) for album re-edit.

alter table public.social_artwork_images
  add column if not exists source jsonb;
