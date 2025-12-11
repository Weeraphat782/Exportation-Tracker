import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quotationId: string }> }
) {
  try {
    const resolvedParams = await params;
    const supabase = getSupabaseServerClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Get quotation details with company and destination info
    const { data: quotation, error } = await supabase
      .from('quotations')
      .select(`
        quotation_no,
        date,
        created_at,
        company_id,
        destination_id,
        companies (
          name
        ),
        destinations (
          country,
          port
        )
      `)
      .eq('quotation_no', resolvedParams.quotationId)
      .single();

    if (error) {
      console.error('Error fetching quotation:', error);
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }

    // Format the response
    const response = {
      quotation_id: quotation.quotation_no,
      date: quotation.date,
      created_at: quotation.created_at,
      company: quotation.companies?.[0]?.name || 'Unknown Company',
      destination: quotation.destinations?.[0] ?
        `${quotation.destinations[0].country}${quotation.destinations[0].port ? ` - ${quotation.destinations[0].port}` : ''}` :
        'Unknown Destination'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in quotation details API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



