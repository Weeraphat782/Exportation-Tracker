'use client';

import { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadFile } from '@/lib/storage';
import { createDocumentSubmission, getDocumentTemplate, updateQuotation } from '@/lib/db';
import { Upload, Check, AlertCircle, X, Trash, ChevronUp, ChevronDown, FileText } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Document categories and types
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

// Flatten all document types for easier lookup
const ALL_DOCUMENT_TYPES = DOCUMENT_CATEGORIES.flatMap(category => 
  category.types.map(type => ({...type, category: category.id}))
);

// Allowed file types and size limits
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Define type for files in the upload queue
interface QueuedFile {
  file: File;
  documentType: string;
  documentTypeName: string;
  notes: string;
  id: string; // Unique identifier for this queued file
}

// Define type for uploaded files
interface UploadedFile {
  id: string;
  name: string;
  type: string;
  documentType: string;
  uploadTime: string;
}

export default function DocumentUploadPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const quotationId = params.id as string;
  const companyName = searchParams.get('company') || 'Unknown Company';
  const destination = searchParams.get('destination') || 'Unknown Destination';

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'company-info': true,
    'permits-forms': true,
    'shipping-docs': true,
    'additional': true
  });
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File[]>>({});
  const [notes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadQueue, setUploadQueue] = useState<QueuedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewLoading, setPreviewLoading] = useState<Record<string, boolean>>({});
  
  // Toggle section open/closed
  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // File validation
  const validateFile = (file: File) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError('Invalid file type. Please upload PDF, Word, Excel, or image files.');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File is too large. Maximum size is 10MB.');
      return false;
    }

    setError(null);
    return true;
  };

  // Handle file selection for a specific document type
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, documentTypeId: string) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        // Add to existing files for this document type
        setSelectedFiles(prev => ({
          ...prev,
          [documentTypeId]: [...(prev[documentTypeId] || []), file]
        }));

        // Add to queue automatically
        const docType = ALL_DOCUMENT_TYPES.find(type => type.id === documentTypeId);
        if (docType) {
          addToQueue(file, documentTypeId, docType.name, notes[documentTypeId] || '');
        }

        // Clear file input value to allow selecting the same file again
        e.target.value = '';
      } else {
        e.target.value = '';
      }
    }
  };

  // Add file to upload queue
  const addToQueue = (file: File, documentType: string, documentTypeName: string, note: string) => {
    setUploadQueue(prev => [
      ...prev, 
      { 
        file: file, 
        documentType: documentType,
        documentTypeName: documentTypeName,
        notes: note,
        id: `${Date.now()}-${file.name}`
      }
    ]);
  };

  // Remove file from queue
  const removeFromQueue = (id: string) => {
    setUploadQueue(uploadQueue.filter(item => item.id !== id));
  };

  // Remove a specific file for a document type
  const removeFile = (documentTypeId: string, fileIndex: number) => {
    setSelectedFiles(prev => {
      const updatedFiles = [...(prev[documentTypeId] || [])];
      updatedFiles.splice(fileIndex, 1);
      return {
        ...prev,
        [documentTypeId]: updatedFiles
      };
    });

    // Also remove from queue
    const fileToRemove = selectedFiles[documentTypeId]?.[fileIndex];
    if (fileToRemove) {
      const fileId = uploadQueue.find(
        item => item.file.name === fileToRemove.name && item.documentType === documentTypeId
      )?.id;
      
      if (fileId) {
        removeFromQueue(fileId);
      }
    }
  };

  // Upload all files from queue
  const handleSubmitAll = async () => {
    if (uploadQueue.length === 0) {
      setError('Please add at least one file to upload.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const results = [];

    for (const queuedFile of uploadQueue) {
      try {
        // Create path for file
        const filePath = `${quotationId}/${queuedFile.documentType}/${queuedFile.file.name}`;
        
        // Upload to Supabase Storage
        const fileUrl = await uploadFile('documents', filePath, queuedFile.file);

        if (!fileUrl) {
          console.error(`Failed to upload file: ${queuedFile.file.name}`);
          continue;
        }

        // Save submission record to database
        const submission = {
          quotation_id: quotationId,
          company_name: companyName,
          document_type: queuedFile.documentTypeName,
          category: ALL_DOCUMENT_TYPES.find(type => type.id === queuedFile.documentType)?.category || '',
          document_type_id: queuedFile.documentType,
          file_name: queuedFile.file.name,
          file_url: fileUrl,
          file_size: queuedFile.file.size,
          mime_type: queuedFile.file.type,
          notes: queuedFile.notes,
          status: 'submitted'
        };

        const result = await createDocumentSubmission(submission);

        if (result) {
          results.push(result);
          
          // Add to uploaded files list
          setUploadedFiles(prev => [
            ...prev,
            {
              id: result.id,
              name: queuedFile.file.name,
              type: queuedFile.documentTypeName,
              documentType: queuedFile.documentType,
              uploadTime: new Date().toLocaleString()
            }
          ]);
        }
      } catch (err) {
        console.error('Error uploading document:', err);
      }
    }

    // Update quotation status to indicate documents have been uploaded
    try {
      await updateQuotation(quotationId, { status: 'docs_uploaded' });
      console.log('Quotation status updated to: docs_uploaded');
    } catch (err) {
      console.error('Error updating quotation status:', err);
    }

    // Clear the queue after uploading
    setUploadQueue([]);
    setSelectedFiles({});
    setIsSubmitting(false);
    setSuccess(true);

    // Hide success message after 5 seconds
    setTimeout(() => {
      setSuccess(false);
    }, 5000);
  };

  // Simplified preview function that opens the file directly in a new tab
  const handlePreview = async (documentTypeId: string, documentName: string) => {
    try {
      setPreviewLoading(prev => ({ ...prev, [documentTypeId]: true }));
      setError(null);
      
      const template = await getDocumentTemplate(documentTypeId);
      
      if (template && template.file_url) {
        // Open the URL directly in a new tab
        window.open(template.file_url, '_blank');
      } else {
        setError(`No template available for ${documentName}`);
      }
    } catch (err) {
      console.error('Error loading document template:', err);
      setError('Failed to load document template');
    } finally {
      setPreviewLoading(prev => ({ ...prev, [documentTypeId]: false }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Card className="shadow-lg">
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-2xl">Document Upload</CardTitle>
          <CardDescription>
            Upload required documents for quotation <span className="font-semibold">{quotationId}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-6">
            <div className="flex items-center space-x-2 text-lg font-medium">
              <h2>Quotation Information</h2>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Company Name:</span>
                <span className="font-medium">{companyName}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Destination:</span>
                <span className="font-medium">{destination}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Quotation ID:</span>
                <span className="font-medium">{quotationId}</span>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2 text-green-700">
              <Check className="h-5 w-5" />
              <span>Documents uploaded successfully!</span>
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
              <Button variant="ghost" size="sm" className="ml-auto p-0 h-5 w-5" onClick={() => setError(null)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Document Upload Sections */}
          <div className="space-y-4 mb-6">
            {DOCUMENT_CATEGORIES.map(category => (
              <Collapsible
                key={category.id}
                open={openSections[category.id]}
                onOpenChange={() => toggleSection(category.id)}
                className="border rounded-md overflow-hidden"
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-slate-50">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium">{category.name}</h3>
                    
                    {/* Show count of files selected for this category */}
                    {(() => {
                      const fileCount = category.types.reduce((count, type) => {
                        return count + (selectedFiles[type.id]?.length || 0);
                      }, 0);
                      
                      if (fileCount > 0) {
                        return (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                            {fileCount} file{fileCount !== 1 ? 's' : ''}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  {openSections[category.id] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-4 space-y-4 bg-white">
                    {category.types.map(docType => {
                      const hasFiles = selectedFiles[docType.id]?.length > 0;
                      
                      return (
                        <div 
                          key={docType.id} 
                          className={`border-b pb-4 last:border-b-0 last:pb-0 ${
                            hasFiles ? 'bg-green-50 rounded-md p-3 border border-green-200' : ''
                          }`}
                        >
                          <div className="flex flex-wrap md:flex-nowrap md:items-start gap-4">
                            <div className="w-full md:w-1/3">
                              <Label htmlFor={docType.id} className="font-medium">
                                {docType.name}<span className="text-red-500">*</span>
                              </Label>
                            </div>
                            <div className="w-full md:w-2/3 space-y-2">
                              <Input
                                id={docType.id}
                                type="file"
                                className="mt-1"
                                onChange={(e) => handleFileChange(e, docType.id)}
                                accept={ALLOWED_FILE_TYPES.join(',')}
                              />
                              
                              {/* Display selected files */}
                              {selectedFiles[docType.id]?.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  <p className="text-sm font-medium text-green-700">Selected files:</p>
                                  <ul className="space-y-1 max-h-40 overflow-y-auto">
                                    {selectedFiles[docType.id].map((file, index) => (
                                      <li key={index} className="flex items-center justify-between bg-white p-2 rounded border text-sm">
                                        <span className="truncate">{file.name}</span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeFile(docType.id, index)}
                                          className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                                        >
                                          <Trash className="h-3.5 w-3.5" />
                                        </Button>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              <div className="flex justify-between">
                                <p className="text-xs text-gray-500">
                                  {hasFiles 
                                    ? `${selectedFiles[docType.id].length} file(s) selected` 
                                    : 'No file chosen'}
                                </p>
                                <Button 
                                  type="button" 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handlePreview(docType.id, docType.name)}
                                  disabled={previewLoading[docType.id]}
                                >
                                  {previewLoading[docType.id] ? (
                                    <span className="animate-spin mr-1">⏳</span>
                                  ) : (
                                    <FileText className="h-3.5 w-3.5 mr-1" />
                                  )}
                                  Preview
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>

          {/* Upload Queue */}
          {uploadQueue.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Upload Queue</h3>
              <Card>
                <ScrollArea className="h-60">
                  <div className="p-4 space-y-2">
                    {uploadQueue.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border">
                        <div className="flex-1">
                          <p className="font-medium truncate">{item.file.name}</p>
                          <p className="text-sm text-gray-500">{item.documentTypeName}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromQueue(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <Separator />
                <div className="p-4">
                  <Button
                    type="button"
                    onClick={handleSubmitAll}
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Submit All Documents ({uploadQueue.length})
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Uploaded Documents</h3>
              <div className="bg-gray-50 rounded-md p-3 border">
                <ScrollArea className="h-60">
                  <ul className="divide-y">
                    {uploadedFiles.map((file) => (
                      <li key={file.id} className="py-2 flex justify-between items-center">
                        <div>
                          <div className="font-medium">{file.name}</div>
                          <div className="text-sm text-gray-500">{file.type} • {file.uploadTime}</div>
                        </div>
                        <Check className="h-5 w-5 text-green-500" />
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-gray-50 flex justify-between">
          <p className="text-sm text-gray-500">
            Upload all required documents for your shipment to expedite processing.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 