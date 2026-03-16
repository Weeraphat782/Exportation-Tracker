/**
 * Shared utilities for document comparison system.
 * Extracted from analyze route for maintainability.
 */

export const RATE_LIMIT_WINDOW = 10000; // 10 seconds between requests per user
const rateLimitStore = new Map<string, number>();

export function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userKey = `user_${userId}`;

  const lastRequestTime = rateLimitStore.get(userKey);
  if (!lastRequestTime) {
    rateLimitStore.set(userKey, now);
    return true;
  }

  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_WINDOW) {
    return false;
  }

  rateLimitStore.set(userKey, now);
  return true;
}

export interface DocumentData {
  id: string;
  file_name: string;
  file_url: string;
  document_type: string;
  file_path?: string;
  storage_provider?: 'supabase' | 'r2';
  base64Data?: string;
  mimeType?: string;
}

export interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  base64Data: string;
  mimeType: string;
}

export interface ExtractedData {
  consignor_name?: string;
  consignor_address?: string;
  consignee_name?: string;
  consignee_address?: string;
  hs_code?: string;
  permit_number?: string;
  po_number?: string;
  country_of_origin?: string;
  country_of_destination?: string;
  quantity?: string;
  total_value?: string;
  shipping_marks?: string;
  shipped_from?: string;
  shipped_to?: string;
  document_date?: string;
}

export function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

export function isErrorWithStatus(error: unknown): error is { status: number } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as Record<string, unknown>).status === 'number'
  );
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      const isRetryableError =
        (isErrorWithMessage(error) && (
          error.message.includes('RESOURCE_EXHAUSTED') ||
          error.message.includes('quota') ||
          error.message.includes('rate_limit') ||
          error.message.includes('429')
        )) ||
        (isErrorWithStatus(error) && (
          error.status === 429 ||
          error.status === 503
        ));

      if (!isRetryableError || attempt === maxRetries - 1) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`⏳ Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms delay`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

export async function downloadAndConvertToBase64(url: string): Promise<string> {
  try {
    if (url.startsWith('data:')) {
      const base64Data = url.split(',')[1];
      if (base64Data) return base64Data;
      throw new Error('Invalid data URL format');
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
}

export function getMimeType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop();
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
  };
  return mimeTypes[ext || ''] || 'application/pdf';
}

const DOCUMENT_TYPE_MAP: Record<string, string> = {
  'commercial-invoice': 'Commercial Invoice',
  'packing-list': 'Packing List',
  'tk-31': 'TK-31 Export Report',
  'tk-10-eng': 'TK-10 Export Permit (ENG)',
  'tk-11-eng': 'TK-11 Export Report (ENG)',
  'tk-31-eng': 'TK-31 Export Report (ENG)',
  'tk-32': 'TK-32 Export Permit',
  'import-permit': 'Import Permit',
  'export-permit': 'Export Permit',
  'hemp-letter': 'Hemp Certification Letter',
  'bill-of-lading': 'Bill of Lading',
  'certificate-of-origin': 'Certificate of Origin',
  'other': 'Other Document',
};

export function getDocumentTypeDisplayName(slug: string): string {
  return DOCUMENT_TYPE_MAP[slug] || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
