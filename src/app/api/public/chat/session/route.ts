import { createHash } from 'crypto';
import { NextRequest } from 'next/server';
import {
  marketingJsonResponse,
  marketingOptionsResponse,
} from '@/lib/marketing-cors';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { createChatSession, validateIntake } from '@/lib/chat-log';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SESSION_DAILY_CAP = Number(process.env.MARKETING_CHAT_SESSION_DAILY_CAP || 20);
const SESSION_COOLDOWN_MS = 5_000;

// ponytail: in-memory IP caps reset on cold start; upgrade to Redis/edge store if abuse appears.
const sessionRunsByIp = new Map<string, number[]>();

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return request.headers.get('x-real-ip') || 'unknown';
}

function ipKey(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 32);
}

function checkSessionRateLimit(
  key: string
): { ok: true } | { ok: false; error: string; status: number } {
  const now = Date.now();
  const since = now - 24 * 60 * 60 * 1000;
  const prev = (sessionRunsByIp.get(key) || []).filter((t) => t >= since);
  sessionRunsByIp.set(key, prev);

  if (prev.length >= SESSION_DAILY_CAP) {
    return {
      ok: false,
      error: `Session limit reached. Contact cargo@omgexp.com for help.`,
      status: 429,
    };
  }
  if (prev.length > 0 && now - prev[prev.length - 1] < SESSION_COOLDOWN_MS) {
    const wait = Math.ceil((SESSION_COOLDOWN_MS - (now - prev[prev.length - 1])) / 1000);
    return { ok: false, error: `Please wait ${wait}s before starting another chat.`, status: 429 };
  }
  return { ok: true };
}

function recordSessionRun(key: string) {
  const now = Date.now();
  const since = now - 24 * 60 * 60 * 1000;
  const prev = (sessionRunsByIp.get(key) || []).filter((t) => t >= since);
  prev.push(now);
  sessionRunsByIp.set(key, prev);
}

export async function OPTIONS(request: NextRequest) {
  return marketingOptionsResponse(request.headers.get('origin'));
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');

  if (process.env.MARKETING_CHAT_ENABLED === 'false') {
    return marketingJsonResponse({ error: 'Chat is temporarily unavailable.' }, 503, origin);
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return marketingJsonResponse({ error: 'Server configuration error.' }, 500, origin);
  }

  try {
    const rateKey = ipKey(clientIp(request));
    const rate = checkSessionRateLimit(rateKey);
    if (!rate.ok) {
      return marketingJsonResponse({ error: rate.error }, rate.status, origin);
    }

    let body: { name?: unknown; company?: unknown; email?: unknown; phone?: unknown };
    try {
      body = await request.json();
    } catch {
      return marketingJsonResponse({ error: 'Invalid JSON body.' }, 400, origin);
    }

    const intakeResult = validateIntake(body);
    if (!intakeResult.ok) {
      return marketingJsonResponse({ error: intakeResult.error }, 400, origin);
    }

    const sessionId = await createChatSession(
      supabase,
      intakeResult.intake,
      rateKey,
      request.headers.get('user-agent')
    );

    recordSessionRun(rateKey);
    return marketingJsonResponse({ sessionId }, 200, origin);
  } catch (err) {
    console.error('public chat session error:', err);
    return marketingJsonResponse({ error: 'Failed to start chat session.' }, 500, origin);
  }
}
