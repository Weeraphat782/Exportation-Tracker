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
      .select('*, quotations(id)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching opportunities:', error);
      toast.error('Failed to fetch opportunities');
    } else {
      // Map DB fields to Frontend types
      const mapped: Opportunity[] = data.map((item: Record<string, unknown>) => {
        // item.quotations will be an array of objects { id: ... } or null
        const linkedQuotation = item.quotations && (item.quotations as Array<{ id: string }>).length > 0 ? (item.quotations as Array<{ id: string }>)[0] : null;

        return {
          id: item.id as string,
          topic: item.topic as string,
          customerName: (item.customer_name as string) || 'Unknown',
          companyName: (item.customer_name as string) || 'Unknown',
          companyId: item.company_id as string | undefined,
          amount: item.amount as number,
          currency: item.currency as string,
          stage: item.stage as OpportunityStage,
          probability: item.probability as number,
          closeDate: item.close_date as string,
          ownerName: 'Me',
          createdAt: item.created_at as string,
          updatedAt: item.updated_at as string,

          vehicleType: item.vehicle_type as string | undefined,
          containerSize: item.container_size as string | undefined,
          productDetails: (item.product_details as { description?: string })?.description || (typeof item.product_details === 'string' ? item.product_details : ''),
          notes: item.notes as string | undefined,
          destinationId: item.destination_id as string | undefined,

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

  const handleSaveOpportunity = async (data: Partial<Opportunity>) => {
    try {
      console.log('Saving opportunity:', data);

      const payload = {
        topic: data.topic,
        amount: data.amount,
        company_id: data.companyId,
        customer_name: data.companyName,
        vehicle_type: data.vehicleType,
        container_size: data.containerSize,
        product_details: data.productDetails ? { description: data.productDetails } : null,
        notes: data.notes,
        destination_id: data.destinationId,
        // Default fields for new
        stage: data.stage || 'prospecting',
        probability: data.probability || 10,
        currency: 'THB',
        close_date: data.closeDate,
      };

      console.log('Payload to save:', payload);

      if (data.id) {
        // UPDATE
        console.log('Updating opportunity with ID:', data.id);
        const { error } = await supabase
          .from('opportunities')
          .update(payload)
          .eq('id', data.id);

        if (error) {
          console.error('Supabase update error:', error);
          throw error;
        }
        toast.success('Opportunity updated!');
      } else {
        // INSERT
        console.log('Inserting new opportunity');
        const { error } = await supabase
          .from('opportunities')
          .insert([payload]);

        if (error) {
          console.error('Supabase insert error:', error);
          throw error;
        }
        toast.success('Opportunity created!');
      }

      fetchOpportunities();
      setEditingOpportunity(undefined); // Reset editing state
      setIsDialogOpen(false); // Close dialog
    } catch (error: unknown) {
      console.error('Error saving opportunity:', error);
      console.error('Error type:', typeof error);
      if (error && typeof error === 'object') {
        console.error('Error keys:', Object.keys(error));
        console.error('Error message:', (error as { message?: string })?.message);
        console.error('Error details:', (error as { details?: string })?.details);
        console.error('Error hint:', (error as { hint?: string })?.hint);
      }
      toast.error(`Failed to save opportunity: ${(error as { message?: string })?.message || (error as { details?: string })?.details || JSON.stringify(error)}`);
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

  const getProbabilityForStage = (stage: OpportunityStage): number => {
    switch (stage) {
      case 'prospecting': return 10;
      case 'qualification': return 20;
      case 'proposal': return 50;
      case 'negotiation': return 80;
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
