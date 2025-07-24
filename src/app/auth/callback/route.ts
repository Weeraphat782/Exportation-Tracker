import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// This route handles the callback from Supabase Auth
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  if (code) {
    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirect to the app after successful sign-in
  return NextResponse.redirect(new URL('/shipping-calculator', request.url));
} 