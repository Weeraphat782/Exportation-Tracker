/** FM-QC-019 R.05 fixed test catalog — must mirror the printed form exactly. */

export interface QcCatalogItem {
  key: string;
  label: string;
}

export interface QcCatalogGroup {
  id: string;
  label: string;
  /** Microbiology rows require a unit value when selected. */
  requiresUnit?: boolean;
  /** Group supports an "Other" free-text field (Potency, Heavy Metals). */
  hasOtherField?: boolean;
  otherFieldKey?: 'potencyOther' | 'heavyMetalsOther';
  items: QcCatalogItem[];
}

export interface QcCatalogSelections {
  items: string[];
  units?: Record<string, string>;
  potencyOther?: string;
  heavyMetalsOther?: string;
  other?: string;
}

export const EMPTY_CATALOG_SELECTIONS: QcCatalogSelections = {
  items: [],
  units: {},
};

export const QC_CATALOG: QcCatalogGroup[] = [
  {
    id: 'potency',
    label: 'Potency',
    hasOtherField: true,
    otherFieldKey: 'potencyOther',
    items: [
      { key: 'potency_cbd_a', label: 'CBD-A (Cannabidiolic Acid)' },
      { key: 'potency_cbdv_a', label: 'CBDV-A (Cannabidivarinic Acid)' },
      { key: 'potency_cbn', label: 'CBN (Cannabinol)' },
      { key: 'potency_cbl', label: 'CBL (Cannabicyclol Acid)' },
      { key: 'potency_cbc', label: 'CBC (Cannabichromene)' },
      { key: 'potency_total_cbd', label: 'Total CBD (Total Cannabidiol)' },
      { key: 'potency_cbd', label: 'CBD (Cannabidiol)' },
      { key: 'potency_cbdv', label: 'CBDV (Cannabidivarin)' },
      { key: 'potency_cbg', label: 'CBG (Cannabigerol)' },
      { key: 'potency_total_thc', label: 'Total THC (Total Tetrahydrocannabinol)' },
      { key: 'potency_thc_a', label: 'THC-A (Tetrahydrocannabinolic acid)' },
      { key: 'potency_thcv', label: 'THCV (Tetrahydrocannabivarin)' },
      { key: 'potency_delta9_thc', label: 'Δ9-THC (Delta-9-Tetrahydrocannabinol)' },
      { key: 'potency_delta8_thc', label: 'Δ8-THC (Delta-8-Tetrahydrocannabinol)' },
    ],
  },
  {
    id: 'moisture',
    label: 'Moisture',
    items: [
      { key: 'moisture_content', label: 'Moisture content' },
      { key: 'loss_on_drying', label: 'Loss on drying' },
    ],
  },
  {
    id: 'microbiology',
    label: 'Microbiology',
    requiresUnit: true,
    items: [
      { key: 'micro_aerobic', label: 'Total Aerobic Microbial Count' },
      { key: 'micro_yeast_mold', label: 'Total Yeast and Mold Count' },
      { key: 'micro_bile_tolerant', label: 'Bile-tolerant gram negative bacteria' },
      { key: 'micro_ecoli', label: 'Escherichia coli' },
      { key: 'micro_clostridium', label: 'Clostridium spp.' },
      { key: 'micro_salmonella', label: 'Salmonella spp.' },
      { key: 'micro_staph', label: 'Staphylococcus aureus' },
      { key: 'micro_pseudomonas', label: 'Pseudomonas aeruginosa' },
    ],
  },
  {
    id: 'heavy_metals',
    label: 'Heavy Metals',
    hasOtherField: true,
    otherFieldKey: 'heavyMetalsOther',
    items: [
      { key: 'metal_arsenic', label: 'Arsenic' },
      { key: 'metal_cadmium', label: 'Cadmium' },
      { key: 'metal_mercury', label: 'Mercury' },
      { key: 'metal_lead', label: 'Lead' },
    ],
  },
  {
    id: 'other',
    label: 'Other',
    items: [],
  },
];

const ALL_ITEM_KEYS = new Set(
  QC_CATALOG.flatMap((g) => g.items.map((i) => i.key))
);

export function normalizeCatalogSelections(raw: unknown): QcCatalogSelections {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_CATALOG_SELECTIONS };
  const obj = raw as Record<string, unknown>;
  const items = Array.isArray(obj.items)
    ? obj.items.filter((k): k is string => typeof k === 'string' && ALL_ITEM_KEYS.has(k))
    : [];
  const units: Record<string, string> = {};
  if (obj.units && typeof obj.units === 'object') {
    for (const [k, v] of Object.entries(obj.units as Record<string, unknown>)) {
      if (ALL_ITEM_KEYS.has(k) && typeof v === 'string') units[k] = v;
    }
  }
  return {
    items,
    units,
    potencyOther: typeof obj.potencyOther === 'string' ? obj.potencyOther : undefined,
    heavyMetalsOther: typeof obj.heavyMetalsOther === 'string' ? obj.heavyMetalsOther : undefined,
    other: typeof obj.other === 'string' ? obj.other : undefined,
  };
}

export function hasCatalogSelections(sel: QcCatalogSelections): boolean {
  return (
    sel.items.length > 0 ||
    Boolean(sel.potencyOther?.trim()) ||
    Boolean(sel.heavyMetalsOther?.trim()) ||
    Boolean(sel.other?.trim())
  );
}

export function getCatalogItemLabel(key: string): string {
  for (const group of QC_CATALOG) {
    const item = group.items.find((i) => i.key === key);
    if (item) return item.label;
  }
  return key;
}
