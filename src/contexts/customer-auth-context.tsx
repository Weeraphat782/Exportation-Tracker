'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode
} from 'react';
import {
  User,
  Session,
  AuthError
} from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/customer-query-client';
import {
  getStoredSession,
  isTokenExpired,
  ensureValidSession,
} from '@/lib/session-helper';

type CustomerProfile = {
  id: string;
  email: string;
  full_name: string | null;
  company: string | null;
  role: string;
};

type CustomerAuthContextType = {
  user: User | null;
  session: Session | null;
  profile: CustomerProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: AuthError | Error | null;
    success: boolean;
  }>;
  signUp: (email: string, password: string, fullName: string, companyName: string) => Promise<{
    error: AuthError | Error | null;
    success: boolean;
  }>;
  signOut: () => Promise<void>;
};

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  // ใช้ queryClient สำหรับ fetch profile (ไม่ใช้ main supabase client → ไม่ค้าง)
  const fetchProfile = async (userId: string): Promise<CustomerProfile | null> => {
    try {
      const { data, error } = await queryClient
        .from('profiles')
        .select('id, email, full_name, company, role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Customer auth - fetchProfile error:', error.message);
        return null;
      }
      return data as CustomerProfile;
    } catch (err) {
      console.error('Customer auth - fetchProfile exception:', err);
      return null;
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    const initialize = async () => {
      try {
        console.log('Customer auth - Initializing...');

        // Step 1: อ่าน session จาก localStorage + refresh ถ้าจำเป็น (ไม่ผ่าน main client)
        const freshSession = await ensureValidSession();
        if (!mountedRef.current) return;

        if (!freshSession) {
          console.log('Customer auth - No valid session');
          setIsLoading(false);
          return;
        }

        // Step 2: โหลดเข้า queryClient เพื่อได้ proper User/Session objects
        const { data, error } = await queryClient.auth.setSession({
          access_token: freshSession.access_token,
          refresh_token: freshSession.refresh_token,
        });

        if (!mountedRef.current) return;

        if (error || !data?.session?.user) {
          console.error('Customer auth - setSession error:', error?.message);
          setIsLoading(false);
          return;
        }

        console.log('Customer auth - Session loaded:', data.session.user.email);
        setSession(data.session);
        setUser(data.session.user);

        // Step 3: Fetch profile ด้วย queryClient (ไม่ค้าง)
        const prof = await fetchProfile(data.session.user.id);
        if (!mountedRef.current) return;
        setProfile(prof);
      } catch (err) {
        console.error('Customer auth - init error:', err);
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    // visibilitychange: เมื่อ tab กลับมา → refresh token + sync queryClient
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;
      if (!mountedRef.current) return;

      const stored = getStoredSession();
      if (!stored || !isTokenExpired(stored)) return;

      console.log('Customer auth - Tab visible + token expired, refreshing...');
      const fresh = await ensureValidSession();
      if (!fresh || !mountedRef.current) return;

      // Sync เข้า queryClient
      const { data } = await queryClient.auth.setSession({
        access_token: fresh.access_token,
        refresh_token: fresh.refresh_token,
      });

      if (data?.session?.user && mountedRef.current) {
        setSession(data.session);
        setUser(data.session.user);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic refresh: ทุก 4 นาที
    const refreshInterval = setInterval(async () => {
      if (!mountedRef.current) return;
      const stored = getStoredSession();
      if (stored && isTokenExpired(stored)) {
        const fresh = await ensureValidSession();
        if (fresh && mountedRef.current) {
          await queryClient.auth.setSession({
            access_token: fresh.access_token,
            refresh_token: fresh.refresh_token,
          });
        }
      }
    }, 4 * 60 * 1000);

    return () => {
      mountedRef.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(refreshInterval);
    };
  }, []);

  // Customer sign in — ใช้ main supabase client (เพื่อ store session ลง localStorage)
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error, success: false };
      }

      if (data?.session) {
        // Sync เข้า queryClient ด้วย
        await queryClient.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        const prof = await fetchProfile(data.session.user.id);

        if (!prof || prof.role !== 'customer') {
          await supabase.auth.signOut();
          return {
            error: new Error('This account is not registered as a customer. Please use the staff login instead.') as unknown as AuthError,
            success: false
          };
        }

        setProfile(prof);
        window.location.href = '/portal';
        return { error: null, success: true };
      } else {
        return { error: null, success: false };
      }
    } catch (e) {
      return { error: e as AuthError, success: false };
    } finally {
      setIsLoading(false);
    }
  };

  // Customer sign up
  const signUp = async (email: string, password: string, fullName: string, companyName: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/site/login?verified=true`,
          data: {
            full_name: fullName,
            company: companyName,
            role: 'customer',
          }
        },
      });

      if (error) {
        return { error, success: false };
      }

      return { error: null, success: true };
    } catch (e) {
      return { error: e as AuthError, success: false };
    } finally {
      setIsLoading(false);
    }
  };

  // Customer sign out
  const signOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
    window.location.href = '/site';
    setIsLoading(false);
  };

  const value = {
    user,
    session,
    profile,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};
