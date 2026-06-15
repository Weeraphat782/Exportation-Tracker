'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertCircle } from 'lucide-react';

function getHashSearchParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams();
  return new URLSearchParams(window.location.hash.replace(/^#/, ''));
}

function LabAuthCallbackInner() {
  const searchParams = useSearchParams();
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const hashParams = getHashSearchParams();
      const errHint =
        searchParams.get('error_description') ||
        searchParams.get('error') ||
        hashParams.get('error_description') ||
        hashParams.get('error');

      if (errHint) {
        setMsg(errHint.trim() || 'Sign-in was cancelled or failed.');
        return;
      }

      const code = searchParams.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (!cancelled) setMsg(error.message);
          return;
        }
      }

      const { data: sessData } = await supabase.auth.getSession();
      if (!sessData.session?.access_token) {
        if (!cancelled) setMsg('Could not read session after login.');
        return;
      }

      const res = await fetch('/api/auth/lab-google-finish', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessData.session.access_token}`,
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        await supabase.auth.signOut();
        if (!cancelled) {
          setMsg(
            typeof body.error === 'string'
              ? body.error
              : 'This account is not authorized for Lab Admin.'
          );
        }
        return;
      }

      window.location.replace(`${window.location.origin}/qc`);
    }

    finish();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  if (msg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-slate-50">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-600" />
          <h1 className="text-lg font-semibold text-red-900">Lab Admin sign-in</h1>
          <p className="mt-2 text-sm text-red-800">{msg}</p>
          <Link href="/login" className="mt-6 inline-block text-sm font-medium underline">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      <p className="text-sm text-slate-600">Completing Lab Admin sign-in…</p>
    </div>
  );
}

export default function LabAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      }
    >
      <LabAuthCallbackInner />
    </Suspense>
  );
}
