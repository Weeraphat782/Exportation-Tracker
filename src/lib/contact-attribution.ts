const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
] as const;

const CLICK_KEYS = [
  'gclid',
  'gbraid',
  'wbraid',
  'fbclid',
  'msclkid',
  'ttclid',
  'li_fat_id',
] as const;

const TOUCH_KEYS = [...UTM_KEYS, ...CLICK_KEYS, 'referrer_host', 'landing_path', 'captured_at'] as const;

type TouchRecord = Partial<Record<(typeof TOUCH_KEYS)[number], string>>;

export type StoredAttribution = {
  first_touch?: TouchRecord;
  last_touch?: TouchRecord;
};

function sanitizeTouch(raw: unknown): TouchRecord | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const src = raw as Record<string, unknown>;
  const out: TouchRecord = {};
  for (const key of TOUCH_KEYS) {
    const v = src[key];
    if (typeof v === 'string' && v.trim()) out[key] = v.trim().slice(0, 500);
  }
  return Object.keys(out).length ? out : undefined;
}

/** Allow-list client attribution — never spread arbitrary objects into the DB. */
export function parseAttribution(raw: unknown): StoredAttribution | null {
  if (!raw || typeof raw !== 'object') return null;
  const src = raw as Record<string, unknown>;
  const first = sanitizeTouch(src.first_touch);
  const last = sanitizeTouch(src.last_touch);
  if (!first && !last) return null;
  return { ...(first ? { first_touch: first } : {}), ...(last ? { last_touch: last } : {}) };
}

export function formatAttributionLine(attribution: StoredAttribution | null): string {
  const touch = attribution?.last_touch || attribution?.first_touch;
  if (!touch) return '';
  const parts: string[] = [];
  if (touch.utm_source) parts.push(`source=${touch.utm_source}`);
  if (touch.utm_medium) parts.push(`medium=${touch.utm_medium}`);
  if (touch.utm_campaign) parts.push(`campaign=${touch.utm_campaign}`);
  if (touch.gclid) parts.push('gclid=…');
  if (touch.referrer_host) parts.push(`referrer=${touch.referrer_host}`);
  if (touch.landing_path) parts.push(`landing=${touch.landing_path}`);
  return parts.length ? `\n📊 Attribution: ${parts.join(' · ')}` : '';
}
