"use client";

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Opportunity, STAGE_COLORS } from '@/types/opportunity';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GripVertical, ExternalLink, Loader2, MoreHorizontal, Edit, Trash, Plus, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface KanbanCardProps {
  opportunity: Opportunity;
  onEdit?: (opportunity: Opportunity) => void;
  onDelete?: (id: string) => void;
  onWinCase?: (id: string) => void;
  onLoseCase?: (id: string) => void;
}

export function KanbanCard({ opportunity, onEdit, onDelete, onWinCase, onLoseCase }: KanbanCardProps) {
  // console.log(`Card ${opportunity.id}: onEdit is`, !!onEdit);
  const router = useRouter();
  const [creating] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: opportunity.id,
    data: {
      type: 'Opportunity',
      opportunity,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleCreateQuotation = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag start

    // Calculate values to pass
    const params = new URLSearchParams();
    if (opportunity.id) params.set('opportunityId', opportunity.id);
    if (opportunity.productId && opportunity.productId.length > 0) params.set('productId', opportunity.productId.join(','));
    if (opportunity.companyId) params.set('companyId', opportunity.companyId);
    if (opportunity.companyName) params.set('customerName', opportunity.companyName);
    if (opportunity.destinationId) params.set('destinationId', opportunity.destinationId); // Pass destination
    // Map optional fields if they align with target form
    // Target form has 'deliveryVehicleType', 'notes'
    if (opportunity.vehicleType) params.set('deliveryVehicleType', opportunity.vehicleType);
    if (opportunity.notes) params.set('notes', opportunity.notes);

    // Navigate to existing creation page
    router.push(`/shipping-calculator/new?${params.toString()}`);
  };

  const handleViewQuotation = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to quotation detail
    router.push(`/shipping-calculator/preview?id=${opportunity.quotationId}`);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <Card className="premium-shadow-hover border-none ring-1 ring-slate-100/50 transition-all duration-300">
        <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
          <Badge variant="outline" className={`font-semibold px-2 py-0.5 rounded-full ${STAGE_COLORS[opportunity.stage]}`}>
            {opportunity.probability}%
          </Badge>
          <div className="flex items-center gap-1">
            <div className="p-1 text-gray-300">
              <GripVertical className="h-4 w-4" />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="cursor-pointer text-green-600 focus:text-green-600"
                  onSelect={() => {
                    if (confirm('Mark this opportunity as WON?')) {
                      if (onWinCase) onWinCase(opportunity.id);
                    }
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Win Case
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onSelect={() => {
                    if (confirm('Mark this opportunity as LOST?')) {
                      if (onLoseCase) onLoseCase(opportunity.id);
                    }
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Lose Case
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={() => {
                    // console.log('KanbanCard: Edit clicked');
                    if (onEdit) onEdit(opportunity);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                  onSelect={() => {
                    // console.log('KanbanCard: Delete clicked');
                    if (confirm('Are you sure you want to delete this opportunity?')) {
                      if (onDelete) onDelete(opportunity.id);
                    }
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <h4 className="font-bold text-sm mb-1 text-slate-800 line-clamp-1">{opportunity.topic}</h4>
          <p className="text-base font-extrabold text-blue-600 mb-2 truncate">{opportunity.companyName}</p>

          <div className="flex justify-between items-center text-sm mb-3">
            <span className="font-semibold text-gray-900">
              {opportunity.amount.toLocaleString()} {opportunity.currency}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(opportunity.closeDate).toLocaleDateString()}
            </span>
          </div>

          {/* Additional Details Section */}
          <div className="space-y-1.5 mb-3 text-xs">
            {opportunity.destinationName && (
              <div className="flex items-start gap-1.5">
                <span className="text-gray-500 min-w-[70px]">Destination:</span>
                <span className="text-blue-700 font-semibold">{opportunity.destinationName}</span>
              </div>
            )}
            {opportunity.vehicleType && (
              <div className="flex items-start gap-1.5">
                <span className="text-gray-500 min-w-[70px]">Vehicle:</span>
                <span className="text-gray-700 font-medium">{opportunity.vehicleType}</span>
              </div>
            )}
            {opportunity.containerSize && (
              <div className="flex items-start gap-1.5">
                <span className="text-gray-500 min-w-[70px]">Container:</span>
                <span className="text-gray-700 font-medium">{opportunity.containerSize}</span>
              </div>
            )}
            {opportunity.productName && opportunity.productName.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2 mb-1">
                {opportunity.productName.map((name, i) => (
                  <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md border border-emerald-100">
                    {name}
                  </span>
                ))}
              </div>
            )}
            {opportunity.productDetails && (
              <div className="flex items-start gap-1.5">
                <span className="text-gray-500 min-w-[70px]">Details:</span>
                <span className="text-gray-700 font-medium line-clamp-2">{opportunity.productDetails}</span>
              </div>
            )}
            {opportunity.notes && (
              <div className="flex items-start gap-1.5">
                <span className="text-gray-500 min-w-[70px]">Notes:</span>
                <span className="text-gray-600 italic line-clamp-2">{opportunity.notes}</span>
              </div>
            )}
          </div>

          {opportunity.quotationId ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
              onClick={handleViewQuotation}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              View Quotation
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-9 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 border-none shadow-sm transition-all hover:shadow-md"
              onClick={handleCreateQuotation}
              onPointerDown={(e) => e.stopPropagation()}
              disabled={creating}
            >
              {creating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {creating ? 'Processing...' : 'Generate Quotation'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
