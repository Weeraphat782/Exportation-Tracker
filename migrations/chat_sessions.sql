-- Run in Supabase SQL Editor (or apply as migration).
-- Chatbot visitor sessions and message transcripts. RLS on with no policies:
-- only service_role (API routes) can insert/select.

create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text not null,
  email text,
  phone text,
  ip_hash text,
  user_agent text,
  message_count int not null default 0,
  created_at timestamptz not null default now(),
  last_message_at timestamptz
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_session_idx on chat_messages(session_id, created_at);

alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;

comment on table chat_sessions is 'Marketing chatbot visitor sessions (name/company/contact intake)';
comment on table chat_messages is 'Messages within a chatbot session';
