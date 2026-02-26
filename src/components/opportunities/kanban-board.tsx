"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Opportunity, OpportunityStage } from '@/types/opportunity';
import { KanbanColumn } from './kanban-column';
import { KanbanCard } from './kanban-card';

// Custom hook for drag-to-scroll like Trello
function useDragToScroll() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // Check if clicked on a card or interactive element
        const target = e.target as HTMLElement;
        const isCard = target.closest('[data-kanban-card]');
        const isButton = target.closest('button');
        const isLink = target.closest('a');
        const isInput = target.closest('input');

        // Only activate drag-to-scroll when NOT clicking on cards or buttons
        if (!isCard && !isButton && !isLink && !isInput) {
            setIsDragging(true);
            setStartX(e.pageX - (containerRef.current?.offsetLeft || 0));
            setScrollLeft(containerRef.current?.scrollLeft || 0);
            e.preventDefault();
        }
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - (containerRef.current?.offsetLeft || 0);
        const walk = (x - startX) * 2; // Scroll speed multiplier
        if (containerRef.current) {
            containerRef.current.scrollLeft = scrollLeft - walk;
        }
    }, [isDragging, startX, scrollLeft]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleMouseLeave = useCallback(() => {
        if (isDragging) {
            setIsDragging(false);
        }
    }, [isDragging]);

    return {
        containerRef,
        isDragging,
        handlers: {
            onMouseDown: handleMouseDown,
            onMouseMove: handleMouseMove,
            onMouseUp: handleMouseUp,
            onMouseLeave: handleMouseLeave,
        }
    };
}

const STAGES: OpportunityStage[] = [
    'inquiry',
    'quoting',
    'pending_docs',
    'pending_booking',
    'booking_requested',
    'awb_received',
    'payment_received',
];

interface KanbanBoardProps {
    initialOpportunities: Opportunity[];
    onStageChange?: (opportunityId: string, newStage: OpportunityStage) => void;
    onEditOpportunity?: (opportunity: Opportunity) => void;
    onDeleteOpportunity?: (id: string) => void;
    onWinCase?: (id: string) => void;
    onLoseCase?: (id: string) => void;
    onRefresh?: () => void;
}

export function KanbanBoard({ initialOpportunities, onStageChange, onEditOpportunity, onDeleteOpportunity, onWinCase, onLoseCase, onRefresh }: KanbanBoardProps) {
    // Sync state with props
    const [opportunities, setOpportunities] = useState<Opportunity[]>(initialOpportunities);

    // Watch for prop changes (e.g. new item added from parent)
    useEffect(() => {
        setOpportunities(initialOpportunities);
    }, [initialOpportunities]);

    const [activeId, setActiveId] = useState<string | null>(null);
    const [startStage, setStartStage] = useState<OpportunityStage | null>(null);

    // Drag to scroll like Trello
    const { containerRef, isDragging, handlers } = useDragToScroll();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function findContainer(id: string) {
        if (STAGES.includes(id as OpportunityStage)) {
            return id as OpportunityStage;
        }
        const item = opportunities.find((o) => o.id === id);
        return item?.stage;
    }

    function handleDragStart(event: DragStartEvent) {
        const id = event.active.id as string;
        setActiveId(id);
        const stage = findContainer(id);
        if (stage && STAGES.includes(stage)) {
            setStartStage(stage);
        }
    }

    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event;
        const overId = over?.id;

        if (!overId || active.id === overId) return;

        const activeContainer = findContainer(active.id as string);
        const overContainer = findContainer(overId as string);

        if (!activeContainer || !overContainer || activeContainer === overContainer) {
            return;
        }

        setOpportunities((prev) => {
            const activeIndex = prev.findIndex((o) => o.id === active.id);
            // Create new logical state where item is in new container
            const newItems = [...prev];
            const newStage = overContainer as OpportunityStage;
            newItems[activeIndex] = {
                ...newItems[activeIndex],
                stage: newStage,
                // Auto update probability based on stage (simple mock logic)
                probability: getProbabilityForStage(newStage)
            };

            return newItems;
        });
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        // The activeContainer here will reflect the *final* stage after DragOver updates
        const finalActiveContainer = findContainer(active.id as string);
        const overContainer = findContainer(over?.id as string); // This is the container where the item was dropped

        // Handle reordering within the same column
        if (
            finalActiveContainer &&
            overContainer &&
            finalActiveContainer === overContainer
        ) {
            const activeIndex = opportunities.findIndex((o) => o.id === active.id);
            const overIndex = opportunities.findIndex((o) => o.id === over?.id);

            if (activeIndex !== overIndex) {
                setOpportunities((items) => arrayMove(items, activeIndex, overIndex));
            }
        }

        // Check for stage change using startStage
        // If startStage is defined and the final stage is different from the start stage,
        // then a stage change occurred.
        if (startStage && finalActiveContainer && startStage !== finalActiveContainer) {
            if (onStageChange) {
                onStageChange(active.id as string, finalActiveContainer as OpportunityStage);
            }
        }

        setActiveId(null);
        setStartStage(null);
    }

    const getProbabilityForStage = (stage: OpportunityStage): number => {
        switch (stage) {
            case 'inquiry': return 10;
            case 'quoting': return 20;
            case 'pending_docs': return 30;
            case 'pending_booking': return 45;
            case 'booking_requested': return 60;
            case 'awb_received': return 75;
            case 'payment_received': return 85;
            default: return 0;
        }
    };

    const activeOpportunity = activeId ? opportunities.find(o => o.id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div
                ref={containerRef}
                className={`kanban-scroll-container flex h-full gap-4 overflow-x-auto pb-4 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
                {...handlers}
            >
                <div className="kanban-scroll-area flex gap-4 min-w-max px-6">
                    {STAGES.map((stage) => (
                        <KanbanColumn
                            key={stage}
                            stage={stage}
                            opportunities={opportunities.filter((o) => o.stage === stage)}
                            onEdit={onEditOpportunity}
                            onDelete={onDeleteOpportunity}
                            onWinCase={onWinCase}
                            onLoseCase={onLoseCase}
                            onRefresh={onRefresh}
                        />
                    ))}
                </div>
            </div>

            <DragOverlay>
                {activeOpportunity ? <KanbanCard opportunity={activeOpportunity} /> : null}
            </DragOverlay>
        </DndContext>
    );
}
