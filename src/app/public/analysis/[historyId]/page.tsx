"use client";

import React, { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, FileSearch, Clock, ShieldCheck } from 'lucide-react';

interface AnalysisResult {
    document_id: string;
    document_name: string;
    document_type: string;
    ai_feedback: string;
}

interface CriticalCheckResult {
    check_name: string;
    status: 'PASS' | 'FAIL' | 'WARNING';
    details: string;
    issue?: string;
}

interface AnalysisHistoryItem {
    id: string;
    quotation_id: string;
    opportunity_id: string;
    version: number;
    results: AnalysisResult[];
    critical_checks_results: CriticalCheckResult[];
    status: 'PASS' | 'FAIL' | 'WARNING';
    created_at: string;
}

export default function PublicAnalysisReportPage({ params }: { params: Promise<{ historyId: string }> }) {
    const { historyId } = use(params);
    const [data, setData] = useState<AnalysisHistoryItem | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('document_analysis_history')
                    .select('*')
                    .eq('id', historyId)
                    .single();

                if (error) throw error;
                setData(data);
            } catch (err) {
                console.error('Error fetching analysis report:', err);
            } finally {
                setLoading(false);
            }
        };

        if (historyId) {
            fetchHistory();
        }
    }, [historyId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50/50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center h-screen space-y-4 px-4 text-center">
                <h2 className="text-xl font-semibold">Analysis report not found or link has expired.</h2>
                <p className="text-gray-500 max-w-md">Please contact your account manager for a new link.</p>
            </div>
        );
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PASS': return <Badge className="bg-green-500 hover:bg-green-600 text-white border-none px-3 py-1">PASS</Badge>;
            case 'WARNING': return <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none px-3 py-1">WARNING</Badge>;
            case 'FAIL': return <Badge className="bg-red-500 hover:bg-red-600 text-white border-none px-3 py-1">FAIL</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PASS': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'WARNING': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
            case 'FAIL': return <XCircle className="h-5 w-5 text-red-500" />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Public Header */}
            <div className="bg-white border-b border-gray-200 py-4 px-6 mb-8">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-emerald-600" />
                        <span className="font-bold text-xl tracking-tight text-gray-900">Document Review Portal</span>
                    </div>
                    <div className="text-xs text-gray-400 font-medium">Safe & Secure Analysis</div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 space-y-8">
                {/* Report Overview */}
                <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black text-gray-900">Analysis Feedback</h1>
                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold">
                                    Report v{data.version}
                                </Badge>
                            </div>
                            <p className="text-gray-500 text-sm max-w-xl">
                                Please review the feedback below from our AI-assisted document verification system to ensure compliance and accuracy.
                            </p>
                            <div className="flex items-center gap-4 pt-2 text-xs text-gray-400">
                                <div className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {new Date(data.created_at).toLocaleString('en-US', {
                                        dateStyle: 'long',
                                        timeStyle: 'short'
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center min-w-[140px]">
                            <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1 text-center">Overall Compliance</div>
                            <div className="flex justify-center">{getStatusBadge(data.status)}</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    {/* Critical Observations */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 pl-1">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            <h2 className="text-lg font-bold text-gray-800">Key Observations</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {data.critical_checks_results?.map((check: CriticalCheckResult, idx: number) => (
                                <div key={idx} className="flex flex-col p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${check.status === 'PASS' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {getStatusIcon(check.status)}
                                            </div>
                                            <h3 className="font-bold text-gray-900 text-lg">{check.check_name}</h3>
                                        </div>
                                        {getStatusBadge(check.status)}
                                    </div>
                                    <div className="pl-11 space-y-4">
                                        <div className="text-sm text-gray-600 leading-relaxed">
                                            {check.details}
                                        </div>
                                        {check.issue && check.status !== 'PASS' && (
                                            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                                <div className="text-red-800 font-bold text-xs uppercase mb-2 tracking-wider">Required Action / Issue</div>
                                                <p className="text-red-700 text-sm font-medium">{check.issue}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Individual Document Details */}
                    <section className="space-y-4 pt-4">
                        <div className="flex items-center gap-2 pl-1">
                            <FileSearch className="h-5 w-5 text-blue-600" />
                            <h2 className="text-lg font-bold text-gray-800">Detailed Document Feedback</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            {data.results?.map((res: AnalysisResult, idx: number) => (
                                <div key={idx} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden border-l-4 border-l-blue-500">
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-blue-50 p-3 rounded-xl">
                                                    <FileSearch className="h-6 w-6 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 text-lg">{res.document_name}</h3>
                                                    <Badge variant="outline" className="text-[10px] text-gray-400 font-bold uppercase mt-1 px-2 py-0 border-gray-200">{res.document_type}</Badge>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-blue-50/30 p-5 rounded-xl border border-blue-50/50">
                                            <div className="text-[10px] text-blue-400 font-black uppercase mb-3 tracking-widest">AI Assessment</div>
                                            <div className="prose prose-blue max-w-none text-sm text-gray-700 leading-relaxed">
                                                <div dangerouslySetInnerHTML={{ __html: res.ai_feedback?.replace(/\n/g, '<br/>') || '' }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="pt-12 text-center">
                    <p className="text-gray-400 text-xs">
                        © {new Date().getFullYear()} Document Analysis Portal. All rights reserved.
                        <br />Confidential Report. Only shared for verification purposes.
                    </p>
                </div>
            </div>
        </div>
    );
}
