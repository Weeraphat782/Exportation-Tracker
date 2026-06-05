/**
 * Hardcoded rule for the CUSTOMER self document check (pre-booking stage).
 *
 * This is a cleaned snapshot of the internal "pre booking" comparison rule:
 * - The embedded markdown "## per document" output-format block was removed,
 *   because the analysis engine enforces its own JSON output schema.
 * - The seven comparisons are expressed as discrete `critical_checks` so the
 *   customer UI can render a clean pass/fail checklist.
 * - Stamp-focused extraction fields are added so the model is forced to look at
 *   the TK-32 red stamp visually.
 *
 * Customers can NEVER change this rule; it lives in code on purpose.
 */

export interface CustomerCheckRule {
  name: string;
  description: string;
  extraction_fields: string[];
  comparison_instructions: string;
  critical_checks: string[];
}

export const CUSTOMER_CHECK_RULE: CustomerCheckRule = {
  name: 'Pre-Booking Verification',
  description:
    'Cross-document verification for export documents at the pre-booking stage, using TK-32 as the primary reference.',
  extraction_fields: [
    'net_weight',
    'product_quantity',
    'price',
    'product_value',
    'importer_name',
    'importer_address',
    'exporter_name',
    'exporter_address',
    'consignee_name',
    'consignee_address',
    'consigner_name',
    'consigner_address',
    'import_permit_number',
    'po_number',
    'invoice_number',
    'destination_country',
    'country_of_origin',
    'shipping_mark',
    'red_stamp_present',
    'red_stamp_text',
    'red_stamp_meaning',
  ],
  comparison_instructions: `You are performing a comprehensive cross-document verification for export-related documents (PRE-BOOKING STAGE).
Use TK32 as the primary reference document and compare all other documents (Import Permit, TK31, PO, Packing List, Commercial Invoice) against it.

Perform the following comparisons:
1. Match Net Weight and Product Quantity across all documents with TK32.
2. Verify that Price and Product Value match TK32.
3. Ensure Importer/Exporter, Consignee, and Consigner names and addresses are spelled correctly and consistent across all documents.
4. Confirm Import Permit Number, PO Number, and Invoice Number are correctly referenced and consistent.
5. Check that Destination Country, Country of Origin, and Shipping Mark align with TK32.
6. Validate that all fields are free from spelling errors and formatting inconsistencies.
7. Check if there is a RED STAMP on TK32. If found, describe its location, extract any text inside it, and explain its meaning (e.g., is it an authorization stamp, a cancellation stamp, or a 'used' stamp?).

ANALYSIS REQUIREMENTS:
- Be extremely strict and precise in your comparisons
- ALWAYS provide SPECIFIC VALUES from EACH document when comparing
- Flag ANY discrepancies with exact values (e.g., "TK32: 500kg vs Packing List: 471kg")
- For matching fields, show the actual values (e.g., "PO Number: PO-12345 found in TK32, Invoice, Packing List")
- If a document type is MISSING or NOT PROVIDED, use status "WARNING" and state "Document not provided" - DO NOT fail the check
- If a field is missing in a document but the document exists, state which document is missing the field
- Show exact spelling differences when names don't match (e.g., "TK32: ABC Co., Ltd. vs Invoice: ABC Company Limited")`,
  critical_checks: [
    'Net Weight and Product Quantity match across all documents versus TK-32 (show the values).',
    'Price and Product Value match TK-32 (show the values).',
    'Importer/Exporter, Consignee, and Consigner names and addresses are consistent and correctly spelled across all documents.',
    'Import Permit Number, PO Number, and Invoice Number are consistent and correctly referenced across documents.',
    'Destination Country, Country of Origin, and Shipping Mark align with TK-32.',
    'All fields are free from spelling errors and formatting inconsistencies.',
    'TK-32 red stamp: detect whether a red stamp is present, extract any text inside it, and explain its meaning (authorization / cancellation / used).',
  ],
};

/**
 * Document set required by the pre-booking rule. Enforcement is SOFT:
 * a missing document is surfaced as a warning, it never blocks the check.
 * `altTypes` are alternate slugs that also satisfy the requirement.
 */
export interface RequiredDoc {
  type: string;
  name: string;
  primary?: boolean;
  altTypes?: string[];
}

export const REQUIRED_PREBOOKING_DOCS: RequiredDoc[] = [
  { type: 'tk-32', name: 'TK-32 Export Permit', primary: true },
  { type: 'import-permit', name: 'Import Permit' },
  { type: 'tk-31', name: 'TK-31 Export Report', altTypes: ['tk-31-eng'] },
  { type: 'purchase-order', name: 'Purchase Order' },
  { type: 'packing-list', name: 'Packing List' },
  { type: 'commercial-invoice', name: 'Commercial Invoice' },
];

/** All slugs that count as a required pre-booking document (includes altTypes). */
export const REQUIRED_PREBOOKING_TYPES = new Set(
  REQUIRED_PREBOOKING_DOCS.flatMap((d) => [d.type, ...(d.altTypes || [])])
);

export function isRequiredPrebookingType(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return REQUIRED_PREBOOKING_TYPES.has(slug);
}

/**
 * Given the set of uploaded document_type slugs, return the required-doc
 * checklist with an `uploaded` flag for each entry.
 */
export function computeRequiredDocStatus(
  uploadedTypes: Iterable<string>
): Array<{ type: string; name: string; primary: boolean; uploaded: boolean }> {
  const uploaded = new Set(Array.from(uploadedTypes).filter(Boolean));
  return REQUIRED_PREBOOKING_DOCS.map((doc) => {
    const matches = [doc.type, ...(doc.altTypes || [])];
    return {
      type: doc.type,
      name: doc.name,
      primary: !!doc.primary,
      uploaded: matches.some((t) => uploaded.has(t)),
    };
  });
}

/** Friendly labels for extraction fields (shown in customer UI). */
export const EXTRACTION_FIELD_LABELS: Record<string, string> = {
  net_weight: 'Net Weight',
  product_quantity: 'Product Quantity',
  price: 'Price',
  product_value: 'Product Value',
  importer_name: 'Importer',
  importer_address: 'Importer Address',
  exporter_name: 'Exporter',
  exporter_address: 'Exporter Address',
  consignee_name: 'Consignee',
  consignee_address: 'Consignee Address',
  consigner_name: 'Consigner',
  consigner_address: 'Consigner Address',
  import_permit_number: 'Import Permit No.',
  po_number: 'PO No.',
  invoice_number: 'Invoice No.',
  destination_country: 'Destination',
  country_of_origin: 'Country of Origin',
  shipping_mark: 'Shipping Mark',
  red_stamp_present: 'Red Stamp Present',
  red_stamp_text: 'Red Stamp Text',
  red_stamp_meaning: 'Red Stamp Meaning',
};

/**
 * Format extracted fields for display — only non-empty values, in rule field order.
 */
export function formatExtractedFields(
  extracted: Record<string, unknown> | undefined | null
): Array<{ label: string; value: string }> {
  if (!extracted) return [];
  const fields: Array<{ label: string; value: string }> = [];
  for (const key of CUSTOMER_CHECK_RULE.extraction_fields) {
    const raw = extracted[key];
    if (raw == null) continue;
    const value = String(raw).trim();
    if (!value) continue;
    fields.push({
      label: EXTRACTION_FIELD_LABELS[key] || key.replace(/_/g, ' '),
      value,
    });
  }
  return fields;
}
