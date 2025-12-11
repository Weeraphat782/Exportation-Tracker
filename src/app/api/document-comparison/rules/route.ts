import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Use authenticated client to work with RLS policies
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const { data: rules, error } = await supabase
      .from('document_comparison_rules')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rules:', error);
      return NextResponse.json(
        { error: 'Failed to fetch rules' },
        { status: 500 }
      );
    }

    return NextResponse.json(rules || []);
  } catch (error) {
    console.error('Error in GET /api/document-comparison/rules:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, name, description, extraction_fields, comparison_instructions, critical_checks } = body;

    console.log('POST /api/document-comparison/rules - Received:', {
      user_id,
      name,
      description,
      extraction_fields,
      comparison_instructions: comparison_instructions?.substring(0, 50) + '...',
      critical_checks
    });

    if (!user_id || !name || !comparison_instructions) {
      return NextResponse.json(
        { error: 'user_id, name, and comparison_instructions are required' },
        { status: 400 }
      );
    }

    // Use authenticated client to work with RLS policies
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const { data: rule, error } = await supabase
      .from('document_comparison_rules')
      .insert({
        user_id,
        name,
        description: description || '',
        extraction_fields: extraction_fields || [],
        comparison_instructions,
        critical_checks: critical_checks || [],
        is_default: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating rule:', error);
      return NextResponse.json(
        { error: 'Failed to create rule' },
        { status: 500 }
      );
    }

    return NextResponse.json(rule);
  } catch (error) {
    console.error('Error in POST /api/document-comparison/rules:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

