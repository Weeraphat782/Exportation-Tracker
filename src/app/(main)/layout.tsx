'use client';

import { ReactNode } from 'react';
import { UserProfile } from '@/components/ui/user-profile';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <MainLayout>
      <div className="absolute top-4 right-4 z-50">
        <UserProfile />
      </div>
      {children}
    </MainLayout>
  );
} 