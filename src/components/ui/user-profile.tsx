'use client';

import { useState, useEffect } from 'react';
import { LogOut /*, User */ } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';

export function UserProfile(/* { className }: UserProfileProps */) {
  const [userEmail, setUserEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user info from localStorage first (faster)
    const userFromStorage = localStorage.getItem('user');
    if (userFromStorage) {
      try {
        const userData = JSON.parse(userFromStorage);
        if (userData && userData.email) {
          setUserEmail(userData.email);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Error parsing user data from localStorage:', e);
      }
    }

    // Fall back to checking Supabase session
    async function getUserFromSession() {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user.email) {
          setUserEmail(data.session.user.email);
        }
      } catch (error) {
        console.error('Error getting user from session:', error);
      } finally {
        setLoading(false);
      }
    }

    getUserFromSession();
  }, []);

  const handleLogout = async () => {
    try {
      // Clear localStorage items
      localStorage.removeItem('user');
      localStorage.removeItem('auth_session');
      localStorage.removeItem('quotations'); // ล้างข้อมูล quotations เพื่อความปลอดภัย
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      console.log('User logged out successfully');
      
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (loading) {
    return <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse" />;
  }

  if (!userEmail) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
          <span className="sr-only">เมนูผู้ใช้</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-white">
            {userEmail.charAt(0).toUpperCase()}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-white">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col space-y-0.5">
            <p className="text-sm font-medium">{userEmail}</p>
            <p className="text-xs text-muted-foreground">ผู้ใช้งาน</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer text-red-600 focus:text-red-600" 
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>ออกจากระบบ</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 