import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiUser } from '@/lib/api-auth';
import { listChatSessions } from '@/lib/chat-log';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdminApiUser(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get('limit') || 50);
  const offset = Number(searchParams.get('offset') || 0);

  try {
    const { sessions, total } = await listChatSessions(auth.supabase, { limit, offset });
    return NextResponse.json({ sessions, total, limit, offset });
  } catch (err) {
    console.error('admin chat-logs list error:', err);
    const message = err instanceof Error ? err.message : 'Failed to load chat logs';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
