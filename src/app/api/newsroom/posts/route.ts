import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/newsroom/posts
 * Called by the OMG Social Media Agent to publish a news article.
 * Protected by Bearer token (OMG_AGENT_TOKEN env var).
 */

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase credentials not configured');
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  // ── Auth check ──────────────────────────────────────────────
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const expectedToken = process.env.OMG_AGENT_TOKEN;

  if (!expectedToken) {
    return NextResponse.json({ error: 'OMG_AGENT_TOKEN not configured on server' }, { status: 500 });
  }
  if (!token || token !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Parse body ───────────────────────────────────────────────
  let body: {
    title?: string;
    slug?: string;
    summary?: string;
    bodyMd?: string;
    heroImageUrl?: string;
    category?: string;
    publishedAt?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { title, slug, summary, bodyMd, heroImageUrl, publishedAt } = body;

  if (!title || !slug) {
    return NextResponse.json({ error: 'title and slug are required' }, { status: 400 });
  }

  // ── Build slug (ensure unique by appending timestamp if needed) ──
  const finalSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-|-$/g, '');

  // ── Insert into news_articles ────────────────────────────────
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('news_articles')
    .insert({
      title,
      slug: finalSlug,
      excerpt: summary ?? '',
      content: bodyMd ?? '',
      image_url: heroImageUrl ?? null,
      is_pinned: false,
      is_published: true,
      published_at: publishedAt ?? new Date().toISOString(),
    })
    .select('id, slug')
    .single();

  if (error) {
    // Handle slug conflict — append timestamp and retry
    if (error.code === '23505') {
      const retrySlug = `${finalSlug}-${Date.now()}`;
      const { data: retryData, error: retryError } = await supabase
        .from('news_articles')
        .insert({
          title,
          slug: retrySlug,
          excerpt: summary ?? '',
          content: bodyMd ?? '',
          image_url: heroImageUrl ?? null,
          is_pinned: false,
          is_published: true,
          published_at: publishedAt ?? new Date().toISOString(),
        })
        .select('id, slug')
        .single();

      if (retryError) {
        return NextResponse.json({ error: retryError.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        id: retryData.id,
        slug: retryData.slug,
        url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cargo.omgexp.com'}/newsroom/${retryData.slug}`,
      });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    id: data.id,
    slug: data.slug,
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cargo.omgexp.com'}/newsroom/${data.slug}`,
  });
}
