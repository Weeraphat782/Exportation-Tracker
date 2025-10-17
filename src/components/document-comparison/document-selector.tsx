'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileCheck, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Document {
  id: string;
  quotation_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  submitted_at: string;
  description?: string;
}

interface Quotation {
  id: string;
  company_name: string;
  destination: string;
  created_at: string;
  customer_name: string;
  status: string;
}

interface DocumentSelectorProps {
  onAnalyze: (quotationId: string, documentIds: string[]) => void;
  isAnalyzing: boolean;
}

export function DocumentSelector({ onAnalyze, isAnalyzing }: DocumentSelectorProps) {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  // Load quotations on mount
  useEffect(() => {
    loadQuotations();
  }, []);

  // Load documents when quotation changes
  useEffect(() => {
    if (selectedQuotationId) {
      loadDocuments(selectedQuotationId);
      setSelectedDocuments(new Set()); // Reset selection
    } else {
      setDocuments([]);
      setSelectedDocuments(new Set());
    }
  }, [selectedQuotationId]);

  async function loadQuotations() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      const { data, error } = await supabase
        .from('quotations')
        .select('id, company_name, destination, created_at, contact_person, status')
        .eq('user_id', user.id)
        .in('status', ['draft', 'sent', 'accepted', 'rejected', 'docs_uploaded'])  // Show all except completed
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading quotations:', error);
        return;
      }

      // Map contact_person to customer_name for compatibility
      const mappedData = (data || []).map(q => ({
        ...q,
        customer_name: q.contact_person
      }));

      setQuotations(mappedData as Quotation[]);
    } catch (error) {
      console.error('Error loading quotations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadDocuments(quotationId: string) {
    setLoadingDocuments(true);
    try {
      console.log('Loading documents for quotation:', quotationId);
      const response = await fetch(`/api/document-comparison/list-documents?quotation_id=${quotationId}`);
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error('Failed to load documents');
      }

      const data = await response.json();
      console.log('Received data:', data);
      console.log('Documents count:', data.documents?.length || 0);
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoadingDocuments(false);
    }
  }

  function toggleDocument(documentId: string) {
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(documentId)) {
      newSelected.delete(documentId);
    } else {
      newSelected.add(documentId);
    }
    setSelectedDocuments(newSelected);
  }

  function handleSelectAll() {
    if (selectedDocuments.size === documents.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(documents.map(d => d.id)));
    }
  }

  function handleAnalyze() {
    if (!selectedQuotationId || selectedDocuments.size === 0) {
      return;
    }
    onAnalyze(selectedQuotationId, Array.from(selectedDocuments));
  }

  const selectedQuotation = quotations.find(q => q.id === selectedQuotationId);

  return (
    <div className="space-y-6">
      {/* Quotation Selection */}
      <Card>
        <CardHeader>
          <CardTitle>1. Select Quotation</CardTitle>
          <CardDescription>
            Choose a quotation to analyze its documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Select value={selectedQuotationId} onValueChange={setSelectedQuotationId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a quotation..." />
              </SelectTrigger>
              <SelectContent>
                {quotations.map((quotation) => (
                  <SelectItem key={quotation.id} value={quotation.id}>
                    <div className="flex items-center gap-2">
                      <span>{quotation.company_name} → {quotation.destination} ({quotation.customer_name})</span>
                      <Badge 
                        variant={quotation.status === 'draft' ? 'secondary' : 'default'}
                        className="ml-2"
                      >
                        {quotation.status}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedQuotation && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Selected Quotation Details:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Company:</span>{' '}
                  <span className="font-medium">{selectedQuotation.company_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Destination:</span>{' '}
                  <span className="font-medium">{selectedQuotation.destination}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Customer:</span>{' '}
                  <span className="font-medium">{selectedQuotation.customer_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>{' '}
                  <Badge 
                    variant={selectedQuotation.status === 'draft' ? 'secondary' : 'default'}
                  >
                    {selectedQuotation.status}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Created:</span>{' '}
                  <span className="font-medium">{new Date(selectedQuotation.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Selection */}
      {selectedQuotationId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>2. Select Documents to Analyze</CardTitle>
                <CardDescription>
                  Choose at least 2 documents for cross-document comparison
                </CardDescription>
              </div>
              {documents.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedDocuments.size === documents.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loadingDocuments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Documents Found</h3>
                <p className="text-sm text-muted-foreground">
                  This quotation doesn&apos;t have any uploaded documents yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedDocuments.has(doc.id)}
                      onCheckedChange={() => toggleDocument(doc.id)}
                      id={doc.id}
                    />
                    <label htmlFor={doc.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{doc.file_name}</span>
                        <Badge variant="outline">{doc.document_type}</Badge>
                      </div>
                      {doc.description && (
                        <p className="text-sm text-muted-foreground">{doc.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Uploaded: {new Date(doc.submitted_at).toLocaleString()}
                      </p>
                    </label>
                  </div>
                ))}
              </div>
            )}

            {documents.length > 0 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {selectedDocuments.size} of {documents.length} documents selected
                </div>
                <Button
                  onClick={handleAnalyze}
                  disabled={selectedDocuments.size < 2 || isAnalyzing}
                  size="lg"
                  className="gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <FileCheck className="h-5 w-5" />
                      Run AI Verification ({selectedDocuments.size} docs)
                    </>
                  )}
                </Button>
              </div>
            )}

            {selectedDocuments.size === 1 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Please select at least 2 documents for cross-document comparison.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

