-- Allow exported Remotion MP4s in the social artwork library.

alter table public.social_artwork_images
  drop constraint if exists social_artwork_images_kind_check;

alter table public.social_artwork_images
  add constraint social_artwork_images_kind_check
  check (kind in ('photo', 'artwork', 'video'));
