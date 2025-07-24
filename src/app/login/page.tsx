'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [showDebug, setShowDebug] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setDebugInfo('');

    try {
      setDebugInfo((prev) => prev + `\nAttempting login with: ${email}\n`);
      
      // Direct Supabase login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });
      
      if (error) {
        console.error("Login error:", error);
        setErrorMessage(error.message);
        setDebugInfo((prev) => prev + `\nLogin error: ${error.message}\n`);
        setIsLoading(false);
        return;
      }
      
      setDebugInfo((prev) => prev + `\nLogin response: Session exists: ${!!data?.session}\n`);
      
      if (data && data.session) {
        // Store session info in localStorage as backup
        localStorage.setItem('auth_session', JSON.stringify({
          email: email,
          timestamp: new Date().toISOString(),
        }));
        
        // Store user session in localStorage for client-side auth
        localStorage.setItem('user', JSON.stringify({
          email: data.session.user.email,
          id: data.session.user.id,
          isAuthenticated: true
        }));
        
        setSuccessMessage('Login successful! Redirecting...');
        setDebugInfo((prev) => prev + `\nStored auth_session in localStorage.\nWill redirect to /shipping-calculator in 2 seconds...\n`);
        
        // Give Supabase time to properly set the cookie
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Clear the URL to avoid issues with state
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Use hard redirect with longer delay for debugging
        setTimeout(() => {
          // Use complete URL to force a full page refresh
          window.location.href = `${window.location.origin}/shipping-calculator`;
        }, 1500);
      } else {
        setErrorMessage('Login failed. No session returned.');
        setDebugInfo((prev) => prev + `\nNo session returned.\n`);
        setIsLoading(false);
      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      setErrorMessage('An unexpected error occurred');
      const message = error instanceof Error ? error.message : JSON.stringify(error);
      setDebugInfo((prev) => prev + `\nUnexpected error: ${message}\n`);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M23 14H18V9H14V14H9V18H14V23H18V18H23V14Z" fill="white"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Exportation Tracker</h1>
          <p className="text-sm text-slate-500">Login to your account</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {errorMessage && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                  {errorMessage}
                </div>
              )}
              
              {successMessage && (
                <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">
                  {successMessage}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <Button 
                type="submit"
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
              
              <div className="text-xs text-center">
                <button
                  type="button"
                  onClick={() => setShowDebug(!showDebug)}
                  className="text-slate-500 hover:text-slate-700 underline"
                >
                  {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
                </button>
              </div>
              
              {showDebug && debugInfo && (
                <div className="p-2 bg-slate-100 rounded text-xs font-mono whitespace-pre-wrap">
                  {debugInfo}
                </div>
              )}
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-center">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-blue-600 hover:underline">
                Register
              </Link>
            </div>
            <div className="text-sm text-center">
              <Link href="/reset-password" className="text-slate-500 hover:underline">
                Forgot your password?
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 