'use client';

import { Bell, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserProfile } from '@/components/ui/user-profile';
import { useSidebar } from './MainLayout';
import Image from 'next/image';

const Header = () => {
  const { toggleSidebar, isMobile, isSidebarCollapsed } = useSidebar();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-5 shadow-sm print:hidden">
      {/* Left Section - Logo */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Logo - Show on mobile or when sidebar is collapsed */}
        {(isMobile || isSidebarCollapsed) && (
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Cantrak"
              width={100}
              height={32}
              className="h-7 w-auto"
            />
            <span className="text-sm font-semibold text-gray-500 italic">For Export</span>
          </div>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1">
        {/* Search Button */}
        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
          <Search className="h-5 w-5" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-green-500 rounded-full"></span>
        </Button>

        {/* User Profile */}
        <div className="ml-1">
          <UserProfile />
        </div>
      </div>
    </header>
  );
};

export default Header;
