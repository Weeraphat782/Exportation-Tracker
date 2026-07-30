import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { deleteFromR2, uploadToR2 } from '@/lib/r2';

const TABLE = 'social_artwork_images';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 15 * 1024 * 1024;

export async function GET(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const id = request.nextUrl.searchParams.get('id');
  if (id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ item: data });
  }

  const kind = request.nextUrl.searchParams.get('kind');
  let query = supabase.from(TABLE).select('*').order('created_at', { ascending: false }).limit(200);
  if (kind === 'photo' || kind === 'artwork') query = query.eq('kind', kind);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const form = await request.formData();
  const file = form.get('file') as File | null;
  const kind = form.get('kind') === 'artwork' ? 'artwork' : 'photo';

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPG, PNG or WebP allowed' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 15MB)' }, { status: 400 });
  }

  const safeName = (file.name || 'image').replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `social-artwork/${kind}/${Date.now()}_${safeName}`;
  await uploadToR2(key, Buffer.from(await file.arrayBuffer()), file.type);

  // Same-origin URL so html-to-image can export canvases without R2 CORS setup.
  const url = `/api/social-artwork/file?key=${encodeURIComponent(key)}`;

  const label = (form.get('label') as string) || safeName;
  const template = (form.get('template') as string) || null;
  const format = (form.get('format') as string) || null;
  const caption = (form.get('caption') as string) || null;
  const prompt = (form.get('prompt') as string) || null;
  const replaceId = (form.get('replaceId') as string) || null;
  const sourceRaw = form.get('source') as string | null;
  let source: unknown = null;
  if (sourceRaw) {
    try {
      source = JSON.parse(sourceRaw);
    } catch {
      return NextResponse.json({ error: 'Invalid source JSON' }, { status: 400 });
    }
  }

  if (replaceId) {
    const { data: existing, error: fetchError } = await supabase
      .from(TABLE)
      .select('r2_key')
      .eq('id', replaceId)
      .single();
    if (fetchError || !existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await deleteFromR2(existing.r2_key);

    const { data, error } = await supabase
      .from(TABLE)
      .update({ r2_key: key, url, label, template, format, caption, prompt, source })
      .eq('id', replaceId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ item: data });
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      kind,
      r2_key: key,
      url,
      label,
      template,
      format,
      caption,
      prompt,
      source,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function DELETE(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { data: row, error: fetchError } = await supabase.from(TABLE).select('r2_key').eq('id', id).single();
  if (fetchError || !row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await deleteFromR2(row.r2_key);
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
