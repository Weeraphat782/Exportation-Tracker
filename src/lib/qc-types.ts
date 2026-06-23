export type QcRequestStatus = 'new' | 'processing' | 'complete';
export type QcPaymentStatus = 'pending' | 'paid' | 'verified';
export type QcSampleType = 'solid' | 'liquid' | 'other';
export type QcTestMethod = 'lab' | 'customer' | 'other';

import type { QcCatalogSelections } from '@/lib/qc-catalog';

export interface QcLabAdminAllowlistEntry {
  id: string;
  email: string;
  is_active: boolean;
  added_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface QcTemplate {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface QcTestItem {
  id: string;
  template_id: string;
  parent_id?: string | null;
  name: string;
  group_label?: string | null;
  price?: number | null;
  unit_label?: string | null;
  min_sample_qty?: number | null;
  test_duration?: string | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  children?: QcTestItem[];
}

export interface QcSelectedItem {
  test_item_id: string;
  name: string;
  group_label?: string | null;
  unit_label?: string | null;
  price: number;
  qty: number;
  subtotal: number;
}

export type QcStorageCondition = 'room' | 'cold' | 'other';
export type QcSampleReturn = 'none' | 'with_report' | 'container_only';
export type QcReportLanguage = 'th' | 'en';
export type QcReportDelivery = 'pickup' | 'other';

/** Lab-admin-entered fields for the FM-QC-019 request form (stored as JSONB). */
export interface QcLabFormData {
  lab_sample_no?: string;
  lab_test_no?: string;
  service_request_no?: string;
  storage_condition?: QcStorageCondition | null;
  storage_condition_other?: string;
  attached_docs?: 'none' | 'yes' | null;
  attached_docs_detail?: string;
  sample_return?: QcSampleReturn | null;
  report_language?: QcReportLanguage | null;
  report_format_lab?: boolean;
  want_raw_data?: boolean;
  want_uncertainty?: boolean;
  report_delivery?: QcReportDelivery | null;
  report_delivery_other?: string;
  signer_name?: string;
  sign_date?: string;
}

export interface QcRequest {
  id: string;
  customer_user_id: string;
  template_id?: string | null;
  qc_code: string;
  share_token?: string | null;
  status: QcRequestStatus;
  company_name_address?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  sample_name?: string | null;
  lot_no?: string | null;
  manufacturer?: string | null;
  sample_qty?: string | null;
  production_date?: string | null;
  expiry_date?: string | null;
  sampling_date?: string | null;
  sample_type?: QcSampleType | null;
  sample_type_other?: string | null;
  test_method?: QcTestMethod | null;
  test_method_other?: string | null;
  selected_items: QcSelectedItem[];
  catalog_selections?: QcCatalogSelections | null;
  subtotal?: number | null;
  vat?: number | null;
  grand_total?: number | null;
  invoice_no?: string | null;
  discount_percent?: number | null;
  discount_amount?: number | null;
  wht_amount?: number | null;
  net_payable?: number | null;
  price_finalized?: boolean;
  finalized_at?: string | null;
  estimated_coa_date?: string | null;
  payment_status: QcPaymentStatus;
  payment_slip_path?: string | null;
  coa_path?: string | null;
  coa_paths?: string[];
  lab_notes?: string | null;
  lab_form_data?: QcLabFormData | null;
  created_at?: string;
  updated_at?: string;
  qc_templates?: Pick<QcTemplate, 'name'> | null;
}

export const QC_LAB_LETTERHEAD = {
  nameTh: 'ห้องปฏิบัติการ บริษัท สยาม เฮอเบิล เทค จำกัด',
  formCode: 'FM-QC-019 R.05',
} as const;

/**
 * Static blank FM-QC-019 form for customers to print and tick by hand.
 * Prefers the R2-hosted copy (set NEXT_PUBLIC_QC_FORM_URL after running
 * scripts/upload-qc-form-to-r2.mjs); falls back to the local public/ copy in dev.
 */
export const QC_REQUEST_FORM_FILE =
  process.env.NEXT_PUBLIC_QC_FORM_URL || '/forms/FM-QC-019.pdf';

/** Static PromptPay / bank QR image for QC invoice payment */
export const QC_PAYMENT_QR_IMAGE = '/images/Payment QR/201417.jpg';

export const QC_SAMPLE_TYPE_LABELS: Record<QcSampleType, string> = {
  solid: 'ของแข็ง',
  liquid: 'ของเหลว',
  other: 'อื่นๆ',
};

export const QC_TEST_METHOD_LABELS: Record<QcTestMethod, string> = {
  lab: 'วิธีของห้องปฏิบัติการ',
  customer: 'วิธีที่ผู้ขอรับบริการกำหนด',
  other: 'อื่นๆ',
};

export type QcPaymentStatusBadgeVariant = 'default' | 'secondary' | 'outline';

export const QC_PAYMENT_STATUS_LABELS: Record<
  QcPaymentStatus,
  { label: string; helper: string; badgeClass: string; variant: QcPaymentStatusBadgeVariant }
> = {
  pending: {
    label: 'Awaiting payment',
    helper: 'Please transfer and upload your payment slip.',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    variant: 'outline',
  },
  paid: {
    label: 'Slip uploaded — awaiting verification',
    helper: 'Lab will verify your payment before testing begins.',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    variant: 'secondary',
  },
  verified: {
    label: 'Payment verified',
    helper: 'Payment confirmed. Lab testing can proceed.',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    variant: 'default',
  },
};

/** True when the stored slip path looks like an image (inline preview). */
export function isQcPaymentSlipImage(path: string | null | undefined): boolean {
  if (!path) return false;
  return /\.(jpe?g|png|webp|gif)$/i.test(path);
}

/** All COA storage paths for a request (legacy single path + JSONB array). */
export function getQcCoaPaths(request: Pick<QcRequest, 'coa_path' | 'coa_paths'>): string[] {
  const fromArray = Array.isArray(request.coa_paths) ? request.coa_paths.filter(Boolean) : [];
  if (fromArray.length > 0) return fromArray;
  if (request.coa_path) return [request.coa_path];
  return [];
}

/** Demo PromptPay-style payload for the payment QR placeholder. */
export function buildQcPaymentQrPayload(
  qcCode: string,
  netPayable: number | null | undefined
): string {
  const amount = Number(netPayable) || 0;
  return `DEMO-QC-PAYMENT|${qcCode}|${amount.toFixed(2)} THB`;
}
