import { supabase } from '@/lib/supabase';
import { queryClient, loadSession } from '@/lib/customer-query-client';
import type {
  QcLabAdminAllowlistEntry,
  QcRequest,
  QcRequestStatus,
  QcTemplate,
  QcTestItem,
} from '@/lib/qc-types';
import type { QcCatalogSelections } from '@/lib/qc-catalog';
import { normalizeCatalogSelections } from '@/lib/qc-catalog';
import { computeQcInvoiceTotals, computeQcTotalsWithDiscount, generateQcCode } from '@/lib/qc-invoice';
import type { QcSelectedItem } from '@/lib/qc-types';

export function nestQcTestItems(items: QcTestItem[]): QcTestItem[] {
  const map = new Map<string, QcTestItem>();
  const roots: QcTestItem[] = [];
  items.forEach((item) => map.set(item.id, { ...item, children: [] }));
  map.forEach((item) => {
    if (item.parent_id && map.has(item.parent_id)) {
      map.get(item.parent_id)!.children!.push(item);
    } else {
      roots.push(item);
    }
  });
  const sortRec = (list: QcTestItem[]) => {
    list.sort((a, b) => a.sort_order - b.sort_order);
    list.forEach((n) => n.children && sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

export async function getQcTemplates(activeOnly = false): Promise<QcTemplate[]> {
  let q = supabase.from('qc_templates').select('*').order('name');
  if (activeOnly) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error) {
    console.error('getQcTemplates:', error);
    return [];
  }
  return (data || []) as QcTemplate[];
}

export async function getQcTemplateById(id: string): Promise<QcTemplate | null> {
  const { data, error } = await supabase.from('qc_templates').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return data as QcTemplate;
}

export async function getQcTestItems(templateId: string): Promise<QcTestItem[]> {
  const { data, error } = await supabase
    .from('qc_test_items')
    .select('*')
    .eq('template_id', templateId)
    .order('sort_order');
  if (error) return [];
  return (data || []) as QcTestItem[];
}

export async function getCustomerQcRequests(userId: string): Promise<QcRequest[]> {
  const { data, error } = await supabase
    .from('qc_requests')
    .select('*, qc_templates(name)')
    .eq('customer_user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []) as QcRequest[];
}

export async function getQcRequestById(id: string): Promise<QcRequest | null> {
  const { data, error } = await supabase
    .from('qc_requests')
    .select('*, qc_templates(name)')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return data as QcRequest;
}

export async function getQcRequestsByStatus(status?: QcRequestStatus): Promise<QcRequest[]> {
  let q = supabase.from('qc_requests').select('*, qc_templates(name)').order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) return [];
  return (data || []) as QcRequest[];
}

export async function createQcRequest(input: {
  customer_user_id: string;
  template_id?: string | null;
  catalog_selections?: QcCatalogSelections;
  company_name_address?: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  sample_name?: string;
  lot_no?: string;
  manufacturer?: string;
  sample_qty?: string;
  production_date?: string;
  expiry_date?: string;
  sampling_date?: string;
  sample_type?: string;
  sample_type_other?: string;
  test_method?: string;
  test_method_other?: string;
  selected_items?: QcSelectedItem[];
  estimated_coa_date?: string;
}): Promise<QcRequest | null> {
  const selected_items = input.selected_items ?? [];
  const catalog_selections = normalizeCatalogSelections(input.catalog_selections ?? {});
  const totals = computeQcInvoiceTotals(selected_items);
  const qc_code = generateQcCode();
  const share_token = crypto.randomUUID();

  const { data, error } = await supabase
    .from('qc_requests')
    .insert({
      customer_user_id: input.customer_user_id,
      template_id: input.template_id ?? null,
      catalog_selections,
      company_name_address: input.company_name_address,
      contact_name: input.contact_name,
      phone: input.phone,
      email: input.email,
      sample_name: input.sample_name,
      lot_no: input.lot_no,
      manufacturer: input.manufacturer,
      sample_qty: input.sample_qty,
      production_date: input.production_date,
      expiry_date: input.expiry_date,
      sampling_date: input.sampling_date,
      sample_type: input.sample_type,
      sample_type_other: input.sample_type_other,
      test_method: input.test_method,
      test_method_other: input.test_method_other,
      selected_items,
      estimated_coa_date: input.estimated_coa_date || null,
      qc_code,
      share_token,
      status: 'new',
      payment_status: 'pending',
      price_finalized: false,
      discount_percent: 0,
      discount_amount: totals.discount_amount,
      subtotal: totals.subtotal,
      vat: totals.vat,
      grand_total: totals.grand_total,
      wht_amount: totals.wht_amount,
      net_payable: totals.net_payable,
      coa_paths: [],
    })
    .select('*, qc_templates(name)')
    .single();

  if (error) {
    console.error('createQcRequest:', error);
    return null;
  }
  return data as QcRequest;
}

export async function updateQcRequest(
  id: string,
  patch: Partial<QcRequest>,
  options?: { asCustomer?: boolean }
): Promise<boolean> {
  let client = supabase;
  // Customer portal must use the dedicated query client (main client's session
  // handling can stall/fail on navigator locks). loadSession() guarantees a
  // valid token is attached before the write.
  if (options?.asCustomer) {
    const ready = await loadSession();
    if (!ready) {
      console.error('updateQcRequest: no valid customer session');
      return false;
    }
    client = queryClient;
  }
  const { error } = await client
    .from('qc_requests')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) {
    console.error(
      'updateQcRequest failed:',
      error.message,
      error.code,
      error.details,
      error.hint
    );
    return false;
  }
  return true;
}

export async function finalizeQcInvoice(
  id: string,
  discountPercent: number
): Promise<QcRequest | null> {
  const existing = await getQcRequestById(id);
  if (!existing) return null;

  const totals = computeQcTotalsWithDiscount(existing.selected_items ?? [], discountPercent);
  const now = new Date().toISOString();

  const { data: invoiceNo, error: rpcError } = await supabase.rpc('assign_qc_invoice_no', {
    p_request_id: id,
  });
  if (rpcError) {
    console.error('finalizeQcInvoice assign_qc_invoice_no:', rpcError);
    return null;
  }

  const { data, error } = await supabase
    .from('qc_requests')
    .update({
      discount_percent: totals.discount_percent,
      discount_amount: totals.discount_amount,
      subtotal: totals.subtotal,
      vat: totals.vat,
      grand_total: totals.grand_total,
      wht_amount: totals.wht_amount,
      net_payable: totals.net_payable,
      price_finalized: true,
      finalized_at: now,
      invoice_no: invoiceNo as string,
      updated_at: now,
    })
    .eq('id', id)
    .select('*, qc_templates(name)')
    .single();

  if (error) {
    console.error('finalizeQcInvoice:', error);
    return null;
  }
  return data as QcRequest;
}

export async function appendQcCoaPath(id: string, path: string): Promise<boolean> {
  const existing = await getQcRequestById(id);
  if (!existing) return false;
  const current = Array.isArray(existing.coa_paths) ? existing.coa_paths : [];
  const next = [...current, path];
  const { error } = await supabase
    .from('qc_requests')
    .update({
      coa_paths: next,
      coa_path: next[0] ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) {
    console.error('appendQcCoaPath:', error);
    return false;
  }
  return true;
}

export async function removeQcCoaPath(id: string, path: string): Promise<boolean> {
  const existing = await getQcRequestById(id);
  if (!existing) return false;
  const current = Array.isArray(existing.coa_paths) ? existing.coa_paths : [];
  const next = current.filter((p) => p !== path);
  const { error } = await supabase
    .from('qc_requests')
    .update({
      coa_paths: next,
      coa_path: next[0] ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) {
    console.error('removeQcCoaPath:', error);
    return false;
  }
  return true;
}

/**
 * A request can be deleted only before it is "submitted" into the workflow:
 * still new and payment not yet sent (no slip uploaded / not verified).
 */
export function canDeleteQcRequest(
  request: Pick<QcRequest, 'status' | 'payment_status'>
): boolean {
  return request.status === 'new' && request.payment_status === 'pending';
}

export async function deleteQcRequest(id: string): Promise<boolean> {
  const { error } = await supabase.from('qc_requests').delete().eq('id', id);
  if (error) {
    console.error('deleteQcRequest:', error);
    return false;
  }
  return true;
}

export async function getQcAllowlist(): Promise<QcLabAdminAllowlistEntry[]> {
  const { data, error } = await supabase
    .from('qc_lab_admin_allowlist')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []) as QcLabAdminAllowlistEntry[];
}

export async function addQcAllowlistEmail(email: string, addedBy: string): Promise<boolean> {
  const { error } = await supabase.from('qc_lab_admin_allowlist').insert({
    email: email.trim().toLowerCase(),
    added_by: addedBy,
    is_active: true,
  });
  return !error;
}

export async function toggleQcAllowlist(id: string, is_active: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('qc_lab_admin_allowlist')
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq('id', id);
  return !error;
}

export async function deleteQcAllowlistEntry(id: string): Promise<boolean> {
  const { error } = await supabase.from('qc_lab_admin_allowlist').delete().eq('id', id);
  return !error;
}

export async function createQcTemplate(input: {
  name: string;
  description?: string;
  created_by?: string;
}): Promise<QcTemplate | null> {
  const { data, error } = await supabase
    .from('qc_templates')
    .insert({ ...input, is_active: true })
    .select('*')
    .single();
  if (error) return null;
  return data as QcTemplate;
}

export async function updateQcTemplate(
  id: string,
  patch: Partial<Pick<QcTemplate, 'name' | 'description' | 'is_active'>>
): Promise<boolean> {
  const { error } = await supabase
    .from('qc_templates')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  return !error;
}

export async function deleteQcTemplate(id: string): Promise<boolean> {
  const { error } = await supabase.from('qc_templates').delete().eq('id', id);
  return !error;
}

export async function upsertQcTestItem(
  item: Partial<QcTestItem> & { template_id: string; name: string }
): Promise<QcTestItem | null> {
  if (item.id) {
    const { id, ...patch } = item;
    const { data, error } = await supabase
      .from('qc_test_items')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) return null;
    return data as QcTestItem;
  }
  const { data, error } = await supabase
    .from('qc_test_items')
    .insert(item)
    .select('*')
    .single();
  if (error) return null;
  return data as QcTestItem;
}

export async function deleteQcTestItem(id: string): Promise<boolean> {
  const { error } = await supabase.from('qc_test_items').delete().eq('id', id);
  return !error;
}

export type QcTestItemInsert = {
  name: string;
  group_label?: string | null;
  price?: number | null;
  unit_label?: string | null;
  min_sample_qty?: number | null;
  test_duration?: string | null;
  sort_order?: number;
  parent_id?: string | null;
};

export async function createQcTestItems(
  templateId: string,
  items: QcTestItemInsert[]
): Promise<{ ok: boolean; inserted: number; failed: number }> {
  if (items.length === 0) return { ok: true, inserted: 0, failed: 0 };

  const rows = items.map((item, index) => ({
    template_id: templateId,
    name: item.name.trim(),
    group_label: item.group_label ?? null,
    price: item.price ?? null,
    unit_label: item.unit_label ?? null,
    min_sample_qty: item.min_sample_qty ?? null,
    test_duration: item.test_duration ?? null,
    sort_order: item.sort_order ?? index,
    parent_id: item.parent_id ?? null,
  }));

  const { data, error } = await supabase.from('qc_test_items').insert(rows).select('id');
  if (error) {
    console.error('createQcTestItems:', error);
    return { ok: false, inserted: 0, failed: items.length };
  }
  const inserted = data?.length ?? 0;
  return { ok: inserted === items.length, inserted, failed: items.length - inserted };
}

export interface QcItemDraft {
  key: string;
  id?: string;
  name: string;
  price: string;
  unit_label: string;
  test_duration: string;
}

export interface QcGroupDraft {
  key: string;
  id?: string;
  name: string;
  min_sample_qty: string;
  unit_label: string;
  test_duration: string;
  price: string;
  items: QcItemDraft[];
}

/**
 * Persist a template's test items as groups.
 * Each group is a parent qc_test_item; its sub-items are children (parent_id).
 * A group with no sub-items acts as a single test (price on the group itself).
 */
export async function saveQcTemplateGroups(
  templateId: string,
  groups: QcGroupDraft[],
  removedIds: string[]
): Promise<{ ok: boolean; failed: number }> {
  let failed = 0;

  for (const id of removedIds) {
    await deleteQcTestItem(id);
  }

  for (let gi = 0; gi < groups.length; gi++) {
    const group = groups[gi];
    const hasItems = group.items.length > 0;

    const parent = await upsertQcTestItem({
      id: group.id,
      template_id: templateId,
      parent_id: null,
      name: group.name.trim(),
      group_label: null,
      price: hasItems ? null : group.price ? parseFloat(group.price) : null,
      unit_label: group.unit_label.trim() || null,
      min_sample_qty: group.min_sample_qty ? parseFloat(group.min_sample_qty) : null,
      test_duration: group.test_duration.trim() || null,
      sort_order: gi,
    });

    if (!parent) {
      failed++;
      continue;
    }

    for (let si = 0; si < group.items.length; si++) {
      const item = group.items[si];
      const saved = await upsertQcTestItem({
        id: item.id,
        template_id: templateId,
        parent_id: parent.id,
        name: item.name.trim(),
        group_label: group.name.trim() || null,
        price: item.price ? parseFloat(item.price) : null,
        unit_label: item.unit_label.trim() || null,
        min_sample_qty: null,
        test_duration: item.test_duration.trim() || null,
        sort_order: si,
      });
      if (!saved) failed++;
    }
  }

  return { ok: failed === 0, failed };
}
