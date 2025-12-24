'use client';

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import Image from 'next/image';
import { getDocumentTemplate } from '@/lib/db';
import { useState } from 'react';

// Document categories and types (Matched with documents-upload/page.tsx)
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
            { id: 'additional-file', name: 'Additional File' }
        ]
    }
];

export default function DocumentRequirementsPage() {
    const searchParams = useSearchParams();
    const clientName = searchParams.get('client') || 'Client';
    const destination = searchParams.get('destination') || 'Unknown Destination';
    const itemsParam = searchParams.get('items') || '';

    const requiredDocIds = itemsParam.split(',');

    // Filter categories to only show required documents
    const displayCategories = DOCUMENT_CATEGORIES.map(category => ({
        ...category,
        types: category.types.filter(type => requiredDocIds.includes(type.id))
    })).filter(category => category.types.length > 0);

    const [loadingTemplate, setLoadingTemplate] = useState<Record<string, boolean>>({});

    const handleDownloadTemplate = async (docTypeId: string) => {
        try {
            setLoadingTemplate(prev => ({ ...prev, [docTypeId]: true }));
            const template = await getDocumentTemplate(docTypeId);
            if (template && template.file_url) {
                window.open(template.file_url, '_blank');
            } else {
                alert('No template available for this document type.');
            }
        } catch (error) {
            console.error('Error fetching template:', error);
            alert('Failed to load template.');
        } finally {
            setLoadingTemplate(prev => ({ ...prev, [docTypeId]: false }));
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Card className="shadow-lg border-t-4 border-t-primary">
                <div className="flex justify-center pt-6 pb-2">
                    <div className="relative w-[200px] h-[60px]">
                        {/* Use text if logo image fails/doesn't exist, but try to use same structure */}
                        <Image
                            src="/logo.png"
                            alt="Company Logo"
                            fill
                            style={{ objectFit: 'contain' }}
                            priority
                            className="object-contain"
                        />
                    </div>
                </div>

                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-3xl font-bold text-gray-800">Document Checklist</CardTitle>
                    <CardDescription className="text-lg mt-2">
                        Required documents for <span className="font-semibold text-primary">{clientName}</span>
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-6 px-4 sm:px-8">
                    <div className="bg-slate-50 p-4 rounded-lg border mb-8 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
                        <div>
                            <span className="font-semibold">Destination:</span> {destination}
                        </div>
                        <div className="mt-2 sm:mt-0">
                            <span className="font-semibold">Total Documents:</span> {requiredDocIds.length}
                        </div>
                    </div>

                    <div className="space-y-8">
                        {displayCategories.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">
                                No documents specificed in this list.
                            </div>
                        ) : (
                            displayCategories.map(category => (
                                <div key={category.id} className="space-y-3">
                                    <h3 className="text-xl font-semibold text-gray-700 flex items-center border-b pb-2">
                                        {category.name}
                                    </h3>
                                    <div className="grid gap-3">
                                        {category.types.map(doc => (
                                            <div key={doc.id} className="flex items-center justify-between p-3 bg-white border rounded-md shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                        <FileText size={18} />
                                                    </div>
                                                    <span className="font-medium text-gray-800">{doc.name}</span>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDownloadTemplate(doc.id)}
                                                    disabled={loadingTemplate[doc.id]}
                                                    className="text-gray-600 border-gray-300"
                                                >
                                                    {loadingTemplate[doc.id] ? (
                                                        <span className="animate-spin mr-2">⏳</span>
                                                    ) : (
                                                        <Download size={16} className="mr-2" />
                                                    )}
                                                    Template
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>

                <CardFooter className="bg-gray-50 mt-8 border-t p-6 text-center">
                    <p className="text-sm text-gray-500 w-full">
                        Please prepare these documents for your shipment. <br />
                        If you have any questions, please contact our support team.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
