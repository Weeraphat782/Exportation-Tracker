#!/usr/bin/env node
/** Self-check: GA4 relative date ranges + Search Console absolute ranges. */
import assert from 'node:assert/strict';
import {
  parseGaRange,
  previousGaRange,
  absoluteGaRange,
  previousAbsoluteRange,
  gscLagDays,
} from '../src/lib/ga-range.ts';

/** ponytail: mirror of ga-data buildChannelPerformance — avoids loading GA client in node test */
function buildChannelPerformance(sources, leadBySource, limit = 10) {
  const sessionMap = new Map(sources.map((s) => [s.sourceMedium, s.sessions]));
  const leadMap = new Map(leadBySource.map((l) => [l.sourceMedium, l.count]));
  const keys = new Set([...sessionMap.keys(), ...leadMap.keys()]);
  return [...keys]
    .map((sourceMedium) => {
      const sessions = sessionMap.get(sourceMedium) ?? 0;
      const leads = leadMap.get(sourceMedium) ?? 0;
      return {
        sourceMedium,
        sessions,
        leads,
        conversionRate: sessions > 0 ? (leads / sessions) * 100 : 0,
      };
    })
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, limit);
}

function run() {
  for (const [param, days] of [
    ['7d', 7],
    ['28d', 28],
    ['90d', 90],
    [null, 28],
  ]) {
    const current = parseGaRange(param);
    assert.equal(current.days, days, `${param ?? 'default'} days`);
    assert.equal(current.endDate, 'yesterday', `${param ?? 'default'} endDate`);
    assert.equal(current.startDate, `${days}daysAgo`, `${param ?? 'default'} startDate`);

    const prev = previousGaRange(current);
    assert.equal(prev.endDate, `${days + 1}daysAgo`, `${param ?? 'default'} prev end`);
    assert.equal(prev.startDate, `${days * 2}daysAgo`, `${param ?? 'default'} prev start`);
    assert.notEqual(prev.endDate, current.startDate, `${param ?? 'default'} no overlap`);
  }

  console.log('OK: parseGaRange + previousGaRange (4 cases)');

  const lag = gscLagDays();
  assert.ok(lag >= 0, 'gscLagDays non-negative');

  const abs = absoluteGaRange(28, lag);
  assert.match(abs.startDate, /^\d{4}-\d{2}-\d{2}$/, 'startDate format');
  assert.match(abs.endDate, /^\d{4}-\d{2}-\d{2}$/, 'endDate format');
  assert.equal(abs.days, 28, 'absolute days');
  assert.ok(abs.startDate <= abs.endDate, 'start before end');

  const today = new Date().toISOString().slice(0, 10);
  assert.ok(abs.endDate <= today, 'end not in future');

  const prevAbs = previousAbsoluteRange(abs);
  assert.ok(prevAbs.endDate < abs.startDate, 'previous absolute no overlap');
  assert.equal(prevAbs.days, abs.days, 'previous same length');

  console.log('OK: absoluteGaRange + previousAbsoluteRange');

  const merged = buildChannelPerformance(
    [
      { sourceMedium: 'google / organic', sessions: 100 },
      { sourceMedium: '(direct) / (none)', sessions: 50 },
    ],
    [
      { sourceMedium: 'google / organic', count: 2 },
      { sourceMedium: 'newsletter / email', count: 1 },
    ]
  );
  assert.equal(merged.length, 3, 'includes lead-only source');
  const organic = merged.find((r) => r.sourceMedium === 'google / organic');
  assert.ok(organic, 'organic row exists');
  assert.equal(organic.conversionRate, 2, 'CVR = leads/sessions * 100');
  const emailOnly = merged.find((r) => r.sourceMedium === 'newsletter / email');
  assert.ok(emailOnly, 'lead-only row exists');
  assert.equal(emailOnly.sessions, 0, 'lead-only sessions default 0');
  assert.equal(emailOnly.conversionRate, 0, 'zero sessions => 0 CVR not NaN');
  assert.equal(merged[0].sourceMedium, 'google / organic', 'sorted by sessions desc');

  console.log('OK: buildChannelPerformance (3 sources, CVR, sort)');
}

run();
