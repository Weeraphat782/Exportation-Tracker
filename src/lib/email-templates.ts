import { Quotation } from './db';

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
}

export function generateBookingEmailFromQuotation(quotation: Quotation, additionalData?: Partial<EmailBookingData>): EmailBookingData {
  // Product is always "Dried Cannabis Flower"
  const product = 'Dried Cannabis Flower';
      
  const destination = quotation.destination || '';
  
  // Calculate actual weight from pallets (not chargeable weight)
  let actualWeight = 0;
  let totalPallets = 0;
  let palletDimensions = '';
  
  if (quotation.pallets && Array.isArray(quotation.pallets)) {
    quotation.pallets.forEach(pallet => {
      const quantity = pallet.quantity || 1;
      totalPallets += quantity;
      // Use actual weight from pallets, not chargeable weight
      actualWeight += (pallet.weight || 0) * quantity;
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
    product: product, // Always "Dried Cannabis Flower"
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
    routing: additionalData?.routing || ''
  };
}

export function formatBookingEmail(data: EmailBookingData): string {
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
DESCRIPTION OF CONTENTS, INCLUDING MODEL/MANUFACTURER: Dried Cannabis Flower
WEIGHT: ${data.netWeight ? `${data.netWeight} KG` : '[Weight] KG'}
NUMBER OF PIECE: ${data.numberOfPieces || '[Number] Pallets'}
PALLET DIMENSION: ${data.palletDimensions || '[Length] × [Width] × [Height] cm'}
ORIGIN: ${data.origin || 'BKK'}
DESTINATION: ${data.destination || '[Destination]'}
SHIPPER: ${data.shipper || '[Shipper Company]'}
CONSIGNEE: ${data.consignee || '[Consignee Company]'}
ROUTING: ${data.routing || '[Origin Code]- [Destination Code]'}


Best Regards,
${data.senderName || 'Weeraphat'}`;

  return template;
}

export function generateEmailSubject(data: EmailBookingData): string {
  const product = data.product || 'Shipment';
  const destination = data.destination || 'International';
  return `Booking Request - ${product} to ${destination}`;
}
