'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertCircle } from 'lucide-react';

function SiteAuthCallbackInner() {
  const searchParams = useSearchParams();  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const errHint = searchParams.get('error_description') || searchParams.get('error');
      if (errHint) {
        setMsg(errHint || 'Sign-in was cancelled or failed.');
        return;
      }

      const code = searchParams.get('code');
      if (!code) {
        setMsg('Missing authorization code.');
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        if (!cancelled) setMsg(error.message);
        return;
      }

      const { data: sessData, error: sessErr } = await supabase.auth.getSession();
      if (sessErr || !sessData.session?.user) {
        if (!cancelled) setMsg('Could not read session after login.');
        return;
      }

      const userId = sessData.session.user.id;
      let profile: { role: string } | null = null;
      for (let attempt = 0; attempt < 6; attempt++) {
        const res = await supabase.from('profiles').select('role').eq('id', userId).single();
        if (res.data) {
          profile = res.data;
          break;
        }
        await new Promise((r) => setTimeout(r, 450));
      }

      if (!profile) {
        await supabase.auth.signOut();
        if (!cancelled)
          setMsg('Could not verify your account profile. Try again or use email/password registration.');
        return;
      }

      if (profile.role !== 'customer') {
        await supabase.auth.signOut();
        if (!cancelled)
          setMsg('This login is not a customer portal account. Please use Login for Admin / Staff instead.');
        return;
      }

      const next = searchParams.get('next');
      const destination =
        next &&
        next.startsWith('/portal') &&
        !next.startsWith('//') &&
        !next.includes('://')
          ? next
          : '/portal';
      // Full reload so CustomerAuthProvider re-reads session from storage (avoids SPA race).
      window.location.replace(`${window.location.origin}${destination}`);    }

    finish();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);
  if (msg) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4 bg-neutral-50">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-600" />
          <h1 className="text-lg font-semibold text-red-900">Sign-in issue</h1>
          <p className="mt-2 text-sm text-red-800">{msg}</p>
          <Link
            href="/site/login"
            className="mt-6 inline-block text-sm font-medium text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
          >
            Back to customer login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center gap-4 bg-neutral-50">
      <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      <p className="text-sm text-neutral-600">Completing Google sign-in…</p>
    </div>
  );
}

export default function SiteAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center gap-4 bg-neutral-50">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          <p className="text-sm text-neutral-600">Loading…</p>
        </div>
      }
    >
      <SiteAuthCallbackInner />
    </Suspense>
  );
}
