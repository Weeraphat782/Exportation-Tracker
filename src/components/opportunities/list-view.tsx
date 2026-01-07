"use client";

import React from 'react';
import { Opportunity, STAGE_LABELS, STAGE_COLORS } from '@/types/opportunity';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash, CheckCircle, XCircle, FileText, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ListViewProps {
  opportunities: Opportunity[];
  onEdit?: (opportunity: Opportunity) => void;
  onDelete?: (id: string) => void;
  onWinCase?: (id: string) => void;
  onLoseCase?: (id: string) => void;
}

export function ListView({ opportunities, onEdit, onDelete, onWinCase, onLoseCase }: ListViewProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleViewQuotation = (quotationId: string) => {
    router.push(`/shipping-calculator/preview?id=${quotationId}`);
  };

  return (
    <div className="rounded-md border bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="w-[50px]">Status</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Topic</TableHead>
            <TableHead>Destination</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead className="text-center">Prob.</TableHead>
            <TableHead>Close Date</TableHead>
            <TableHead>Quotations</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {opportunities.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                No opportunities found
              </TableCell>
            </TableRow>
          ) : (
            opportunities.map((opp) => (
              <TableRow 
                key={opp.id} 
                className={`hover:bg-slate-50 transition-colors ${
                  opp.closureStatus === 'won' 
                    ? 'bg-emerald-50/50' 
                    : opp.closureStatus === 'lost' 
                      ? 'bg-red-50/50' 
                      : ''
                }`}
              >
                {/* Status Badge */}
                <TableCell>
                  {opp.closureStatus === 'won' && (
                    <Badge className="bg-emerald-500 text-white text-[10px] px-1.5 py-0">
                      🏆 WON
                    </Badge>
                  )}
                  {opp.closureStatus === 'lost' && (
                    <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0">
                      ❌ LOST
                    </Badge>
                  )}
                  {!opp.closureStatus && (
                    <span className="text-xs text-gray-400">Active</span>
                  )}
                </TableCell>

                {/* Company */}
                <TableCell className="font-medium text-blue-600">
                  {opp.companyName}
                </TableCell>

                {/* Topic */}
                <TableCell className="max-w-[200px]">
                  <span className="truncate block" title={opp.topic}>
                    {opp.topic}
                  </span>
                </TableCell>

                {/* Destination */}
                <TableCell className="text-sm">
                  {opp.destinationName || '-'}
                </TableCell>

                {/* Amount */}
                <TableCell className="text-right font-semibold">
                  {opp.amount.toLocaleString()} {opp.currency}
                </TableCell>

                {/* Stage */}
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${STAGE_COLORS[opp.stage]}`}
                  >
                    {STAGE_LABELS[opp.stage]}
                  </Badge>
                </TableCell>

                {/* Probability */}
                <TableCell className="text-center">
                  <span className={`text-sm font-medium ${
                    opp.probability >= 70 ? 'text-emerald-600' :
                    opp.probability >= 40 ? 'text-amber-600' :
                    'text-gray-500'
                  }`}>
                    {opp.probability}%
                  </span>
                </TableCell>

                {/* Close Date */}
                <TableCell className="text-sm text-gray-600">
                  {formatDate(opp.closeDate)}
                </TableCell>

                {/* Quotations */}
                <TableCell>
                  {opp.quotationIds && opp.quotationIds.length > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-green-700">
                          <FileText className="mr-1 h-3 w-3" />
                          {opp.quotationIds.length} Quotation{opp.quotationIds.length > 1 ? 's' : ''}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {opp.quotationIds.map((qId, index) => (
                          <DropdownMenuItem 
                            key={qId}
                            onClick={() => handleViewQuotation(qId)}
                            className="cursor-pointer"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Quotation {index + 1}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span className="text-xs text-gray-400">No quotations</span>
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!opp.closureStatus && (
                        <>
                          <DropdownMenuItem
                            className="cursor-pointer text-green-600 focus:text-green-600"
                            onClick={() => {
                              if (confirm('Mark this opportunity as WON?')) {
                                onWinCase?.(opp.id);
                              }
                            }}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Win Case
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer text-red-600 focus:text-red-600"
                            onClick={() => {
                              if (confirm('Mark this opportunity as LOST?')) {
                                onLoseCase?.(opp.id);
                              }
                            }}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Lose Case
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => onEdit?.(opp)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer text-red-600 focus:text-red-600"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this opportunity?')) {
                            onDelete?.(opp.id);
                          }
                        }}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

