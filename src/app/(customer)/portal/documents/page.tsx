'use client';

import { useState, useEffect } from 'react';
import {
  Upload, FileText, CheckCircle2, XCircle, Clock,
  Search, Download, Plus,
  Image as ImageIcon, FileSpreadsheet, Inbox, Loader2
} from 'lucide-react';
import { getCustomerDocuments } from '@/lib/customer-db';
import type { DocumentSubmission } from '@/lib/db';

type DocWithQuotation = DocumentSubmission & { quotation_display_id?: string; quotation_no?: string };

function StatusBadge({ status }: { status: string }) {
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
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${c.className}`}>
      <Icon className="w-3 h-3" /> {c.label}
    </span>
  );
}

function FileIcon({ mimeType }: { mimeType?: string }) {
  if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
  if (mimeType?.includes('image')) return <ImageIcon className="w-5 h-5 text-violet-500" />;
  return <FileText className="w-5 h-5 text-blue-500" />;
}

function formatFileSize(bytes?: number) {
  if (!bytes) return 'N/A';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [documents, setDocuments] = useState<DocWithQuotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCustomerDocuments()
      .then((data) => setDocuments(data))
      .catch((err) => console.error('Documents fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = documents.filter(d => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      d.file_name.toLowerCase().includes(query) ||
      (d.quotation_display_id || '').toLowerCase().includes(query) ||
      (d.document_type || '').toLowerCase().includes(query)
    );
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="text-sm text-gray-500 mt-1">View and manage your export documents</p>
      </div>

      {/* Upload Zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          dragOver
            ? 'border-emerald-500 bg-emerald-50'
            : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={() => setDragOver(false)}
      >
        <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Upload className={`w-7 h-7 ${dragOver ? 'text-emerald-600' : 'text-emerald-500'}`} />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          {dragOver ? 'Drop files here' : 'Upload Documents'}
        </h3>
        <p className="text-sm text-gray-500 mb-4">Drag and drop files here, or click to browse</p>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
          <Plus className="w-4 h-4" /> Select Files
        </button>
        <p className="text-xs text-gray-400 mt-3">PDF, Excel, Images &middot; Max 10MB per file</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="text-sm font-medium text-gray-700">
            All Documents ({documents.length})
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Documents Table */}
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
            <h3 className="text-base font-semibold text-gray-900 mb-1">No documents yet</h3>
            <p className="text-sm text-gray-500 max-w-[320px]">
              Documents linked to your quotations will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Document</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Quotation</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Type</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                          <FileIcon mimeType={doc.mime_type} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[250px]">{doc.file_name}</div>
                          <div className="text-xs text-gray-400">{formatFileSize(doc.file_size)} &middot; {formatDate(doc.submitted_at)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-600">{doc.quotation_display_id || 'N/A'}</span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">{doc.document_type}</span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={doc.status || 'submitted'} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {doc.file_url && (
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="View/Download">
                            <Download className="w-4 h-4 text-gray-400" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
