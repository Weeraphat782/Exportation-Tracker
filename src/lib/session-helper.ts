/**
 * Session Helper — จัดการ auth token ผ่าน localStorage + fetch() ตรงๆ
 *
 * ปัญหา: Supabase GoTrue client ใช้ navigator.locks เมื่อ auto-refresh token
 * ถ้า refresh ค้าง (เช่น tab อยู่ background) → lock ไม่ถูกปล่อย →
 * getSession() ค้าง → query ทุกตัวค้าง → หน้าหมุนไม่โหลด
 *
 * วิธีแก้:
 * 1. อ่าน token จาก localStorage ตรงๆ (ไม่ผ่าน Supabase client, ไม่มี lock)
 * 2. ถ้า token หมดอายุ → refresh ด้วย fetch() ตรงไปที่ Supabase Auth API
 * 3. เขียน session ใหม่กลับ localStorage
 * 4. ใช้ supabase.auth.stopAutoRefresh() ก่อน → setSession() → startAutoRefresh()
 *
 * ใช้ storage key เดียวกับ Supabase client หลัก (supabase.auth.token)
 */

const STORAGE_KEY = 'supabase.auth.token';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const REFRESH_BUFFER_SECONDS = 30;

export interface StoredSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  token_type: string;
  user: Record<string, unknown>;
}

/**
 * อ่าน session จาก localStorage ตรงๆ — ไม่ผ่าน Supabase client, instant, ไม่มี lock
 */
export function getStoredSession(): StoredSession | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const session = parsed?.currentSession || parsed;
    if (!session?.access_token || !session?.refresh_token) return null;
    return session as StoredSession;
  } catch {
    return null;
  }
}

/**
 * เช็คว่า access token หมดอายุหรือใกล้หมด (30 วินาทีก่อนหมด)
 */
export function isTokenExpired(session?: StoredSession | null): boolean {
  if (!session) return true;
  const expiresAt = session.expires_at || 0;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return nowSeconds >= (expiresAt - REFRESH_BUFFER_SECONDS);
}

/**
 * Refresh token ด้วย fetch() ตรงๆ — ไม่ผ่าน Supabase client, ไม่มี lock, มี timeout 5 วินาที
 */
export async function refreshTokenDirect(refreshToken: string): Promise<StoredSession | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      console.error('[SessionHelper] Refresh failed:', response.status);
      return null;
    }

    const newSession = await response.json() as StoredSession;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    return newSession;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      console.error('[SessionHelper] Refresh timed out (5s)');
    } else {
      console.error('[SessionHelper] Refresh error:', err);
    }
    return null;
  }
}

// Singleton ป้องกัน refresh พร้อมกัน
let activeRefreshPromise: Promise<StoredSession | null> | null = null;

/**
 * ตรวจสอบ + refresh token ถ้าจำเป็น
 * - token ยังไม่หมดอายุ → return session ทันที
 * - token หมดอายุ → refresh ด้วย fetch() → return session ใหม่
 * - refresh ไม่ได้ → return null
 */
export async function ensureValidSession(): Promise<StoredSession | null> {
  const session = getStoredSession();
  if (!session) return null;

  if (!isTokenExpired(session)) {
    return session;
  }

  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  console.log('[SessionHelper] Token expired, refreshing via direct API...');
  activeRefreshPromise = refreshTokenDirect(session.refresh_token);

  try {
    const result = await activeRefreshPromise;
    if (result) {
      console.log('[SessionHelper] Token refreshed successfully');
    } else {
      console.warn('[SessionHelper] Token refresh failed');
    }
    return result;
  } finally {
    activeRefreshPromise = null;
  }
}
