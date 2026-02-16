'use client';

import { useEffect, useState } from 'react';
import {
  Plane, Package, MapPin, CalendarDays,
  CheckCircle2, Inbox, Loader2
} from 'lucide-react';
import { getCustomerQuotations } from '@/lib/customer-db';
import type { Quotation } from '@/lib/db';

export default function ShipmentsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCustomerQuotations()
      .then((data) => setQuotations(data))
      .catch((err) => console.error('Shipments fetch error:', err))
      .finally(() => setLoading(false));
  }, []);


  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  };

  const formatAmount = (amount: number) => {
    return `฿${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // รวม quotations ที่เกี่ยวกับ shipment (shipped + accepted + completed)
  const shipmentQuotations = quotations.filter(q =>
    q.status === 'Shipped' ||
    q.status === 'completed' ||
    q.status === 'accepted' ||
    (q.opportunities && q.opportunities.stage !== 'inquiry' && q.opportunities.stage !== 'quoting')
  );

  const getStageDisplay = (stage?: string, status?: string) => {
    if (status === 'completed') return { label: 'Delivered', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200', step: 5 };
    if (status === 'Shipped') return { label: 'Shipped', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200', step: 4 };

    switch (stage) {
      case 'payment_received':
        return { label: 'Payment Received', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200', step: 5 };
      case 'awb_received':
        return { label: 'AWB Received', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200', step: 4 };
      case 'booking_requested':
        return { label: 'Booking Requested', color: 'text-cyan-700', bgColor: 'bg-cyan-50 border-cyan-200', step: 3 };
      case 'pending_booking':
        return { label: 'Pending Booking', color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200', step: 2 };
      case 'pending_docs':
        return { label: 'Pending Documents', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200', step: 1 };
      default:
        return { label: 'Preparing', color: 'text-slate-700', bgColor: 'bg-slate-50 border-slate-200', step: 0 };
    }
  };

  const steps = [
    { label: 'Pending Documents', step: 1 },
    { label: 'Pending Booking', step: 2 },
    { label: 'Booking Requested', step: 3 },
    { label: 'AWB Received', step: 4 },
    { label: 'Delivered', step: 5 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipment Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor your shipments in real-time</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Live Updates</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-300" /> : shipmentQuotations.filter(q => getStageDisplay(q.opportunities?.stage, q.status).step < 4).length}
              </div>
              <div className="text-xs text-gray-500">In Progress</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Plane className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-300" /> : shipmentQuotations.filter(q => getStageDisplay(q.opportunities?.stage, q.status).step === 4).length}
              </div>
              <div className="text-xs text-gray-500">Shipped</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-300" /> : shipmentQuotations.filter(q => getStageDisplay(q.opportunities?.stage, q.status).step === 5).length}
              </div>
              <div className="text-xs text-gray-500">Delivered</div>
            </div>
          </div>
        </div>
      </div>

      {/* Shipment Cards */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        </div>
      ) : shipmentQuotations.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No active shipments</h3>
            <p className="text-sm text-gray-500 max-w-[320px]">
              Shipment information will appear here once your quotations proceed to the processing stage.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {shipmentQuotations.map((q) => {
            const sc = getStageDisplay(q.opportunities?.stage, q.status);

            return (
              <div key={q.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all p-0 group">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${sc.step === 5 ? 'bg-emerald-50 text-emerald-600' : sc.step >= 4 ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                        <Plane className={`w-7 h-7 ${sc.step >= 4 ? 'animate-bounce' : ''}`} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-gray-900">{q.quotation_no || q.id.slice(0, 8)}</span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${sc.bgColor} ${sc.color}`}>
                            {sc.step === 4 && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 animate-pulse" />}
                            {sc.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 font-medium">
                          <span className="flex items-center gap-1.5 text-blue-600 font-bold"><MapPin className="w-4 h-4" /> {q.destination || q.company_name || 'N/A'}</span>
                          <span className="flex items-center gap-1.5"><Package className="w-4 h-4 text-gray-400" /> {q.pallets?.length || 0} pallets</span>
                          <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-gray-400" /> {formatDate(q.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 self-start md:self-auto">
                      <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest text-right mb-0.5">Total Value</div>
                      <div className="text-xl font-black text-gray-900">{formatAmount(q.total_cost)}</div>
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div className="mt-8 px-2">
                    <div className="relative">
                      {/* Gray Line Background */}
                      <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full" />

                      {/* Active Line */}
                      <div
                        className={`absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full transition-all duration-1000 ${sc.step === 5 ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                        style={{ width: `${Math.min((sc.step / 5) * 100, 100)}%` }}
                      />

                      {/* Step Bubbles */}
                      <div className="relative flex justify-between">
                        {steps.map((step) => {
                          const isActive = sc.step >= step.step;
                          const isCurrent = sc.step === step.step;
                          return (
                            <div key={step.step} className="flex flex-col items-center">
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 z-10 ${isCurrent
                                ? 'bg-white border-blue-600 scale-125 shadow-lg shadow-blue-100'
                                : isActive
                                  ? 'bg-blue-600 border-blue-600'
                                  : 'bg-white border-gray-200'
                                }`}>
                                {isActive && !isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                {isCurrent && <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />}
                              </div>
                              <span className={`text-[10px] font-black uppercase tracking-tighter mt-3 transition-colors ${isActive ? 'text-gray-900' : 'text-gray-400'
                                }`}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer/Details */}
                <div className="bg-gray-50/50 border-t border-gray-50 px-6 py-3 flex items-center justify-between">
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    Last update: {formatDate(q.updated_at || q.created_at)}
                  </div>
                  <button className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1.5 group/btn">
                    View Details
                    <div className="w-4 h-4 bg-emerald-100 rounded flex items-center justify-center group-hover/btn:translate-x-1 transition-transform">
                      <Package className="w-2.5 h-2.5" />
                    </div>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
