require('ts-node/register/transpile-only');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { parseTrackingHtml, validateAwb } = require('../src/lib/thai-cargo-tracking');

const fixture = readFileSync(join(__dirname, 'fixtures/thai-cargo-tracking-sample.html'), 'utf8');

assert.equal(validateAwb('217', '10000001'), null);
assert.match(validateAwb('217', '10000002'), /check digit/i);

const parsed = parseTrackingHtml(fixture, '217-10000001');
assert.equal(parsed.found, true);
assert.equal(parsed.awb, '217-10000001');
assert.equal(parsed.origin, 'FRA');
assert.equal(parsed.destination, 'MEL');
assert.equal(parsed.status, 'Delivered');
assert.equal(parsed.flight, 'TG0461');
assert.equal(parsed.pieces, '7');
assert.equal(parsed.events.length, 2);
assert.equal(parsed.events[0].station, 'MEL');
assert.equal(parsed.events[1].flight, 'TG0461');

console.log('thai-cargo-tracking parser check passed');
