'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, Plus, Trash2, Package, Send,
    Loader2, CheckCircle2, AlertCircle
} from 'lucide-react';
import { createCustomerQuoteRequest } from '@/lib/customer-db';
import toast from 'react-hot-toast';

interface PalletInput {
    id: string;
    length: string;
    width: string;
    height: string;
    weight: string;
    quantity: string;
}

function createEmptyPallet(): PalletInput {
    return {
        id: crypto.randomUUID(),
        length: '',
        width: '',
        height: '',
        weight: '',
        quantity: '1',
    };
}

export default function NewQuoteRequestPage() {
    const [pallets, setPallets] = useState<PalletInput[]>([createEmptyPallet()]);
    const [requestedDestination, setRequestedDestination] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const addPallet = () => {
        setPallets(prev => [...prev, createEmptyPallet()]);
    };

    const removePallet = (id: string) => {
        if (pallets.length === 1) return;
        setPallets(prev => prev.filter(p => p.id !== id));
    };

    const updatePallet = (id: string, field: keyof PalletInput, value: string) => {
        setPallets(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
        // Clear error for this field
        setErrors(prev => {
            const next = { ...prev };
            delete next[`${id}-${field}`];
            return next;
        });
    };

    const handleRequestedDestinationChange = (value: string) => {
        setRequestedDestination(value);
        if (value.trim()) {
            setErrors(prev => {
                const next = { ...prev };
                delete next['requestedDestination'];
                return next;
            });
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!requestedDestination.trim()) {
            newErrors['requestedDestination'] = 'Shipping Destination is required';
        }

        pallets.forEach((p, idx) => {
            const num = idx + 1;
            if (!p.length || parseFloat(p.length) <= 0) newErrors[`${p.id}-length`] = `Pallet ${num}: Length required`;
            if (!p.width || parseFloat(p.width) <= 0) newErrors[`${p.id}-width`] = `Pallet ${num}: Width required`;
            if (!p.height || parseFloat(p.height) <= 0) newErrors[`${p.id}-height`] = `Pallet ${num}: Height required`;
            if (!p.weight || parseFloat(p.weight) <= 0) newErrors[`${p.id}-weight`] = `Pallet ${num}: Weight required`;
            if (!p.quantity || parseInt(p.quantity) < 1) newErrors[`${p.id}-quantity`] = `Pallet ${num}: Qty must be >= 1`;
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) {
            toast.error('Please fill in all required pallet dimensions.');
            return;
        }

        setSubmitting(true);
        try {
            const palletData = pallets.map(p => ({
                length: parseFloat(p.length),
                width: parseFloat(p.width),
                height: parseFloat(p.height),
                weight: parseFloat(p.weight),
                quantity: parseInt(p.quantity),
            }));

            const result = await createCustomerQuoteRequest(palletData, requestedDestination, notes || undefined);

            if (result.success) {
                setSubmitted(true);
                toast.success('Quote request submitted successfully!');
            } else {
                toast.error(result.error || 'Failed to submit request.');
            }
        } catch {
            toast.error('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Success state
    if (submitted) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
                    <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                        Your quote request has been submitted successfully. Our team will review your pallet dimensions,
                        select the appropriate destination & rate, and get back to you shortly.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            href="/portal"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                            Back to My Shipments
                        </Link>
                        <button
                            onClick={() => {
                                setSubmitted(false);
                                setPallets([createEmptyPallet()]);
                                setNotes('');
                            }}
                            className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Submit Another
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/portal" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Request a Quote</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Enter your pallet dimensions and we&apos;ll prepare a shipping quote for you
                    </p>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                    <p className="font-semibold">How it works</p>
                    <p className="mt-1 text-blue-600">
                        Enter your pallet dimensions below. Our team will select the destination, calculate the rate,
                        and send you an approved quotation. You&apos;ll see it in &quot;My Shipments&quot; once approved.
                    </p>
                </div>
            </div>

            {/* Requested Destination */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    Shipping Destination (Where to?) <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    placeholder="e.g. Bangkok to Tokyo / Warehouse Address"
                    value={requestedDestination}
                    onChange={(e) => handleRequestedDestinationChange(e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${errors['requestedDestination'] ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                />
                {errors['requestedDestination'] && (
                    <p className="text-xs text-red-500 mt-1">{errors['requestedDestination']}</p>
                )}
            </div>

            {/* Pallets */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Package className="w-5 h-5 text-emerald-600" />
                        Pallet Dimensions
                    </h2>
                    <button
                        onClick={addPallet}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" /> Add Pallet
                    </button>
                </div>

                {pallets.map((pallet, idx) => (
                    <div key={pallet.id} className="bg-white rounded-xl border border-gray-100 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-bold text-gray-700">
                                Pallet {idx + 1}
                            </span>
                            {pallets.length > 1 && (
                                <button
                                    onClick={() => removePallet(pallet.id)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            {/* Length */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    Length (cm)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0"
                                    value={pallet.length}
                                    onChange={(e) => updatePallet(pallet.id, 'length', e.target.value)}
                                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${errors[`${pallet.id}-length`] ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                />
                            </div>

                            {/* Width */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    Width (cm)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0"
                                    value={pallet.width}
                                    onChange={(e) => updatePallet(pallet.id, 'width', e.target.value)}
                                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${errors[`${pallet.id}-width`] ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                />
                            </div>

                            {/* Height */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    Height (cm)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0"
                                    value={pallet.height}
                                    onChange={(e) => updatePallet(pallet.id, 'height', e.target.value)}
                                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${errors[`${pallet.id}-height`] ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                />
                            </div>

                            {/* Weight */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    Weight (kg)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0"
                                    value={pallet.weight}
                                    onChange={(e) => updatePallet(pallet.id, 'weight', e.target.value)}
                                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${errors[`${pallet.id}-weight`] ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                />
                            </div>

                            {/* Quantity */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    Quantity
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    placeholder="1"
                                    value={pallet.quantity}
                                    onChange={(e) => updatePallet(pallet.id, 'quantity', e.target.value)}
                                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${errors[`${pallet.id}-quantity`] ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                />
                            </div>
                        </div>

                        {/* Pallet summary */}
                        {pallet.length && pallet.width && pallet.height && pallet.weight ? (
                            <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
                                Volume: {((parseFloat(pallet.length) * parseFloat(pallet.width) * parseFloat(pallet.height)) / 1000000).toFixed(3)} m³
                                &nbsp;·&nbsp;
                                Vol. Weight: {((parseFloat(pallet.length) * parseFloat(pallet.width) * parseFloat(pallet.height)) / 6000).toFixed(1)} kg
                                &nbsp;·&nbsp;
                                Actual: {pallet.weight} kg
                                {parseInt(pallet.quantity) > 1 && (
                                    <> &nbsp;·&nbsp; × {pallet.quantity} pcs</>
                                )}
                            </div>
                        ) : null}
                    </div>
                ))}
            </div>

            {/* Total Summary */}
            {
                pallets.some(p => p.length && p.width && p.height && p.weight) && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                        <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Summary</div>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-emerald-800">
                            <span>
                                Total Pallets: <strong>
                                    {pallets.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0)}
                                </strong>
                            </span>
                            <span>
                                Total Weight: <strong>
                                    {pallets.reduce((sum, p) => sum + ((parseFloat(p.weight) || 0) * (parseInt(p.quantity) || 0)), 0).toFixed(1)} kg
                                </strong>
                            </span>
                        </div>
                    </div>
                )
            }

            {/* Notes */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    Additional Notes <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                    rows={3}
                    placeholder="Any special requirements, preferred shipping dates, or other notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
            </div>

            {/* Validation Errors */}
            {
                Object.keys(errors).length > 0 && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                        <div className="text-xs font-bold text-red-700 mb-1">Please fix the following:</div>
                        <ul className="text-xs text-red-600 space-y-0.5">
                            {Object.values(errors).map((err, i) => (
                                <li key={i}>• {err}</li>
                            ))}
                        </ul>
                    </div>
                )
            }

            {/* Submit */}
            <div className="flex items-center justify-between pt-2">
                <Link href="/portal" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                    &larr; Back to My Shipments
                </Link>
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4" /> Submit Quote Request
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
