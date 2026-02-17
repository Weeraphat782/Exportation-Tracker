'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Link2, Package, Calendar, Loader2, Inbox, Clock } from 'lucide-react';
import { getUnlinkedQuotations, linkQuotationToOpportunity, Quotation } from '@/lib/db';
import { toast } from 'sonner';

interface LinkQuotationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    opportunityId: string;
    opportunityTopic?: string;
    onLinked: () => void;
}

function formatDate(dateStr: string) {
    try {
        return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return dateStr;
    }
}

function getStatusBadge(status: string) {
    switch (status) {
        case 'draft': return { label: 'Draft', variant: 'warning' as const };
        case 'sent': return { label: 'Submitted', variant: 'warning' as const };
        case 'accepted': return { label: 'Accepted', variant: 'success' as const };
        case 'pending_approval': return { label: 'Customer Request', variant: 'destructive' as const };
        case 'docs_uploaded': return { label: 'Docs Uploaded', variant: 'purple' as const };
        case 'completed': return { label: 'Completed', variant: 'success' as const };
        default: return { label: status, variant: 'outline' as const };
    }
}

export function LinkQuotationDialog({
    open,
    onOpenChange,
    opportunityId,
    opportunityTopic,
    onLinked,
}: LinkQuotationDialogProps) {
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [loading, setLoading] = useState(false);
    const [linking, setLinking] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!open) return;

        async function load() {
            setLoading(true);
            try {
                let userId = '';
                const userString = localStorage.getItem('user');
                if (userString) {
                    const userData = JSON.parse(userString);
                    userId = userData.id;
                }
                const data = await getUnlinkedQuotations(userId);
                setQuotations(data);
            } catch (err) {
                console.error('Error loading unlinked quotations:', err);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [open]);

    const filtered = quotations.filter(q => {
        if (!search) return true;
        const query = search.toLowerCase();
        const qNo = (q.quotation_no || '').toLowerCase();
        const customer = (q.customer_name || '').toLowerCase();
        const company = (q.company_name || '').toLowerCase();
        const dest = (q.destination || '').toLowerCase();
        return qNo.includes(query) || customer.includes(query) || company.includes(query) || dest.includes(query);
    });

    const handleLink = async (quotationId: string) => {
        setLinking(quotationId);
        try {
            const success = await linkQuotationToOpportunity(quotationId, opportunityId);
            if (success) {
                toast.success('Quotation linked successfully');
                onLinked();
                onOpenChange(false);
            } else {
                toast.error('Failed to link quotation');
            }
        } catch {
            toast.error('Error linking quotation');
        } finally {
            setLinking(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Link2 className="w-5 h-5 text-emerald-600" />
                        Link Existing Quotation
                    </DialogTitle>
                    <DialogDescription>
                        Select a quotation to link to{' '}
                        <strong>{opportunityTopic || 'this opportunity'}</strong>.
                        Only quotations not yet linked to any opportunity are shown.
                    </DialogDescription>
                </DialogHeader>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search by quotation no, customer, company, destination..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-1">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Inbox className="w-10 h-10 text-gray-300 mb-3" />
                            <p className="text-sm font-semibold text-gray-600">
                                {quotations.length === 0 ? 'No unlinked quotations' : 'No matching results'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                {quotations.length === 0
                                    ? 'All quotations are already linked to opportunities.'
                                    : 'Try a different search term.'}
                            </p>
                        </div>
                    ) : (
                        filtered.map((q) => {
                            const statusBadge = getStatusBadge(q.status);
                            const isLinking = linking === q.id;
                            const palletCount = q.pallets?.length || 0;
                            const totalWeight = q.pallets?.reduce((sum, p) => {
                                const w = typeof p.weight === 'number' ? p.weight : parseFloat(String(p.weight)) || 0;
                                const qty = typeof p.quantity === 'number' ? p.quantity : parseInt(String(p.quantity)) || 1;
                                return sum + (w * qty);
                            }, 0) || 0;

                            return (
                                <div
                                    key={q.id}
                                    className={`border rounded-lg p-4 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all ${
                                        q.status === 'pending_approval' ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0 space-y-1.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-sm text-gray-900">
                                                    {q.quotation_no || q.id.slice(0, 8).toUpperCase()}
                                                </span>
                                                <Badge variant={statusBadge.variant} className="text-[10px]">
                                                    {q.status === 'pending_approval' && <Clock className="w-3 h-3 mr-1" />}
                                                    {statusBadge.label}
                                                </Badge>
                                            </div>

                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                                {q.customer_name && (
                                                    <span className="font-medium text-gray-700">{q.customer_name}</span>
                                                )}
                                                {q.company_name && (
                                                    <span>{q.company_name}</span>
                                                )}
                                                {q.destination && q.destination !== 'N/A' && (
                                                    <span className="text-blue-600">{q.destination}</span>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Package className="w-3 h-3" /> {palletCount} pallet(s) · {totalWeight.toFixed(0)} kg
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> {formatDate(q.created_at)}
                                                </span>
                                                {q.total_cost > 0 && (
                                                    <span className="font-semibold text-gray-600">
                                                        ฿{q.total_cost.toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <Button
                                            size="sm"
                                            onClick={() => handleLink(q.id)}
                                            disabled={!!linking}
                                            className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold"
                                        >
                                            {isLinking ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <>
                                                    <Link2 className="w-3.5 h-3.5 mr-1" />
                                                    Link
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                {!loading && filtered.length > 0 && (
                    <div className="text-xs text-gray-400 text-center pt-2 border-t">
                        Showing {filtered.length} of {quotations.length} unlinked quotation(s)
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
