'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const resetPasswordFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      console.log("Reset password attempt for:", data.email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      console.log("Reset password response:", error);

      if (error) {
        console.error("Reset password error:", error);
        setErrorMessage(error.message);
      } else {
        setSuccessMessage(
          'Password reset link sent. Check your email to reset your password.'
        );
        form.reset();
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
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
          <p className="text-sm text-slate-500">Reset your password</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Enter your email address and we&apos;ll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="your.email@example.com" 
                          type="email"
                          autoComplete="email"
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="text-sm text-center">
            Remember your password?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Back to login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 