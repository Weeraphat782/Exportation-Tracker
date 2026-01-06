"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { KanbanBoard } from '@/components/opportunities/kanban-board';
import { Button } from '@/components/ui/button';
import { RefreshCw, PlusCircle } from 'lucide-react';
import { OpportunityDialog } from '@/components/opportunities/new-opportunity-dialog';
import { Opportunity, OpportunityStage } from '@/types/opportunity';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import { getCompanies } from '@/lib/db';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('opportunities')
      // Select opportunity fields AND linked quotations(id)
      // Note: This relies on the foreign key relationship being detected.
      // If one-to-many, it returns an array. We take the first one (most recent?).
      .select('*, quotations(id), destination:destination_id(country, port), opportunity_products(product:products(id, name))')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching opportunities:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      toast.error(`Failed to fetch opportunities: ${error.message}`);
    } else {
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
        product_id?: string | null;
        quotations?: { id: string }[];
        opportunity_products?: { product: { id: string; name: string } }[];
      }

      // Map DB fields to Frontend types
      const mapped: Opportunity[] = (data as unknown as RawSupabaseOpportunity[]).map((item) => {
        // item.quotations will be an array of objects { id: ... } or null
        const linkedQuotation = item.quotations && item.quotations.length > 0 ? item.quotations[0] : null;

        // Extract destination name
        const dest = item.destination;
        const destinationName = dest ? `${dest.country}${dest.port ? ` (${dest.port})` : ''}` : undefined;

        return {
          id: item.id,
          topic: item.topic,
          customerName: item.customer_name || 'Unknown',
          companyName: item.customer_name || 'Unknown',
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
          productId: item.opportunity_products?.map(op => op.product.id) || [],
          productName: item.opportunity_products?.map(op => op.product.name) || [],

          quotationId: linkedQuotation?.id
        }
      });
      setOpportunities(mapped);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchOpportunities();

    // Subscribe to realtime changes in quotations to update the board when a quotation is linked
    const channel = supabase
      .channel('realtime-quotations-opportunities')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quotations' },
        (payload) => {
          console.log('Quotation change detected:', payload);
          fetchOpportunities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchOpportunities]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | undefined>(undefined);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);

  // Fetch companies for filter
  useEffect(() => {
    const fetchCompaniesData = async () => {
      const companiesData = await getCompanies();
      setCompanies(companiesData || []);
    };
    fetchCompaniesData();
  }, []);

  const handleEditOpportunity = (opportunity: Opportunity) => {
    console.log('handleEditOpportunity called with:', opportunity);
    setEditingOpportunity(opportunity);
    setIsDialogOpen(true);
  };

  const handleDeleteOpportunity = async (id: string) => {
    try {
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting opportunity:', error);
        toast.error(`Failed to delete opportunity: ${error.message}`);
      } else {
        toast.success('Opportunity deleted');
        fetchOpportunities();
      }
    } catch (err) {
      console.error('Error in handleDelete:', err);
    }
  };

  const handleSaveOpportunity = async (opportunityData: Partial<Opportunity>) => {
    try {
      console.log('handleSaveOpportunity received:', opportunityData);

      // Validate required fields
      if (!opportunityData.topic || opportunityData.topic.trim() === '') {
        throw new Error('Topic is required');
      }

      if (!opportunityData.customerName || opportunityData.customerName.trim() === '') {
        throw new Error('Customer name is required');
      }

      const payload = {
        topic: opportunityData.topic.trim(),
        customer_name: opportunityData.customerName.trim(),
        company_id: opportunityData.companyId || null,
        amount: opportunityData.amount || 0,
        currency: opportunityData.currency || 'THB',
        stage: opportunityData.stage || 'inquiry',
        probability: opportunityData.probability || 10,
        close_date: opportunityData.closeDate ? new Date(opportunityData.closeDate).toISOString().split('T')[0] : null,
        vehicle_type: opportunityData.vehicleType || null,
        container_size: opportunityData.containerSize || null,
        product_details: opportunityData.productDetails ? JSON.stringify(opportunityData.productDetails) : null,
        notes: opportunityData.notes || null,
        destination_id: opportunityData.destinationId || null,
      };

      console.log('Payload to save:', payload);

      let oppId: string;

      if (editingOpportunity) {
        console.log('Updating existing opportunity:', editingOpportunity.id);
        const { error } = await supabase
          .from('opportunities')
          .update(payload)
          .eq('id', editingOpportunity.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }

        oppId = editingOpportunity.id;
        toast.success('Opportunity updated');
      } else {
        console.log('Creating new opportunity');
        const { data, error } = await supabase
          .from('opportunities')
          .insert([payload])
          .select('id')
          .single();

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }

        oppId = data!.id;
        toast.success('Opportunity created');
      }

      // Update product links in junction table
      if (opportunityData.productId && opportunityData.productId.length > 0) {
        console.log('Updating product links for opportunity:', oppId);

        // Delete existing links
        const { error: deleteError } = await supabase
          .from('opportunity_products')
          .delete()
          .eq('opportunity_id', oppId);

        if (deleteError) {
          console.error('Error deleting product links:', deleteError);
          // Don't throw here, continue with insert
        }

        // Insert new links
        const productLinks = opportunityData.productId
          .filter(id => id && id !== 'none')
          .map(productId => ({
            opportunity_id: oppId,
            product_id: productId
          }));

        console.log('Product links to insert:', productLinks);

        if (productLinks.length > 0) {
          const { error: insertError } = await supabase
            .from('opportunity_products')
            .insert(productLinks);

          if (insertError) {
            console.error('Error inserting product links:', insertError);
            throw insertError;
          }
        }
      }

      fetchOpportunities();
      setIsDialogOpen(false);
      setEditingOpportunity(undefined);
    } catch (error: unknown) {
      console.error('Error saving opportunity:', error);

      let errorMessage = 'Failed to save opportunity';

      if (error && typeof error === 'object' && 'message' in error) {
        const err = error as { message?: string; details?: unknown; hint?: unknown; code?: string };
        console.error('Error details:', {
          message: err.message,
          details: err.details,
          hint: err.hint,
          code: err.code
        });

        // Provide more specific error messages
        if (err.code === '23503') {
          errorMessage = 'Invalid reference data. Please check company or destination selection.';
        } else if (err.code === '23505') {
          errorMessage = 'Duplicate data found.';
        } else if (err.message) {
          errorMessage = err.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    }
  };

  const handleStageChange = async (opportunityId: string, newStage: OpportunityStage) => {
    // Optimistic update confirmation
    const { error } = await supabase
      .from('opportunities')
      .update({
        stage: newStage,
        probability: getProbabilityForStage(newStage)
      })
      .eq('id', opportunityId);

    if (error) {
      toast.error('Failed to update stage');
      fetchOpportunities(); // Revert on error
    }
  };

  const handleWinCase = async (opportunityId: string) => {
    const { error } = await supabase
      .from('opportunities')
      .update({
        stage: 'closed_won',
        probability: 100
      })
      .eq('id', opportunityId);

    if (error) {
      toast.error('Failed to mark as won');
    } else {
      toast.success('Opportunity marked as WON!');
      fetchOpportunities(); // Refresh the board
    }
  };

  const handleLoseCase = async (opportunityId: string) => {
    const { error } = await supabase
      .from('opportunities')
      .update({
        stage: 'closed_lost',
        probability: 0
      })
      .eq('id', opportunityId);

    if (error) {
      toast.error('Failed to mark as lost');
    } else {
      toast.success('Opportunity marked as LOST');
      fetchOpportunities(); // Refresh the board
    }
  };

  const getProbabilityForStage = (stage: OpportunityStage): number => {
    switch (stage) {
      case 'inquiry': return 10;
      case 'quoting': return 20;
      case 'pending_docs': return 30;
      case 'pending_booking': return 45;
      case 'booking_requested': return 60;
      case 'awb_received': return 75;
      case 'payment_received': return 85;
      case 'closed_won': return 100;
      case 'closed_lost': return 0;
      default: return 0;
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Opportunities</h2>
          <p className="text-muted-foreground">
            Manage your sales pipeline and track potential deals.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={fetchOpportunities} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <OpportunityDialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) setEditingOpportunity(undefined);
            }}
            trigger={
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Opportunity
              </Button>
            }
            initialData={editingOpportunity}
            mode={editingOpportunity ? 'edit' : 'create'}
            onSubmit={handleSaveOpportunity}
          />
        </div>
      </div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Company:</label>
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="All Companies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden rounded-md border bg-white p-4 shadow-sm h-[calc(100vh-200px)]">
          <KanbanBoard
            onStageChange={handleStageChange}
            onEditOpportunity={handleEditOpportunity}
            onDeleteOpportunity={handleDeleteOpportunity}
            onWinCase={handleWinCase}
            onLoseCase={handleLoseCase}
            initialOpportunities={selectedCompany === 'all'
              ? opportunities
              : opportunities.filter(opp => opp.companyId === selectedCompany)
            }
          />
        </div>
      )}
    </div>
  );
}
