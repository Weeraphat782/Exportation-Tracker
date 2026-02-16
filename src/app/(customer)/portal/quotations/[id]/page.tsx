'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft, FileText, MapPin, CalendarDays,
    Plane, Loader2, Save, Trash2, Plus, Info,
    CheckCircle2, XCircle, Clock, Download,
    Image as ImageIcon, FileSpreadsheet, Inbox, Upload,
    ChevronUp, ChevronDown, Eye, Calculator
} from 'lucide-react';
import {
    getCustomerQuotationById,
    updateCustomerQuotation,
    getCustomerDocuments,
    submitCustomerDocument,
    getFreightRatesByDestination
} from '@/lib/customer-db';
import { calculateVolumeWeight } from '@/lib/calculators';
import type { Quotation, DocumentSubmission, AdditionalCharge, Pallet } from '@/lib/db';
import type { FreightRate } from '@/lib/customer-db';
import { uploadFile } from '@/lib/storage';
import { toast } from 'react-hot-toast';
import { getDocumentTemplate } from '@/lib/db';
import { useCustomerAuth } from '@/contexts/customer-auth-context';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Leaf } from 'lucide-react';

const DOCUMENT_CATEGORIES = [
    {
        id: 'company-info',
        name: 'Company Information',
        types: [
            { id: 'company-registration', name: 'Company Registration' },
            { id: 'company-declaration', name: 'Company Declaration' },
            { id: 'id-card-copy', name: 'ID Card Copy' }
        ]
    },
    {
        id: 'permits-forms',
        name: 'Permits & TK Forms',
        types: [
            { id: 'import-permit', name: 'Import Permit' },
            { id: 'tk-10', name: 'TK 10' },
            { id: 'tk-11', name: 'TK 11' },
            { id: 'tk-31', name: 'TK 31' },
            { id: 'tk-32', name: 'TK 32' }
        ]
    },
    {
        id: 'shipping-docs',
        name: 'Shipping Documents',
        types: [
            { id: 'purchase-order', name: 'Purchase Order' },
            { id: 'msds', name: 'MSDS' },
            { id: 'commercial-invoice', name: 'Commercial Invoice' },
            { id: 'packing-list', name: 'Packing List' }
        ]
    },
    {
        id: 'additional',
        name: 'Additional Documents',
        types: [
            { id: 'hemp-letter', name: 'Letter (Hemp Case)' },
            { id: 'additional-file', name: 'Additional File' }
        ]
    }
];

const GACP_DOCS_STANDARD = [
    { id: 'thai-gacp-certificate-standard', name: 'Thai GACP or GACP Certificate' }
];

const GACP_DOCS_FARM = [
    { id: 'farm-purchase-order', name: 'Farm Purchase Order' },
    { id: 'farm-commercial-invoice', name: 'Farm Commercial Invoice' },
    { id: 'thai-gacp-certificate-farm', name: 'Thai GACP Certificate (Farm)' }
];

interface QueuedFile {
    file: File;
    documentType: string;
    documentTypeName: string;
    id: string;
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        draft: 'bg-gray-100 text-gray-600 border-gray-200',
        sent: 'bg-blue-50 text-blue-700 border-blue-200',
        accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        rejected: 'bg-red-50 text-red-700 border-red-200',
        completed: 'bg-violet-50 text-violet-700 border-violet-200',
        docs_uploaded: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        Shipped: 'bg-blue-50 text-blue-700 border-blue-200',
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${styles[status] || styles.draft}`}>
            {status.replace('_', ' ')}
        </span>
    );
}

function DocStatusBadge({ status }: { status: string }) {
    const config: Record<string, { icon: React.ElementType; label: string; className: string }> = {
        approved: { icon: CheckCircle2, label: 'Approved', className: 'bg-emerald-50 text-emerald-700' },
        submitted: { icon: Clock, label: 'Under Review', className: 'bg-blue-50 text-blue-700' },
        rejected: { icon: XCircle, label: 'Rejected', className: 'bg-red-50 text-red-700' },
        pending: { icon: Clock, label: 'Pending', className: 'bg-amber-50 text-amber-700' },
        reviewed: { icon: CheckCircle2, label: 'Reviewed', className: 'bg-emerald-50 text-emerald-700' },
    };

    const c = config[status] || config.submitted;
    const Icon = c.icon;

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${c.className}`}>
            <Icon className="w-3 h-3" /> {c.label}
        </span>
    );
}

function FileIcon({ mimeType }: { mimeType?: string }) {
    if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    if (mimeType?.includes('image')) return <ImageIcon className="w-5 h-5 text-violet-500" />;
    return <FileText className="w-5 h-5 text-blue-500" />;
}

export default function QuotationDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'overview' | 'documents'>('overview');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const { user, isLoading: authLoading } = useCustomerAuth();
    const [quotation, setQuotation] = useState<Quotation | null>(null);
    const [pallets, setPallets] = useState<Pallet[]>([]);
    const [documents, setDocuments] = useState<DocumentSubmission[]>([]);
    const [uploadQueue, setUploadQueue] = useState<QueuedFile[]>([]);
    const [isThaiGacp, setIsThaiGacp] = useState(false);
    const [freightRates, setFreightRates] = useState<FreightRate[]>([]);
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        'company-info': true,
        'permits-forms': true,
        'shipping-docs': true,
        'additional': true,
        'gacp-certification': true
    });
    const [previewLoading, setPreviewLoading] = useState<Record<string, boolean>>({});

    // Real-time calculation preview
    const totals = useMemo(() => {
        if (!quotation) return null;

        let totalFreightCost = 0;
        let totalActualWeight = 0;
        let totalVolumeWeight = 0;

        pallets.forEach(pallet => {
            const length = Number(pallet.length) || 0;
            const width = Number(pallet.width) || 0;
            const height = Number(pallet.height) || 0;
            const weight = Number(pallet.weight) || 0;
            const quantity = Number(pallet.quantity) || 1;

            const volWt = calculateVolumeWeight(length, width, height);
            const chargeableWeight = Math.max(volWt, weight);

            const applicableRates = freightRates.filter(rate =>
                (rate.min_weight === null || chargeableWeight >= rate.min_weight) &&
                (rate.max_weight === null || chargeableWeight <= rate.max_weight)
            );

            const rate = applicableRates.length > 0 ? applicableRates[0].base_rate : 0;
            const cost = Math.round(chargeableWeight * rate) * quantity;

            totalFreightCost += cost;
            totalActualWeight += weight * quantity;
            totalVolumeWeight += volWt * quantity;
        });

        const chargeableWeight = Math.max(totalActualWeight, totalVolumeWeight);
        const deliveryRates: Record<string, number> = { '4wheel': 3500, '6wheel': 6500 };
        const deliveryCost = quotation.delivery_service_required && quotation.delivery_vehicle_type
            ? (deliveryRates[quotation.delivery_vehicle_type] || 0)
            : 0;

        const totalAdditionalCharges = (quotation.additional_charges || []).reduce(
            (sum: number, charge: AdditionalCharge) => sum + (Number(charge.amount) || 0),
            0
        );

        const totalCost = totalFreightCost + deliveryCost + (quotation.clearance_cost || 0) + totalAdditionalCharges;

        return {
            totalFreightCost,
            deliveryCost,
            totalActualWeight,
            totalVolumeWeight,
            chargeableWeight,
            totalCost
        };
    }, [pallets, quotation, freightRates]);

    useEffect(() => {
        if (!id) return;

        const loadData = async () => {
            if (authLoading) return;
            if (!user?.id) {
                setLoading(false);
                return;
            }
            try {
                const [qData, docsData] = await Promise.all([
                    getCustomerQuotationById(id, user.id),
                    getCustomerDocuments(user.id)
                ]);

                if (!qData) {
                    toast.error('Quotation not found');
                    router.push('/portal/quotations');
                    return;
                }
                setQuotation(qData);
                setPallets(qData.pallets || []);
                const filteredDocs = docsData.filter(d => d.quotation_id === id);
                setDocuments(filteredDocs);

                // Auto-collapse sections based on existing documents
                setOpenSections(prev => {
                    const next = { ...prev };
                    [...DOCUMENT_CATEGORIES, {
                        id: 'gacp-certification',
                        types: isThaiGacp ? GACP_DOCS_FARM : GACP_DOCS_STANDARD
                    }].forEach(cat => {
                        const hasDocs = filteredDocs.some(doc =>
                            cat.types.some(t => t.id === doc.document_type)
                        );
                        if (hasDocs) next[cat.id] = false;
                    });
                    return next;
                });

                // Fetch freight rates for this destination
                if (qData.destination_id) {
                    const rates = await getFreightRatesByDestination(qData.destination_id);
                    setFreightRates(rates);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                toast.error('Failed to load quotation data');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id, user?.id, authLoading, isThaiGacp, router]);

    const handlePalletChange = (index: number, field: string, value: string | number) => {
        const newPallets = [...pallets];
        newPallets[index] = { ...newPallets[index], [field]: value };
        setPallets(newPallets);
    };

    const addPallet = () => {
        setPallets([...pallets, { length: 0, width: 0, height: 0, weight: 0, quantity: 1 }]);
    };

    const removePallet = (index: number) => {
        if (pallets.length <= 1) {
            toast.error('At least one pallet is required');
            return;
        }
        const newPallets = [...pallets];
        newPallets.splice(index, 1);
        setPallets(newPallets);
    };

    const handleSave = async () => {
        if (!id || !quotation) return;
        setSaving(true);

        try {
            // Mirroring the calculation logic from the back-office (shipping-calculator/new/page.tsx)
            // 1. Calculate individual pallet costs
            let totalFreightCost = 0;
            let totalActualWeight = 0;
            let totalVolumeWeight = 0;

            const updatedPallets = pallets.map((pallet: Pallet) => {
                const length = Number(pallet.length) || 0;
                const width = Number(pallet.width) || 0;
                const height = Number(pallet.height) || 0;
                const weight = Number(pallet.weight) || 0;
                const quantity = Number(pallet.quantity) || 1;

                // Volume weight for one unit
                const volWt = calculateVolumeWeight(length, width, height);
                const chargeableWeight = Math.max(volWt, weight);

                // Find applicable rate
                const applicableRates = freightRates.filter(rate =>
                    (rate.min_weight === null || chargeableWeight >= rate.min_weight) &&
                    (rate.max_weight === null || chargeableWeight <= rate.max_weight)
                );

                const rate = applicableRates.length > 0 ? applicableRates[0].base_rate : 0;
                const cost = Math.round(chargeableWeight * rate) * quantity;

                totalFreightCost += cost;
                totalActualWeight += weight * quantity;
                totalVolumeWeight += volWt * quantity;

                return {
                    ...pallet,
                    length,
                    width,
                    height,
                    weight,
                    quantity,
                    volumeWeight: volWt,
                    chargeableWeight: chargeableWeight,
                    customerFreightCost: cost / quantity // per unit
                };
            });

            const chargeableWeight = Math.max(totalActualWeight, totalVolumeWeight);

            // Re-calculate delivery cost
            const deliveryRates: Record<string, number> = { '4wheel': 3500, '6wheel': 6500 };
            const deliveryCost = quotation.delivery_service_required && quotation.delivery_vehicle_type
                ? (deliveryRates[quotation.delivery_vehicle_type] || 0)
                : 0;

            // Total additional charges
            const totalAdditionalCharges = (quotation.additional_charges || []).reduce(
                (sum: number, charge: AdditionalCharge) => sum + (Number(charge.amount) || 0),
                0
            );

            const totalCost = totalFreightCost + deliveryCost + (quotation.clearance_cost || 0) + totalAdditionalCharges;

            const updates = {
                pallets: updatedPallets,
                total_freight_cost: totalFreightCost,
                total_actual_weight: totalActualWeight,
                total_volume_weight: totalVolumeWeight,
                chargeable_weight: chargeableWeight,
                delivery_cost: deliveryCost,
                total_cost: totalCost,
                updated_at: new Date().toISOString()
            };

            const success = await updateCustomerQuotation(id, updates);
            if (success) {
                toast.success('Calculation updated successfully');
                const updated = await getCustomerQuotationById(id);
                if (updated) {
                    setQuotation(updated);
                    setPallets(updated.pallets || []);
                }
            } else {
                toast.error('Failed to update calculations');
            }
        } catch (err) {
            console.error('Error saving calculations:', err);
            toast.error('An error occurred during calculation');
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = (files: FileList | null, docTypeId: string, docTypeName: string) => {
        if (!files || files.length === 0 || !quotation) return;

        const newItems: QueuedFile[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`${file.name} is too large (> 10MB)`);
                continue;
            }
            newItems.push({
                file,
                documentType: docTypeId,
                documentTypeName: docTypeName,
                id: Math.random().toString(36).substring(7)
            });
        }
        setUploadQueue(prev => [...prev, ...newItems]);
    };

    const handlePreview = async (documentTypeId: string, documentName: string) => {
        try {
            setPreviewLoading(prev => ({ ...prev, [documentTypeId]: true }));
            const template = await getDocumentTemplate(documentTypeId);

            if (template && template.file_url) {
                window.open(template.file_url, '_blank');
            } else {
                toast.error(`No template available for ${documentName}`);
            }
        } catch (err) {
            console.error('Error loading document template:', err);
            toast.error('Failed to load document template');
        } finally {
            setPreviewLoading(prev => ({ ...prev, [documentTypeId]: false }));
        }
    };

    const removeFromQueue = (id: string) => {
        setUploadQueue(prev => prev.filter(item => item.id !== id));
    };

    const submitAllDocuments = async () => {
        if (uploadQueue.length === 0 || !quotation) return;
        setUploading(true);

        try {
            let successCount = 0;
            for (const item of uploadQueue) {
                const path = `quotation-docs/${id}/${item.file.name}`;
                const url = await uploadFile('documents', path, item.file);

                if (!url) {
                    toast.error(`Failed to upload ${item.file.name}`);
                    continue;
                }

                const success = await submitCustomerDocument({
                    quotation_id: id,
                    company_name: quotation.company_name || 'N/A',
                    document_type: item.documentType, // The slug (e.g., 'company-registration')
                    document_type_name: item.documentTypeName, // The display name
                    file_name: item.file.name,
                    original_file_name: item.file.name,
                    file_path: path,
                    file_url: url,
                    file_size: item.file.size,
                    mime_type: item.file.type,
                    status: 'submitted'
                });

                if (success) successCount++;
            }

            if (successCount > 0) {
                toast.success(`Successfully uploaded ${successCount} document(s)`);
                setUploadQueue([]);
                const docsData = await getCustomerDocuments();
                const filteredDocs = docsData.filter(d => d.quotation_id === id);
                setDocuments(filteredDocs.sort((a, b) =>
                    new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime()
                ));

                // Auto-collapse updated sections
                setOpenSections(prev => {
                    const next = { ...prev };
                    [...DOCUMENT_CATEGORIES, {
                        id: 'gacp-certification',
                        types: isThaiGacp ? GACP_DOCS_FARM : GACP_DOCS_STANDARD
                    }].forEach(cat => {
                        const hasDocs = filteredDocs.some(doc =>
                            cat.types.some(t => t.id === doc.document_type)
                        );
                        if (hasDocs) next[cat.id] = false;
                    });
                    return next;
                });
            }
        } catch (err) {
            console.error('Submit all error:', err);
            toast.error('An error occurred during upload');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    if (!quotation) return null;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Breadcrumbs & Actions */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.push('/portal/quotations')}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to list
                </button>
                <div className="flex items-center gap-3">
                    <StatusBadge status={quotation.status} />
                </div>
            </div>

            {/* Main Container */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                {/* Header Section */}
                <div className="p-6 md:p-8 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <FileText className="w-5 h-5 text-emerald-600" />
                                <h1 className="text-xl font-bold text-gray-900">
                                    Quotation #{quotation.quotation_no || quotation.id.slice(0, 8).toUpperCase()}
                                </h1>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {quotation.destination || 'N/A'}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <CalendarDays className="w-3.5 h-3.5" />
                                    {new Date(quotation.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-500 mb-0.5">Total Amount</div>
                            <div className="text-3xl font-extrabold text-emerald-600">
                                ฿{(totals?.totalCost ?? quotation.total_cost).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex px-6 md:px-8 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-4 text-sm font-semibold transition-all border-b-2 relative ${activeTab === 'overview'
                            ? 'text-emerald-600 border-emerald-500'
                            : 'text-gray-400 border-transparent hover:text-gray-600'
                            }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('documents')}
                        className={`px-4 py-4 text-sm font-semibold transition-all border-b-2 relative flex items-center gap-2 ${activeTab === 'documents'
                            ? 'text-emerald-600 border-emerald-500'
                            : 'text-gray-400 border-transparent hover:text-gray-600'
                            }`}
                    >
                        Documents
                        {documents.length > 0 && (
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded-full">
                                {documents.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1">
                    {activeTab === 'overview' ? (
                        <div className="p-6 md:p-8 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* 1. SHIPPING & PRODUCT INFO */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <Plane className="w-4 h-4" /> Shipping Information
                                    </h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase">Shipping Date</div>
                                            <div className="text-sm font-semibold text-gray-900">
                                                {quotation.shipping_date ? new Date(quotation.shipping_date).toLocaleDateString('en-GB') : 'To be confirmed'}
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase">Vehicle Type</div>
                                            <div className="text-sm font-semibold text-gray-900 capitalize">
                                                {quotation.delivery_vehicle_type || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase">Destination Port</div>
                                        <div className="text-sm font-semibold text-gray-900">{quotation.destination || 'N/A'}</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <FileText className="w-4 h-4" /> Weight & Volume Summary
                                    </h2>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/50 text-center">
                                            <div className="text-[10px] font-bold text-emerald-600 uppercase">Actual (KG)</div>
                                            <div className="text-base font-bold text-emerald-700">{totals?.totalActualWeight ?? quotation.total_actual_weight ?? 0}</div>
                                        </div>
                                        <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100/50 text-center">
                                            <div className="text-[10px] font-bold text-blue-600 uppercase">Volume (KG)</div>
                                            <div className="text-base font-bold text-blue-700">{totals?.totalVolumeWeight ?? quotation.total_volume_weight ?? 0}</div>
                                        </div>
                                        <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100/50 text-center">
                                            <div className="text-[10px] font-bold text-amber-600 uppercase">Chargeable</div>
                                            <div className="text-base font-bold text-amber-700">{totals?.chargeableWeight ?? quotation.chargeable_weight ?? 0}</div>
                                        </div>
                                    </div>
                                    {quotation.notes && (
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase">Your Notes</div>
                                            <div className="text-xs text-gray-600 mt-1 italic">&quot;{quotation.notes}&quot;</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 2. UNIFIED COST BREAKDOWN */}
                            <div className="space-y-4">
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Calculator className="w-3.5 h-3.5" /> Cost Breakdown
                                        </h2>
                                        <span className="text-[10px] font-medium text-gray-400 italic">Values update in real-time based on pallet changes</span>
                                    </div>
                                    <div className="divide-y divide-gray-50">
                                        {/* Main Costs */}
                                        <div className="px-6 py-4 flex justify-between items-center hover:bg-gray-50/30 transition-colors">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-gray-700">Freight Cost</span>
                                                <span className="text-[10px] text-gray-400">Based on destination rates and chargeable weight</span>
                                            </div>
                                            <span className="text-sm font-bold text-gray-900">
                                                ฿{(totals?.totalFreightCost ?? quotation.total_freight_cost ?? 0).toLocaleString()}
                                            </span>
                                        </div>

                                        {(totals?.deliveryCost ?? quotation.delivery_cost ?? 0) > 0 && (
                                            <div className="px-6 py-4 flex justify-between items-center hover:bg-gray-50/30 transition-colors">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-700">Delivery Fee</span>
                                                    <span className="text-[10px] text-gray-400">Local transportation to port</span>
                                                </div>
                                                <span className="text-sm font-bold text-gray-900">
                                                    ฿{(quotation.delivery_cost || 0).toLocaleString()}
                                                </span>
                                            </div>
                                        )}

                                        {(quotation.clearance_cost ?? 0) > 0 && (
                                            <div className="px-6 py-4 flex justify-between items-center hover:bg-gray-50/30 transition-colors">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-700">Clearance Fee</span>
                                                    <span className="text-[10px] text-gray-400">Customs documentation and processing</span>
                                                </div>
                                                <span className="text-sm font-bold text-gray-900">
                                                    ฿{(quotation.clearance_cost ?? 0).toLocaleString()}
                                                </span>
                                            </div>
                                        )}

                                        {/* Additional Charges mapped inside the same list */}
                                        {quotation.additional_charges && quotation.additional_charges.length > 0 && (
                                            <>
                                                {quotation.additional_charges.map((charge: AdditionalCharge, i: number) => (
                                                    <div key={i} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50/30 transition-colors">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-semibold text-gray-700">{charge.name}</span>
                                                            {charge.description && <span className="text-[10px] text-gray-400">{charge.description}</span>}
                                                        </div>
                                                        <span className="text-sm font-bold text-gray-900">
                                                            ฿{Number(charge.amount).toLocaleString()}
                                                        </span>
                                                    </div>
                                                ))}
                                            </>
                                        )}

                                        {/* Grand Total Row */}
                                        <div className="px-6 py-6 bg-gradient-to-r from-emerald-600 to-teal-600 flex justify-between items-center">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-emerald-100 uppercase tracking-widest">Total Quotation</span>
                                                <span className="text-[10px] text-emerald-200/80">Inclusive of all services listed above</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-2xl font-black text-white">
                                                    ฿{(totals?.totalCost ?? quotation.total_cost).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-8 mt-4">
                                {/* Instructions Box */}
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 mb-8">
                                    <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                    <div className="text-sm text-blue-700">
                                        <p className="font-semibold mb-1 text-[13px]">Action Required: Verify Pallet Dimensions</p>
                                        <p className="opacity-90 leading-relaxed">Please ensure the dimensions below match your actual loading requirements. If you modify these, our team will review and update the quote if necessary.</p>
                                    </div>
                                </div>

                                {/* Pallets Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-bold text-gray-900">Pallet Management</h2>
                                        <button
                                            onClick={addPallet}
                                            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-100 flex items-center gap-1.5 transition-colors border border-emerald-100"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Add New Pallet
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {pallets.map((pallet, idx) => (
                                            <div key={idx} className="relative bg-white rounded-xl border border-gray-200 p-4 md:p-6 shadow-sm hover:border-emerald-300 transition-all">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                        #{idx + 1}
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest italic">Pallet Unit</span>
                                                </div>
                                                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Length (cm)</label>
                                                        <input
                                                            type="number"
                                                            value={pallet.length}
                                                            onChange={(e) => handlePalletChange(idx, 'length', e.target.value)}
                                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Width (cm)</label>
                                                        <input
                                                            type="number"
                                                            value={pallet.width}
                                                            onChange={(e) => handlePalletChange(idx, 'width', e.target.value)}
                                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Height (cm)</label>
                                                        <input
                                                            type="number"
                                                            value={pallet.height}
                                                            onChange={(e) => handlePalletChange(idx, 'height', e.target.value)}
                                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Weight (kg)</label>
                                                        <input
                                                            type="number"
                                                            value={pallet.weight}
                                                            onChange={(e) => handlePalletChange(idx, 'weight', e.target.value)}
                                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Qty Units</label>
                                                        <input
                                                            type="number"
                                                            value={pallet.quantity}
                                                            onChange={(e) => handlePalletChange(idx, 'quantity', e.target.value)}
                                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none border-emerald-100"
                                                        />
                                                    </div>
                                                </div>

                                                {pallets.length > 1 && (
                                                    <button
                                                        onClick={() => removePallet(idx)}
                                                        className="absolute -top-2 -right-2 w-7 h-7 bg-white border border-red-100 text-red-400 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 shadow-sm transition-all"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex items-center justify-end gap-3 pt-10 border-t border-gray-50">
                                <button
                                    onClick={() => router.push('/portal/quotations')}
                                    className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-8 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:shadow-none"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 transition-all">
                            {/* Document Instructions */}
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 shadow-sm shadow-amber-50/50">
                                <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div className="text-sm text-amber-800">
                                    <p className="font-semibold mb-1">Upload Documents</p>
                                    <p className="opacity-90 leading-relaxed text-[13px]">
                                        Please upload all required export documents. Select files for each type below and click <span className="font-bold">&quot;Submit All&quot;</span> at the bottom.
                                    </p>
                                </div>
                            </div>

                            {/* Document Upload Sections */}
                            <div className="space-y-4">
                                {[
                                    ...DOCUMENT_CATEGORIES,
                                    {
                                        id: 'gacp-certification',
                                        name: 'Thai GACP or GACP Certificate',
                                        types: isThaiGacp ? GACP_DOCS_FARM : GACP_DOCS_STANDARD
                                    }
                                ].map(category => (
                                    <Collapsible
                                        key={category.id}
                                        open={openSections[category.id]}
                                        onOpenChange={(open) => setOpenSections(prev => ({ ...prev, [category.id]: open }))}
                                        className="border rounded-2xl overflow-hidden bg-white shadow-sm border-gray-100/80 group"
                                    >
                                        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50/50 hover:bg-emerald-50/30 transition-colors group-data-[state=open]:border-b border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-100 shadow-sm">
                                                    <FileText className="w-4 h-4 text-emerald-500" />
                                                </div>
                                                <h3 className="text-sm font-bold text-gray-700">{category.name}</h3>
                                                {(() => {
                                                    const count = uploadQueue.filter(item =>
                                                        category.types.some(t => t.id === item.documentType)
                                                    ).length;
                                                    return count > 0 ? (
                                                        <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-700 rounded-full font-bold">
                                                            {count} QUEUED
                                                        </span>
                                                    ) : null;
                                                })()}
                                            </div>
                                            {openSections[category.id] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <div className="p-5 space-y-6">
                                                {category.id === 'gacp-certification' && (
                                                    <div className="flex items-start space-x-3 p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl transition-all">
                                                        <div className="p-2 bg-white rounded-lg mt-0.5 border border-emerald-100 shadow-sm">
                                                            <Leaf className="h-4 w-4 text-emerald-600" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <Label htmlFor="thai-gacp" className="text-[13px] font-bold text-emerald-900 cursor-pointer">
                                                                Using GACP documents from another farm (purchased goods)
                                                            </Label>
                                                            <p className="text-[11px] text-emerald-700 mt-1 leading-relaxed opacity-80">
                                                                *Check this box only if you purchased goods from another farm. You will need to upload farm-level documents.
                                                            </p>
                                                        </div>
                                                        <Checkbox
                                                            id="thai-gacp"
                                                            checked={isThaiGacp}
                                                            onCheckedChange={(checked) => setIsThaiGacp(!!checked)}
                                                            className="h-5 w-5 border-emerald-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                                        />
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {category.types.map((docType) => {
                                                        const isUploaded = documents.some(d => d.document_type === docType.id);
                                                        return (
                                                            <div key={docType.id} className="flex flex-col space-y-2 p-3 bg-gray-50/30 rounded-xl border border-gray-100 hover:border-emerald-200 transition-colors group/item relative">
                                                                <div className="flex items-center justify-between">
                                                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                                                        {isUploaded && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                                                                        {docType.name}
                                                                        <span className="text-red-400 font-bold">*</span>
                                                                    </Label>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="relative flex-1">
                                                                        <input
                                                                            type="file"
                                                                            id={docType.id}
                                                                            className="sr-only"
                                                                            onChange={(e) => handleFileUpload(e.target.files, docType.id, docType.name)}
                                                                            accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls"
                                                                        />
                                                                        <label
                                                                            htmlFor={docType.id}
                                                                            className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:border-emerald-500 hover:text-emerald-600 cursor-pointer transition-all shadow-sm"
                                                                        >
                                                                            <span className="truncate flex-1">
                                                                                {uploadQueue.find(q => q.documentType === docType.id)?.file.name || 'Select file...'}
                                                                            </span>
                                                                            <Upload className="w-3 h-3 opacity-50" />
                                                                        </label>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handlePreview(docType.id, docType.name)}
                                                                        disabled={previewLoading[docType.id]}
                                                                        className="p-1.5 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg border border-gray-100 shadow-sm transition-all shrink-0"
                                                                        title="View Template"
                                                                    >
                                                                        {previewLoading[docType.id] ? (
                                                                            <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />
                                                                        ) : (
                                                                            <Eye className="w-3 h-3" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                ))}
                            </div>

                            {/* Upload Queue Section */}
                            {uploadQueue.length > 0 && (
                                <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Upload Queue</h2>
                                        </div>
                                        <button
                                            onClick={() => setUploadQueue([])}
                                            className="text-[10px] text-red-400 font-bold hover:text-red-500 transition-colors uppercase tracking-[0.1em]"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                    <div className="bg-white border border-emerald-100 rounded-3xl overflow-hidden shadow-2xl shadow-emerald-500/10">
                                        <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                                            {uploadQueue.map((item) => (
                                                <div key={item.id} className="flex items-center justify-between p-3.5 bg-emerald-50/20 rounded-2xl border border-emerald-50/50 hover:bg-emerald-50/40 transition-colors">
                                                    <div className="flex items-center gap-3.5">
                                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-emerald-100 shadow-sm">
                                                            <FileIcon mimeType={item.file.type} />
                                                        </div>
                                                        <div>
                                                            <div className="text-[13px] font-bold text-gray-900 truncate max-w-[180px] md:max-w-md">{item.file.name}</div>
                                                            <div className="text-[10px] text-emerald-600 font-black uppercase tracking-widest opacity-60">
                                                                {item.documentTypeName}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFromQueue(item.id)}
                                                        className="w-9 h-9 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="p-5 bg-gradient-to-t from-emerald-50/30 to-white">
                                            <button
                                                onClick={submitAllDocuments}
                                                disabled={uploading}
                                                className="w-full flex items-center justify-center gap-3 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
                                            >
                                                {uploading ? (
                                                    <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</>
                                                ) : (
                                                    <><CheckCircle2 className="w-5 h-5" /> Submit All ({uploadQueue.length} Files)</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Submitted History */}
                            <div className="space-y-4 pt-10 border-t border-gray-50">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Submitted History</h2>
                                    <div className="text-[10px] text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full font-black tracking-widest border border-emerald-100 shadow-sm">
                                        {documents.length} FILES
                                    </div>
                                </div>

                                {documents.length === 0 ? (
                                    <div className="text-center py-20 bg-gray-50/30 rounded-[32px] border-2 border-dashed border-gray-100/50">
                                        <Inbox className="w-12 h-12 text-gray-200 mx-auto mb-3 opacity-50" />
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No documents submitted yet</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {documents.map((doc) => (
                                            <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-2xl hover:border-emerald-200 hover:shadow-lg transition-all group overflow-hidden relative">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 shrink-0 group-hover:bg-emerald-50 transition-colors">
                                                        <FileIcon mimeType={doc.mime_type} />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <div className="text-xs font-bold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                                                            {doc.file_name}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="text-[9px] text-emerald-600/80 font-black uppercase tracking-tight truncate max-w-[80px]">{doc.document_type}</span>
                                                            <span className="text-[9px] text-gray-300">•</span>
                                                            <span className="text-[9px] text-gray-400 font-medium">
                                                                {new Date(doc.submitted_at || '').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <DocStatusBadge status={doc.status || 'submitted'} />
                                                    {doc.file_url && (
                                                        <a
                                                            href={doc.file_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 hover:bg-emerald-600 hover:text-white transition-all active:scale-90"
                                                            title="Download/Preview"
                                                        >
                                                            <Download className="w-3.5 h-3.5" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
