import type { SupabaseClient } from '@supabase/supabase-js';

export interface ChatIntake {
  name: string;
  company: string;
  email: string | null;
  phone: string | null;
}

export interface ChatSessionRow {
  id: string;
  name: string;
  company: string;
  email: string | null;
  phone: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  message_count: number;
  created_at: string;
  last_message_at: string | null;
}

export interface ChatMessageRow {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidSessionId(id: unknown): id is string {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

export function validateIntake(raw: {
  name?: unknown;
  company?: unknown;
  email?: unknown;
  phone?: unknown;
}): { ok: true; intake: ChatIntake } | { ok: false; error: string } {
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  const company = typeof raw.company === 'string' ? raw.company.trim() : '';
  const email = typeof raw.email === 'string' ? raw.email.trim() : '';
  const phone = typeof raw.phone === 'string' ? raw.phone.trim() : '';

  if (!name || name.length > 120) {
    return { ok: false, error: 'Name is required (max 120 characters).' };
  }
  if (!company || company.length > 200) {
    return { ok: false, error: 'Company is required (max 200 characters).' };
  }
  if (!email && !phone) {
    return { ok: false, error: 'Email or phone is required.' };
  }
  if (email && email.length > 254) {
    return { ok: false, error: 'Email is too long.' };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Invalid email address.' };
  }
  if (phone && phone.length > 40) {
    return { ok: false, error: 'Phone is too long.' };
  }

  return {
    ok: true,
    intake: {
      name,
      company,
      email: email || null,
      phone: phone || null,
    },
  };
}

export async function createChatSession(
  client: SupabaseClient,
  intake: ChatIntake,
  ipHash: string | null,
  userAgent: string | null
): Promise<string> {
  const { data, error } = await client
    .from('chat_sessions')
    .insert({
      name: intake.name,
      company: intake.company,
      email: intake.email,
      phone: intake.phone,
      ip_hash: ipHash,
      user_agent: userAgent,
    })
    .select('id')
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message || 'Failed to create chat session');
  }
  return data.id as string;
}

export async function logChatTurn(
  client: SupabaseClient,
  sessionId: string,
  userText: string,
  assistantText: string
): Promise<void> {
  const { data: session, error: sessionError } = await client
    .from('chat_sessions')
    .select('id, message_count')
    .eq('id', sessionId)
    .maybeSingle();

  if (sessionError || !session) return;

  const { error: insertError } = await client.from('chat_messages').insert([
    { session_id: sessionId, role: 'user', content: userText },
    { session_id: sessionId, role: 'assistant', content: assistantText },
  ]);

  if (insertError) return;

  const now = new Date().toISOString();
  await client
    .from('chat_sessions')
    .update({
      message_count: (session.message_count as number) + 1,
      last_message_at: now,
    })
    .eq('id', sessionId);
}

export async function listChatSessions(
  client: SupabaseClient,
  { limit = 50, offset = 0 }: { limit?: number; offset?: number } = {}
): Promise<{ sessions: ChatSessionRow[]; total: number }> {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const safeOffset = Math.max(offset, 0);

  const { data, error, count } = await client
    .from('chat_sessions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(safeOffset, safeOffset + safeLimit - 1);

  if (error) throw new Error(error.message);
  return {
    sessions: (data || []) as ChatSessionRow[],
    total: count ?? 0,
  };
}

export async function getChatSession(
  client: SupabaseClient,
  id: string
): Promise<{ session: ChatSessionRow; messages: ChatMessageRow[] } | null> {
  const { data: session, error: sessionError } = await client
    .from('chat_sessions')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (sessionError || !session) return null;

  const { data: messages, error: messagesError } = await client
    .from('chat_messages')
    .select('*')
    .eq('session_id', id)
    .order('created_at', { ascending: true });

  if (messagesError) throw new Error(messagesError.message);

  return {
    session: session as ChatSessionRow,
    messages: (messages || []) as ChatMessageRow[],
  };
}
