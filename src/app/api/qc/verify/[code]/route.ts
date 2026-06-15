import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getServiceClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

/** Public read-only QC verification by qc_code (for QR scan). */
export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;
  if (!code) {
    return NextResponse.json({ error: 'Missing code.' }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('qc_requests')
    .select('qc_code, status, sample_name, lot_no, manufacturer, selected_items, created_at, qc_templates(name)')
    .eq('qc_code', code)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'QC code not found.' }, { status: 404 });
  }

  return NextResponse.json({
    qc_code: data.qc_code,
    status: data.status,
    sample_name: data.sample_name,
    lot_no: data.lot_no,
    manufacturer: data.manufacturer,
    template_name: (data.qc_templates as { name?: string } | null)?.name,
    tests: data.selected_items,
    created_at: data.created_at,
  });
}
