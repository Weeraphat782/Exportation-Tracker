import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiUser } from '@/lib/api-auth';
import { getChatSession, isValidSessionId } from '@/lib/chat-log';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiUser(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!isValidSessionId(id)) {
    return NextResponse.json({ error: 'Invalid session id.' }, { status: 400 });
  }

  try {
    const result = await getChatSession(auth.supabase, id);
    if (!result) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error('admin chat-logs detail error:', err);
    const message = err instanceof Error ? err.message : 'Failed to load session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
