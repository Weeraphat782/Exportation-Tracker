'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ChevronDown, 
  ChevronRight, 
  Settings, 
  Building, 
  Globe, 
  DollarSign,
  Calculator,
  Menu,
  FileText,
  LayoutDashboard,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { UserProfile } from '@/components/ui/user-profile';

// Define props for Sidebar
interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  isMobile: boolean;
  className?: string;
}

// Update component to accept props
const Sidebar = ({ isCollapsed, toggleSidebar, isMobile, className }: SidebarProps) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pathname = usePathname();

  // Collapse settings menu when sidebar collapses
  if (isCollapsed && settingsOpen) {
    setSettingsOpen(false);
  }

  return (
    <div 
      className={cn(
        "h-full bg-slate-900 text-white flex flex-col transition-all duration-300 ease-in-out",
        // Width based on state
        isCollapsed ? "w-16" : "w-64",
        // Position: fixed overlay on mobile, normal on desktop  
        isMobile 
          ? "fixed left-0 top-0 z-50 h-screen" 
          : "relative",
        // Hide on mobile when collapsed
        isMobile && isCollapsed ? "hidden" : "flex",
        // Padding
        isCollapsed ? "p-2" : "p-4",
        className
      )}
    >
      <div className={cn(
        "flex items-center mb-6 mt-3",
        isCollapsed ? "justify-center" : "justify-between" 
      )}>
        {!isCollapsed && <div className="text-lg font-bold">Exportation Tracker</div>}
        {/* Show toggle button only on desktop or when sidebar is expanded on mobile */}
        {(!isMobile || !isCollapsed) && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="text-white hover:bg-slate-800"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      <nav className="space-y-3 flex-1 overflow-y-auto">
        <Link 
          href="/dashboard" 
          className={cn(
            "flex items-center px-4 py-3 rounded-md hover:bg-slate-800 transition-colors",
            isCollapsed ? "justify-center" : "",
            pathname?.startsWith("/dashboard") ? "bg-slate-800" : ""
          )}
          title="Dashboard"
        >
          <LayoutDashboard className={cn("h-6 w-6", !isCollapsed && "mr-3")} />
          {!isCollapsed && <span className="text-base">Dashboard</span>}
        </Link>

        <Link 
          href="/packing-lists" 
          className={cn(
            "flex items-center px-4 py-3 rounded-md hover:bg-slate-800 transition-colors",
            isCollapsed ? "justify-center" : "",
            pathname?.startsWith("/packing-lists") ? "bg-slate-800" : ""
          )}
          title="Packing Lists"
        >
          <FileText className={cn("h-6 w-6", !isCollapsed && "mr-3")} />
          {!isCollapsed && <span className="text-base">Packing Lists</span>}
        </Link>

        <Link 
          href="/shipping-calculator" 
          className={cn(
            "flex items-center px-4 py-3 rounded-md hover:bg-slate-800 transition-colors",
            isCollapsed ? "justify-center" : "",
            pathname?.startsWith("/shipping-calculator") ? "bg-slate-800" : ""
          )}
          title="Shipping Calculator"
        >
          <Calculator className={cn("h-6 w-6", !isCollapsed && "mr-3")} />
          {!isCollapsed && <span className="text-base">Shipping Calculator</span>}
        </Link>
        
        <Link 
          href="/document-submissions" 
          className={cn(
            "flex items-center px-4 py-3 rounded-md hover:bg-slate-800 transition-colors",
            isCollapsed ? "justify-center" : "",
            pathname?.startsWith("/document-submissions") ? "bg-slate-800" : ""
          )}
          title="Document Submissions"
        >
          <FileText className={cn("h-6 w-6", !isCollapsed && "mr-3")} />
          {!isCollapsed && <span className="text-base">Document Submissions</span>}
        </Link>

        <Link 
          href="/calendar" 
          className={cn(
            "flex items-center px-4 py-3 rounded-md hover:bg-slate-800 transition-colors",
            isCollapsed ? "justify-center" : "",
            pathname?.startsWith("/calendar") ? "bg-slate-800" : ""
          )}
          title="Calendar"
        >
          <Calendar className={cn("h-6 w-6", !isCollapsed && "mr-3")} />
          {!isCollapsed && <span className="text-base">Calendar</span>}
        </Link>

        {/* Removed direct link to Generator; creation is accessed from list page */}
        
        <div className="space-y-1">
          <button
            onClick={() => !isCollapsed && setSettingsOpen(!settingsOpen)}
            className={cn(
              "flex items-center w-full px-4 py-3 rounded-md hover:bg-slate-800 transition-colors",
              isCollapsed ? "justify-center" : "",
              pathname?.startsWith("/settings") ? "bg-slate-800" : ""
            )}
            title="Settings"
            disabled={isCollapsed}
          >
            <Settings className={cn("h-6 w-6", !isCollapsed && "mr-3")} />
            {!isCollapsed && <span className="text-base">Settings</span>}
            {!isCollapsed && (settingsOpen ? (
              <ChevronDown className="h-5 w-5 ml-auto" />
            ) : (
              <ChevronRight className="h-5 w-5 ml-auto" />
            ))}
          </button>
          
          {!isCollapsed && settingsOpen && (
            <div className="pl-8 space-y-2 mt-2">
              <Link 
                href="/settings/company" 
                className={cn(
                  "flex items-center px-4 py-2 rounded-md hover:bg-slate-800 transition-colors",
                  pathname?.startsWith("/settings/company") ? "bg-slate-700" : ""
                )}
              >
                <Building className="h-5 w-5 mr-3" />
                <span className="text-base">Company</span>
              </Link>
              <Link 
                href="/settings/destination" 
                className={cn(
                  "flex items-center px-4 py-2 rounded-md hover:bg-slate-800 transition-colors",
                  pathname?.startsWith("/settings/destination") ? "bg-slate-700" : ""
                )}
              >
                <Globe className="h-5 w-5 mr-3" />
                <span className="text-base">Destination</span>
              </Link>
              <Link 
                href="/settings/freight-rate" 
                className={cn(
                  "flex items-center px-4 py-2 rounded-md hover:bg-slate-800 transition-colors",
                  pathname?.startsWith("/settings/freight-rate") ? "bg-slate-700" : ""
                )}
              >
                <DollarSign className="h-5 w-5 mr-3" />
                <span className="text-base">Freight Rate</span>
              </Link>
            </div>
          )}
        </div>
        
      </nav>
      
      <div className="mt-auto">
        {isCollapsed ? (
          <div className="flex justify-center mb-4">
            <UserProfile />
          </div>
        ) : (
          <div className="mb-4">
            <UserProfile />
          </div>
        )}
        <div className="text-base text-slate-400 p-2">
          v1.0.0
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 