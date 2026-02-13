'use client';

import { ReactNode, useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';

/**
 * Staff Route Guard
 * 
 * ป้องกันไม่ให้ customer เข้าถึงหน้า internal ได้
 * - ถ้า user เป็น customer → redirect ไป /portal
 * - ถ้า user เป็น staff/admin → ผ่านปกติ
 * - ถ้าไม่มี session → ปล่อยผ่าน (แต่ละหน้าจัดการ auth เอง เหมือนเดิม)
 * 
 * ⚠️ ไม่เปลี่ยนแปลง auth flow เดิมของระบบ internal
 */
function StaffRouteGuard({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Only check role if user is logged in
    if (!user) return;

    let cancelled = false;
    setChecking(true);

    const checkRole = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (cancelled) return;

        if (data?.role === 'customer') {
          window.location.href = '/portal';
          return;
        }

        setChecking(false);
      } catch {
        if (!cancelled) setChecking(false);
      }
    };

    checkRole();

    return () => { cancelled = true; };
  }, [user]);

  // ถ้ากำลังโหลด auth หรือ check role → แสดง loading
  // แต่ถ้าไม่มี user เลย ไม่ต้อง loading (ปล่อยให้แต่ละหน้าจัดการ)
  if (user && (authLoading || checking)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-3">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <StaffRouteGuard>
      <MainLayout>
        {children}
      </MainLayout>
    </StaffRouteGuard>
  );
}
