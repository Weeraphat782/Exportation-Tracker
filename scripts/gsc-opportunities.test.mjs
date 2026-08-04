#!/usr/bin/env node
/** Self-check: GSC SEO opportunity ranking logic. */
import assert from 'node:assert/strict';

/** ponytail: mirror of gsc-opportunities.ts — avoids loading google-auth in node test */
const STRIKING_MIN_IMPRESSIONS = 10;
const STRIKING_MIN_POSITION = 5;
const STRIKING_MAX_POSITION = 20;

function buildStrikingDistanceQueries(queries, limit = 8) {
  return queries
    .filter(
      (row) =>
        row.impressions >= STRIKING_MIN_IMPRESSIONS &&
        row.position >= STRIKING_MIN_POSITION &&
        row.position <= STRIKING_MAX_POSITION
    )
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit);
}

function buildLowCtrPages(pages, siteCtr, limit = 8) {
  return pages
    .filter((row) => row.impressions > 0 && row.ctr < siteCtr)
    .map((row) => ({
      ...row,
      missedClicks: row.impressions * (siteCtr - row.ctr),
    }))
    .sort((a, b) => b.missedClicks - a.missedClicks)
    .slice(0, limit);
}

function buildZeroClickQueries(queries, limit = 8) {
  return queries
    .filter((row) => row.impressions > 0 && row.clicks === 0)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit);
}

function run() {
  const striking = buildStrikingDistanceQueries([
    { query: 'top', impressions: 100, position: 2, clicks: 10 },
    { query: 'good', impressions: 500, position: 8, clicks: 5 },
    { query: 'tail', impressions: 50, position: 25, clicks: 1 },
    { query: 'low imp', impressions: 5, position: 10, clicks: 0 },
  ]);
  assert.equal(striking.length, 1, 'only position 5-20 with enough impressions');
  assert.equal(striking[0].query, 'good');

  const lowCtr = buildLowCtrPages(
    [
      { page: '/a', impressions: 3, ctr: 0, clicks: 0 },
      { page: '/b', impressions: 2000, ctr: 0.01, clicks: 20 },
    ],
    0.03
  );
  assert.equal(lowCtr.length, 2);
  assert.equal(lowCtr[0].page, '/b', 'high-impression low-CTR page ranks first');
  assert.ok(lowCtr[0].missedClicks > lowCtr[1].missedClicks, 'missed clicks ordering');

  const zeroClick = buildZeroClickQueries([
    { query: 'clicked', impressions: 100, clicks: 2, position: 5 },
    { query: 'ghost', impressions: 300, clicks: 0, position: 12 },
  ]);
  assert.equal(zeroClick.length, 1);
  assert.equal(zeroClick[0].query, 'ghost');

  console.log('OK: GSC opportunity filters (striking, low CTR, zero-click)');
}

run();
