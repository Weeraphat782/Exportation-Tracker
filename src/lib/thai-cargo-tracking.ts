import * as cheerio from 'cheerio';

const SKYCHAIN_BASE = 'https://chorus.thaicargo.com';
const TRACK_PAGE_URL = `${SKYCHAIN_BASE}/skychain/app?service=page/nwp:Trackshipmt`;
const SUBMIT_URL = `${SKYCHAIN_BASE}/skychain/app`;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const FETCH_TIMEOUT_MS = 20_000;
const CACHE_TTL_MS = 5 * 60 * 1000;

export interface AwbTrackingEvent {
  station: string;
  date: string;
  time: string;
  status: string;
  flightDetails: string;
  flight: string | null;
  pieces: string;
  weight: string;
}

export interface AwbTrackingResult {
  awb: string;
  status: string;
  origin: string;
  destination: string;
  flight: string;
  lastUpdate: string;
  pieces: string;
  weight: string;
  volume: string;
  natureOfGoods: string;
  product: string;
  shcCode: string;
  events: AwbTrackingEvent[];
  found: boolean;
}

interface CacheEntry {
  expiresAt: number;
  data: AwbTrackingResult;
}

// ponytail: in-memory cache; multi-instance won't share — upgrade to Redis/Supabase later
const cache = new Map<string, CacheEntry>();

export function validateAwb(prefix: string, number: string): string | null {
  if (!/^\d{3}$/.test(prefix)) return 'AWB prefix must be 3 digits.';
  if (!/^\d{8}$/.test(number)) return 'AWB number must be 8 digits.';
  const serial = number.slice(0, 7);
  const checkDigit = Number(number[7]);
  if (Number(serial) % 7 !== checkDigit) return 'Invalid AWB check digit.';
  return null;
}

function formatAwb(prefix: string, number: string): string {
  return `${prefix}-${number}`;
}

function extractFlight(flightDetails: string): string | null {
  const m = flightDetails.match(/\b([A-Z]{2}\d{3,4})\b/);
  return m ? m[1] : null;
}

function parseStatusDate(raw: string): { date: string; time: string } {
  const m = raw.match(/^(\d{1,2}\s+[A-Z]{3}\s+\d{4})\s+(\d{2}:\d{2})/);
  if (m) return { date: m[1], time: m[2] };
  return { date: raw.trim(), time: '' };
}

function collectCookies(response: Response): string {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  const setCookies =
    typeof headers.getSetCookie === 'function'
      ? headers.getSetCookie()
      : (() => {
          const raw = response.headers.get('set-cookie');
          return raw ? [raw] : [];
        })();
  return setCookies.map((c) => c.split(';')[0]).filter(Boolean).join('; ');
}

function mergeCookies(existing: string, incoming: string): string {
  const jar = new Map<string, string>();
  for (const part of `${existing}; ${incoming}`.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    jar.set(trimmed.slice(0, eq), trimmed);
  }
  return Array.from(jar.values()).join('; ');
}

function buildPostBody(formHtml: string, prefix: string, number: string): URLSearchParams {
  const $ = cheerio.load(formHtml);
  const form = $('form[name="Form1"]');
  if (!form.length) throw new Error('Tracking form not found on SkyChain page.');

  const params = new URLSearchParams();
  form.find('input, select, textarea').each((_, el) => {
    const tag = el.tagName.toLowerCase();
    const name = $(el).attr('name');
    if (!name || tag === 'button') return;
    const type = ($(el).attr('type') || '').toLowerCase();
    if (type === 'submit' || type === 'reset' || type === 'button') return;
    if (type === 'radio' || type === 'checkbox') {
      if (!$(el).is(':checked')) return;
    }
    params.append(name, $(el).val()?.toString() ?? '');
  });

  params.set('selectDoctype', 'AWB');
  params.set('txtPrefix', prefix);
  params.set('txtNumber', number);
  params.set('txtAWBPrefix', prefix);
  params.set('txtAWBNumber', number);
  params.set('trackViewHdn', 'tableRadio');
  params.set('trackView', 'tableRadio');
  params.set('$JSubmit$0', 'Track');
  params.delete('$JSubmit$2');
  return params;
}

export function parseTrackingHtml(html: string, awb: string): AwbTrackingResult {
  const $ = cheerio.load(html);
  const empty: AwbTrackingResult = {
    awb,
    status: '',
    origin: '',
    destination: '',
    flight: '',
    lastUpdate: '',
    pieces: '',
    weight: '',
    volume: '',
    natureOfGoods: '',
    product: '',
    shcCode: '',
    events: [],
    found: false,
  };

  const tables = $('table.grdTable');
  if (!tables.length) return empty;

  let summaryRow: string[] = [];
  tables.each((_, table) => {
    const headers = $(table)
      .find('tr')
      .first()
      .find('th, td')
      .map((__, cell) => $(cell).text().replace(/\s+/g, ' ').trim())
      .get();
    if (headers.includes('Document No.') && !summaryRow.length) {
      const dataCells = $(table).find('td.grdRowData');
      if (dataCells.length >= 5) {
        summaryRow = dataCells.map((__, cell) => $(cell).text().replace(/\s+/g, ' ').trim()).get();
      }
    }
  });

  const events: AwbTrackingEvent[] = [];
  tables.each((_, table) => {
    const headers = $(table)
      .find('tr')
      .first()
      .find('th, td')
      .map((__, cell) => $(cell).text().replace(/\s+/g, ' ').trim())
      .get();
    if (!headers.includes('Station') || !headers.includes('Status')) return;

    $(table)
      .find('tr')
      .slice(1)
      .each((__, row) => {
        const cells = $(row)
          .find('td')
          .map((___, cell) => $(cell).text().replace(/\s+/g, ' ').trim())
          .get()
          .filter((c) => c.length > 0);
        if (cells.length < 4) return;
        const { date, time } = parseStatusDate(cells[1] || '');
        const flightDetails = cells[3] || '';
        events.push({
          station: cells[0] || '',
          date,
          time,
          status: cells[2] || '',
          flightDetails,
          flight: extractFlight(flightDetails),
          pieces: cells[4] || '',
          weight: cells[5] || '',
        });
      });
  });

  if (!summaryRow.length && !events.length) return empty;

  const latest = events[0];
  const primaryFlight =
    events.find((e) => e.flight)?.flight ||
    extractFlight(events.map((e) => e.flightDetails).join(' ')) ||
    '';

  return {
    awb: summaryRow[0] || awb,
    origin: summaryRow[1] || '',
    destination: summaryRow[2] || '',
    pieces: summaryRow[3] || latest?.pieces || '',
    weight: summaryRow[4] || latest?.weight || '',
    volume: summaryRow[5] || '',
    natureOfGoods: summaryRow[6] || '',
    product: summaryRow[7] || '',
    shcCode: summaryRow[8] || '',
    status: latest?.status || '',
    flight: primaryFlight,
    lastUpdate: latest ? `${latest.date}${latest.time ? ` ${latest.time}` : ''}`.trim() : '',
    events,
    found: summaryRow.length > 0 || events.length > 0,
  };
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchAwbTracking(prefix: string, number: string): Promise<AwbTrackingResult> {
  const awb = formatAwb(prefix, number);
  const cached = cache.get(awb);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const getRes = await fetchWithTimeout(TRACK_PAGE_URL, {
    method: 'GET',
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
  });
  if (!getRes.ok) throw new Error(`SkyChain track page returned ${getRes.status}.`);

  let cookies = collectCookies(getRes);
  const pageHtml = await getRes.text();
  const params = buildPostBody(pageHtml, prefix, number);

  const postRes = await fetchWithTimeout(SUBMIT_URL, {
    method: 'POST',
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html',
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: cookies,
      Origin: SKYCHAIN_BASE,
      Referer: TRACK_PAGE_URL,
    },
    body: params.toString(),
  });
  if (!postRes.ok) throw new Error(`SkyChain tracking submit returned ${postRes.status}.`);

  cookies = mergeCookies(cookies, collectCookies(postRes));
  const resultHtml = await postRes.text();
  const result = parseTrackingHtml(resultHtml, awb);

  cache.set(awb, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}

/** ponytail: for tests only */
export function __clearTrackingCacheForTests(): void {
  cache.clear();
}
