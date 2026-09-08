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

function piecesLabel(pieces, packagingType = 'pallet') {
  if (pieces <= 0) return '';
  const label =
    packagingType === 'box' ? 'Boxes' : packagingType === 'carton' ? 'Cartons' : 'Pallets';
  return `${pieces} ${label}`;
}

function summarizePallets(pallets, actualWeightKg, packagingType = 'pallet') {
  let weight = 0;
  let pieces = 0;
  let dims = '';
  for (const p of pallets) {
    const qty = Number(p.quantity) || 1;
    pieces += qty;
    weight += (Number(p.weight) || 0) * qty;
  }
  if (pallets.length > 0) {
    const first = pallets[0];
    dims = `${first.length || 0} × ${first.width || 0} × ${first.height || 0} cm`;
  }
  const piecesSummary = piecesLabel(pieces, packagingType);
  if (weight > 0) {
    return { declaredNetWeightKg: weight, netWeightSource: 'quotation_pallets', piecesSummary, palletDimensions: dims, pieces };
  }
  const stored = Number(actualWeightKg) || 0;
  if (stored > 0) {
    return { declaredNetWeightKg: stored, netWeightSource: 'quotation_actual_weight', piecesSummary, palletDimensions: dims, pieces };
  }
  return { declaredNetWeightKg: null, netWeightSource: 'unavailable', piecesSummary, palletDimensions: dims, pieces };
}

function buildOpCardPayload(quotation, ownerId, overrides) {
  const customerName = (quotation.company_name || quotation.customer_name || '').trim();
  if (!customerName) {
    throw new Error('Missing required fields: customer_name (set company_name or customer_name on quotation)');
  }
  const topic =
    overrides?.topic?.trim() ||
    quotation.quotation_no ||
    customerName ||
    `Quote ${quotation.id.slice(0, 8)}`;
  return {
    topic,
    customer_name: customerName,
    company_id: quotation.company_id || null,
    amount: quotation.total_cost || 0,
    currency: 'THB',
    stage: overrides?.stage?.trim() || 'inquiry',
    probability: 10,
    close_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    vehicle_type: quotation.delivery_vehicle_type || null,
    container_size: null,
    product_details: null,
    notes: overrides?.notes?.trim() || quotation.notes || null,
    destination_id: quotation.destination_id || null,
    owner_id: ownerId,
    pickup_date: null,
  };
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

// Net resolution: never use chargeable (629)
const fromActual = summarizePallets([], 341.6);
assert.equal(fromActual.declaredNetWeightKg, 341.6);
assert.equal(fromActual.netWeightSource, 'quotation_actual_weight');

const unavailable = summarizePallets([], 0);
assert.equal(unavailable.declaredNetWeightKg, null);
assert.equal(unavailable.netWeightSource, 'unavailable');

const fromPallets = summarizePallets([{ weight: 700, quantity: 1, length: 0, width: 0, height: 0 }], 629);
assert.equal(fromPallets.declaredNetWeightKg, 700);
assert.equal(fromPallets.netWeightSource, 'quotation_pallets');

// buildOpCardPayload
const STAFF_OWNER_ID = 'staff-uuid-0000-0000-0000-000000000001';
const opPayload = buildOpCardPayload(
  { id: 'abc12345-0000-0000-0000-000000000000', quotation_no: 'OMG09014', company_name: 'PACCAN GROW', company_id: 'c1', total_cost: 1000, user_id: 'u1', delivery_vehicle_type: '4wheel', destination_id: 'd1', notes: null, customer_name: '' },
  STAFF_OWNER_ID,
  {}
);
assert.equal(opPayload.topic, 'OMG09014');
assert.equal(opPayload.customer_name, 'PACCAN GROW');
assert.equal(opPayload.stage, 'inquiry');
assert.equal(opPayload.owner_id, STAFF_OWNER_ID);
assert.notEqual(opPayload.owner_id, 'u1');

assert.throws(
  () => buildOpCardPayload({ id: 'abc12345-0000-0000-0000-000000000000', company_name: '', customer_name: '' }, STAFF_OWNER_ID, {}),
  /Missing required fields/
);

// piecesLabel: pallet default, box/carton overrides
assert.equal(piecesLabel(2, 'pallet'), '2 Pallets');
assert.equal(piecesLabel(48, 'box'), '48 Boxes');
assert.equal(piecesLabel(12, 'carton'), '12 Cartons');
assert.equal(piecesLabel(0, 'pallet'), '');

// summarizePallets packaging override renders Boxes without touching weight
const boxSummary = summarizePallets([{ weight: 0, quantity: 48 }], 0, 'box');
assert.equal(boxSummary.piecesSummary, '48 Boxes');
assert.equal(boxSummary.declaredNetWeightKg, null); // no chargeable invented

console.log('booking draft check passed');
