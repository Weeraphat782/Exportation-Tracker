import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { uploadToR2 } from '@/lib/r2';

const TABLE = 'social_artwork_images';

interface UnsplashPhoto {
  id: string;
  urls: { regular: string };
  links: { download_location: string };
  user: { name: string };
}

export async function POST(request: NextRequest) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return NextResponse.json(
      { error: 'UNSPLASH_ACCESS_KEY is not configured. Add it to .env.local.' },
      { status: 500 },
    );
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  let body: { query?: string; count?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const query = body.query?.trim();
  if (!query) return NextResponse.json({ error: 'query is required' }, { status: 400 });

  const count = Math.min(10, Math.max(1, Math.round(body.count ?? 4)));

  const searchUrl = new URL('https://api.unsplash.com/search/photos');
  searchUrl.searchParams.set('query', query);
  searchUrl.searchParams.set('per_page', String(count));
  searchUrl.searchParams.set('orientation', 'squarish');

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Client-ID ${accessKey}` },
  });

  if (!searchRes.ok) {
    const detail = await searchRes.text();
    return NextResponse.json(
      { error: 'Unsplash search failed', detail: detail.slice(0, 200) },
      { status: searchRes.status },
    );
  }

  const searchData = (await searchRes.json()) as { results?: UnsplashPhoto[] };
  const photos = searchData.results ?? [];
  if (photos.length === 0) {
    return NextResponse.json({ error: 'No photos found for this query' }, { status: 404 });
  }

  const rows: {
    kind: string;
    r2_key: string;
    url: string;
    label: string;
    template: null;
    format: null;
  }[] = [];

  for (const photo of photos) {
    const imgRes = await fetch(photo.urls.regular);
    if (!imgRes.ok) continue;

    const key = `social-artwork/photo/unsplash_${photo.id}.jpg`;
    await uploadToR2(key, Buffer.from(await imgRes.arrayBuffer()), 'image/jpeg');

    // ponytail: fire-and-forget — Unsplash API guideline for triggering download count
    fetch(photo.links.download_location, {
      headers: { Authorization: `Client-ID ${accessKey}` },
    }).catch(() => {});

    rows.push({
      kind: 'photo',
      r2_key: key,
      url: `/api/social-artwork/file?key=${encodeURIComponent(key)}`,
      label: `${query} · ${photo.user.name}`,
      template: null,
      format: null,
    });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Failed to download photos from Unsplash' }, { status: 502 });
  }

  const { data, error } = await supabase.from(TABLE).insert(rows).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: data });
}
