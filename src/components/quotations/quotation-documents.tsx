"use client";

import React, { useEffect, useState } from 'react';
import { getDocumentSubmissions, DocumentSubmission } from '@/lib/db';
import { FileText, ExternalLink, Loader2, File } from 'lucide-react';
import { Button } from '@/components/ui/button';


interface QuotationDocumentsProps {
    quotationId: string;
}

export function QuotationDocuments({ quotationId }: QuotationDocumentsProps) {
    const [documents, setDocuments] = useState<DocumentSubmission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDocuments = async () => {
            setLoading(true);
            try {
                const docs = await getDocumentSubmissions(quotationId);
                setDocuments(docs || []);
            } catch (error) {
                console.error("Error fetching documents:", error);
            } finally {
                setLoading(false);
            }
        };

        if (quotationId) {
            fetchDocuments();
        }
    }, [quotationId]);

    if (loading) {
        return <div className="p-2 text-xs text-gray-400 flex items-center"><Loader2 className="h-3 w-3 animate-spin mr-1.5" />Loading documents...</div>;
    }

    if (documents.length === 0) {
        return null;
    }

    return (
        <div className="mt-3 pt-3 border-t border-gray-100">
            <h5 className="text-xs font-bold text-gray-500 mb-2 uppercase flex items-center">
                <File className="h-3 w-3 mr-1.5" />
                Attached Documents ({documents.length})
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 rounded border border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50/30 transition-colors group">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="h-8 w-8 rounded bg-blue-50 flex items-center justify-center shrink-0 text-blue-600">
                                <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-xs font-medium text-gray-900 truncate" title={doc.file_name}>
                                    {doc.document_type || 'Document'}
                                </div>
                                <div className="text-[10px] text-gray-500 truncate">
                                    {doc.file_name} {doc.file_size ? `(${(doc.file_size / 1024).toFixed(1)} KB)` : ''}
                                </div>
                            </div>
                        </div>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="ml-2">
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-blue-600">
                                <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
}
