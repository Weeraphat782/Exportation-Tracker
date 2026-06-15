import { supabase } from '@/lib/supabase';
import type {
  QcLabAdminAllowlistEntry,
  QcRequest,
  QcRequestStatus,
  QcTemplate,
  QcTestItem,
} from '@/lib/qc-types';
import { computeQcInvoiceTotals, generateQcCode } from '@/lib/qc-invoice';
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
  template_id: string;
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
  selected_items: QcSelectedItem[];
}): Promise<QcRequest | null> {
  const totals = computeQcInvoiceTotals(input.selected_items);
  const qc_code = generateQcCode();
  const share_token = crypto.randomUUID();

  const { data, error } = await supabase
    .from('qc_requests')
    .insert({
      ...input,
      qc_code,
      share_token,
      status: 'new',
      payment_status: 'pending',
      subtotal: totals.subtotal,
      vat: totals.vat,
      grand_total: totals.grand_total,
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
  patch: Partial<QcRequest>
): Promise<boolean> {
  const { error } = await supabase
    .from('qc_requests')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) {
    console.error('updateQcRequest:', error);
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
