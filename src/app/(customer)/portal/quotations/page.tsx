'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Search, Eye,
  MapPin, CalendarDays,
  Plane, Inbox, Loader2
} from 'lucide-react';
import { getCustomerQuotations } from '@/lib/customer-db';
import type { Quotation } from '@/lib/db';


import { useCustomerAuth } from '@/contexts/customer-auth-context';

export default function QuotationsListPage() {
  const { user, isLoading: authLoading } = useCustomerAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user?.id) {
      setLoading(false);
      return;
    }

    getCustomerQuotations(user.id)
      .then((data) => setQuotations(data))
      .catch((err) => console.error('[Quotations] Fetch error:', err))
      .finally(() => setLoading(false));
  }, [user?.id, authLoading]);

  const filtered = quotations.filter(q => {
    const query = searchQuery.toLowerCase();
    if (query) {
      const qNo = (q.quotation_no || '').toLowerCase();
      const dest = (q.destination || '').toLowerCase();
      const company = (q.company_name || '').toLowerCase();
      if (!qNo.includes(query) && !dest.includes(query) && !company.includes(query)) return false;
    }
    return true;
  });

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  };

  const formatAmount = (amount: number) => {
    return `฿${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Quotations</h1>
        <p className="text-sm text-gray-500 mt-1">View and track all your shipping quotations</p>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search quotation or destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-72 pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {quotations.length === 0 ? 'No quotations yet' : 'No matching quotations'}
            </h3>
            <p className="text-sm text-gray-500 max-w-[320px]">
              {quotations.length === 0
                ? 'Your quotations will appear here once our team assigns them to you.'
                : 'Try adjusting your search or filter criteria.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Quotation</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Destination</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Method</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Amount</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((q) => (
                    <tr key={q.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-gray-900">{q.quotation_no || q.id.slice(0, 8)}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <CalendarDays className="w-3 h-3" /> {formatDate(q.created_at)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" /> {q.destination || 'N/A'}
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Plane className="w-3.5 h-3.5 text-sky-500" />
                          Air Freight
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-gray-900">{formatAmount(q.total_cost)}</div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link href={`/portal/quotations/${q.id}`} className="p-2 rounded-lg hover:bg-gray-100 transition-colors inline-flex" title="View details">
                          <Eye className="w-4 h-4 text-gray-400" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/30">
              <div className="text-sm text-gray-500">
                Showing <span className="font-medium text-gray-700">{filtered.length}</span> of <span className="font-medium text-gray-700">{quotations.length}</span> quotations
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
