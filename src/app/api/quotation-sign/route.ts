import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

const MAX_SIGNATURE_LENGTH = 600_000; // ~450KB base64

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    const signatureDataUrl =
      typeof body.signatureDataUrl === 'string' ? body.signatureDataUrl.trim() : '';
    const signedCompanyName =
      typeof body.signedCompanyName === 'string' ? body.signedCompanyName.trim() : '';

    if (!token || !signatureDataUrl || !signedCompanyName) {
      return NextResponse.json(
        { error: 'Missing token, signature, or company name' },
        { status: 400 }
      );
    }

    if (!signatureDataUrl.startsWith('data:image/png;base64,')) {
      return NextResponse.json(
        { error: 'Signature must be a PNG data URL' },
        { status: 400 }
      );
    }

    if (signatureDataUrl.length > MAX_SIGNATURE_LENGTH) {
      return NextResponse.json({ error: 'Signature too large' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Only select columns that exist before/after migration — avoid selecting customer_signature
    // here so a missing migration does not break the lookup query.
    const { data: row, error: fetchError } = await supabase
      .from('quotations')
      .select('id, status')
      .eq('share_token', token)
      .maybeSingle();

    if (fetchError) {
      console.error('quotation-sign lookup:', fetchError);
      return NextResponse.json(
        { error: 'Could not load quotation. Check server logs and database.' },
        { status: 500 }
      );
    }

    if (!row) {
      return NextResponse.json(
        { error: 'Invalid or expired sign link.' },
        { status: 422 }
      );
    }

    if (row.status === 'signed') {
      return NextResponse.json({ error: 'This quotation is already signed' }, { status: 409 });
    }

    const { error: updateError } = await supabase
      .from('quotations')
      .update({
        customer_signature: signatureDataUrl,
        signed_at: new Date().toISOString(),
        signed_company_name: signedCompanyName,
        status: 'signed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id)
      .eq('share_token', token);

    if (updateError) {
      console.error('quotation-sign update:', updateError);
      return NextResponse.json({ error: 'Failed to save signature' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('quotation-sign POST:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
