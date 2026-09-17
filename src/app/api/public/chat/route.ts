import { createHash } from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { NextRequest } from 'next/server';
import {
  marketingJsonResponse,
  marketingOptionsResponse,
} from '@/lib/marketing-cors';
import {
  SYSTEM_PROMPT,
  buildPrompt,
  fallbackResponse,
  getKnowledge,
  parseModelResponse,
} from '@/lib/chat-knowledge';

export const dynamic = 'force-dynamic';

const MAX_CONTEXT_MESSAGES = 20;
const COOLDOWN_MS = 3_000;
const DAILY_CAP = Number(process.env.MARKETING_CHAT_DAILY_CAP || 60);
const GEMINI_MODEL =
  process.env.GEMINI_CHAT_MODEL?.trim() || 'gemini-3.1-flash-lite-preview';

// ponytail: in-memory IP caps reset on cold start; upgrade to Redis/edge store if abuse appears.
const chatRunsByIp = new Map<string, number[]>();

type HistoryRole = 'user' | 'assistant';

interface HistoryMessage {
  role: HistoryRole;
  content: string;
}

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return request.headers.get('x-real-ip') || 'unknown';
}

function ipKey(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 32);
}

function checkChatRateLimit(
  key: string
): { ok: true; remaining: number } | { ok: false; error: string; status: number } {
  const now = Date.now();
  const since = now - 24 * 60 * 60 * 1000;
  const prev = (chatRunsByIp.get(key) || []).filter((t) => t >= since);
  chatRunsByIp.set(key, prev);

  if (prev.length >= DAILY_CAP) {
    return {
      ok: false,
      error: `Chat limit reached (${DAILY_CAP} messages per day). Contact cargo@omgexp.com for help.`,
      status: 429,
    };
  }
  if (prev.length > 0 && now - prev[prev.length - 1] < COOLDOWN_MS) {
    const wait = Math.ceil((COOLDOWN_MS - (now - prev[prev.length - 1])) / 1000);
    return { ok: false, error: `Please wait ${wait}s before sending another message.`, status: 429 };
  }
  return { ok: true, remaining: Math.max(0, DAILY_CAP - prev.length - 1) };
}

function recordChatRun(key: string) {
  const now = Date.now();
  const since = now - 24 * 60 * 60 * 1000;
  const prev = (chatRunsByIp.get(key) || []).filter((t) => t >= since);
  prev.push(now);
  chatRunsByIp.set(key, prev);
}

function isValidHistory(raw: unknown): raw is HistoryMessage[] {
  if (!Array.isArray(raw) || raw.length > MAX_CONTEXT_MESSAGES) return false;
  return raw.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      (item.role === 'user' || item.role === 'assistant') &&
      typeof item.content === 'string' &&
      item.content.length >= 1 &&
      item.content.length <= 4_000
  );
}

function geminiContents(
  message: string,
  knowledge: string,
  history: HistoryMessage[]
): Array<{ role: string; parts: Array<{ text: string }> }> {
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  for (const item of history.slice(-MAX_CONTEXT_MESSAGES)) {
    const text = item.content.trim();
    if (!text) continue;
    contents.push({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text }],
    });
  }

  while (contents.length > 0 && contents[0].role === 'model') {
    contents.shift();
  }

  contents.push({
    role: 'user',
    parts: [{ text: buildPrompt(message, knowledge) }],
  });

  return contents;
}

export async function OPTIONS(request: NextRequest) {
  return marketingOptionsResponse(request.headers.get('origin'));
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');

  if (process.env.MARKETING_CHAT_ENABLED === 'false') {
    return marketingJsonResponse({ error: 'Chat is temporarily unavailable.' }, 503, origin);
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    const fallback = fallbackResponse();
    return marketingJsonResponse(fallback, 200, origin);
  }

  try {
    const rateKey = ipKey(clientIp(request));
    const rate = checkChatRateLimit(rateKey);
    if (!rate.ok) {
      return marketingJsonResponse({ error: rate.error }, rate.status, origin);
    }

    let body: { message?: string; history?: unknown };
    try {
      body = await request.json();
    } catch {
      return marketingJsonResponse({ error: 'Invalid JSON body.' }, 400, origin);
    }

    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!message || message.length > 2_000) {
      return marketingJsonResponse(
        { error: 'Message is required (max 2000 characters).' },
        400,
        origin
      );
    }

    const history = isValidHistory(body.history) ? body.history : [];

    const knowledge = await getKnowledge();
    const contents = geminiContents(message, knowledge, history);

    const ai = new GoogleGenAI({ apiKey });
    let result = fallbackResponse();

    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.2,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              answer: { type: 'STRING' },
              suggestions: {
                type: 'ARRAY',
                items: { type: 'STRING' },
              },
            },
            required: ['answer', 'suggestions'],
          },
        },
      });

      const rawText = response.text?.trim() || '';
      result = parseModelResponse(rawText);
    } catch (err) {
      console.warn('public chat Gemini error:', err);
      result = fallbackResponse();
    }

    recordChatRun(rateKey);
    return marketingJsonResponse(result, 200, origin);
  } catch (err) {
    console.error('public chat error:', err);
    return marketingJsonResponse(fallbackResponse(), 200, origin);
  }
}
