import { Quotation } from './db';

/** Air Freight team response submitted via public booking link */
export interface BookingAirFreightResponse {
  mawb?: string;
  flight_no?: string;
  carrier?: string;
  booked_date?: string;
  remarks?: string;
  responder_name?: string;
  submitted_at?: string;
}

export interface EmailBookingData {
  recipientName?: string;
  senderName?: string;
  product?: string;
  destination?: string;
  netWeight?: number;
  airline?: string;
  pickupLocation?: string;
  pickupDate?: string;
  preferredShipmentDate?: string;
  mawb?: string;
  numberOfPieces?: string;
  palletDimensions?: string;
  origin?: string;
  shipper?: string;
  consignee?: string;
  routing?: string;
  /** OMG quotation code, e.g. OMG06017 */
  quotationNo?: string;
  /** Uppercase shipper short name for subject, e.g. HOLLYMOOD */
  shipperShort?: string;
  /** Public booking link shown as Document List in email body */
  documentListUrl?: string;
}

/** Strip legal suffixes and uppercase for subject line, e.g. "Hollymood Co.,Ltd." -> "HOLLYMOOD" */
export function deriveShipperShort(companyName?: string | null): string {
  if (!companyName) return '';
  let name = companyName.trim();
  const suffixes = [
    /\s*co\.?,?\s*ltd\.?$/i,
    /\s*ltd\.?$/i,
    /\s*limited$/i,
    /\s*inc\.?$/i,
    /\s*llc\.?$/i,
    /\s*corp\.?$/i,
    /\s*corporation$/i,
    /\s*s\.r\.o\.?$/i,
    /\s*gmbh$/i,
    /\s*plc$/i,
  ];
  for (const suffix of suffixes) {
    name = name.replace(suffix, '');
  }
  return name.trim().toUpperCase();
}

export function buildBookingDocumentListUrl(origin: string, token: string): string {
  return `${origin.replace(/\/$/, '')}/booking/${token}`;
}

/** Merge persisted booking_details over quotation defaults */
export function mergeBookingDetailsFromQuotation(
  quotation: Quotation,
  saved?: EmailBookingData | Record<string, unknown> | null
): EmailBookingData {
  const base = generateBookingEmailFromQuotation(quotation);
  if (!saved || typeof saved !== 'object') return base;

  // Start from saved (preserves user-entered fields like airline, pickup, etc.)
  const merged: EmailBookingData = { ...base, ...(saved as Partial<EmailBookingData>) };

  // Quotation-derived fields must always reflect the latest quotation, so edits
  // to the quotation (destination, weight, pallets, company) show up even when
  // booking_details were saved previously. Fall back to saved value only when the
  // quotation has no data for that field.
  return {
    ...merged,
    destination: base.destination || merged.destination,
    netWeight: base.netWeight ?? merged.netWeight,
    numberOfPieces: base.numberOfPieces || merged.numberOfPieces,
    palletDimensions: base.palletDimensions || merged.palletDimensions,
    shipper: base.shipper || merged.shipper,
    quotationNo: base.quotationNo || merged.quotationNo,
    shipperShort: base.shipperShort || merged.shipperShort,
  };
}

export function generateBookingEmailFromQuotation(quotation: Quotation, additionalData?: Partial<EmailBookingData>): EmailBookingData {
  // Default product, but editable/overridable via saved booking_details
  const product = additionalData?.product || 'Dried Cannabis Flower';
      
  const destination = quotation.destination || '';
  
  // Calculate actual weight from pallets (not chargeable weight)
  let actualWeight = 0;
  let totalPallets = 0;
  let palletDimensions = '';
  
  if (quotation.pallets && Array.isArray(quotation.pallets)) {
    quotation.pallets.forEach(pallet => {
      const quantity = Number(pallet.quantity) || 1;
      totalPallets += quantity;
      // Use actual weight from pallets, not chargeable weight
      actualWeight += (Number(pallet.weight) || 0) * quantity;
    });
    
    // Get dimensions from first pallet
    if (quotation.pallets.length > 0) {
      const firstPallet = quotation.pallets[0];
      palletDimensions = `${firstPallet.length || 0} × ${firstPallet.width || 0} × ${firstPallet.height || 0} cm`;
    }
  }
  
  // If no pallet data, try to use total_actual_weight or fallback to chargeable_weight
  if (actualWeight === 0) {
    actualWeight = quotation.total_actual_weight || quotation.chargeable_weight || 0;
  }
  
  // Calculate number of pieces (only pallets)
  let numberOfPieces = '';
  if (totalPallets > 0) {
    numberOfPieces = `${totalPallets} Pallets`;
  }

  return {
    recipientName: additionalData?.recipientName || '',
    senderName: additionalData?.senderName || 'Weeraphat', // Default sender name
    product: product,
    destination: destination || '',
    netWeight: actualWeight > 0 ? actualWeight : undefined, // Use actual weight
    airline: additionalData?.airline || '',
    pickupLocation: additionalData?.pickupLocation || 'BKK (location and date TBC)',
    pickupDate: additionalData?.pickupDate || '',
    preferredShipmentDate: additionalData?.preferredShipmentDate || '',
    mawb: additionalData?.mawb || 'TBC',
    numberOfPieces: numberOfPieces || '',
    palletDimensions: palletDimensions || '',
    origin: additionalData?.origin || 'BKK',
    shipper: quotation.company_name || '',
    consignee: additionalData?.consignee || '',
    routing: additionalData?.routing || '',
    quotationNo: quotation.quotation_no || additionalData?.quotationNo || '',
    shipperShort: deriveShipperShort(quotation.company_name) || additionalData?.shipperShort || '',
    documentListUrl: additionalData?.documentListUrl || '',
  };
}

export function formatBookingEmail(data: EmailBookingData): string {
  const documentListBlock = data.documentListUrl
    ? `\nDocument List : ${data.documentListUrl}\n`
    : '\n';

  const template = `Dear Khun ${data.recipientName || '[Recipient Name]'}, 

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

  return template;
}

export function generateEmailSubject(data: EmailBookingData): string {
  const product = data.product || 'Shipment';
  const destination = data.destination || 'International';
  let subject = `Booking Request - ${product} to ${destination}`;
  if (data.shipperShort) {
    subject += ` - ${data.shipperShort}`;
  }
  if (data.quotationNo) {
    subject += ` - ${data.quotationNo}`;
  }
  return subject;
}
