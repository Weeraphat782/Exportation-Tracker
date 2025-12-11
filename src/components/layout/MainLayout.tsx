'use client'; // Mark as a Client Component

import { ReactNode, useState, useEffect, createContext, useContext } from 'react';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';
import { Toaster } from 'sonner';

// Create context for sidebar toggle
const SidebarContext = createContext<{
  toggleSidebar: () => void;
  isMobile: boolean;
  isSidebarCollapsed: boolean;
} | null>(null);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within MainLayout');
  }
  return context;
};

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      console.log('Mobile check:', mobile, 'Sidebar collapsed:', isSidebarCollapsed);
    };

    // Initial check
    checkMobile();
    
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <SidebarContext.Provider value={{ toggleSidebar, isMobile, isSidebarCollapsed }}>
      <div className="h-screen bg-slate-900 print:block overflow-hidden">
        {/* Layout Container */}
        <div className="flex h-full">
          {/* Sidebar - Desktop: always visible, Mobile: overlay */}
          <Sidebar 
            isCollapsed={isSidebarCollapsed} 
            toggleSidebar={toggleSidebar} 
            isMobile={isMobile}
            className="print:hidden"
          />
          
          {/* Main Content - Full width on mobile, adjusted on desktop */}
          <main 
            className={cn(
              "flex-1 overflow-y-auto bg-slate-50",
              "print:flex-none print:p-0 print:m-0 print:overflow-visible print:w-full",
              // Padding: very minimal
              "p-1 sm:p-2"
            )}
          >
            {children}
          </main>
        </div>

        {/* Mobile Overlay - only when sidebar is open */}
        {isMobile && !isSidebarCollapsed && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-30 z-40 lg:hidden"
            onClick={() => setIsSidebarCollapsed(true)}
          />
        )}
        <Toaster position="top-right" expand={true} richColors />
      </div>
    </SidebarContext.Provider>
  );
};

export default MainLayout; 