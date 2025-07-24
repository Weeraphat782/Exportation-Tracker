'use client'; // Mark as a Client Component

import { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';
import { Toaster } from 'sonner';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-slate-900 print:block overflow-hidden">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={toggleSidebar} 
        className="print:hidden"
      />
      <main 
        className={cn(
          "flex-1 p-3 overflow-y-auto transition-all duration-300 ease-in-out bg-slate-50",
          "print:flex-none print:p-0 print:m-0 print:overflow-visible",
          isSidebarCollapsed ? "w-[calc(100%-4rem)]" : "w-[calc(100%-18rem)]",
          "print:w-full"
        )}
      >
        {children}
      </main>
      <Toaster position="top-right" expand={true} richColors />
    </div>
  );
};

export default MainLayout; 