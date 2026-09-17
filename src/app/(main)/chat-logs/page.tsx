'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ChatMessageRow, ChatSessionRow } from '@/lib/chat-log';

function formatWhen(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function contactLabel(session: ChatSessionRow) {
  return [session.email, session.phone].filter(Boolean).join(' · ') || '—';
}

export default function ChatLogsPage() {
  const [sessions, setSessions] = useState<ChatSessionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ChatSessionRow | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch('/api/admin/chat-logs?limit=50', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.ok) {
      const body = await res.json();
      setSessions(body.sessions || []);
      setTotal(body.total ?? 0);
    }
    setLoading(false);
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setSelectedId(id);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`/api/admin/chat-logs/${id}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.ok) {
      const body = await res.json();
      setSelectedSession(body.session || null);
      setMessages(body.messages || []);
    } else {
      setSelectedSession(null);
      setMessages([]);
    }
    setDetailLoading(false);
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Chat Logs</h1>
          <p className="text-sm text-muted-foreground">
            Visitors who used the marketing chatbot ({total} sessions)
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadSessions} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5" />
              Sessions
            </CardTitle>
            <CardDescription>Name, company, contact, and message count</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No chat sessions yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Msgs</TableHead>
                    <TableHead>Started</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      data-state={selectedId === row.id ? 'selected' : undefined}
                      onClick={() => loadDetail(row.id)}
                    >
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.company}</TableCell>
                      <TableCell className="max-w-[180px] truncate">{contactLabel(row)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{row.message_count}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatWhen(row.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transcript</CardTitle>
            <CardDescription>
              {selectedSession
                ? `${selectedSession.name} · ${selectedSession.company}`
                : 'Select a session to read the conversation'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {detailLoading ? (
              <p className="text-sm text-muted-foreground">Loading transcript…</p>
            ) : !selectedSession ? (
              <p className="text-sm text-muted-foreground">No session selected.</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages recorded for this session.</p>
            ) : (
              <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-lg border p-3 text-sm ${
                      msg.role === 'user'
                        ? 'border-primary/20 bg-primary/5'
                        : 'border-muted bg-muted/30'
                    }`}
                  >
                    <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {msg.role === 'user' ? 'Visitor' : 'Assistant'} ·{' '}
                      {formatWhen(msg.created_at)}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
