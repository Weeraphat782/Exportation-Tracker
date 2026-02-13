'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  FileText, Upload, Plane, Clock, CheckCircle2,
  ArrowRight, Eye,
  MapPin, Loader2
} from 'lucide-react';
import { useCustomerAuth } from '@/contexts/customer-auth-context';
import { getCustomerStats } from '@/lib/customer-db';
import type { Quotation } from '@/lib/db';

// ============ STATUS BADGE ============
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    sent: 'bg-blue-50 text-blue-700',
    accepted: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-red-50 text-red-700',
    completed: 'bg-violet-50 text-violet-700',
    pending: 'bg-amber-50 text-amber-700',
    docs_uploaded: 'bg-cyan-50 text-cyan-700',
    Shipped: 'bg-blue-50 text-blue-700',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] || styles.draft}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

// ============ EMPTY STATE ============
function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-300" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 max-w-[250px]">{description}</p>
    </div>
  );
}

// ============ PAGE ============
export default function CustomerDashboard() {
  const { profile } = useCustomerAuth();
  const displayName = profile?.full_name || profile?.company || 'Customer';

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeQuotations: 0,
    inTransit: 0,
    completed: 0,
    totalQuotations: 0,
  });
  const [recentQuotations, setRecentQuotations] = useState<Quotation[]>([]);

  useEffect(() => {
    getCustomerStats()
      .then((data) => {
        setStats({
          activeQuotations: data.activeQuotations,
          inTransit: data.inTransit,
          completed: data.completed,
          totalQuotations: data.totalQuotations,
        });
        setRecentQuotations(data.recentQuotations);
      })
      .catch((err) => console.error('Dashboard fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Total Quotations', value: stats.totalQuotations.toString(), icon: FileText, color: 'emerald' },
    { label: 'Active', value: stats.activeQuotations.toString(), icon: Clock, color: 'amber' },
    { label: 'In Transit', value: stats.inTransit.toString(), icon: Plane, color: 'blue' },
    { label: 'Completed', value: stats.completed.toString(), icon: CheckCircle2, color: 'violet' },
  ];

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
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {displayName}</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your export activities</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                stat.color === 'emerald' ? 'bg-emerald-50' :
                stat.color === 'amber' ? 'bg-amber-50' :
                stat.color === 'blue' ? 'bg-blue-50' : 'bg-violet-50'
              }`}>
                <stat.icon className={`w-5 h-5 ${
                  stat.color === 'emerald' ? 'text-emerald-600' :
                  stat.color === 'amber' ? 'text-amber-600' :
                  stat.color === 'blue' ? 'text-blue-600' : 'text-violet-600'
                }`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-300" /> : stat.value}
            </div>
            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Quotations — 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Quotations</h2>
            <Link href="/portal/quotations" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : recentQuotations.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No quotations yet"
              description="Your quotations will appear here once our team assigns them to you."
            />
          ) : (
            <div className="divide-y divide-gray-50">
              {recentQuotations.map((q) => (
                <div key={q.id} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{q.quotation_no || q.id.slice(0, 8)}</div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                        <MapPin className="w-3 h-3" /> {q.destination || q.company_name || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <div className="text-sm font-medium text-gray-900">{formatAmount(q.total_cost)}</div>
                      <div className="text-xs text-gray-400">{formatDate(q.created_at)}</div>
                    </div>
                    <StatusBadge status={q.status} />
                    <Link href={`/portal/quotations/${q.id}`} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                      <Eye className="w-4 h-4 text-gray-400" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Action Required</h2>
            </div>
            <div className="p-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">All caught up!</p>
              <p className="text-xs text-gray-400 mt-0.5">No pending actions</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link href="/portal/quotations" className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 transition-colors group">
                <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-100">
                  <FileText className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">View Quotations</div>
                  <div className="text-xs text-gray-500">Check your quotes</div>
                </div>
              </Link>
              <Link href="/portal/documents" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100">
                  <Upload className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Upload Documents</div>
                  <div className="text-xs text-gray-500">Submit required paperwork</div>
                </div>
              </Link>
              <Link href="/portal/shipments" className="flex items-center gap-3 p-3 rounded-lg hover:bg-violet-50 transition-colors group">
                <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center group-hover:bg-violet-100">
                  <Plane className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Track Shipments</div>
                  <div className="text-xs text-gray-500">Monitor delivery progress</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
