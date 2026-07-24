import { createHash, randomUUID } from 'crypto';
import { NextRequest } from 'next/server';
import { getMimeType } from '@/lib/document-comparison-utils';
import { isRequiredPrebookingType } from '@/lib/customer-check-rule';
import {
  marketingJsonResponse,
  marketingOptionsResponse,
} from '@/lib/marketing-cors';
import {
  DocumentCheckPipelineError,
  mapPipelineError,
  runCustomerDocumentCheckPipeline,
  type DocumentCheckInput,
} from '@/lib/run-customer-document-check';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const MAX_FILES = 6;
const MAX_BYTES = 8 * 1024 * 1024;
const COOLDOWN_MS = 60_000;
const DAILY_CAP = Number(process.env.MARKETING_DEMO_DAILY_CAP || 3);

const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

// ponytail: in-memory IP caps reset on cold start; upgrade to Redis/edge store if abuse appears.
const demoRunsByIp = new Map<string, number[]>();

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return request.headers.get('x-real-ip') || 'unknown';
}

function ipKey(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 32);
}

function checkDemoRateLimit(key: string): { ok: true; remaining: number } | { ok: false; error: string; status: number } {
  const now = Date.now();
  const since = now - 24 * 60 * 60 * 1000;
  const prev = (demoRunsByIp.get(key) || []).filter((t) => t >= since);
  demoRunsByIp.set(key, prev);

  if (prev.length >= DAILY_CAP) {
    return {
      ok: false,
      error: `Demo limit reached (${DAILY_CAP} checks per day). Sign in to the Export Portal for full checks.`,
      status: 429,
    };
  }
  if (prev.length > 0 && now - prev[prev.length - 1] < COOLDOWN_MS) {
    const wait = Math.ceil((COOLDOWN_MS - (now - prev[prev.length - 1])) / 1000);
    return { ok: false, error: `Please wait ${wait}s before running another demo check.`, status: 429 };
  }
  return { ok: true, remaining: Math.max(0, DAILY_CAP - prev.length - 1) };
}

function recordDemoRun(key: string) {
  const now = Date.now();
  const since = now - 24 * 60 * 60 * 1000;
  const prev = (demoRunsByIp.get(key) || []).filter((t) => t >= since);
  prev.push(now);
  demoRunsByIp.set(key, prev);
}

export async function OPTIONS(request: NextRequest) {
  return marketingOptionsResponse(request.headers.get('origin'));
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');

  if (process.env.MARKETING_DEMO_ENABLED === 'false') {
    return marketingJsonResponse({ error: 'Document demo is temporarily unavailable.' }, 503, origin);
  }

  try {
    const rateKey = ipKey(clientIp(request));
    const rate = checkDemoRateLimit(rateKey);
    if (!rate.ok) {
      return marketingJsonResponse({ error: rate.error }, rate.status, origin);
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch (e) {
      console.error('public document-demo formData parse:', e);
      return marketingJsonResponse(
        { error: 'Invalid upload payload. Try smaller PDF or image files.' },
        400,
        origin
      );
    }

    const entries: Array<{ type: string; file: File }> = [];

    for (const [key, value] of form.entries()) {
      if (!key.startsWith('file_') || !(value instanceof File)) continue;
      const type = key.slice('file_'.length);
      if (!type || !isRequiredPrebookingType(type)) continue;
      entries.push({ type, file: value });
    }

    if (entries.length < 2) {
      return marketingJsonResponse(
        { error: 'Attach at least 2 required export documents (PDF or image) to run a demo check.' },
        400,
        origin
      );
    }
    if (entries.length > MAX_FILES) {
      return marketingJsonResponse({ error: `Too many files (max ${MAX_FILES}).` }, 400, origin);
    }

    const seenTypes = new Set<string>();
    const pipelineInputs: DocumentCheckInput[] = [];

    for (const { type, file } of entries) {
      if (seenTypes.has(type)) {
        return marketingJsonResponse({ error: `Duplicate document type: ${type}` }, 400, origin);
      }
      seenTypes.add(type);

      if (file.size > MAX_BYTES) {
        return marketingJsonResponse(
          { error: `File too large (max ${MAX_BYTES / (1024 * 1024)}MB per file).` },
          400,
          origin
        );
      }

      const mimeType = file.type || getMimeType(file.name);
      if (!ALLOWED_MIME.has(mimeType)) {
        return marketingJsonResponse({ error: 'Only PDF and image files are supported.' }, 400, origin);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      pipelineInputs.push({
        id: `${type}-${randomUUID()}`,
        file_name: file.name,
        document_type: type,
        base64Data: buffer.toString('base64'),
        mimeType,
      });
    }

    const result = await runCustomerDocumentCheckPipeline(pipelineInputs);
    recordDemoRun(rateKey);

    return marketingJsonResponse(
      {
        success: true,
        ...result,
        checksRemaining: rate.remaining,
        checkedAt: new Date().toISOString(),
      },
      200,
      origin
    );
  } catch (error: unknown) {
    if (error instanceof DocumentCheckPipelineError) {
      return marketingJsonResponse({ error: error.message }, error.status, origin);
    }
    console.error('public document-demo error:', error);
    const { message, status } = mapPipelineError(error);
    return marketingJsonResponse({ error: message }, status, origin);
  }
}
