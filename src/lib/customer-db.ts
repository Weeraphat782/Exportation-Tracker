import { supabase } from '@/lib/supabase';
import type { Quotation, DocumentSubmission } from '@/lib/db';

// ============================================================
// Customer-specific database functions
// ใช้สำหรับ customer portal เท่านั้น
// RLS policies ทำหน้าที่ filter ข้อมูลอัตโนมัติ
// ============================================================

/**
 * ดึง quotations ทั้งหมดที่ assign ให้ customer
 * ใช้ denormalized fields (company_name, destination) เพราะ customer
 * ไม่มี access ไปยังตาราง companies/destinations โดยตรง
 */
export async function getCustomerQuotations(): Promise<Quotation[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .eq('customer_user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer quotations:', error);
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
export async function getCustomerQuotationById(id: string): Promise<Quotation | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', id)
      .eq('customer_user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching customer quotation:', error);
      return null;
    }

    return data as Quotation;
  } catch (err) {
    console.error('getCustomerQuotationById exception:', err);
    return null;
  }
}

/**
 * ดึง document_submissions สำหรับ quotations ที่ assign ให้ customer
 */
export async function getCustomerDocuments(): Promise<(DocumentSubmission & { quotation_display_id?: string })[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // ดึง quotation IDs ของ customer ก่อน
    const { data: quotations } = await supabase
      .from('quotations')
      .select('id')
      .eq('customer_user_id', user.id);

    if (!quotations || quotations.length === 0) return [];

    const quotationIds = quotations.map(q => q.id);
    // ใช้ id ย่อเป็น display ID เพราะ quotation_no ไม่มีใน DB
    const quotationMap = new Map(quotations.map(q => [q.id, q.id.slice(0, 8).toUpperCase()]));

    // ดึง documents สำหรับ quotations เหล่านั้น
    const { data: docs, error } = await supabase
      .from('document_submissions')
      .select('*')
      .in('quotation_id', quotationIds)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer documents:', error);
      return [];
    }

    // เพิ่ม quotation display ID เข้าไปในแต่ละ document
    return (docs || []).map(doc => ({
      ...doc,
      quotation_display_id: quotationMap.get(doc.quotation_id) || 'N/A',
    })) as (DocumentSubmission & { quotation_display_id?: string })[];
  } catch (err) {
    console.error('getCustomerDocuments exception:', err);
    return [];
  }
}

/**
 * ดึง customer stats สำหรับ dashboard
 */
export async function getCustomerStats() {
  try {
    const quotations = await getCustomerQuotations();

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
