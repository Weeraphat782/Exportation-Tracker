import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

type AuthSuccess = {
  ok: true;
  user: User;
  role: string | null;
  supabase: SupabaseClient;
};

type AuthFailure = {
  ok: false;
  response: NextResponse;
};

export type ApiAuthResult = AuthSuccess | AuthFailure;

function getSupabaseUrl() {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
}

function getBearerToken(request: Request) {
  const header = request.headers.get('authorization') || '';
  return header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
}

function createServerSupabaseClient(key: string) {
  return createClient(getSupabaseUrl(), key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function requireApiUser(request: Request): Promise<ApiAuthResult> {
  const supabaseUrl = getSupabaseUrl();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Server auth configuration error.' }, { status: 500 }),
    };
  }

  const token = getBearerToken(request);
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Not authenticated.' }, { status: 401 }),
    };
  }

  const anonClient = createServerSupabaseClient(anonKey);
  const { data: userData, error: userError } = await anonClient.auth.getUser(token);
  const user = userData?.user;

  if (userError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Session expired. Please sign in again.' }, { status: 401 }),
    };
  }

  const supabase = createServerSupabaseClient(serviceRoleKey);
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('API auth profile lookup failed:', profileError);
    return {
      ok: false,
      response: NextResponse.json({ error: 'Could not verify user role.' }, { status: 500 }),
    };
  }

  return {
    ok: true,
    user,
    role: typeof profile?.role === 'string' ? profile.role : null,
    supabase,
  };
}

export async function requireStaffApiUser(request: Request): Promise<ApiAuthResult> {
  const auth = await requireApiUser(request);
  if (!auth.ok) return auth;

  if (auth.role !== 'staff' && auth.role !== 'admin') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Staff access required.' }, { status: 403 }),
    };
  }

  return auth;
}
