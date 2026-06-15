import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';
import { ROLES } from '@/lib/roles';

export const dynamic = 'force-dynamic';

/** After Google OAuth, verify email is on allowlist and grant lab_admin role. */
export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if (!auth.ok) return auth.response;

  const email = (auth.user.email || '').trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: 'No email on account.' }, { status: 400 });
  }

  const { data: entry, error: listError } = await auth.supabase
    .from('qc_lab_admin_allowlist')
    .select('id, is_active')
    .eq('email', email)
    .maybeSingle();

  if (listError) {
    console.error('[lab-google-finish] allowlist lookup failed:', listError);
    return NextResponse.json({ error: 'Could not verify allowlist.' }, { status: 500 });
  }

  if (!entry?.is_active) {
    return NextResponse.json(
      { error: 'This Google account is not authorized for Lab Admin access.' },
      { status: 403 }
    );
  }

  const { error: profileError } = await auth.supabase
    .from('profiles')
    .update({ role: ROLES.LAB_ADMIN, updated_at: new Date().toISOString() })
    .eq('id', auth.user.id);

  if (profileError) {
    console.error('[lab-google-finish] profile update failed:', profileError);
    return NextResponse.json({ error: 'Could not assign lab admin role.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, role: ROLES.LAB_ADMIN });
}
