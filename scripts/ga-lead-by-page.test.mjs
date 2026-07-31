#!/usr/bin/env node
/** Live check: pagePath + generate_lead query must not INVALID_ARGUMENT. */
import assert from 'node:assert/strict';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

function normalizeKey(raw) {
  let key = raw.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\r/g, '').replace(/\\n/g, '\n').replace(/\r/g, '').trim() + '\n';
}

const propertyId = process.env.GA4_PROPERTY_ID?.trim();
const email = process.env.GA_SERVICE_ACCOUNT_EMAIL?.trim();
const keyRaw = process.env.GA_SERVICE_ACCOUNT_PRIVATE_KEY?.trim();
const host = process.env.MARKETING_GA_HOSTNAME?.trim() || 'www.omgcargo.tech';
const prefix = process.env.GA_PUBLIC_PATH_PREFIX?.trim() || '/site';

if (!propertyId || !email || !keyRaw) {
  console.log('SKIP: GA env not set');
  process.exit(0);
}

const client = new BetaAnalyticsDataClient({
  credentials: { client_email: email, private_key: normalizeKey(keyRaw) },
});

const siteFilter = {
  orGroup: {
    expressions: [
      { filter: { fieldName: 'hostName', stringFilter: { matchType: 'EXACT', value: host } } },
      {
        filter: {
          fieldName: 'pagePath',
          stringFilter: { matchType: 'BEGINS_WITH', value: prefix },
        },
      },
    ],
  },
};

const eventFilter = {
  filter: {
    fieldName: 'eventName',
    stringFilter: { matchType: 'EXACT', value: 'generate_lead' },
  },
};

try {
  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: '28daysAgo', endDate: 'yesterday' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: { andGroup: { expressions: [siteFilter, eventFilter] } },
    limit: 5,
  });
  assert.ok(Array.isArray(response.rows), 'rows array');
  console.log('OK: lead breakdown by pagePath query', response.rows?.length ?? 0, 'rows');
} catch (err) {
  console.error('FAIL:', err.message || err);
  process.exit(1);
}
