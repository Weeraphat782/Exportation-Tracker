import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { resolveDocumentFileUrl } from '@/lib/storage';

export const dynamic = 'force-dynamic';

async function resolveStaffFileUrl(
  fileUrl: string | null | undefined,
  storageProvider: string | null | undefined
): Promise<string | null> {
  if (!fileUrl?.trim()) return null;
  const path = fileUrl.includes('supabase')
    ? fileUrl.split('/public/')[1] || fileUrl
    : fileUrl;
  const url = await resolveDocumentFileUrl({
    file_path: path,
    file_url: fileUrl,
    storage_provider: (storageProvider as 'supabase' | 'r2') || 'supabase',
  });
  return url || null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const trimmed = token?.trim();
    if (!trimmed) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { data: row, error } = await supabase
      .from('quotations')
      .select(
        `
        id,
        quotation_no,
        company_name,
        customer_name,
        contact_person,
        destination,
        commodity_type,
        pallets,
        total_actual_weight,
        total_volume_weight,
        chargeable_weight,
        booking_details,
        awb_file_url,
        awb_file_name,
        customs_declaration_file_url,
        customs_declaration_file_name,
        storage_provider
      `
      )
      .eq('booking_share_token', trimmed)
      .maybeSingle();

    if (error) {
      console.error('booking GET lookup:', error);
      return NextResponse.json({ error: 'Could not load booking' }, { status: 500 });
    }

    if (!row) {
      return NextResponse.json({ error: 'Invalid or expired booking link' }, { status: 404 });
    }

    const { data: docs } = await supabase
      .from('document_submissions')
      .select(
        'id, file_name, original_file_name, document_type, document_type_name, file_path, file_url, mime_type, submitted_at, storage_provider'
      )
      .eq('quotation_id', row.id)
      .order('submitted_at', { ascending: false });

    const documents = await Promise.all(
      (docs ?? []).map(async (doc) => {
        const file_url = await resolveDocumentFileUrl({
          file_path: doc.file_path,
          file_url: doc.file_url,
          storage_provider: doc.storage_provider || 'r2',
        });
        return { ...doc, file_url };
      })
    );

    const [awb_url, customs_url] = await Promise.all([
      resolveStaffFileUrl(row.awb_file_url, row.storage_provider),
      resolveStaffFileUrl(row.customs_declaration_file_url, row.storage_provider),
    ]);

    return NextResponse.json({
      quotation: row,
      documents,
      staff_files: {
        awb_url,
        awb_file_name: row.awb_file_name,
        customs_url,
        customs_file_name: row.customs_declaration_file_name,
      },
    });
  } catch (e) {
    console.error('booking GET:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
