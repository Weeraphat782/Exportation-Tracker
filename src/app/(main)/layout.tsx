'use client';

import { ReactNode } from 'react';
import { UserProfile } from '@/components/ui/user-profile';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Settings, FileText, Package, Box } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';

interface MainLayoutProps {
  children: ReactNode;
}

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

// NavItem component 
function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname?.startsWith(`${href}/`);
  
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
        isActive 
          ? 'bg-blue-50 text-blue-700' 
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <span className={isActive ? 'text-blue-700' : 'text-gray-500'}>
        {icon}
      </span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
} 