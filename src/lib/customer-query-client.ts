/**
 * Lightweight Supabase client สำหรับ Customer Portal queries
 *
 * ทำไมต้องแยก: Main supabase client มี autoRefreshToken + navigator.locks
 * เมื่อ token หมดอายุใน background tab → lock ค้าง → ทุก query ค้างตาม
 * (เพราะ supabase.from().select() เรียก getSession() ภายใน ซึ่งรอ lock)
 *
 * Client ตัวนี้:
 * - autoRefreshToken: false → ไม่มี timer, ไม่มี visibilitychange handler
 * - persistSession: false → ไม่อ่าน/เขียน localStorage, ไม่มี storage lock
 * - detectSessionInUrl: false → ไม่ parse URL
 * - Session เก็บใน memory เท่านั้น → getSession() return ทันที
 *
 * ก่อนทุก query → เรียก loadSession() เพื่อ sync token จาก localStorage เข้า memory
 * Token refresh จัดการโดย session-helper.ts ผ่าน fetch() ตรงๆ
 */

import { createClient } from '@supabase/supabase-js';
import { getStoredSession, isTokenExpired, ensureValidSession } from './session-helper';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const queryClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  }
});

/**
 * โหลด session จาก localStorage เข้า queryClient
 * ถ้า token หมดอายุ → refresh ด้วย fetch() ก่อน
 * Return true ถ้าพร้อม query, false ถ้า session ตาย
 */
export async function loadSession(): Promise<boolean> {
  try {
    let stored = getStoredSession();
    if (!stored) return false;

    if (isTokenExpired(stored)) {
      const fresh = await ensureValidSession();
      if (!fresh) return false;
      stored = fresh;
    }

    const { error } = await queryClient.auth.setSession({
      access_token: stored.access_token,
      refresh_token: stored.refresh_token,
    });

    return !error;
  } catch (err) {
    console.error('[QueryClient] loadSession error:', err);
    return false;
  }
}
