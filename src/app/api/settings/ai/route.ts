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

    // Use Service Role Key to bypass RLS
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

    const { data, error } = await supabase
      .from('settings')
      .select('settings_value')
      .eq('user_id', userId)
      .eq('category', 'ai')
      .eq('settings_key', 'gemini_api_key')
      .maybeSingle();

    if (error) {
      console.error('Error fetching API key:', error);
      return NextResponse.json({ api_key: '' });
    }

    const apiKey = typeof data?.settings_value === 'string' 
      ? data.settings_value 
      : (data?.settings_value as Record<string, unknown>)?.value as string || '';

    return NextResponse.json({ api_key: apiKey });
  } catch (error) {
    console.error('Error in GET /api/settings/ai:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, api_key } = body;

    if (!user_id || !api_key) {
      return NextResponse.json(
        { error: 'user_id and api_key are required' },
        { status: 400 }
      );
    }

    console.log('Saving API key for user:', user_id);

    // Use Service Role Key to bypass RLS
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

    // First, verify user exists
    const { data: userCheck, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user_id)
      .maybeSingle();
    
    console.log('User check:', { exists: !!userCheck, error: userError });

    // Check if setting exists
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .eq('user_id', user_id)
      .eq('category', 'ai')
      .eq('settings_key', 'gemini_api_key')
      .maybeSingle();

    console.log('Existing setting:', existing);

    let error;
    if (existing && existing.id) {
      // Update existing
      console.log('Updating existing setting');
      const result = await supabase
        .from('settings')
        .update({
          settings_value: api_key,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      
      error = result.error;
      console.log('Update result:', JSON.stringify({ 
        error: result.error, 
        data: result.data,
        status: result.status,
        statusText: result.statusText 
      }));
    } else {
      // Insert new - try without user_id first (allow NULL)
      console.log('Inserting new setting');
      const result = await supabase
        .from('settings')
        .insert({
          category: 'ai',
          settings_key: `gemini_api_key_${user_id}`, // Make it unique per user
          settings_value: api_key,
          user_id: user_id,
        })
        .select();
      
      error = result.error;
      console.log('Insert result:', JSON.stringify({ 
        error: result.error, 
        data: result.data,
        status: result.status,
        statusText: result.statusText,
        errorCode: result.error?.code,
        errorMessage: result.error?.message,
        errorDetails: result.error?.details,
        errorHint: result.error?.hint
      }, null, 2));
    }

    if (error) {
      console.error('Error saving settings:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { 
          error: error.message || error.toString() || 'Failed to save settings',
          details: JSON.stringify(error)
        },
        { status: 500 }
      );
    }

    console.log('Settings saved successfully');
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error in POST /api/settings/ai:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

