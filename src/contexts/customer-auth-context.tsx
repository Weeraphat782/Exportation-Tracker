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

  // Fetch customer profile — with timeout to prevent hanging
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
        // 1. Get current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Customer auth - getSession error:', error.message);
        }

        if (!mountedRef.current) return;

        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          
          // 2. Fetch profile (with safety)
          const prof = await fetchProfile(currentSession.user.id);
          if (!mountedRef.current) return;
          setProfile(prof);
        }
      } catch (err) {
        console.error('Customer auth - initialize error:', err);
      } finally {
        // ✅ Always set loading to false, even on error
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
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

    // Failsafe: force loading to false after 5 seconds
    const timeout = setTimeout(() => {
      if (mountedRef.current) {
        console.warn('Customer auth - Loading timeout, forcing isLoading=false');
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
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
