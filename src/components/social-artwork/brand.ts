import type { TextStyleKey, TextStyleOverride } from './textStyle';

export type { TextStyleKey, TextStyleOverride };
export { ts, TEXT_STYLE_DEFAULTS } from './textStyle';

/** OMGEXP social artwork tokens — from Social Media Design Guidelines v1.0 */
export const COLORS = {
  navy900: '#0d2c4d',
  navy700: '#184878',
  green500: '#6FBE44',
  canvas: '#f8f9fa',
  ink: '#16191c',
  white: '#FFFFFF',
  ink60: 'rgba(22,25,28,.6)',
  ink15: 'rgba(22,25,28,.15)',
  muted: '#5c656e',
  navy200: '#8fb4d8',
  white90: 'rgba(255,255,255,.9)',
  white60: 'rgba(255,255,255,.6)',
} as const;

export const FONTS = {
  display: 'var(--font-barlow), Barlow, sans-serif',
  body: 'var(--font-public-sans), "Public Sans", sans-serif',
} as const;

export const FIXED = {
  phone: '02-630-4600-1',
  email: 'info@omgexp.com',
  website: 'omgexp.com',
  credit: 'OMG Experience Co., Ltd. · Air Freight Forwarding, Bangkok',
  fareConditions: '*Indicative rates · subject to availability, capacity & booking conditions',
} as const;

export const CANVAS = {
  post: { w: 1080, h: 1080 },
  story: { w: 1080, h: 1920, keepClearTop: 250, keepClearBottom: 320 },
} as const;

export const GEOMETRY = {
  safeMargin: 60,
  lockupHeight: 140,
  panelMaxHeightRatio: 0.25,
  sidePanelMaxWidthRatio: 1 / 3,
  minTextSize: 20,
  footer: {
    creditBottom: 32,
    conditionsAboveCredit: 16,
    contactAboveConditions: 12,
    contactHeight: 26,
  },
} as const;

export const TYPE = {
  kicker: { size: 28, weight: 700, ls: '0.16em' },
  headline: { min: 64, max: 84, weight: 800, lh: 1.05 },
  subhead: { size: 44, weight: 600 },
  data: { size: 64, weight: 800 },
  body: { size: 34, weight: 400 },
  cta: { size: 30, weight: 700 },
  contact: { size: 26, weight: 600, ls: '0.02em' },
  fine: { size: 20, weight: 400 },
} as const;

export type Format = 'post' | 'story';
export type TemplateId = 'T0' | 'T1' | 'T2' | 'T2b' | 'T2c' | 'T3' | 'T4';
export type LockupPosition = 'top-right' | 'top-left' | 'bottom-left';
export type LockupTextColor = 'dark' | 'light';

export interface FareRoute {
  city: string;
  code: string;
  price: string;
}

export interface ArtworkContent {
  photoUrl: string | null;
  photoFocusX: number;
  photoFocusY: number;
  lockupPosition: LockupPosition;
  lockupTextColor: LockupTextColor;
  headline: string;
  subhead: string;
  body: string;
  eyebrow: string;
  routeFrom: string;
  routeTo: string;
  tripType: string;
  price: string;
  pillText: string;
  fareHeader: string;
  fareSubheader: string;
  routes: FareRoute[];
  contactPhone: string;
  contactEmail: string;
  contactWebsite: string;
  fareConditionsText: string;
  /** Brand credit line (replaces Bhutan GSA disclaimer). */
  gsaText: string;
  /** Per-section font size (px) and color overrides. */
  textStyles: Partial<Record<TextStyleKey, TextStyleOverride>>;
}

export const TEMPLATE_META: Record<
  TemplateId,
  { label: string; desc: string; needsPhoto: boolean; isPromo: boolean }
> = {
  T0: { label: 'T0 — Photo only', desc: 'Lockup watermark only', needsPhoto: true, isPromo: false },
  T1: { label: 'T1 — Full-bleed photo', desc: 'Network & brand posts', needsPhoto: true, isPromo: false },
  T2: { label: 'T2 — Green promo panel', desc: 'Rate & capacity offers', needsPhoto: true, isPromo: true },
  T2b: { label: 'T2b — Price pill', desc: 'Strong photo, green pill', needsPhoto: true, isPromo: true },
  T2c: { label: 'T2c — Side panel', desc: 'Promo, one-third navy panel', needsPhoto: true, isPromo: true },
  T3: { label: 'T3 — Light card', desc: 'Festivals & announcements', needsPhoto: false, isPromo: false },
  T4: { label: 'T4 — Rate board', desc: 'Multi-lane transit updates', needsPhoto: false, isPromo: true },
};

export interface LayerMeta {
  id: string;
  label: string;
}

export const TEMPLATE_LAYERS: Record<TemplateId, LayerMeta[]> = {
  T0: [
    { id: 'lockup', label: 'Logo' },
    { id: 'photo', label: 'Photo' },
  ],
  T1: [
    { id: 'lockup', label: 'Logo' },
    { id: 'text', label: 'Kicker & headline' },
    { id: 'contact', label: 'Contact strip' },
    { id: 'credit', label: 'Brand credit' },
    { id: 'gradient', label: 'Photo scrim' },
    { id: 'photo', label: 'Photo' },
  ],
  T2: [
    { id: 'lockup', label: 'Logo' },
    { id: 'panel', label: 'Green panel' },
    { id: 'contact', label: 'Contact strip' },
    { id: 'conditions', label: 'Conditions' },
    { id: 'credit', label: 'Brand credit' },
    { id: 'photo', label: 'Photo' },
  ],
  T2b: [
    { id: 'lockup', label: 'Logo' },
    { id: 'pill', label: 'Offer pill' },
    { id: 'contact', label: 'Contact strip' },
    { id: 'conditions', label: 'Conditions' },
    { id: 'credit', label: 'Brand credit' },
    { id: 'gradient', label: 'Photo scrim' },
    { id: 'photo', label: 'Photo' },
  ],
  T2c: [
    { id: 'panelContent', label: 'Panel content' },
    { id: 'contact', label: 'Contact strip' },
    { id: 'conditions', label: 'Conditions' },
    { id: 'credit', label: 'Brand credit' },
    { id: 'photo', label: 'Photo' },
  ],
  T3: [
    { id: 'lockup', label: 'Logo' },
    { id: 'text', label: 'Message text' },
    { id: 'contact', label: 'Contact strip' },
    { id: 'credit', label: 'Brand credit' },
  ],
  T4: [
    { id: 'header', label: 'Header bar' },
    { id: 'routes', label: 'Route list' },
    { id: 'contact', label: 'Contact strip' },
    { id: 'conditions', label: 'Conditions' },
    { id: 'credit', label: 'Brand credit' },
  ],
};

export function defaultContent(template: TemplateId): ArtworkContent {
  const base: ArtworkContent = {
    photoUrl: null,
    photoFocusX: 50,
    photoFocusY: 50,
    lockupPosition: 'top-right',
    lockupTextColor: 'light',
    headline: '',
    subhead: '',
    body: '',
    eyebrow: '',
    routeFrom: 'Bangkok',
    routeTo: 'Frankfurt',
    tripType: 'Guaranteed capacity · GDP compliant',
    price: '48h',
    pillText: '',
    fareHeader: 'This Week · Air Rates',
    fareSubheader: 'Bangkok departures',
    routes: [
      { city: 'Frankfurt', code: 'FRA', price: '48h' },
      { city: 'London', code: 'LHR', price: '52h' },
      { city: 'Los Angeles', code: 'LAX', price: '36h' },
    ],
    contactPhone: FIXED.phone,
    contactEmail: FIXED.email,
    contactWebsite: FIXED.website,
    fareConditionsText: FIXED.fareConditions,
    gsaText: FIXED.credit,
    textStyles: {},
  };

  switch (template) {
    case 'T0':
      return { ...base, lockupTextColor: 'light' };
    case 'T1':
      return {
        ...base,
        lockupTextColor: 'light',
        eyebrow: 'AIR NETWORK',
        headline: 'Bangkok to 200+\ndestinations, daily.',
        subhead: 'GDP-certified air freight · documented end-to-end',
      };
    case 'T2':
      return {
        ...base,
        lockupTextColor: 'dark',
        routeFrom: 'Bangkok',
        routeTo: 'Frankfurt',
      };
    case 'T2b':
      return {
        ...base,
        lockupTextColor: 'light',
        pillText: 'BKK ⇄ FRA · guaranteed capacity, daily uplift',
      };
    case 'T2c':
      return {
        ...base,
        lockupTextColor: 'dark',
      };
    case 'T3':
      return {
        ...base,
        photoUrl: null,
        lockupTextColor: 'dark',
        eyebrow: 'PUBLIC HOLIDAY',
        headline: 'Songkran\noffice hours',
        body: 'Bookings and tracking stay online 24/7.\nDesk support resumes 16 April.',
      };
    case 'T4':
      return { ...base, photoUrl: null };
    default:
      return base;
  }
}

export function formatPrice(price: string) {
  const trimmed = price.trim();
  if (!trimmed) return '';
  if (/h$/i.test(trimmed) || /%/.test(trimmed)) return trimmed;
  const clean = trimmed.replace(/[^\d,]/g, '');
  if (!clean) return trimmed;
  return `฿${clean}${price.includes('*') ? '*' : ''}`;
}

export function assertBrandGeometry() {
  const errs: string[] = [];
  if (GEOMETRY.safeMargin < 60) errs.push('safe margin below 60px');
  if (GEOMETRY.panelMaxHeightRatio > 0.25) errs.push('panel exceeds 25%');
  if (GEOMETRY.sidePanelMaxWidthRatio > 1 / 3) errs.push('side panel exceeds 1/3 width');
  if (TYPE.fine.size < GEOMETRY.minTextSize) errs.push('fine text below 20px');
  if (TYPE.contact.size < GEOMETRY.minTextSize) errs.push('contact text below 20px');
  const panelH = CANVAS.post.h * GEOMETRY.panelMaxHeightRatio;
  if (panelH > CANVAS.post.h * 0.25) errs.push('T2 panel height invalid');
  const sideW = CANVAS.post.w * GEOMETRY.sidePanelMaxWidthRatio;
  if (sideW > CANVAS.post.w / 3) errs.push('T2c panel width invalid');
  if (errs.length) throw new Error(errs.join('; '));
  return true;
}

if (process.env.NODE_ENV === 'development') {
  assertBrandGeometry();
}
