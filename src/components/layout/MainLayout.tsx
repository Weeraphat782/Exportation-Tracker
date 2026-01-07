'use client';

import { ReactNode, useState, useEffect, createContext, useContext } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Breadcrumb from './Breadcrumb';
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
    };

    // Initial check
    checkMobile();
    
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <SidebarContext.Provider value={{ toggleSidebar, isMobile, isSidebarCollapsed }}>
      <div className="h-screen bg-gray-100 print:block overflow-hidden">
        {/* Layout Container */}
        <div className="flex h-full">
          {/* Sidebar - Desktop: always visible, Mobile: overlay */}
          <Sidebar 
            isCollapsed={isSidebarCollapsed} 
            toggleSidebar={toggleSidebar} 
            isMobile={isMobile}
            className="print:hidden"
          />
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <Header />
            
            {/* Main Content */}
            <main 
              className={cn(
                "flex-1 overflow-y-auto bg-gray-50",
                "print:flex-none print:p-0 print:m-0 print:overflow-visible print:w-full",
                "p-4 sm:p-6"
              )}
            >
              <Breadcrumb />
              {children}
            </main>
          </div>
        </div>

        {/* Mobile Overlay - only when sidebar is open */}
        {isMobile && !isSidebarCollapsed && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarCollapsed(true)}
          />
        )}
        <Toaster position="top-right" expand={true} richColors />
      </div>
    </SidebarContext.Provider>
  );
};

export default MainLayout;
