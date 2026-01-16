"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, CheckCircle2, AlertTriangle, XCircle, FileSearch, Clock } from 'lucide-react';

interface AnalysisHistoryItem {
    id: string;
    quotation_id: string;
    opportunity_id: string;
    version: number;
    results: Record<string, any>[];
    critical_checks_results: Record<string, any>[];
    status: 'PASS' | 'FAIL' | 'WARNING';
    created_at: string;
}

export function AnalysisHistory({ opportunityId }: { opportunityId: string }) {
    const router = useRouter();
    const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('document_analysis_history')
                    .select('*')
                    .eq('opportunity_id', opportunityId)
                    .order('version', { ascending: false });

                if (error) throw error;
                setHistory(data || []);
            } catch (err) {
                console.error('Error fetching analysis history:', err);
            } finally {
                setLoading(false);
            }
        };

        if (opportunityId) {
            fetchHistory();
        }
    }, [opportunityId]);

    if (loading) {
        return (
            <Card className="shadow-sm border-gray-200">
                <CardContent className="p-8 flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                </CardContent>
            </Card>
        );
    }

    if (history.length === 0) {
        return null;
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PASS': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'WARNING': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
            case 'FAIL': return <XCircle className="h-4 w-4 text-red-500" />;
            default: return null;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PASS': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">PASS</Badge>;
            case 'WARNING': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">WARNING</Badge>;
            case 'FAIL': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">FAIL</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <Card className="shadow-sm border-gray-200">
            <CardHeader className="pb-3 border-b border-gray-50">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <History className="h-4 w-4 text-emerald-600" />
                    Document Analysis History
                </CardTitle>
                <CardDescription className="text-[10px]">Track versioned AI review results</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                    {history.map((item) => (
                        <div
                            key={item.id}
                            className="p-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between transition-colors"
                            onClick={() => router.push(`/opportunities/${opportunityId}/analysis/${item.id}`)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col items-center justify-center bg-gray-50 rounded h-10 w-10 border border-gray-100">
                                    <span className="text-[8px] text-gray-400 font-bold uppercase">Ver.</span>
                                    <span className="text-sm font-bold text-gray-700">{item.version}</span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        {getStatusIcon(item.status)}
                                        <span className="text-xs font-bold text-gray-800">
                                            Analysis Report
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-gray-400 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(item.created_at).toLocaleString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                {getStatusBadge(item.status)}
                                <span className="text-[9px] text-emerald-600 font-medium">View Report →</span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
