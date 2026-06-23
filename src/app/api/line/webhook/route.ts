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
  events?: LineWebhookEvent[];
};

/**
 * LINE Messaging API webhook — logs group/room IDs when the OA joins.
 * Set Webhook URL to https://cargo.omgexp.com/api/line/webhook temporarily,
 * invite the OA to the QC group, then copy LINE_QC_GROUP_ID from server logs.
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

  for (const event of body.events || []) {
    if (event.type !== 'join' || !event.source) continue;

    if (event.source.type === 'group' && event.source.groupId) {
      console.info(
        `[line webhook] OA joined group — set LINE_QC_GROUP_ID=${event.source.groupId}`
      );
    } else if (event.source.type === 'room' && event.source.roomId) {
      console.info(
        `[line webhook] OA joined room — set LINE_QC_GROUP_ID=${event.source.roomId}`
      );
    }
  }

  return NextResponse.json({ ok: true });
}
