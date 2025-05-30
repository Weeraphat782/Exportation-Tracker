'use client';

import { ReactNode } from 'react';
import MainLayout from '@/components/layout/MainLayout';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
}