import { NextResponse } from 'next/server';
import { requireAdminApiUser } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireAdminApiUser(request);
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.supabase
    .from('qc_lab_admin_allowlist')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to load allowlist.' }, { status: 500 });
  }

  return NextResponse.json({ entries: data || [] });
}

export async function POST(request: Request) {
  const auth = await requireAdminApiUser(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required.' }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from('qc_lab_admin_allowlist')
    .insert({ email, added_by: auth.user.id, is_active: true })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ entry: data });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminApiUser(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const id = body?.id;
  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.is_active === 'boolean') patch.is_active = body.is_active;

  const { error } = await auth.supabase.from('qc_lab_admin_allowlist').update(patch).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await requireAdminApiUser(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 });

  const { error } = await auth.supabase.from('qc_lab_admin_allowlist').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
