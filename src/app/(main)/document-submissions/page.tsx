'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, CheckCircle, XCircle, FileText, Search, Trash2, ChevronDown, ChevronUp, ExternalLink, Bot, Loader2 } from 'lucide-react';
import { getDocumentSubmissions, getQuotations, updateDocumentSubmission, deleteDocumentSubmission, Quotation as DbQuotation } from '@/lib/db';
import { formatFileSize } from '@/lib/storage';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import JSZip from 'jszip';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { useDocumentAnalysis } from '@/hooks/useDocumentAnalysis';

// Use DbQuotation type from db.ts or extend it if needed locally
// For now, we assume DbQuotation from lib/db is sufficient and includes shipment_photo_url as string[] | null
interface DocumentSubmission {
  id: string;
  quotation_id: string;
  company_name: string;
  document_type: string;
  document_type_id?: string;
  category?: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  notes?: string;
  status?: string;
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  original_file_name: string;
  description?: string; // AI-generated document summary
}

// Define a type for partial updates
type DocumentSubmissionUpdate = {
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
};

const DOCUMENT_CATEGORIES = [
  { id: 'company-info', name: 'Company Information' },
  { id: 'permits-forms', name: 'Permit and TK Forms' },
  { id: 'shipping-docs', name: 'Shipping Documents' },
  { id: 'additional', name: 'Additional Documents' }
];

export default function DocumentSubmissionsPage() {
  const [submissions, setSubmissions] = useState<DocumentSubmission[]>([]);
  const [quotations, setQuotations] = useState<DbQuotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<DocumentSubmission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImagePreviewModalOpen, setIsImagePreviewModalOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [expandedQuotations, setExpandedQuotations] = useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isZipping, setIsZipping] = useState(false);

  // Add AI analysis hook
  const { isAnalyzing, analyzeDocument, processAllDocuments } = useDocumentAnalysis();

  // Add state for tracking which document is being analyzed
  const [analyzingDocuments, setAnalyzingDocuments] = useState<Set<string>>(new Set());

  // Load data function (moved up for reuse)
  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.error('User not authenticated');
        setSubmissions([]);
        setQuotations([]);
        setLoading(false);
        return;
      }

      const userId = user.id;
      const [submissionsData, quotationsData] = await Promise.all([
        getDocumentSubmissions(),
        getQuotations(userId)
      ]);

      // Type cast to ensure compatibility with our local interface
      setSubmissions(submissionsData as unknown as DocumentSubmission[]);
      setQuotations(quotationsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setSubmissions([]);
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  };

  // Check URL parameters for quotation ID when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const quotationParam = urlParams.get('quotation');

      if (quotationParam) {
        // Auto-select the quotation from URL parameter
        setSelectedQuotation(quotationParam);

        // Auto-expand this quotation
        setExpandedQuotations(prev => ({
          ...prev,
          [quotationParam]: true
        }));
      }
    }
  }, []);

  // Load data when page loads
  useEffect(() => {
    loadData();
  }, []);

  // Filter submissions based on search, quotation, and category
  const filteredSubmissions = useMemo(() => {
    if (!submissions) return [];

    return submissions.filter((submission) => {
      // Filter by search term if present
      if (searchTerm && !submission.original_file_name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Filter by selected quotation if any
      if (selectedQuotation !== 'all' && submission.quotation_id !== selectedQuotation) {
        return false;
      }

      return true;
    });
  }, [submissions, searchTerm, selectedQuotation]);

  // Group submissions by quotation for display
  const submissionsByQuotation = filteredSubmissions.reduce((acc, submission) => {
    if (!acc[submission.quotation_id]) {
      acc[submission.quotation_id] = [];
    }
    acc[submission.quotation_id].push(submission);
    return acc;
  }, {} as Record<string, DocumentSubmission[]>);

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSubmission(null);
  };

  const handleOpenImagePreview = (url: string) => {
    setPreviewImageUrl(url);
    setIsImagePreviewModalOpen(true);
  };

  const handleCloseImagePreview = () => {
    setIsImagePreviewModalOpen(false);
    setPreviewImageUrl(null);
  };

  // Download file using fetch + blob URL to handle cross-origin
  const handleDownload = async (url: string, fileName: string) => {
    try {
      // Add loading state indication here if desired (e.g., set button state)
      console.log(`Fetching file from: ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Clean up the object URL
      URL.revokeObjectURL(blobUrl);

      console.log(`Download triggered for: ${fileName}`);
      // Remove loading state indication here if added

    } catch (error) {
      console.error('Download failed:', error);
      // Display error message to the user here (e.g., using a state variable and toast/alert)
      // Remove loading state indication here if added
    }
  };

  // Bulk download function
  const handleBulkDownload = async () => {
    if (selectedIds.size === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const selectedDocs = submissions.filter(s => selectedIds.has(s.id));

      // We need to fetch each file as a blob
      const downloadPromises = selectedDocs.map(async (doc) => {
        try {
          const response = await fetch(doc.file_url);
          if (!response.ok) throw new Error(`Failed to fetch ${doc.file_name}`);
          const blob = await response.blob();

          // Add to zip. If multiple files have the same name, we append ID to avoid overlap
          // But usually original_file_name should be used
          const fileName = doc.original_file_name || doc.file_name || `file_${doc.id.substring(0, 5)}`;
          zip.file(fileName, blob);
        } catch (err) {
          console.error(`Error adding ${doc.original_file_name} to zip:`, err);
        }
      });

      await Promise.all(downloadPromises);

      // Generate ZIP blob
      const content = await zip.generateAsync({ type: 'blob' });

      // Trigger download
      const zipUrl = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `documents_${new Date().getTime()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(zipUrl);

      console.log('Bulk download ZIP generated and triggered');
    } catch (error) {
      console.error('Bulk download failed:', error);
    } finally {
      setIsZipping(false);
    }
  };

  const toggleSelectAll = (quotationId: string, checked: boolean) => {
    const quotationSubmissions = submissionsByQuotation[quotationId] || [];
    const newSelectedIds = new Set(selectedIds);

    quotationSubmissions.forEach(sub => {
      if (checked) {
        newSelectedIds.add(sub.id);
      } else {
        newSelectedIds.delete(sub.id);
      }
    });

    setSelectedIds(newSelectedIds);
  };

  const toggleSelectOne = (id: string, checked: boolean) => {
    const newSelectedIds = new Set(selectedIds);
    if (checked) {
      newSelectedIds.add(id);
    } else {
      newSelectedIds.delete(id);
    }
    setSelectedIds(newSelectedIds);
  };

  // Update document status
  const handleStatusChange = async (id: string, status: 'pending' | 'approved' | 'rejected') => {
    try {
      const update: DocumentSubmissionUpdate = {
        status,
      };

      const result = await updateDocumentSubmission(id, update);

      if (result) {
        // Update submissions list with proper typing
        setSubmissions(prevSubmissions =>
          prevSubmissions.map(sub =>
            sub.id === id ? { ...sub, status } : sub
          )
        );

        if (selectedSubmission && selectedSubmission.id === id) {
          setSelectedSubmission({ ...selectedSubmission, status });
        }

        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Get status badge
  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    switch (status.toLowerCase()) {
      case 'approved': return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Approved</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      case 'pending': return <Badge variant="secondary" className="bg-yellow-400 hover:bg-yellow-500 text-black">Pending</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch {
      // If an error occurs during formatting, return the original string.
      // The error variable _e is intentionally unused here.
      return dateString;
    }
  };

  // Get quotation info
  const getQuotationInfo = (quotationId: string): DbQuotation | undefined => {
    return quotations.find(q => q.id === quotationId);
  };

  // Count documents by category for a quotation
  const countDocumentsByCategory = (quotationId: string, categoryId: string) => {
    return submissions.filter(s =>
      s.quotation_id === quotationId &&
      s.document_type === categoryId
    ).length;
  };

  // Get unique quotation IDs from submissions
  const quotationOptions = useMemo(() => {
    if (!quotations || !Array.isArray(quotations)) return [];

    return quotations.map((quotation) => ({
      value: quotation.id,
      label: `${quotation.company_name} - ${quotation.id.slice(0, 8)}`
    }));
  }, [quotations]);

  // Handle delete document
  const handleDeleteClick = (submission: DocumentSubmission) => {
    setDeletingId(submission.id);
    setIsDeleteModalOpen(true);
  };

  // Confirm delete document
  const confirmDelete = async () => {
    if (!deletingId) return;

    setDeleteLoading(true);
    try {
      const success = await deleteDocumentSubmission(deletingId);

      if (success) {
        // Update UI by removing the deleted document
        setSubmissions(prevSubmissions =>
          prevSubmissions.filter(sub => sub.id !== deletingId)
        );
        setIsDeleteModalOpen(false);
        setDeletingId(null);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Toggle expand/collapse for a quotation
  const toggleExpand = (quotationId: string) => {
    setExpandedQuotations(prev => ({
      ...prev,
      [quotationId]: !prev[quotationId]
    }));
  };

  const openSubmissionModal = (submission: DocumentSubmission) => {
    setSelectedSubmission(submission);
    setIsModalOpen(true);
  };

  // AI Analysis functions
  const handleAnalyzeDocument = async (submission: DocumentSubmission) => {
    if (!submission.file_url || !submission.original_file_name) {
      console.error('Missing file URL or filename for analysis');
      return;
    }

    // Add to analyzing documents set
    setAnalyzingDocuments(prev => new Set(prev).add(submission.id));

    try {
      console.log(`Starting AI analysis for: ${submission.original_file_name}`);

      const result = await analyzeDocument(
        submission.id,
        submission.file_url,
        submission.original_file_name,
        submission.document_type
      );

      if (result.success) {
        console.log(`AI analysis completed for: ${submission.original_file_name}`);
        console.log(`Generated description: ${result.description}`);

        // Immediately update the local state for better UX
        setSubmissions(prevSubmissions =>
          prevSubmissions.map(sub =>
            sub.id === submission.id
              ? { ...sub, description: result.description }
              : sub
          )
        );

        // Also refresh from database to ensure data consistency
        await loadData();
      } else {
        console.error('AI analysis failed:', result.error);
      }
    } catch (error) {
      console.error('Error analyzing document:', error);
    } finally {
      // Remove from analyzing documents set
      setAnalyzingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(submission.id);
        return newSet;
      });
    }
  };

  const handleProcessAllDocuments = async () => {
    try {
      const success = await processAllDocuments();
      if (success) {
        // Refresh data after a short delay to allow processing
        setTimeout(async () => {
          await loadData();
        }, 3000);
      }
    } catch (error) {
      console.error('Error processing all documents:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Document Submissions</h1>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button
              onClick={handleBulkDownload}
              disabled={isZipping}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isZipping ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating ZIP...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download Selected ({selectedIds.size})
                </>
              )}
            </Button>
          )}
          <Button
            onClick={handleProcessAllDocuments}
            disabled={isAnalyzing}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Bot className="h-4 w-4 mr-2" />
                Generate AI Descriptions
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Filters - Modified to remove category filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search document name or type"
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Filter by Quotation</label>
              <Select value={selectedQuotation} onValueChange={setSelectedQuotation}>
                <SelectTrigger>
                  <SelectValue placeholder="All Quotations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quotations</SelectItem>
                  {quotationOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents by Quotation */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-pulse">Loading submissions...</div>
        </div>
      ) : Object.keys(submissionsByQuotation).length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <FileText className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium">No document submissions found</h3>
              <p className="text-sm text-gray-500 mt-1">
                Try adjusting your filters or check back later for new submissions.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(submissionsByQuotation).map(([quotationId, quotationSubmissions]) => {
            const quotationInfo = getQuotationInfo(quotationId);
            if (!quotationInfo) return null;

            const isExpanded = expandedQuotations[quotationId] || false;

            return (
              <Card key={quotationId} className="overflow-hidden">
                <CardHeader className="bg-muted/50 py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl">
                        {quotationInfo.company_name} - {quotationInfo.destination}
                      </CardTitle>
                      <CardDescription>
                        Quotation: {quotationId.substring(0, 8)}... • Created: {formatDate(quotationInfo.created_at)} • Documents: {quotationSubmissions.length}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(quotationId)}
                      className="ml-4"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-2" />
                          Collapse
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-2" />
                          Expand
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="p-0">
                    <Tabs defaultValue="all" className="w-full">
                      <TabsList className="w-full rounded-none px-6 pt-2 flex flex-wrap h-auto">
                        <TabsTrigger value="all">
                          All Documents ({quotationSubmissions.length})
                        </TabsTrigger>
                        {DOCUMENT_CATEGORIES.map(category => {
                          const count = countDocumentsByCategory(quotationId, category.id);
                          return count > 0 ? (
                            <TabsTrigger key={category.id} value={category.id}>
                              {category.name} ({count})
                            </TabsTrigger>
                          ) : null;
                        })}
                        <TabsTrigger value="shipment-qr-photo">
                          Shipment QR & Photo
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="all" className="p-0">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[50px]">
                                  <Checkbox
                                    checked={quotationSubmissions.length > 0 && quotationSubmissions.every(s => selectedIds.has(s.id))}
                                    onCheckedChange={(checked) => toggleSelectAll(quotationId, !!checked)}
                                  />
                                </TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Document Type</TableHead>
                                <TableHead>File Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {quotationSubmissions.map((submission) => (
                                <TableRow key={submission.id}>
                                  <TableCell>
                                    <Checkbox
                                      checked={selectedIds.has(submission.id)}
                                      onCheckedChange={(checked) => toggleSelectOne(submission.id, !!checked)}
                                    />
                                  </TableCell>
                                  <TableCell>{formatDate(submission.submitted_at)}</TableCell>
                                  <TableCell>{submission.document_type}</TableCell>
                                  <TableCell className="max-w-xs truncate" title={submission.original_file_name}>
                                    {submission.original_file_name}
                                  </TableCell>
                                  <TableCell className="max-w-xs" title={submission.description || ''}>
                                    {analyzingDocuments.has(submission.id) ? (
                                      <div className="flex items-center text-blue-600">
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        <span className="text-sm">Analyzing...</span>
                                      </div>
                                    ) : submission.description ? (
                                      <div className="text-sm">
                                        <p className="truncate">{submission.description}</p>
                                      </div>
                                    ) : (
                                      <div className="text-sm text-gray-500 italic">
                                        Click 🤖 to generate AI description
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => openSubmissionModal(submission)}
                                        title="View Details"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => window.open(submission.file_url, '_blank', 'noopener,noreferrer')}
                                        title="Open in new tab"
                                        disabled={!submission.file_url}
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleDownload(submission.file_url, submission.original_file_name)}
                                        title="Download Document"
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleAnalyzeDocument(submission)}
                                        title="Generate AI Description"
                                        disabled={analyzingDocuments.has(submission.id)}
                                        className="text-blue-600 hover:bg-blue-50"
                                      >
                                        {analyzingDocuments.has(submission.id) ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Bot className="h-4 w-4" />
                                        )}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="text-red-500 hover:bg-red-50"
                                        onClick={() => handleDeleteClick(submission)}
                                        title="Delete"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </TabsContent>

                      {DOCUMENT_CATEGORIES.map(category => (
                        <TabsContent key={category.id} value={category.id} className="p-0">
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[50px]">
                                    <Checkbox
                                      checked={quotationSubmissions.filter(s => s.document_type === category.id).length > 0 &&
                                        quotationSubmissions.filter(s => s.document_type === category.id).every(s => selectedIds.has(s.id))}
                                      onCheckedChange={(checked) => {
                                        const categoryDocs = quotationSubmissions.filter(s => s.document_type === category.id);
                                        const newSelectedIds = new Set(selectedIds);
                                        categoryDocs.forEach(s => {
                                          if (checked) newSelectedIds.add(s.id);
                                          else newSelectedIds.delete(s.id);
                                        });
                                        setSelectedIds(newSelectedIds);
                                      }}
                                    />
                                  </TableHead>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Document Type</TableHead>
                                  <TableHead>File Name</TableHead>
                                  <TableHead>Description</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {quotationSubmissions
                                  .filter(submission => submission.document_type === category.id)
                                  .map((submission) => (
                                    <TableRow key={submission.id}>
                                      <TableCell>
                                        <Checkbox
                                          checked={selectedIds.has(submission.id)}
                                          onCheckedChange={(checked) => toggleSelectOne(submission.id, !!checked)}
                                        />
                                      </TableCell>
                                      <TableCell>{formatDate(submission.submitted_at)}</TableCell>
                                      <TableCell>{submission.document_type}</TableCell>
                                      <TableCell className="max-w-xs truncate" title={submission.original_file_name}>
                                        {submission.original_file_name}
                                      </TableCell>
                                      <TableCell className="max-w-xs" title={submission.description || ''}>
                                        {analyzingDocuments.has(submission.id) ? (
                                          <div className="flex items-center text-blue-600">
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            <span className="text-sm">Analyzing...</span>
                                          </div>
                                        ) : submission.description ? (
                                          <div className="text-sm">
                                            <p className="truncate">{submission.description}</p>
                                          </div>
                                        ) : (
                                          <div className="text-sm text-gray-500 italic">
                                            Click 🤖 to generate AI description
                                          </div>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => openSubmissionModal(submission)}
                                            title="View Details"
                                          >
                                            <Eye className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => window.open(submission.file_url, '_blank', 'noopener,noreferrer')}
                                            title="Open in new tab"
                                            disabled={!submission.file_url}
                                          >
                                            <ExternalLink className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleDownload(submission.file_url, submission.original_file_name)}
                                            title="Download Document"
                                          >
                                            <Download className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleAnalyzeDocument(submission)}
                                            title="Generate AI Description"
                                            disabled={analyzingDocuments.has(submission.id)}
                                            className="text-blue-600 hover:bg-blue-50"
                                          >
                                            {analyzingDocuments.has(submission.id) ? (
                                              <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                              <Bot className="h-4 w-4" />
                                            )}
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            className="text-red-500 hover:bg-red-50"
                                            onClick={() => handleDeleteClick(submission)}
                                            title="Delete"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TabsContent>
                      ))}

                      <TabsContent value="shipment-qr-photo" className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                          <div>
                            <h3 className="text-lg font-semibold mb-2">Shipment QR Code</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                              Scan this QR code with a mobile device to access the shipment photo upload page for this quotation.
                            </p>
                            {typeof window !== 'undefined' && (
                              <div className="p-4 border rounded-md inline-block bg-white">
                                <QRCodeCanvas
                                  value={`${window.location.origin}/shipment-photo/${quotationId}`}
                                  size={192}
                                  bgColor={"#ffffff"}
                                  fgColor={"#000000"}
                                  level={"H"}
                                  includeMargin={true}
                                />
                              </div>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              URL: {typeof window !== 'undefined' ? `${window.location.origin}/shipment-photo/${quotationId}` : 'Loading...'}
                            </p>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold mb-2">Uploaded Shipment Photos</h3>
                            {quotationInfo.shipment_photo_url && Array.isArray(quotationInfo.shipment_photo_url) && quotationInfo.shipment_photo_url.length > 0 && (
                              <div className="mb-6 p-4 border rounded-md bg-slate-50">
                                <h4 className="text-md font-semibold mb-3 text-gray-700">Shipment Photos:</h4>
                                <Carousel className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto">
                                  <CarouselContent>
                                    {quotationInfo.shipment_photo_url.map((url, index) => (
                                      <CarouselItem key={index}>
                                        <div className="p-1">
                                          <Card className="overflow-hidden">
                                            <CardContent className="flex aspect-square items-center justify-center p-0 relative">
                                              <Image
                                                src={url}
                                                alt={`Shipment Photo ${index + 1}`}
                                                layout="fill"
                                                objectFit="contain"
                                                className="rounded-md"
                                                onClick={() => handleOpenImagePreview(url)}
                                              />
                                            </CardContent>
                                          </Card>
                                        </div>
                                      </CarouselItem>
                                    ))}
                                  </CarouselContent>
                                  {quotationInfo.shipment_photo_url.length > 1 && (
                                    <>
                                      <CarouselPrevious className="absolute left-[-50px] top-1/2 -translate-y-1/2 fill-black" />
                                      <CarouselNext className="absolute right-[-50px] top-1/2 -translate-y-1/2 fill-black" />
                                    </>
                                  )}
                                </Carousel>
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Document Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {selectedSubmission && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Document Details</DialogTitle>
              <DialogDescription>
                Submitted on {formatDate(selectedSubmission.submitted_at)}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Company</h3>
                <p>{selectedSubmission.company_name || 'Unknown'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Quotation ID</h3>
                <p>{selectedSubmission.quotation_id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Category</h3>
                <p>{selectedSubmission.category || 'Other'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Document Type</h3>
                <p>{selectedSubmission.document_type}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <p>{getStatusBadge(selectedSubmission.status)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">File Size</h3>
                <p>{selectedSubmission.file_size ? formatFileSize(selectedSubmission.file_size) : 'Unknown'}</p>
              </div>
              <div className="col-span-2">
                <h3 className="text-sm font-medium text-gray-500">File Name</h3>
                <p className="truncate">{selectedSubmission.file_name}</p>
              </div>

              {selectedSubmission.notes && (
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedSubmission.notes}</p>
                </div>
              )}

              {selectedSubmission.file_url.endsWith('.pdf') ? (
                <div className="col-span-2 mt-2">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Preview</h3>
                  <div className="border rounded-md p-2">
                    <iframe
                      src={`${selectedSubmission.file_url}#view=FitH`}
                      className="w-full h-64"
                      title={selectedSubmission.file_name}
                    />
                  </div>
                </div>
              ) : selectedSubmission.file_url.endsWith('.jpg') || selectedSubmission.file_url.endsWith('.png') || selectedSubmission.file_url.endsWith('.jpeg') ? (
                <div className="col-span-2 mt-2">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Preview</h3>
                  <div className="border rounded-md p-2 relative w-full h-64">
                    <Image
                      src={selectedSubmission.file_url}
                      alt={selectedSubmission.file_name}
                      layout="fill"
                      objectFit="contain"
                    />
                  </div>
                </div>
              ) : null}

              <div className="col-span-2 flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => handleDownload(selectedSubmission.file_url, selectedSubmission.original_file_name)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </Button>
              </div>
            </div>
            <DialogFooter className="gap-2 flex-wrap sm:justify-between">
              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={handleCloseModal}
                >
                  Close
                </Button>
              </div>
              <div className="space-x-2">
                <Button
                  variant="destructive"
                  onClick={() => handleStatusChange(selectedSubmission.id, 'rejected')}
                  disabled={selectedSubmission.status === 'rejected'}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  variant="default"
                  onClick={() => handleStatusChange(selectedSubmission.id, 'approved')}
                  disabled={selectedSubmission.status === 'approved'}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={deleteLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteLoading}>
              {deleteLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog open={isImagePreviewModalOpen} onOpenChange={handleCloseImagePreview}>
        <DialogContent className="max-w-3xl p-0">
          {previewImageUrl && (
            <Image
              src={previewImageUrl}
              alt="Shipment Photo Preview"
              width={1200}
              height={800}
              objectFit="contain"
              className="rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="text-white text-xl">Loading data...</div>
        </div>
      )}
    </div>
  );
} 