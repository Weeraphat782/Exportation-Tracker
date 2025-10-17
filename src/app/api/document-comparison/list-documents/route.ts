import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const quotationId = searchParams.get('quotation_id');

    console.log('API: Received quotation_id:', quotationId);

    if (!quotationId) {
      return NextResponse.json(
        { error: 'quotation_id is required' },
        { status: 400 }
      );
    }

    // Use Service Role Key to bypass RLS (same as other API routes in the system)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        }
      }
    );

    console.log('API: Using service role client');

    // Get quotation details (service role bypasses RLS)
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', quotationId)
      .single();

    console.log('API: Quotation query result:', { 
      found: !!quotation, 
      error: quotationError?.message 
    });

    if (quotationError || !quotation) {
      console.error('API: Quotation error:', quotationError);
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }

    // Get all documents for this quotation (service role bypasses RLS)
    const { data: documents, error: documentsError } = await supabase
      .from('document_submissions')
      .select('*')
      .eq('quotation_id', quotationId)
      .order('submitted_at', { ascending: false });

    console.log('API: Documents query result:', { 
      count: documents?.length || 0, 
      error: documentsError?.message,
      sampleDoc: documents?.[0] ? {
        id: documents[0].id,
        file_name: documents[0].file_name,
        document_type: documents[0].document_type
      } : null
    });

    if (documentsError) {
      console.error('API: Error fetching documents:', documentsError);
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      quotation,
      documents: documents || [],
    });
  } catch (error) {
    console.error('API: Error in list-documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

