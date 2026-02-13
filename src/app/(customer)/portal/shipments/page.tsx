'use client';

import { useEffect, useState } from 'react';
import {
  Plane, Package, MapPin, CalendarDays,
  CheckCircle2, FileCheck, Inbox, Loader2
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

  // แสดง quotations ที่มีสถานะเกี่ยวกับการจัดส่ง
  const shipped = quotations.filter(q => q.status === 'Shipped');
  const completed = quotations.filter(q => q.status === 'completed');
  const accepted = quotations.filter(q => q.status === 'accepted');

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  };

  const formatAmount = (amount: number) => {
    return `฿${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // รวม quotations ที่เกี่ยวกับ shipment (shipped + completed + accepted)
  const shipmentQuotations = [...shipped, ...accepted, ...completed];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Shipment Tracking</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor your shipments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Plane className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-300" /> : shipped.length}
              </div>
              <div className="text-xs text-gray-500">Shipped</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-300" /> : accepted.length}
              </div>
              <div className="text-xs text-gray-500">Preparing</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-300" /> : completed.length}
              </div>
              <div className="text-xs text-gray-500">Completed</div>
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
            <h3 className="text-base font-semibold text-gray-900 mb-1">No shipments yet</h3>
            <p className="text-sm text-gray-500 max-w-[320px]">
              Shipment information will appear here once your quotations are accepted and shipped.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {shipmentQuotations.map((q) => {
            const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
              Shipped: { label: 'Shipped', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
              accepted: { label: 'Preparing', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
              completed: { label: 'Delivered', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200' },
            };
            const sc = statusConfig[q.status] || statusConfig.accepted;

            return (
              <div key={q.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      q.status === 'completed' ? 'bg-emerald-50' : q.status === 'Shipped' ? 'bg-blue-50' : 'bg-amber-50'
                    }`}>
                      <Plane className={`w-6 h-6 ${
                        q.status === 'completed' ? 'text-emerald-600' : q.status === 'Shipped' ? 'text-blue-600' : 'text-amber-600'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-base font-semibold text-gray-900">{q.quotation_no || q.id.slice(0, 8)}</span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${sc.bgColor} ${sc.color}`}>
                          {q.status === 'Shipped' && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 animate-pulse" />}
                          {q.status === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1.5" />}
                          {sc.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {q.destination || q.company_name || 'N/A'}</span>
                        <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" /> {q.pallets?.length || 0} pallets</span>
                        <span className="hidden sm:flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {formatDate(q.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{formatAmount(q.total_cost)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
