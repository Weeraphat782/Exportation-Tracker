-- Social Artwork: Instagram caption + AI prompt grouping for album exports.

alter table public.social_artwork_images
  add column if not exists caption text,
  add column if not exists prompt text;
