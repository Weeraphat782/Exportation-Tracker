import crypto from 'crypto';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function verifyLineSignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const digest = crypto.createHmac('SHA256', secret).update(body).digest('base64');
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

type LineWebhookEvent = {
  type?: string;
  source?: {
    type?: string;
    groupId?: string;
    roomId?: string;
    userId?: string;
  };
};

type LineWebhookBody = {
  destination?: string;
  events?: LineWebhookEvent[];
};

function logGroupOrRoomId(event: LineWebhookEvent) {
  const sourceType = event.source?.type;
  const groupId = event.source?.groupId?.trim();
  const roomId = event.source?.roomId?.trim();

  if (groupId) {
    console.info(
      `[line webhook] event=${event.type} source=${sourceType} — set LINE_QC_GROUP_ID=${groupId}`
    );
    return;
  }

  if (roomId) {
    console.info(
      `[line webhook] event=${event.type} source=${sourceType} — set LINE_QC_GROUP_ID=${roomId}`
    );
  }
}

/**
 * LINE Messaging API webhook — logs group/room IDs from any chat event.
 * Enable "Allow bot to join group chats" in LINE Developers → Messaging API first.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const secret = process.env.LINE_CHANNEL_SECRET?.trim();

  if (secret) {
    const signature = request.headers.get('x-line-signature');
    if (!verifyLineSignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
    }
  } else {
    console.warn('[line webhook] LINE_CHANNEL_SECRET not set — skipping signature verification');
  }

  let body: LineWebhookBody;
  try {
    body = JSON.parse(rawBody) as LineWebhookBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const events = body.events || [];
  if (events.length === 0) {
    console.info('[line webhook] POST ok — no events (verify ping or empty payload)');
    return NextResponse.json({ ok: true });
  }

  for (const event of events) {
    console.info(`[line webhook] received event type=${event.type ?? 'unknown'}`);
    logGroupOrRoomId(event);
  }

  return NextResponse.json({ ok: true });
}
