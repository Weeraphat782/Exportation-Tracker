import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User /*, Subscription */ } from '@supabase/supabase-js'; // Import User and Subscription types

// Define the shape of the context value
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: Error | null;
  checkUser: () => Promise<void>;
  login: (credentials: { email?: string; password?: string; provider?: 'google' }) => Promise<void>;
  logout: () => Promise<void>;
}

// Create context with a default value matching the type
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Explicitly type children prop
const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Use correct types for state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null); // Use Error type for error state

  const checkUser = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify({ 
          email: session.user.email, 
          id: session.user.id, 
          isAuthenticated: true 
        }));
      } else {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('user');
      }
    } catch (err: unknown) { // Use unknown for catch
      console.error("Error checking auth status:", err);
      setError(err instanceof Error ? err : new Error('Failed to check auth status')); // Set Error object
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Use the correct type for the authListener return value
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      if (session) {
        localStorage.setItem('user', JSON.stringify({ 
          email: session.user.email, 
          id: session.user.id, 
          isAuthenticated: true 
        }));
      } else {
        localStorage.removeItem('user');
      }
    });

    checkUser();

    return () => {
      // Access unsubscribe correctly
      authListener?.subscription?.unsubscribe(); 
    };
  }, []);

  const login = async (credentials: { email?: string; password?: string; provider?: 'google' }) => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (credentials.provider) {
        response = await supabase.auth.signInWithOAuth({
          provider: credentials.provider,
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });
      } else if (credentials.email && credentials.password) {
        response = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });
      } else {
        throw new Error('Invalid login credentials');
      }
      
      const { error: authError } = response; // Data part is unused
      
      if (authError) {
        console.error('Auth Context Login Error:', authError);
        setError(authError); // Set the Error object directly
      }
    } catch (err: unknown) { // Use unknown for catch
      console.error('Auth Context Login Error:', err);
      setError(err instanceof Error ? err : new Error('Login failed')); // Set Error object
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
    } catch (err: unknown) { // Use unknown for catch
      console.error('Auth Context Logout Error:', err);
      setError(err instanceof Error ? err : new Error('Logout failed')); // Set Error object
    } finally {
      setLoading(false);
    }
  };

  // Ensure the provided value matches AuthContextType
  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    error,
    checkUser,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Update useAuth to match context type
const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthProvider, useAuth }; 