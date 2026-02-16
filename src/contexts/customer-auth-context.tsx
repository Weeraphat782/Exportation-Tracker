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

/**
 * Refresh session แบบปลอดภัย — ใช้ fetch() ตรง + หยุด auto-refresh ชั่วคราว
 * เพื่อป้องกัน navigator.locks ค้าง
 *
 * Flow:
 * 1. stopAutoRefresh() → ป้องกัน Supabase client ชิง lock
 * 2. refresh ด้วย fetch() ตรง (5s timeout)
 * 3. setSession() → sync token ใหม่เข้า client (lock ว่างแล้ว)
 * 4. startAutoRefresh() → เปิด timer ใหม่
 */
async function safeRefreshAndSync(): Promise<boolean> {
  try {
    // หยุด auto-refresh ก่อน เพื่อป้องกัน lock ค้าง
    supabase.auth.stopAutoRefresh();

    const freshSession = await ensureValidSession();
    if (!freshSession) {
      supabase.auth.startAutoRefresh();
      return false;
    }

    // Sync token ใหม่เข้า Supabase client (lock ว่างเพราะ stopAutoRefresh แล้ว)
    const { error } = await supabase.auth.setSession({
      access_token: freshSession.access_token,
      refresh_token: freshSession.refresh_token,
    });

    // เปิด auto-refresh ใหม่
    supabase.auth.startAutoRefresh();

    if (error) {
      console.error('[SafeRefresh] setSession error:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[SafeRefresh] error:', err);
    supabase.auth.startAutoRefresh();
    return false;
  }
}

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetchProfile = async (userId: string): Promise<CustomerProfile | null> => {
    try {
      const { data, error } = await supabase
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

        // เช็คว่า token หมดอายุหรือไม่ (อ่านจาก localStorage ตรง, instant)
        const stored = getStoredSession();

        if (!stored) {
          console.log('Customer auth - No stored session');
          setIsLoading(false);
          return;
        }

        if (isTokenExpired(stored)) {
          // Token หมดอายุ → refresh แบบปลอดภัย (stop auto-refresh → fetch → setSession → start)
          console.log('Customer auth - Token expired, doing safe refresh...');
          const success = await safeRefreshAndSync();

          if (!mountedRef.current) return;

          if (!success) {
            console.warn('Customer auth - Refresh failed');
            setIsLoading(false);
            return;
          }
        }

        // Token ยังใช้ได้ → getSession ปกติ (token ไม่หมดอายุ → ไม่ trigger internal refresh → ไม่ค้าง)
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (!mountedRef.current) return;

        if (currentSession?.user) {
          console.log('Customer auth - Session found:', currentSession.user.id);
          setSession(currentSession);
          setUser(currentSession.user);

          const prof = await fetchProfile(currentSession.user.id);
          if (!mountedRef.current) return;
          setProfile(prof);
        } else {
          console.log('Customer auth - No user in session');
        }
      } catch (err) {
        console.error('Customer auth - init error:', err);
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    // Listen for auth state changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log(`Customer auth - Event: ${event}`);
        if (!mountedRef.current) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          const prof = await fetchProfile(newSession.user.id);
          if (mountedRef.current) {
            setProfile(prof);
          }
        } else {
          setProfile(null);
        }

        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    );

    // visibilitychange: เมื่อ tab กลับมา visible → เช็ค + refresh token ถ้าจำเป็น
    // วิธีนี้ refresh token ก่อนที่ component จะ fetch data → ไม่ค้าง
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;
      if (!mountedRef.current) return;

      const stored = getStoredSession();
      if (!stored) return;

      if (isTokenExpired(stored)) {
        console.log('Customer auth - Tab visible + token expired, refreshing...');
        await safeRefreshAndSync();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic check: ทุก 4 นาที เช็คว่า token ใกล้หมดอายุ → refresh ล่วงหน้า
    const refreshInterval = setInterval(async () => {
      if (!mountedRef.current) return;
      const stored = getStoredSession();
      if (stored && isTokenExpired(stored)) {
        console.log('Customer auth - Periodic check: token expired, refreshing...');
        await safeRefreshAndSync();
      }
    }, 4 * 60 * 1000);

    // Failsafe: force loading to false after 5 seconds
    const failsafe = setTimeout(() => {
      if (mountedRef.current && isLoading) {
        console.warn('Customer auth - Failsafe: forcing isLoading=false');
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(refreshInterval);
      clearTimeout(failsafe);
    };
  }, []);

  // Customer sign in
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
