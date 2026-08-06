#!/usr/bin/env node
/** Send one test email via Resend — verifies API key, domain, and recipient. */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resend } from 'resend';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM_EMAIL?.trim() || 'OMG Cargo <noreply@omgcargo.tech>';
const to = (process.env.CONTACT_NOTIFY_EMAIL || 'cargo@omgexp.com')
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean);

if (!apiKey) {
  console.error('RESEND_API_KEY missing — set in .env.local or shell');
  process.exit(1);
}

const resend = new Resend(apiKey);
const { data, error } = await resend.emails.send({
  from,
  to,
  subject: 'Resend test — OMG Cargo',
  html: '<p>Test email from <code>scripts/send-test-email.mjs</code>. If you see this, Resend is configured.</p>',
  text: 'Test email from scripts/send-test-email.mjs. If you see this, Resend is configured.',
});

if (error) {
  console.error('Resend error:', error);
  process.exit(1);
}

console.log('Sent OK — id:', data?.id, '| from:', from, '| to:', to.join(', '));
