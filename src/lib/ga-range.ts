export interface GaDateRange {
  startDate: string;
  endDate: string;
  /** Window length — used for previous-period relative dates. */
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
