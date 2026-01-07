import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';

export function createClient(request: NextRequest) {
  const response = NextResponse.next();
  
  const supabase = createMiddlewareClient({ 
    req: request, 
    res: response 
  });
  
  return { supabase, response };
}
