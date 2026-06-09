import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const quotationId = searchParams.get('quotation_id');
    const auth = await requireApiUser(request);

    if (!auth.ok) {
      return auth.response;
    }

    console.log('API: Received quotation_id:', quotationId);

    if (!quotationId) {
      return NextResponse.json(
        { error: 'quotation_id is required' },
        { status: 400 }
      );
    }

    console.log('API: Using service role client');

    // Get quotation details (service role bypasses RLS)
    const { data: quotation, error: quotationError } = await auth.supabase
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

    const canAccess =
      quotation.user_id === auth.user.id ||
      quotation.customer_user_id === auth.user.id ||
      auth.role === 'staff' ||
      auth.role === 'admin';

    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied for this quotation.' }, { status: 403 });
    }

    // Get all documents for this quotation (service role bypasses RLS)
    const { data: documents, error: documentsError } = await auth.supabase
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

