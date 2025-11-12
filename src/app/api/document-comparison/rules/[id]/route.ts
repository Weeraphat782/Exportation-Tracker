import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function createAuthenticatedClient(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Authentication required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    return createClient(
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
  } catch {
    throw new Error('Authentication failed');
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = createAuthenticatedClient(request);

    const { data: rule, error } = await supabase
      .from('document_comparison_rules')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !rule) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(rule);
  } catch (error) {
    console.error('Error in GET /api/document-comparison/rules/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, extraction_fields, comparison_instructions, critical_checks } = body;

    if (!name || !comparison_instructions) {
      return NextResponse.json(
        { error: 'name and comparison_instructions are required' },
        { status: 400 }
      );
    }

    const supabase = createAuthenticatedClient(request);

    const { data: rule, error } = await supabase
      .from('document_comparison_rules')
      .update({
        name,
        description: description || '',
        extraction_fields: extraction_fields || [],
        comparison_instructions,
        critical_checks: critical_checks || [],
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating rule:', error);
      return NextResponse.json(
        { error: 'Failed to update rule' },
        { status: 500 }
      );
    }

    return NextResponse.json(rule);
  } catch (error) {
    console.error('Error in PUT /api/document-comparison/rules/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = createAuthenticatedClient(request);

    // Check if it's a default rule (shouldn't be deleted)
    const { data: rule } = await supabase
      .from('document_comparison_rules')
      .select('is_default')
      .eq('id', id)
      .single();

    if (rule?.is_default) {
      return NextResponse.json(
        { error: 'Cannot delete default rule' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('document_comparison_rules')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting rule:', error);
      return NextResponse.json(
        { error: 'Failed to delete rule' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/document-comparison/rules/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


