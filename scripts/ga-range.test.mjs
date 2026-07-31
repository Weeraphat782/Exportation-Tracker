#!/usr/bin/env node
/** Self-check: GA4 relative date ranges for analytics dashboard. */
import assert from 'node:assert/strict';
import { parseGaRange, previousGaRange } from '../src/lib/ga-range.ts';

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
}

run();
