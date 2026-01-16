"use client";

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, FileSearch, Clock, Share, Link2 } from 'lucide-react';
import { toast } from 'sonner';

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

export default function AnalysisReportPage({ params }: { params: Promise<{ id: string, historyId: string }> }) {
    const { id, historyId } = use(params);
    const router = useRouter();
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
            <div className="flex flex-col items-center justify-center h-screen space-y-4">
                <h2 className="text-xl font-semibold">Analysis report not found</h2>
                <Button onClick={() => router.push(`/opportunities/${id}`)}>Back to Opportunity</Button>
            </div>
        );
    }

    const handleShare = () => {
        const shareUrl = `${window.location.origin}/public/analysis/${historyId}`;
        navigator.clipboard.writeText(shareUrl);
        toast.success('Shareable link copied to clipboard!', {
            description: 'You can now send this link to your customer.',
            icon: <Link2 className="h-4 w-4" />,
        });
    };

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
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Navigation & Header */}
                <div className="flex flex-col space-y-4">
                    <Button
                        variant="ghost"
                        className="w-fit text-gray-500 hover:text-gray-900"
                        onClick={() => router.push(`/opportunities/${id}`)}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Opportunity Detail
                    </Button>

                    <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-gray-900">Document Analysis Report</h1>
                                <Badge variant="secondary" className="bg-gray-100 text-gray-700 font-bold uppercase tracking-wider">
                                    Version {data.version}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {new Date(data.created_at).toLocaleString('en-US', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short'
                                    })}
                                </div>
                                <div>Quotation ID: <span className="font-mono text-gray-700">{data.quotation_id}</span></div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <div className="text-xs text-gray-400 uppercase font-bold mb-1">Overall Status</div>
                                {getStatusBadge(data.status)}
                            </div>
                            <div className="h-10 w-[1px] bg-gray-100 hidden sm:block mx-2" />
                            <Button
                                onClick={handleShare}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            >
                                <Share className="h-4 w-4 mr-2" />
                                Share Report
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {/* Critical Checks Section */}
                    <Card className="shadow-sm border-gray-200">
                        <CardHeader className="border-b bg-gray-50/50">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                Critical Comparisons
                            </CardTitle>
                            <CardDescription>Major findings across all analyzed documents</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 gap-4">
                                {data.critical_checks_results?.map((check: Record<string, any>, idx: number) => (
                                    <div key={idx} className="flex flex-col p-4 rounded-lg border border-gray-100 bg-white hover:border-gray-300 transition-colors shadow-sm">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(check.status)}
                                                <h3 className="font-bold text-gray-900">{check.check_name}</h3>
                                            </div>
                                            {getStatusBadge(check.status)}
                                        </div>
                                        <div className="pl-7 space-y-3">
                                            <div className="text-sm bg-gray-50 p-3 rounded-md border border-gray-100">
                                                <span className="font-bold text-gray-500 text-[10px] uppercase block mb-1">Details</span>
                                                <p className="text-gray-700">{check.details}</p>
                                            </div>
                                            {check.issue && check.status !== 'PASS' && (
                                                <div className="text-sm bg-red-50 p-3 rounded-md border border-red-100 text-red-700">
                                                    <span className="font-bold text-red-500 text-[10px] uppercase block mb-1">Detected Issue</span>
                                                    <p>{check.issue}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Document Details Section */}
                    <Card className="shadow-sm border-gray-200">
                        <CardHeader className="border-b bg-gray-50/50">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <FileSearch className="h-5 w-5 text-blue-600" />
                                Per-Document Feedback
                            </CardTitle>
                            <CardDescription>AI observations for individual document files</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-6">
                                {data.results?.map((res: Record<string, any>, idx: number) => (
                                    <div key={idx} className="space-y-3 p-6 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                                        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-blue-50 p-2 rounded-lg">
                                                    <FileSearch className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900">{res.document_name}</h3>
                                                    <Badge variant="outline" className="text-[10px] text-gray-500 uppercase mt-0.5">{res.document_type}</Badge>
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="bg-gray-50 font-mono text-[10px]">ID: {res.document_id?.substring(0, 8)}</Badge>
                                        </div>

                                        <div className="prose prose-blue max-w-none text-sm text-gray-700 leading-relaxed pt-2">
                                            <div dangerouslySetInnerHTML={{ __html: res.ai_feedback?.replace(/\n/g, '<br/>') || '' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
