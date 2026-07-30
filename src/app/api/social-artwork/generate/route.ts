import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireApiUser } from '@/lib/api-auth';
import type { TemplateId } from '@/components/social-artwork/brand';
import { TEMPLATE_META } from '@/components/social-artwork/brand';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

const GEMINI_MODEL = 'gemini-3.1-flash-lite-preview';

const CORE_PROMPT = `You are a copywriter for OMG Experience (OMGEXP), an air freight forwarding company in Bangkok, Thailand.

Rules:
- Keep banner copy concise; headlines max ~6 words
- No invented promo percentages, discounts, or fake prices
- Professional B2B logistics tone — GDP-compliant, reliable capacity
- Instagram caption: 2–4 short sentences + 3–5 relevant hashtags (#AirFreight #OMGEXP #Logistics etc.)
- Do NOT invent route names, fares, transit times, or lane prices — those are filled manually
- Return ONLY valid JSON matching the schema`;

interface GeneratedCopy {
  eyebrow?: string;
  headline?: string;
  subhead?: string;
  body?: string;
  caption?: string;
}

async function fetchImageBase64(
  url: string,
  origin: string,
): Promise<{ data: string; mimeType: string } | null> {
  const absolute = url.startsWith('http') ? url : `${origin}${url}`;
  try {
    const res = await fetch(absolute);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const mimeType = res.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
    return { data: buf.toString('base64'), mimeType };
  } catch {
    return null;
  }
}

async function getGeminiKey(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from('settings')
    .select('settings_value')
    .eq('user_id', userId)
    .eq('category', 'ai')
    .eq('settings_key', 'gemini_api_key')
    .maybeSingle();

  let apiKey = data?.settings_value;
  if (typeof apiKey !== 'string') {
    apiKey = (apiKey as Record<string, unknown> | undefined)?.value as string || '';
  }
  if (!apiKey) apiKey = process.env.GEMINI_API_KEY || '';
  return apiKey;
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiUser(request);
    if (!auth.ok) return auth.response;

    let body: { prompt?: string; template?: TemplateId; photoUrls?: string[] };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const userPrompt = body.prompt?.trim();
    const template = body.template;
    const photoUrls = Array.isArray(body.photoUrls) ? body.photoUrls.filter(Boolean) : [];
    const meta = TEMPLATE_META[template!];

    if (!userPrompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }
    if (!template || !meta) {
      return NextResponse.json({ error: 'Invalid template' }, { status: 400 });
    }
    if (meta.needsPhoto && photoUrls.length === 0) {
      return NextResponse.json({ error: 'At least one photo URL is required' }, { status: 400 });
    }
    const targets = photoUrls.length > 0 ? photoUrls : [''];
    if (targets.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 photos per generation' }, { status: 400 });
    }

    const apiKey = await getGeminiKey(auth.supabase, auth.user.id);
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Set it in Settings > AI or GEMINI_API_KEY env.' },
        { status: 500 },
      );
    }

    const origin = new URL(request.url).origin;
    const ai = new GoogleGenAI({ apiKey });
    const results: (GeneratedCopy & { photoUrl: string })[] = [];

    for (const photoUrl of targets) {
      const image = photoUrl ? await fetchImageBase64(photoUrl, origin) : null;
      const contents: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
        {
          text: `${CORE_PROMPT}

Template: ${meta.label} — ${meta.desc}
${meta.needsPhoto ? 'Use the attached photo as visual context.' : 'No photo attached.'}

User direction: ${userPrompt}

Return JSON: {"eyebrow":"...","headline":"...","subhead":"...","body":"...","caption":"..."}
Use empty string for fields not relevant to this template (e.g. T0 photo-only → leave eyebrow/headline/subhead/body empty, focus on caption).`,
        },
      ];

      if (image) {
        contents.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
      }

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: { responseMimeType: 'application/json' },
      });

      const text = response.text?.trim() || '{}';
      let parsed: GeneratedCopy;
      try {
        parsed = JSON.parse(text) as GeneratedCopy;
      } catch {
        return NextResponse.json({ error: 'Gemini returned invalid JSON' }, { status: 502 });
      }

      results.push({
        photoUrl,
        eyebrow: parsed.eyebrow?.slice(0, 80) ?? '',
        headline: parsed.headline?.slice(0, 120) ?? '',
        subhead: parsed.subhead?.slice(0, 160) ?? '',
        body: parsed.body?.slice(0, 400) ?? '',
        caption: parsed.caption?.slice(0, 2200) ?? '',
      });
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error('social-artwork generate error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Generation failed' },
      { status: 500 },
    );
  }
}
