import { supabase } from '@/lib/supabase';
import { getStoredSession, isTokenExpired, ensureValidSession } from '@/lib/session-helper';
import type { Quotation, DocumentSubmission } from '@/lib/db';

export interface FreightRate {
  id: string;
  destination_id: string;
  min_weight: number | null;
  max_weight: number | null;
  base_rate: number;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Customer-specific database functions
// ใช้สำหรับ customer portal เท่านั้น
// RLS policies ทำหน้าที่ filter ข้อมูลอัตโนมัติ
//
// ทุก query function จะเช็ค token ก่อน:
// - ถ้ายังไม่หมดอายุ → query ปกติ
// - ถ้าหมดอายุ → stopAutoRefresh → refresh ด้วย fetch() → setSession → startAutoRefresh → query
// ============================================================

/**
 * ตรวจสอบ + refresh token ก่อนทำ query
 * ป้องกันไม่ให้ Supabase client ค้างจาก internal lock
 */
async function prepareSession(): Promise<boolean> {
  const stored = getStoredSession();
  if (!stored) return false;

  if (!isTokenExpired(stored)) {
    return true;
  }

  // Token หมดอายุ → หยุด auto-refresh → refresh เอง → sync กลับ → เปิด auto-refresh
  try {
    supabase.auth.stopAutoRefresh();

    const freshSession = await ensureValidSession();
    if (!freshSession) {
      supabase.auth.startAutoRefresh();
      return false;
    }

    await supabase.auth.setSession({
      access_token: freshSession.access_token,
      refresh_token: freshSession.refresh_token,
    });

    supabase.auth.startAutoRefresh();
    return true;
  } catch (err) {
    console.error('prepareSession error:', err);
    supabase.auth.startAutoRefresh();
    return false;
  }
}

/**
 * ดึง quotations ทั้งหมดที่ assign ให้ customer
 */
export async function getCustomerQuotations(providedUserId?: string): Promise<Quotation[]> {
  try {
    const sessionReady = await prepareSession();
    if (!sessionReady && !providedUserId) return [];

    let userId = providedUserId;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      userId = user.id;
    }

    const { data, error } = await supabase
      .from('quotations')
      .select('*, opportunities(stage, closure_status)')
      .eq('customer_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getCustomerQuotations error:', error.message);
      return [];
    }

    return (data || []) as Quotation[];
  } catch (err) {
    console.error('getCustomerQuotations exception:', err);
    return [];
  }
}

/**
 * ดึง quotation เดี่ยวสำหรับ customer
 */
export async function getCustomerQuotationById(id: string, providedUserId?: string): Promise<Quotation | null> {
  try {
    const sessionReady = await prepareSession();
    if (!sessionReady && !providedUserId) return null;

    let userId = providedUserId;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      userId = user.id;
    }

    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', id)
      .eq('customer_user_id', userId)
      .single();

    if (error) {
      console.error('getCustomerQuotationById error:', error.message);
      return null;
    }

    return data as Quotation | null;
  } catch (err) {
    console.error('getCustomerQuotationById exception:', err);
    return null;
  }
}

/**
 * ดึง document_submissions สำหรับ quotations ที่ assign ให้ customer
 */
export async function getCustomerDocuments(providedUserId?: string): Promise<(DocumentSubmission & { quotation_display_id?: string })[]> {
  try {
    const sessionReady = await prepareSession();
    if (!sessionReady && !providedUserId) return [];

    let userId = providedUserId;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      userId = user.id;
    }

    const { data: quotations } = await supabase
      .from('quotations')
      .select('id')
      .eq('customer_user_id', userId);

    if (!quotations || quotations.length === 0) return [];

    const quotationIds = quotations.map(q => q.id);
    const quotationMap = new Map(quotations.map(q => [q.id, q.id.slice(0, 8).toUpperCase()]));

    const { data: docs, error } = await supabase
      .from('document_submissions')
      .select('*')
      .in('quotation_id', quotationIds)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('getCustomerDocuments error:', error.message);
      return [];
    }

    return (docs || []).map(doc => ({
      ...doc,
      quotation_display_id: quotationMap.get(doc.quotation_id) || 'N/A',
    }));
  } catch (err) {
    console.error('getCustomerDocuments exception:', err);
    return [];
  }
}

/**
 * ดึง customer stats สำหรับ dashboard
 */
export async function getCustomerStats(providedUserId?: string) {
  try {
    const quotations = await getCustomerQuotations(providedUserId);

    const activeStatuses = ['draft', 'sent', 'accepted', 'docs_uploaded'];
    const inTransitStatuses = ['Shipped'];
    const completedStatuses = ['completed'];

    return {
      totalQuotations: quotations.length,
      activeQuotations: quotations.filter(q => activeStatuses.includes(q.status)).length,
      inTransit: quotations.filter(q => inTransitStatuses.includes(q.status)).length,
      completed: quotations.filter(q => completedStatuses.includes(q.status)).length,
      recentQuotations: quotations.slice(0, 5),
      allQuotations: quotations,
    };
  } catch (err) {
    console.error('getCustomerStats exception:', err);
    return {
      totalQuotations: 0,
      activeQuotations: 0,
      inTransit: 0,
      completed: 0,
      recentQuotations: [],
      allQuotations: [],
    };
  }
}

/**
 * อัปเดต quotation สำหรับ customer (จำกัดเฉพาะบาง field เช่น pallets)
 */
export async function updateCustomerQuotation(id: string, updates: Partial<Quotation>): Promise<boolean> {
  try {
    await prepareSession();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: checkData, error: checkError } = await supabase
      .from('quotations')
      .select('id')
      .eq('id', id)
      .eq('customer_user_id', user.id)
      .single();

    if (checkError || !checkData) {
      console.error('Unauthorized or quotation not found');
      return false;
    }

    const { error } = await supabase
      .from('quotations')
      .update(updates)
      .eq('id', id)
      .eq('customer_user_id', user.id);

    if (error) {
      console.error('Error updating customer quotation:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('updateCustomerQuotation exception:', err);
    return false;
  }
}

/**
 * ส่งเอกสารใหม่สำหรับ quotation
 */
export async function submitCustomerDocument(document: Omit<DocumentSubmission, 'id' | 'submitted_at'>): Promise<boolean> {
  try {
    await prepareSession();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: qCheck } = await supabase
      .from('quotations')
      .select('id')
      .eq('id', document.quotation_id)
      .eq('customer_user_id', user.id)
      .single();

    if (!qCheck) {
      console.error('Unauthorized: Quotation does not belong to this customer');
      return false;
    }

    const { error } = await supabase
      .from('document_submissions')
      .insert({
        ...document,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error submitting document:', error);
      return false;
    }

    const { data: quotation } = await supabase
      .from('quotations')
      .select('status')
      .eq('id', document.quotation_id)
      .single();

    if (quotation && ['draft', 'sent', 'accepted'].includes(quotation.status)) {
      await supabase
        .from('quotations')
        .update({ status: 'docs_uploaded' })
        .eq('id', document.quotation_id);
    }

    return true;
  } catch (err) {
    console.error('submitCustomerDocument exception:', err);
    return false;
  }
}

/**
 * ดึงข้อมูลการตั้งค่าของ customer
 */
export async function getCustomerSetting<T>(category: string, key: string, defaultValue: T): Promise<T> {
  try {
    await prepareSession();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return defaultValue;

    const { data, error } = await supabase
      .from('settings')
      .select('settings_value')
      .eq('user_id', user.id)
      .eq('category', category)
      .eq('settings_key', key)
      .maybeSingle();

    if (error) {
      console.error('getCustomerSetting error:', error);
      return defaultValue;
    }

    return (data?.settings_value as T) ?? defaultValue;
  } catch (err) {
    console.error('getCustomerSetting exception:', err);
    return defaultValue;
  }
}

/**
 * บันทึกข้อมูลการตั้งค่าของ customer
 */
export async function saveCustomerSetting(category: string, key: string, value: unknown): Promise<boolean> {
  try {
    await prepareSession();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('saveCustomerSetting: no user');
      return false;
    }

    const { data: existing, error: selectError } = await supabase
      .from('settings')
      .select('id')
      .eq('user_id', user.id)
      .eq('category', category)
      .eq('settings_key', key)
      .maybeSingle();

    if (selectError) {
      console.error('saveCustomerSetting select error:', selectError.message);
      return false;
    }

    if (existing) {
      const { error } = await supabase
        .from('settings')
        .update({
          settings_value: value,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) console.error('saveCustomerSetting update error:', error.message);
      return !error;
    } else {
      const { error } = await supabase
        .from('settings')
        .insert({
          user_id: user.id,
          category,
          settings_key: key,
          settings_value: value,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) console.error('saveCustomerSetting insert error:', error.message);
      return !error;
    }
  } catch (err) {
    console.error('saveCustomerSetting exception:', err);
    return false;
  }
}

/**
 * ดึงอัตราค่าขนส่งสำหรับสถานที่ปลายทางเฉพาะ
 */
export async function getFreightRatesByDestination(destinationId: string): Promise<FreightRate[]> {
  try {
    await prepareSession();

    const { data, error } = await supabase
      .from('freight_rates')
      .select('*')
      .eq('destination_id', destinationId);

    if (error) {
      console.error('Error fetching freight rates:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('getFreightRatesByDestination exception:', err);
    return [];
  }
}
