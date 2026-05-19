/**
 * Central document checklist presets per commodity (internal system).
 */

export type CommodityType = 'cannabis' | 'hemp';

export interface DocTypeDef {
  id: string;
  name: string;
}

export interface DocCategory {
  id: string;
  name: string;
  types: DocTypeDef[];
}

const COMPANY_INFO_TYPES: DocTypeDef[] = [
  { id: 'company-registration', name: 'Company Registration' },
  { id: 'company-declaration', name: 'Company Declaration' },
  { id: 'id-card-copy', name: 'ID Card Copy' },
];

const TK_FORM_TYPES: DocTypeDef[] = [
  { id: 'tk-10', name: 'TK 10' },
  { id: 'tk-10-eng', name: 'TK 10 (ENG)' },
  { id: 'tk-11', name: 'TK 11' },
  { id: 'tk-11-eng', name: 'TK 11 (ENG)' },
  { id: 'tk-31', name: 'TK 31' },
  { id: 'tk-31-eng', name: 'TK 31 (ENG)' },
  { id: 'tk-32', name: 'TK 32' },
];

const CANNABIS_PERMIT_TYPES: DocTypeDef[] = [
  { id: 'import-permit', name: 'Import Permit' },
  ...TK_FORM_TYPES,
];

const HEMP_PERMIT_TYPES: DocTypeDef[] = [...TK_FORM_TYPES];

const MSDS_TYPE: DocTypeDef = { id: 'msds', name: 'MSDS' };

function buildShippingTypes(includeMsds: boolean): DocTypeDef[] {
  return [
    { id: 'purchase-order', name: 'Purchase Order' },
    ...(includeMsds ? [MSDS_TYPE] : []),
    { id: 'commercial-invoice', name: 'Commercial Invoice' },
    { id: 'packing-list', name: 'Packing List' },
    { id: 'coa', name: 'COA' },
  ];
}

const CANNABIS_ADDITIONAL: DocTypeDef[] = [
  { id: 'additional-file', name: 'Additional File' },
];

const HEMP_ADDITIONAL: DocTypeDef[] = [
  { id: 'hemp-letter', name: 'Hemp Letter' },
  { id: 'additional-file', name: 'Additional File' },
];

export const DOCUMENT_PRESETS: Record<
  CommodityType,
  { label: string; getCategories: (includeMsds?: boolean) => DocCategory[] }
> = {
  cannabis: {
    label: 'Cannabis',
    getCategories: (includeMsds = false) => [
      { id: 'company-info', name: 'Company Information', types: COMPANY_INFO_TYPES },
      { id: 'permits-forms', name: 'Permits & TK Forms', types: CANNABIS_PERMIT_TYPES },
      { id: 'shipping-docs', name: 'Shipping Documents', types: buildShippingTypes(includeMsds) },
      { id: 'additional', name: 'Additional Documents', types: CANNABIS_ADDITIONAL },
    ],
  },
  hemp: {
    label: 'Hemp',
    getCategories: (includeMsds = false) => [
      { id: 'company-info', name: 'Company Information', types: COMPANY_INFO_TYPES },
      { id: 'permits-forms', name: 'Permits & TK Forms', types: HEMP_PERMIT_TYPES },
      { id: 'shipping-docs', name: 'Shipping Documents', types: buildShippingTypes(includeMsds) },
      { id: 'additional', name: 'Additional Documents', types: HEMP_ADDITIONAL },
    ],
  },
};

export function normalizeCommodityType(value: string | null | undefined): CommodityType {
  return value === 'hemp' ? 'hemp' : 'cannabis';
}

export function getDocumentCategories(
  commodity: CommodityType,
  includeMsds = false
): DocCategory[] {
  return DOCUMENT_PRESETS[commodity].getCategories(includeMsds);
}

export function getPresetFlat(commodity: CommodityType, includeMsds = false): DocTypeDef[] {
  return getDocumentCategories(commodity, includeMsds).flatMap((cat) => cat.types);
}

export function countPresetTypes(commodity: CommodityType, includeMsds = false): number {
  return getPresetFlat(commodity, includeMsds).length;
}

export function getAllTemplateDocumentTypes(): Array<DocTypeDef & { category: string }> {
  const seen = new Set<string>();
  const result: Array<DocTypeDef & { category: string }> = [];

  (['cannabis', 'hemp'] as CommodityType[]).forEach((commodity) => {
    getDocumentCategories(commodity, true).forEach((cat) => {
      cat.types.forEach((type) => {
        if (seen.has(type.id)) return;
        seen.add(type.id);
        result.push({ ...type, category: cat.name });
      });
    });
  });

  return result;
}
