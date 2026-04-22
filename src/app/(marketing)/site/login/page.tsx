'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const verified = searchParams.get('verified');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      if (data?.session) {
        // Check if user is a customer
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.session.user.id)
          .single();

        if (profileError || !profile) {
          setError('Could not verify your account. Please contact support.');
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }

        if (profile.role !== 'customer') {
          setError('This account is not registered as a customer. If you are staff, please use the internal login.');
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }

        // Success — redirect to portal
        window.location.href = '/portal';
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 bg-neutral-50">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-neutral-900">Welcome back</h1>
            <p className="text-sm text-neutral-500 mt-1">Sign in to your customer portal</p>
          </div>

          {verified && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-6">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm text-emerald-700">Email verified! You can now sign in.</p>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full pl-10 pr-4 py-3 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 transition-colors"
                    style={{ "--tw-ring-color": "rgba(33,84,151,0.15)" } as React.CSSProperties}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary-ref)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = ""; }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-10 pr-12 py-3 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 transition-colors"
                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-primary-ref)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = ""; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 text-white font-semibold rounded-xl transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: "var(--color-accent-ref)", boxShadow: "0 4px 14px rgba(91,191,33,0.3)" }}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Sign In <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <div className="mt-6 text-center space-y-4">
              <p className="text-sm text-neutral-500">
                Don&apos;t have an account?{' '}
                <Link href="/site/register" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: "var(--color-primary-ref)" }}>
                  Register here
                </Link>
              </p>
              <div className="pt-4 border-t border-neutral-100">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 text-sm font-medium text-neutral-600 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  Login for Admin / Staff
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link href="/site" className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors">
              ← Back to website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
