"use client";

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Opportunity, OpportunityStage } from '@/types/opportunity';
import { Quotation } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, FileText, Edit, Calendar, Package, Eye, Flag, Globe } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { QuotationDocuments } from '@/components/quotations/quotation-documents';
import { StageProgressBar } from '@/components/opportunities/stage-progress-bar';
import { ContactWidget } from '@/components/opportunities/contact-widget';
import { OpportunityTasks } from '@/components/opportunities/opportunity-tasks';
import { AnalysisHistory } from '@/components/opportunities/analysis-history';

interface OpportunityDetail extends Omit<Opportunity, 'quotationIds'> {
    description?: string;
    quotations?: Quotation[];
    contact_person?: string;
    contact_email?: string;
    contact_phone?: string;
}

export default function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [opportunity, setOpportunity] = useState<OpportunityDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOpportunity = async () => {
            setLoading(true);
            try {
                // Fetch opportunity with linked quotations
                const { data, error } = await supabase
                    .from('opportunities')
                    .select(`
                        *, 
                        quotations(*), 
                        destination:destination_id(country, port), 
                        opportunity_products(product:products(name)),
                        company:company_id(name, contact_person, contact_email, contact_phone)
                    `)
                    .eq('id', id)
                    .single();

                if (error) {
                    throw error;
                }

                if (data) {
                    interface RawSupabaseOpportunity {
                        id: string;
                        topic: string;
                        customer_name: string | null;
                        company_id: string | null;
                        amount: number;
                        currency: string;
                        stage: OpportunityStage;
                        probability: number;
                        created_at: string;
                        updated_at: string;
                        close_date: string;
                        vehicle_type?: string;
                        container_size?: string;
                        product_details?: string | { description?: string };
                        notes?: string;
                        destination_id?: string;
                        destination?: { country: string; port: string | null };
                        quotations?: Quotation[];
                        opportunity_products?: { product: { name: string } }[];
                        closure_status?: 'won' | 'lost' | null;
                        company?: {
                            name: string;
                            contact_person?: string;
                            contact_email?: string;
                            contact_phone?: string;
                        };
                    }

                    const item = data as unknown as RawSupabaseOpportunity;

                    const dest = item.destination;
                    const destinationName = dest ? `${dest.country}${dest.port ? ` (${dest.port})` : ''}` : undefined;

                    // Map products
                    const productNames = item.opportunity_products?.map(op => op.product.name) || [];

                    const mapped: OpportunityDetail = {
                        id: item.id,
                        topic: item.topic,
                        customerName: item.customer_name || 'Unknown',
                        companyName: item.company?.name || item.customer_name || 'Unknown',
                        companyId: item.company_id || undefined,
                        amount: item.amount,
                        currency: item.currency,
                        stage: item.stage,
                        probability: item.probability,
                        closeDate: item.close_date,
                        ownerName: 'Me',
                        createdAt: item.created_at,
                        updatedAt: item.updated_at,
                        vehicleType: item.vehicle_type,
                        containerSize: item.container_size,
                        productDetails: typeof item.product_details === 'object' ? item.product_details?.description || '' : item.product_details || '',
                        notes: item.notes,
                        destinationId: item.destination_id,
                        destinationName,
                        productName: productNames, // Map to string[]
                        quotations: item.quotations || [], // Full quotation objects
                        closureStatus: item.closure_status || null,
                        contact_person: item.company?.contact_person,
                        contact_email: item.company?.contact_email,
                        contact_phone: item.company?.contact_phone
                    };

                    setOpportunity(mapped);
                }
            } catch (err) {
                console.error('Error fetching opportunity details:', err);
                toast.error('Failed to load opportunity details');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchOpportunity();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50/50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (!opportunity) {
        return (
            <div className="flex flex-col items-center justify-center h-screen space-y-4">
                <h2 className="text-xl font-semibold">Opportunity not found</h2>
                <Button onClick={() => router.push('/opportunities')}>Return to Board</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/30 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" onClick={() => router.push('/opportunities')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Return
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{opportunity.topic}</h1>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>{opportunity.customerName}</span>
                                <span>•</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100`}>
                                    {opportunity.stage.replace(/_/g, ' ').toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stage Progress Bar */}
                <Card className="shadow-sm border-gray-200 overflow-hidden">
                    <StageProgressBar currentStage={opportunity.stage} />
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Content - Left Column (2/3) */}
                    <div className="md:col-span-2 space-y-6">

                        {/* Quotations Section */}
                        <Card className="shadow-sm border-gray-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-emerald-600" />
                                    Quotations
                                </CardTitle>
                                <CardDescription>All quotations linked to this opportunity</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                {opportunity.quotations && opportunity.quotations.length > 0 ? (
                                    opportunity.quotations.map((quote, index) => (
                                        <div key={quote.id} className="space-y-4">
                                            {opportunity.quotations && opportunity.quotations.length > 1 && (
                                                <div className="flex items-center gap-2 pb-2 border-b">
                                                    <div className="font-bold text-lg text-gray-700">Quotation #{index + 1}</div>
                                                    <div className="text-sm text-gray-400 font-mono">{quote.id}</div>
                                                </div>
                                            )}

                                            <Card className="bg-white border-gray-200">
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <div className="font-semibold text-lg flex items-center gap-2">
                                                                <span className="font-mono text-gray-700">{quote.id}</span>
                                                                <span className={`text-xs px-2 py-0.5 rounded-full border ${quote.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                    quote.status === 'sent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                        'bg-gray-50 text-gray-600 border-gray-200'
                                                                    }`}>
                                                                    {quote.status.toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <div className="text-sm text-gray-500 mt-1">
                                                                Created: {new Date(quote.created_at).toLocaleDateString('th-TH', { year: '2-digit', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xl font-bold text-emerald-700">
                                                                {quote.total_cost.toLocaleString()} <span className="text-sm font-normal text-gray-500">THB</span>
                                                            </div>
                                                            <div className="text-xs text-gray-500">Net Total</div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-gray-50 p-3 rounded-md mb-4 border border-gray-100">
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Freight Cost:</span>
                                                                <span className="font-medium text-gray-900">{(quote.total_freight_cost || 0).toLocaleString()}</span>
                                                            </div>

                                                            {/* Additional Charges */}
                                                            {quote.additional_charges && quote.additional_charges.length > 0 && (
                                                                <div className="pt-2 border-t border-gray-200 mt-2">
                                                                    <div className="text-xs font-bold text-gray-500 mb-1 uppercase">Additional Charges</div>
                                                                    {quote.additional_charges.map((charge, i) => (
                                                                        <div key={i} className="flex justify-between text-xs mb-1">
                                                                            <span className="text-gray-600 truncate mr-2">{charge.description}</span>
                                                                            <span className="font-medium whitespace-nowrap">{Number(charge.amount).toLocaleString()}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {(quote.clearance_cost || 0) > 0 && (
                                                                <div className="flex justify-between pt-1 border-t border-gray-200 mt-1">
                                                                    <span className="text-gray-500">Clearance:</span>
                                                                    <span className="font-medium text-gray-900">{quote.clearance_cost?.toLocaleString()}</span>
                                                                </div>
                                                            )}
                                                            {(quote.delivery_cost || 0) > 0 && quote.delivery_service_required && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-500">Delivery:</span>
                                                                    <span className="font-medium text-gray-900">{quote.delivery_cost?.toLocaleString()}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="space-y-3 border-l pl-4 border-gray-200">
                                                            {/* Pallet Info */}
                                                            <div>
                                                                <div className="text-xs font-bold text-gray-500 mb-1 uppercase">Pallet Details</div>
                                                                <div className="font-medium text-gray-900">
                                                                    {quote.pallets?.length || 0} Pallets
                                                                    {quote.pallets && quote.pallets.length > 0 && (
                                                                        <span className="text-gray-500 font-normal ml-1 text-xs">
                                                                            ({quote.pallets[0].length}x{quote.pallets[0].width}x{quote.pallets[0].height} cm)
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-gray-500 mt-0.5">
                                                                    Dest: {quote.destination}
                                                                </div>
                                                            </div>

                                                            {/* Notes */}
                                                            {quote.notes && (
                                                                <div className="pt-1">
                                                                    <div className="text-xs font-bold text-gray-500 mb-1 uppercase">Notes</div>
                                                                    <div className="text-xs text-gray-700 bg-yellow-50 p-2 rounded border border-yellow-100 italic">
                                                                        {quote.notes}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Attached Documents */}
                                                    <QuotationDocuments quotationId={quote.id} />

                                                    <div className="flex justify-end gap-2 mt-4">
                                                        <Link href={`/document-comparison?quotation_id=${quote.id}&opportunity_id=${opportunity.id}`}>
                                                            <Button className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700">
                                                                <Eye className="h-3.5 w-3.5 mr-1.5" />
                                                                View AI Review
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/shipping-calculator/new?id=${quote.id}`}>
                                                            <Button variant="outline" size="sm" className="h-8 text-xs">
                                                                <Edit className="h-3.5 w-3.5 mr-1.5" />
                                                                Edit
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/shipping-calculator/preview?id=${quote.id}`}>
                                                            <Button variant="outline" size="sm" className="h-8 text-xs">
                                                                <FileText className="h-3.5 w-3.5 mr-1.5" />
                                                                PDF
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                                        No quotations created yet.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Info - Right Column (1/3) */}
                    <div className="space-y-6">
                        {/* Contact Widget */}
                        <ContactWidget
                            companyName={opportunity.companyName}
                            contactPerson={opportunity.contact_person}
                            contactEmail={opportunity.contact_email}
                            contactPhone={opportunity.contact_phone}
                        />

                        {/* Task Management */}
                        <OpportunityTasks opportunityId={opportunity.id} />

                        {/* Document Analysis History */}
                        <AnalysisHistory opportunityId={opportunity.id} />

                        <Card className="shadow-sm border-gray-200">
                            <CardHeader className="pb-3 border-b border-gray-50">
                                <CardTitle className="text-sm font-semibold">Deal Overview</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4 text-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Flag className="h-4 w-4" />
                                        <span>Current Stage</span>
                                    </div>
                                    <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold">
                                        {opportunity.stage.replace(/_/g, ' ')}
                                    </span>
                                </div>

                                <div className="border-t border-gray-50 pt-3">
                                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                                        <Globe className="h-4 w-4" />
                                        <span>Destination</span>
                                    </div>
                                    <div className="font-medium pl-6">{opportunity.destinationName || '-'}</div>
                                </div>

                                <div className="border-t border-gray-50 pt-3">
                                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                                        <Package className="h-4 w-4" />
                                        <span>Products</span>
                                    </div>
                                    <div className="font-medium pl-6">
                                        {(Array.isArray(opportunity.productName) ? opportunity.productName : [opportunity.productName]).filter(Boolean).join(', ') || '-'}
                                    </div>
                                </div>

                                <div className="border-t border-gray-50 pt-3">
                                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>Expected Close</span>
                                    </div>
                                    <div className="font-medium pl-6">{new Date(opportunity.closeDate).toLocaleDateString()}</div>
                                </div>

                                {opportunity.notes && (
                                    <div className="border-t border-gray-50 pt-3">
                                        <div className="text-gray-500 mb-1">Notes</div>
                                        <div className="bg-yellow-50 p-3 rounded text-yellow-800 text-[11px] leading-relaxed italic border border-yellow-100">
                                            {opportunity.notes}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
