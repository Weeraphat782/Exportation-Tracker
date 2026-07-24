import { NextRequest } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { sendTelegramContactNotification } from '@/lib/telegram-admin-notify';
import { sendContactNotification } from '@/lib/mail';
import {
  marketingJsonResponse,
  marketingOptionsResponse,
} from '@/lib/marketing-cors';

export const dynamic = 'force-dynamic';

const MAX_MESSAGE_LEN = 10_000;

export async function OPTIONS(request: NextRequest) {
  return marketingOptionsResponse(request.headers.get('origin'));
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const company =
      typeof body.company === 'string' ? body.company.trim() : null;
    const inquiryType =
      typeof body.inquiryType === 'string' ? body.inquiryType.trim() : null;
    let message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!name || !email || !message) {
      return marketingJsonResponse(
        { error: 'Name, email, and message are required.' },
        400,
        origin,
      );
    }

    if (message.length > MAX_MESSAGE_LEN) {
      message = message.slice(0, MAX_MESSAGE_LEN);
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return marketingJsonResponse(
        { error: 'Please provide a valid email address.' },
        400,
        origin,
      );
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return marketingJsonResponse({ error: 'Server configuration error.' }, 500, origin);
    }

    const { error: insertError } = await supabase
      .from('contact_submissions')
      .insert({
        name,
        email,
        company: company || null,
        inquiry_type: inquiryType || null,
        message,
      });

    if (insertError) {
      console.error('[api/contact] Supabase insert error:', insertError);
      return marketingJsonResponse(
        { error: 'Could not save your message. Please try again later.' },
        500,
        origin,
      );
    }

    await sendTelegramContactNotification({
      name,
      email,
      company,
      inquiryType,
      message,
    });

    await sendContactNotification({
      name,
      email,
      company,
      inquiryType,
      message,
    });

    return marketingJsonResponse({ ok: true }, 200, origin);
  } catch (e) {
    if (e instanceof SyntaxError) {
      return marketingJsonResponse({ error: 'Invalid JSON body.' }, 400, origin);
    }
    console.error('[api/contact]', e);
    return marketingJsonResponse({ error: 'An unexpected error occurred.' }, 500, origin);
  }
}
