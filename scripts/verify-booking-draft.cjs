/** Self-contained booking email draft check (no TS/@ path imports). */
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const fixture = JSON.parse(
  readFileSync(join(__dirname, 'fixtures/booking-quotation-fixture.json'), 'utf8')
);

function deriveShipperShort(companyName) {
  if (!companyName) return '';
  let name = companyName.trim();
  for (const suffix of [/\s*co\.?,?\s*ltd\.?$/i, /\s*ltd\.?$/i, /\s*limited$/i]) {
    name = name.replace(suffix, '');
  }
  return name.trim().toUpperCase();
}

function generateEmailSubject(data) {
  let subject = `Booking Request - ${data.product || 'Shipment'} to ${data.destination || 'International'}`;
  if (data.shipperShort) subject += ` - ${data.shipperShort}`;
  if (data.quotationNo) subject += ` - ${data.quotationNo}`;
  return subject;
}

function formatBookingEmail(data) {
  const documentListBlock = data.documentListUrl
    ? `\nDocument List : ${data.documentListUrl}\n`
    : '\n';
  return `Dear Khun ${data.recipientName || '[Recipient Name]'}, 

I would like to book the following shipment:

Product: ${data.product || '[Product Name]'}
Destination: ${data.destination || '[Destination]'}
Net Weight: ${data.netWeight ? `${data.netWeight} KG` : '[Weight] KG'}
Airline: ${data.airline || '[Airline]'}
Pick-up from ${data.pickupLocation || 'BKK (location and date TBC)'}
Prefer shipment date: ${data.preferredShipmentDate || '[Date]'}

Please see attached all documents krub.

MAWB: ${data.mawb || 'TBC'}
DESCRIPTION OF CONTENTS, INCLUDING MODEL/MANUFACTURER: ${data.product || 'Dried Cannabis Flower'}
WEIGHT: ${data.netWeight ? `${data.netWeight} KG` : '[Weight] KG'}
NUMBER OF PIECE: ${data.numberOfPieces || '[Number] Pallets'}
PALLET DIMENSION: ${data.palletDimensions || '[Length] × [Width] × [Height] cm'}
ORIGIN: ${data.origin || 'BKK'}
DESTINATION: ${data.destination || '[Destination]'}
SHIPPER: ${data.shipper || '[Shipper Company]'}
CONSIGNEE: ${data.consignee || '[Consignee Company]'}
ROUTING: ${data.routing || '[Origin Code]- [Destination Code]'}
${documentListBlock}
Best Regards,
${data.senderName || 'Weeraphat'}`;
}

function assembleBookingDraft(quotation, emailData, recipients) {
  const merged = {
    ...emailData,
    recipientName: emailData.recipientName || recipients.recipientName,
    senderName: emailData.senderName || recipients.senderName,
  };
  return {
    subject: generateEmailSubject(merged),
    body: formatBookingEmail(merged),
    to: recipients.to,
    cc: recipients.cc,
    from: recipients.from,
  };
}

function airportCodeFromPort(port) {
  if (!port) return '';
  const t = port.trim();
  const paren = t.match(/\(([A-Za-z]{3})\)/);
  if (paren) return paren[1].toUpperCase();
  if (/^[A-Za-z]{3}$/.test(t)) return t.toUpperCase();
  return t;
}

function buildRouting(originCode, port) {
  const dest = airportCodeFromPort(port);
  return dest ? `${(originCode || 'BKK').trim()}-${dest}` : '';
}

const recipients = {
  to: 'montri@handleinterfreight.com',
  cc: [
    'consol_ap@handleinterfreight.com',
    'consol_ap2@handleinterfreight.com',
    'airport2@handleinterfreight.com',
    'shivek@omgexp.com',
    'Md@handleinterfreight.com',
    'airport@handleinterfreight.com',
  ],
  from: 'cargo@omgexp.com',
  recipientName: 'Montri',
  senderName: 'Weeraphat',
};

let weight = 0;
let pieces = 0;
for (const p of fixture.pallets) {
  pieces += Number(p.quantity) || 1;
  weight += (Number(p.weight) || 0) * (Number(p.quantity) || 1);
}

const emailData = {
  product: 'Dried Cannabis Flower',
  destination: fixture.destination,
  netWeight: weight,
  airline: 'TG',
  pickupLocation: 'BKK (location and date TBC)',
  preferredShipmentDate: '2026-09-15',
  mawb: 'TBC',
  numberOfPieces: `${pieces} Pallets`,
  palletDimensions: '120 × 100 × 160 cm',
  origin: 'BKK',
  shipper: fixture.company_name,
  consignee: fixture.consignee_name,
  routing: 'BKK-ZRH',
  quotationNo: fixture.quotation_no,
  shipperShort: deriveShipperShort(fixture.company_name),
  documentListUrl: 'https://cargo.omgexp.com/booking/f47ac10b-58cc-4372-a567-0e02b2c3d479',
  recipientName: recipients.recipientName,
  senderName: recipients.senderName,
};

const draft = assembleBookingDraft(fixture, emailData, recipients);

assert.match(draft.subject, /Booking Request - Dried Cannabis Flower to Munich, Germany/);
assert.match(draft.subject, /PACCAN GROW/);
assert.match(draft.subject, /OMG06017/);
assert.match(draft.body, /Dear Khun Montri/);
assert.match(draft.body, /Net Weight: 943 KG/);
assert.match(draft.body, /Airline: TG/);
assert.match(draft.body, /SHIPPER: PACCAN GROW Co., Ltd./);
assert.match(draft.body, /CONSIGNEE: CZW PHARMA GmbH/);
assert.match(draft.body, /ROUTING: BKK-ZRH/);
assert.match(draft.body, /Document List : https:\/\/cargo\.omgexp\.com\/booking\//);
assert.match(draft.body, /Best Regards,\nWeeraphat/);
assert.equal(draft.to, 'montri@handleinterfreight.com');
assert.ok(draft.cc.includes('consol_ap@handleinterfreight.com'));
assert.equal(draft.from, 'cargo@omgexp.com');

// ponytail: chargeable weight must never appear as net when pallets sum to 0
const zeroPalletBody = formatBookingEmail({
  product: 'Dried Cannabis Flower',
  destination: 'Zurich, ZRH',
  netWeight: undefined,
  airline: 'TG',
  origin: 'BKK',
  routing: buildRouting('BKK', 'ZRH'),
});
assert.match(zeroPalletBody, /\[Weight\] KG/);
assert.doesNotMatch(zeroPalletBody, /629/);

// Grok override: CI net weight + explicit routing
const overrideBody = formatBookingEmail({
  product: 'Dried Cannabis Flower',
  destination: 'Zurich, ZRH',
  netWeight: 341.6,
  airline: 'TG',
  origin: 'BKK',
  routing: 'BKK-ZRH',
});
assert.match(overrideBody, /341\.6 KG/);
assert.match(overrideBody, /ROUTING: BKK-ZRH/);

assert.equal(buildRouting('BKK', 'ZRH'), 'BKK-ZRH');
assert.equal(airportCodeFromPort('Zurich (ZRH)'), 'ZRH');
assert.equal(airportCodeFromPort(''), '');

console.log('booking draft check passed');
