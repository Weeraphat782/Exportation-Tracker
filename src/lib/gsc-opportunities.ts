import type { GscPageRow, GscQueryRow } from './gsc-data';

export interface GscStrikingQuery {
  query: string;
  impressions: number;
  position: number;
  clicks: number;
}

export interface GscLowCtrPage {
  page: string;
  impressions: number;
  ctr: number;
  missedClicks: number;
  clicks: number;
}

export interface GscZeroClickQuery {
  query: string;
  impressions: number;
  position: number;
}

export interface GscOpportunities {
  strikingDistance: GscStrikingQuery[];
  lowCtrPages: GscLowCtrPage[];
  zeroClickQueries: GscZeroClickQuery[];
}

const STRIKING_MIN_IMPRESSIONS = 10;
const STRIKING_MIN_POSITION = 5;
const STRIKING_MAX_POSITION = 20;
const DEFAULT_LIMIT = 8;

export function buildStrikingDistanceQueries(
  queries: GscQueryRow[],
  limit = DEFAULT_LIMIT
): GscStrikingQuery[] {
  return queries
    .filter(
      (row) =>
        row.impressions >= STRIKING_MIN_IMPRESSIONS &&
        row.position >= STRIKING_MIN_POSITION &&
        row.position <= STRIKING_MAX_POSITION
    )
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit)
    .map((row) => ({
      query: row.query,
      impressions: row.impressions,
      position: row.position,
      clicks: row.clicks,
    }));
}

export function buildLowCtrPages(
  pages: GscPageRow[],
  siteCtr: number,
  limit = DEFAULT_LIMIT
): GscLowCtrPage[] {
  return pages
    .filter((row) => row.impressions > 0 && row.ctr < siteCtr)
    .map((row) => ({
      page: row.page,
      impressions: row.impressions,
      ctr: row.ctr,
      missedClicks: row.impressions * (siteCtr - row.ctr),
      clicks: row.clicks,
    }))
    .sort((a, b) => b.missedClicks - a.missedClicks)
    .slice(0, limit);
}

export function buildZeroClickQueries(
  queries: GscQueryRow[],
  limit = DEFAULT_LIMIT
): GscZeroClickQuery[] {
  return queries
    .filter((row) => row.impressions > 0 && row.clicks === 0)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit)
    .map((row) => ({
      query: row.query,
      impressions: row.impressions,
      position: row.position,
    }));
}

export function buildGscOpportunities(
  queries: GscQueryRow[],
  pages: GscPageRow[],
  siteCtr: number,
  limit = DEFAULT_LIMIT
): GscOpportunities {
  return {
    strikingDistance: buildStrikingDistanceQueries(queries, limit),
    lowCtrPages: buildLowCtrPages(pages, siteCtr, limit),
    zeroClickQueries: buildZeroClickQueries(queries, limit),
  };
}
