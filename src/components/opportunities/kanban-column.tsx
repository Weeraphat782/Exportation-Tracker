"use client";

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Opportunity, STAGE_LABELS, OpportunityStage } from '@/types/opportunity';
import { KanbanCard } from './kanban-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
    stage: OpportunityStage;
    opportunities: Opportunity[];
    onEdit?: (opportunity: Opportunity) => void;
    onDelete?: (id: string) => void;
    onWinCase?: (id: string) => void;
    onLoseCase?: (id: string) => void;
}

export function KanbanColumn({ stage, opportunities, onEdit, onDelete, onWinCase, onLoseCase }: KanbanColumnProps) {
    console.log(`KanbanColumn ${stage}: onEdit is`, !!onEdit);
    const { setNodeRef } = useDroppable({
        id: stage,
        data: {
            type: 'Column',
            stage,
        },
    });

    const totalAmount = opportunities.reduce((sum, opp) => sum + opp.amount, 0);

    return (
        <div className="flex flex-col h-full min-w-[280px] w-[300px] bg-gray-50/50 rounded-lg border p-2">
            <div className="mb-3 px-2">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-sm">{STAGE_LABELS[stage]}</h3>
                    <span className="text-xs text-muted-foreground font-medium bg-gray-200 px-2 py-0.5 rounded-full">
                        {opportunities.length}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                    Total: {totalAmount.toLocaleString()} THB
                </p>
            </div>

            <ScrollArea className="flex-1">
                <div ref={setNodeRef} className={cn("flex flex-col gap-2 p-1 min-h-[150px]")}>
                    <SortableContext items={opportunities.map(o => o.id)} strategy={verticalListSortingStrategy}>
                        {opportunities.map((opportunity) => (
                            <KanbanCard
                                key={opportunity.id}
                                opportunity={opportunity}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onWinCase={onWinCase}
                                onLoseCase={onLoseCase}
                            />
                        ))}
                    </SortableContext>
                </div>
            </ScrollArea>
        </div>
    );
}
