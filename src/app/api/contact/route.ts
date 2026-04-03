import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { sendTelegramContactNotification } from '@/lib/telegram-admin-notify';
import { sendContactNotification } from '@/lib/mail';

export const dynamic = 'force-dynamic';

const MAX_MESSAGE_LEN = 10_000;

export async function POST(request: NextRequest) {
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
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    if (message.length > MAX_MESSAGE_LEN) {
      message = message.slice(0, MAX_MESSAGE_LEN);
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Server configuration error.' },
        { status: 500 }
      );
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
      return NextResponse.json(
        { error: 'Could not save your message. Please try again later.' },
        { status: 500 }
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

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }
    console.error('[api/contact]', e);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
