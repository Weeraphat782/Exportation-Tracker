'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ROLES } from '@/lib/roles';

/**
 * Smart QR target. Lab admins/admins scanning a sample's QR are sent straight
 * to the internal work page for that request; everyone else (or guests) lands
 * on the public verification page.
 */
export default function QcScanRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const [message, setMessage] = useState('Opening QC request…');

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      const verifyTarget = `/qc/verify/${encodeURIComponent(code)}`;

      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        const role = profile?.role;
        if (role === ROLES.LAB_ADMIN || role === ROLES.ADMIN) {
          // Lab admin: jump to the work page for this sample
          const { data: req } = await supabase
            .from('qc_requests')
            .select('id')
            .eq('qc_code', code)
            .maybeSingle();

          if (!cancelled && req?.id) {
            router.replace(`/qc/requests/${req.id}`);
            return;
          }
        }
      }

      if (!cancelled) {
        setMessage('Opening verification page…');
        router.replace(verifyTarget);
      }
    };

    resolve();
    return () => {
      cancelled = true;
    };
  }, [code, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      <p className="text-sm text-slate-600">{message}</p>
      <p className="font-mono text-xs text-slate-400">{code}</p>
    </div>
  );
}
