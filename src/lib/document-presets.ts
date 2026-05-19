/**
 * Central document checklist presets per commodity (internal system).
 */

import type { LucideIcon } from 'lucide-react';
import { Leaf, Package, Sprout, Trees } from 'lucide-react';

export type CommodityType = 'cannabis' | 'hemp' | 'kratom' | 'general';

export const ALL_COMMODITY_TYPES: CommodityType[] = [
  'cannabis',
  'hemp',
  'kratom',
  'general',
];

export interface DocTypeDef {
  id: string;
  name: string;
}

export interface DocCategory {
  id: string;
  name: string;
  types: DocTypeDef[];
}

export const GACP_DOCS_STANDARD: DocTypeDef[] = [
  { id: 'thai-gacp-certificate-standard', name: 'Thai GACP or GACP Certificate' },
];

export const GACP_DOCS_FARM: DocTypeDef[] = [
  { id: 'farm-purchase-order', name: 'Farm Purchase Order' },
  { id: 'farm-commercial-invoice', name: 'Farm Commercial Invoice' },
  { id: 'thai-gacp-certificate-farm', name: 'Thai GACP Certificate (Farm)' },
];

export const COMMODITY_META: Record<
  CommodityType,
  {
    label: string;
    description: string;
    icon: LucideIcon;
    iconBgClass: string;
    iconClass: string;
    selectedRingClass: string;
    badgeClass: string;
    supportsMsds: boolean;
    supportsGacp: boolean;
  }
> = {
  cannabis: {
    label: 'Cannabis',
    description: 'Medical-grade cannabis flowers, extracts, biomass',
    icon: Leaf,
    iconBgClass: 'bg-emerald-100',
    iconClass: 'text-emerald-600',
    selectedRingClass: 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/50',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    supportsMsds: true,
    supportsGacp: true,
  },
  hemp: {
    label: 'Hemp',
    description: 'Industrial hemp & CBD products (Hemp Letter included)',
    icon: Sprout,
    iconBgClass: 'bg-lime-100',
    iconClass: 'text-lime-700',
    selectedRingClass: 'border-lime-500 ring-2 ring-lime-500/20 bg-lime-50/50',
    badgeClass: 'bg-lime-50 text-lime-800 border-lime-200',
    supportsMsds: true,
    supportsGacp: false,
  },
  kratom: {
    label: 'Kratom',
    description: 'Kratom products for export',
    icon: Trees,
    iconBgClass: 'bg-amber-100',
    iconClass: 'text-amber-700',
    selectedRingClass: 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/50',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    supportsMsds: false,
    supportsGacp: false,
  },
  general: {
    label: 'General',
    description: 'General export shipments',
    icon: Package,
    iconBgClass: 'bg-slate-100',
    iconClass: 'text-slate-600',
    selectedRingClass: 'border-slate-500 ring-2 ring-slate-500/20 bg-slate-50/50',
    badgeClass: 'bg-slate-50 text-slate-800 border-slate-200',
    supportsMsds: false,
    supportsGacp: false,
  },
};

const COMPANY_INFO_TYPES: DocTypeDef[] = [
  { id: 'company-registration', name: 'Company Registration' },
  { id: 'company-declaration', name: 'Company Declaration' },
  { id: 'id-card-copy', name: 'ID Card Copy' },
];

const BASIC_COMPANY_INFO_TYPES: DocTypeDef[] = [
  { id: 'company-registration', name: 'Company Registration' },
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

const KRATOM_PERMIT_TYPES: DocTypeDef[] = [
  { id: 'export-permit', name: 'Export Permit' },
];

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

const BASIC_SHIPPING_TYPES: DocTypeDef[] = [
  { id: 'purchase-order', name: 'Purchase Order' },
  { id: 'commercial-invoice', name: 'Commercial Invoice' },
  { id: 'packing-list', name: 'Packing List' },
];

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
  kratom: {
    label: 'Kratom',
    getCategories: () => [
      { id: 'company-info', name: 'Company Information', types: BASIC_COMPANY_INFO_TYPES },
      { id: 'permits-forms', name: 'Permits & Forms', types: KRATOM_PERMIT_TYPES },
      { id: 'shipping-docs', name: 'Shipping Documents', types: BASIC_SHIPPING_TYPES },
      { id: 'additional', name: 'Additional Documents', types: CANNABIS_ADDITIONAL },
    ],
  },
  general: {
    label: 'General',
    getCategories: () => [
      { id: 'company-info', name: 'Company Information', types: BASIC_COMPANY_INFO_TYPES },
      { id: 'shipping-docs', name: 'Shipping Documents', types: BASIC_SHIPPING_TYPES },
      { id: 'additional', name: 'Additional Documents', types: CANNABIS_ADDITIONAL },
    ],
  },
};

export function normalizeCommodityType(value: string | null | undefined): CommodityType {
  if (value === 'hemp') return 'hemp';
  if (value === 'kratom') return 'kratom';
  if (value === 'general') return 'general';
  return 'cannabis';
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

  ALL_COMMODITY_TYPES.forEach((commodity) => {
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
