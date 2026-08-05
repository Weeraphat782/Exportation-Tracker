#!/usr/bin/env node
/** Self-check: client-side pagination slice + clamp logic. */
import assert from 'node:assert/strict';

/** ponytail: mirror of use-pagination.ts — plain JS for node test */
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
const DEFAULT_PAGE_SIZE = 5;

function paginate(items, page, pageSize) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
    rangeStart: total === 0 ? 0 : start + 1,
    rangeEnd: Math.min(safePage * pageSize, total),
  };
}

function validatePageSize(n) {
  return PAGE_SIZE_OPTIONS.includes(n) ? n : DEFAULT_PAGE_SIZE;
}

function run() {
  // empty list
  const empty = paginate([], 1, 5);
  assert.equal(empty.items.length, 0);
  assert.equal(empty.totalPages, 1);
  assert.equal(empty.rangeStart, 0);
  assert.equal(empty.rangeEnd, 0);

  // exact page boundary
  const items = Array.from({ length: 10 }, (_, i) => i + 1);
  const p1 = paginate(items, 1, 5);
  assert.deepEqual(p1.items, [1, 2, 3, 4, 5]);
  assert.equal(p1.totalPages, 2);
  assert.equal(p1.rangeEnd, 5);

  const p2 = paginate(items, 2, 5);
  assert.deepEqual(p2.items, [6, 7, 8, 9, 10]);
  assert.equal(p2.rangeEnd, 10);

  // uneven last page
  const odd = Array.from({ length: 12 }, (_, i) => i);
  const last = paginate(odd, 3, 5);
  assert.deepEqual(last.items, [10, 11]);
  assert.equal(last.totalPages, 3);
  assert.equal(last.rangeStart, 11);
  assert.equal(last.rangeEnd, 12);

  // page beyond total after filter shrink — clamp
  const clamped = paginate([1, 2, 3], 5, 5);
  assert.equal(clamped.page, 1);
  assert.deepEqual(clamped.items, [1, 2, 3]);

  // pageSize options validation
  assert.equal(validatePageSize(50), 50);
  assert.equal(validatePageSize(99), DEFAULT_PAGE_SIZE);
  assert.equal(validatePageSize(15), DEFAULT_PAGE_SIZE);

  console.log('pagination.test.mjs: all checks passed');
}

run();
