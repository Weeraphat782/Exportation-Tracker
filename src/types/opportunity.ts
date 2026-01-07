export type OpportunityStage =
    | 'inquiry'
    | 'quoting'
    | 'pending_docs'
    | 'pending_booking'
    | 'booking_requested'
    | 'awb_received'
    | 'payment_received';

// Closure status - separate from stage
export type ClosureStatus = 'won' | 'lost' | null;

export interface Opportunity {
    id: string;
    topic: string;
    customerName: string;
    companyId?: string; // Add companyId
    companyName: string;
    amount: number;
    currency: string;
    stage: OpportunityStage;
    probability: number;
    closeDate: string; // ISO Date
    ownerName: string;
    createdAt: string;
    updatedAt: string;

    // Optional fields
    vehicleType?: string;
    containerSize?: string;
    productDetails?: string;
    notes?: string;
    destinationId?: string; // Added field
    destinationName?: string; // Added field to show on card
    productId?: string[]; // Array for multiple products
    productName?: string[]; // Array for multiple products

    // Links - Support multiple quotations
    quotationIds?: string[]; // Array of linked quotation IDs
    
    // Closure status - separate from stage (card can be won/lost at any stage)
    closureStatus?: 'won' | 'lost' | null;
}

export const STAGE_LABELS: Record<OpportunityStage, string> = {
    inquiry: 'Initial Inquiry',
    quoting: 'Quoting',
    pending_docs: 'Pending Documents',
    pending_booking: 'Pending Booking',
    booking_requested: 'Booking Requested',
    awb_received: 'AWB Received',
    payment_received: 'Payment Received',
};

export const STAGE_COLORS: Record<OpportunityStage, string> = {
    inquiry: 'bg-slate-100 text-slate-700 border-slate-200',
    quoting: 'bg-blue-50 text-blue-700 border-blue-200',
    pending_docs: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    pending_booking: 'bg-purple-50 text-purple-700 border-purple-200',
    booking_requested: 'bg-violet-50 text-violet-700 border-violet-200',
    awb_received: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    payment_received: 'bg-amber-50 text-amber-700 border-amber-200',
};
