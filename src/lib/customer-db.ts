import { queryClient, loadSession } from '@/lib/customer-query-client';
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
//
// ใช้ queryClient (ไม่ใช่ main supabase client) เพื่อ bypass navigator.locks
// queryClient ไม่มี autoRefreshToken, ไม่มี persistSession → ไม่มี lock → ไม่ค้าง
//
// ก่อนทุก query: loadSession() อ่าน token จาก localStorage → sync เข้า queryClient
// ถ้า token หมดอายุ → refresh ด้วย fetch() ตรง (5s timeout)
// ============================================================

/**
 * ดึง quotations ทั้งหมดที่ assign ให้ customer
 */
export async function getCustomerQuotations(providedUserId?: string): Promise<Quotation[]> {
  try {
    const ready = await loadSession();
    if (!ready && !providedUserId) return [];

    let userId = providedUserId;
    if (!userId) {
      const { data: { user } } = await queryClient.auth.getUser();
      if (!user) return [];
      userId = user.id;
    }

    const { data, error } = await queryClient
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
    const ready = await loadSession();
    if (!ready && !providedUserId) return null;

    let userId = providedUserId;
    if (!userId) {
      const { data: { user } } = await queryClient.auth.getUser();
      if (!user) return null;
      userId = user.id;
    }

    const { data, error } = await queryClient
      .from('quotations')
      .select('*, opportunities(stage, closure_status)')
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
    const ready = await loadSession();
    if (!ready && !providedUserId) return [];

    let userId = providedUserId;
    if (!userId) {
      const { data: { user } } = await queryClient.auth.getUser();
      if (!user) return [];
      userId = user.id;
    }

    const { data: quotations } = await queryClient
      .from('quotations')
      .select('id')
      .eq('customer_user_id', userId);

    if (!quotations || quotations.length === 0) return [];

    const quotationIds = quotations.map(q => q.id);
    const quotationMap = new Map(quotations.map(q => [q.id, q.id.slice(0, 8).toUpperCase()]));

    const { data: docs, error } = await queryClient
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
 * อัปเดต quotation สำหรับ customer
 */
export async function updateCustomerQuotation(id: string, updates: Partial<Quotation>): Promise<boolean> {
  try {
    await loadSession();

    const { data: { user } } = await queryClient.auth.getUser();
    if (!user) return false;

    const { data: checkData, error: checkError } = await queryClient
      .from('quotations')
      .select('id')
      .eq('id', id)
      .eq('customer_user_id', user.id)
      .single();

    if (checkError || !checkData) {
      console.error('Unauthorized or quotation not found');
      return false;
    }

    const { error } = await queryClient
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
    await loadSession();

    const { data: { user } } = await queryClient.auth.getUser();
    if (!user) return false;

    const { data: qCheck } = await queryClient
      .from('quotations')
      .select('id')
      .eq('id', document.quotation_id)
      .eq('customer_user_id', user.id)
      .single();

    if (!qCheck) {
      console.error('Unauthorized: Quotation does not belong to this customer');
      return false;
    }

    const { error } = await queryClient
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

    const { data: quotation } = await queryClient
      .from('quotations')
      .select('status')
      .eq('id', document.quotation_id)
      .single();

    if (quotation && ['draft', 'sent', 'accepted'].includes(quotation.status)) {
      await queryClient
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
    await loadSession();

    const { data: { user } } = await queryClient.auth.getUser();
    if (!user) return defaultValue;

    const { data, error } = await queryClient
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
    await loadSession();

    const { data: { user } } = await queryClient.auth.getUser();
    if (!user) {
      console.error('saveCustomerSetting: no user');
      return false;
    }

    const { data: existing, error: selectError } = await queryClient
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
      const { error } = await queryClient
        .from('settings')
        .update({
          settings_value: value,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) console.error('saveCustomerSetting update error:', error.message);
      return !error;
    } else {
      const { error } = await queryClient
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
    await loadSession();

    const { data, error } = await queryClient
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
