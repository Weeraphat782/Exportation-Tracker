export type OpportunityStage =
    | 'prospecting'
    | 'qualification'
    | 'proposal'
    | 'negotiation'
    | 'closed_won'
    | 'closed_lost';

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

    // Links
    quotationId?: string; // ID of the linked quotation
}

export const STAGE_LABELS: Record<OpportunityStage, string> = {
    prospecting: 'Prospecting',
    qualification: 'Qualification',
    proposal: 'Proposal',
    negotiation: 'Negotiation',
    closed_won: 'Closed Won',
    closed_lost: 'Closed Lost',
};

export const STAGE_COLORS: Record<OpportunityStage, string> = {
    prospecting: 'bg-slate-100 text-slate-700 border-slate-200',
    qualification: 'bg-blue-50 text-blue-700 border-blue-200',
    proposal: 'bg-purple-50 text-purple-700 border-purple-200',
    negotiation: 'bg-amber-50 text-amber-700 border-amber-200',
    closed_won: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    closed_lost: 'bg-red-50 text-red-700 border-red-200',
};
