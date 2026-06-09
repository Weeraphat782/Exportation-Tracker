import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('user_id');
    const auth = await requireApiUser(request);

    if (!auth.ok) {
      return auth.response;
    }

    const userId = requestedUserId || auth.user.id;
    if (userId !== auth.user.id && auth.role !== 'admin') {
      return NextResponse.json(
        { error: 'You can only read your own AI settings.' },
        { status: 403 }
      );
    }

    const { data, error } = await auth.supabase
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
    const auth = await requireApiUser(request);
    if (!auth.ok) {
      return auth.response;
    }

    const body = await request.json();
    const { user_id, api_key } = body;
    const userId = user_id || auth.user.id;

    if (!api_key) {
      return NextResponse.json(
        { error: 'api_key is required' },
        { status: 400 }
      );
    }

    if (userId !== auth.user.id && auth.role !== 'admin') {
      return NextResponse.json(
        { error: 'You can only update your own AI settings.' },
        { status: 403 }
      );
    }

    console.log('Saving API key for user:', userId);

    // First, verify user exists
    const { data: userCheck, error: userError } = await auth.supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    console.log('User check:', { exists: !!userCheck, error: userError });

    // Check if setting exists
    const { data: existing } = await auth.supabase
      .from('settings')
      .select('id')
      .eq('user_id', userId)
      .eq('category', 'ai')
      .eq('settings_key', 'gemini_api_key')
      .maybeSingle();

    console.log('Existing setting:', existing);

    let error;
    if (existing && existing.id) {
      // Update existing
      console.log('Updating existing setting');
      const result = await auth.supabase
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
      const result = await auth.supabase
        .from('settings')
        .insert({
          category: 'ai',
          settings_key: 'gemini_api_key',
          settings_value: api_key,
          user_id: userId,
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

