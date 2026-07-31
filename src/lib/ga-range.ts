export interface GaDateRange {
  startDate: string;
  endDate: string;
  /** Window length — used for previous-period relative dates. */
  days: number;
}

export interface AbsoluteDateRange {
  startDate: string;
  endDate: string;
  days: number;
}

/** GA4 relative dates — interpreted in the property timezone (not UTC). */
export function parseGaRange(rangeParam: string | null): GaDateRange {
  const days = rangeParam === '7d' ? 7 : rangeParam === '90d' ? 90 : 28;
  return {
    startDate: `${days}daysAgo`,
    endDate: 'yesterday',
    days,
  };
}

/** Previous period of equal length, ending the day before current start. */
export function previousGaRange(range: GaDateRange): GaDateRange {
  const { days } = range;
  return {
    startDate: `${days * 2}daysAgo`,
    endDate: `${days + 1}daysAgo`,
    days,
  };
}

/** Search Console processing lag in days (default 3). */
export function gscLagDays(): number {
  const n = Number(process.env.GSC_LAG_DAYS?.trim());
  return Number.isFinite(n) && n >= 0 ? n : 3;
}

function fmtUtc(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Absolute YYYY-MM-DD window for Search Console (end = today − lag). */
export function absoluteGaRange(days: number, lagDays = gscLagDays()): AbsoluteDateRange {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - lagDays);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return { startDate: fmtUtc(start), endDate: fmtUtc(end), days };
}

/** Previous equal-length window ending the day before range.startDate. */
export function previousAbsoluteRange(range: AbsoluteDateRange): AbsoluteDateRange {
  const end = new Date(`${range.startDate}T00:00:00.000Z`);
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (range.days - 1));
  return { startDate: fmtUtc(start), endDate: fmtUtc(end), days: range.days };
}
