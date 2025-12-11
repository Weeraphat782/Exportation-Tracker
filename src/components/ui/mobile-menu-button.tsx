'use client';

import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useSidebar } from '@/components/layout/MainLayout';

export function MobileMenuButton() {
  const { toggleSidebar, isMobile, isSidebarCollapsed } = useSidebar();

  // Always show on mobile when sidebar is collapsed
  // Hide on desktop (lg and up)
  if (!isMobile || !isSidebarCollapsed) return null;

  return (
    <Button
      variant="ghost" 
      size="sm"
      onClick={toggleSidebar}
      className="h-8 w-8 p-0 lg:hidden flex items-center justify-center"
      title="Open menu"
    >
      <Menu className="h-4 w-4" />
    </Button>
  );
}
