'use client';

import { ReactNode } from 'react';
// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
} 