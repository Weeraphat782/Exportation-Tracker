import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { sendQuoteRequestNotification } from '@/lib/mail';
import { absoluteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const quotationId = typeof body.quotationId === 'string' ? body.quotationId.trim() : '';

    if (!quotationId) {
      return NextResponse.json({ error: 'Missing quotationId.' }, { status: 400 });
    }

    const { data: quote, error } = await supabase
      .from('quotations')
      .select(
        'id, quotation_no, status, customer_name, company_name, requested_destination, commodity_type, phyto_required, notes, pallets'
      )
      .eq('id', quotationId)
      .single();

    if (error || !quote) {
      return NextResponse.json({ error: 'Quotation not found.' }, { status: 404 });
    }

    if (quote.status !== 'pending_approval') {
      return NextResponse.json({ error: 'Not a pending quote request.' }, { status: 400 });
    }

    const pallets = Array.isArray(quote.pallets) ? quote.pallets : [];

    try {
      await sendQuoteRequestNotification({
        quotationNo: quote.quotation_no,
        customerName: quote.customer_name,
        companyName: quote.company_name,
        requestedDestination: quote.requested_destination,
        commodityType: quote.commodity_type,
        phytoRequired: !!quote.phyto_required,
        palletCount: pallets.length,
        notes: quote.notes,
        approveUrl: absoluteUrl(`/shipping-calculator/new?approve_from=${quote.id}`),
      });
    } catch (emailErr) {
      console.error('[notify-quote-request] Email notification failed:', emailErr);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[notify-quote-request] Unexpected error:', err);
    return NextResponse.json({ ok: true });
  }
}
