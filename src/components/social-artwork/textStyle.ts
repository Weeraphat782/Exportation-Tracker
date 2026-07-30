import type { ArtworkContent } from './brand';

export type TextStyleKey =
  | 'eyebrow'
  | 'headline'
  | 'subhead'
  | 'body'
  | 'route'
  | 'tripType'
  | 'price'
  | 'pill'
  | 'fareHeader'
  | 'fareSubheader'
  | 'routeCity'
  | 'routeValue'
  | 'contact'
  | 'conditions'
  | 'credit';

export interface TextStyleOverride {
  size?: number;
  color?: string;
}

/** Merge per-section font overrides onto template defaults. */
export function ts(
  content: ArtworkContent,
  key: TextStyleKey,
  defaults: { size: number; color: string },
): { fontSize: number; color: string } {
  const o = content.textStyles?.[key];
  return {
    fontSize: o?.size ?? defaults.size,
    color: o?.color ?? defaults.color,
  };
}

export const TEXT_STYLE_DEFAULTS: Record<TextStyleKey, { label: string; size: number; color: string }> = {
  eyebrow: { label: 'Kicker / tag', size: 28, color: '#6FBE44' },
  headline: { label: 'Headline', size: 84, color: '#FFFFFF' },
  subhead: { label: 'Support line', size: 34, color: 'rgba(255,255,255,.9)' },
  body: { label: 'Body', size: 34, color: '#16191c' },
  route: { label: 'Route', size: 48, color: '#0d2c4d' },
  tripType: { label: 'Offer detail', size: 26, color: 'rgba(22,25,28,.6)' },
  price: { label: 'Highlight value', size: 64, color: '#0d2c4d' },
  pill: { label: 'Price pill', size: 34, color: '#0d2c4d' },
  fareHeader: { label: 'Header title', size: 26, color: '#FFFFFF' },
  fareSubheader: { label: 'Header subtitle', size: 26, color: '#FFFFFF' },
  routeCity: { label: 'Route city', size: 52, color: '#FFFFFF' },
  routeValue: { label: 'Route value', size: 64, color: '#6FBE44' },
  contact: { label: 'Contact strip', size: 26, color: '#FFFFFF' },
  conditions: { label: 'Conditions', size: 20, color: 'rgba(255,255,255,.6)' },
  credit: { label: 'Brand credit', size: 20, color: 'rgba(255,255,255,.6)' },
};
