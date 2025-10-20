'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { FileCheck, AlertCircle, ArrowLeft, Brain } from 'lucide-react';
import { DocumentSelector } from '@/components/document-comparison/document-selector';
import { ComparisonResults } from '@/components/document-comparison/comparison-results';
import { supabase } from '@/lib/supabase';

interface AnalysisResult {
  document_id: string;
  document_name: string;
  document_type: string;
  ai_feedback: string;
  sequence_order: number;
}

interface CriticalCheckResult {
  check_name: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string;
  issue: string;
}

export default function DocumentComparisonPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[] | null>(null);
  const [fullFeedback, setFullFeedback] = useState<string>('');
  const [criticalChecksResults, setCriticalChecksResults] = useState<CriticalCheckResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(quotationId: string, documentIds: string[], ruleId: string) {
    setIsAnalyzing(true);
    setError(null);
    setResults(null);

    try {
      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in to use AI analysis');
        setIsAnalyzing(false);
        return;
      }

      const response = await fetch('/api/document-comparison/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quotation_id: quotationId,
          document_ids: documentIds,
          user_id: user.id,
          rule_id: ruleId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze documents');
      }

      const data = await response.json();
      
      if (data.success) {
        setResults(data.results);
        setFullFeedback(data.full_feedback);
        setCriticalChecksResults(data.critical_checks_results || []);
      } else {
        throw new Error('Analysis failed');
      }
    } catch (err: unknown) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleReset() {
    setResults(null);
    setFullFeedback('');
    setCriticalChecksResults([]);
    setError(null);
  }

  return (
    <div className="space-y-6">
      {/* Loading Dialog Popup */}
      <Dialog open={isAnalyzing}>
        <DialogContent className="sm:max-w-md [&>button]:hidden">
          <DialogTitle className="sr-only">Analyzing Documents</DialogTitle>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="relative">
              <Brain className="h-20 w-20 text-blue-600 animate-pulse" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Analyzing Documents...</h3>
              <p className="text-sm text-muted-foreground">
                AI is analyzing and comparing your documents
              </p>
              <p className="text-xs text-muted-foreground">
                Please wait, this may take 30-60 seconds
              </p>
            </div>
            <div className="flex gap-2 mt-4">
              <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileCheck className="h-8 w-8 text-blue-600" />
            Document Comparison
          </h1>
          <p className="text-muted-foreground mt-2">
            AI-powered cross-document verification system using Google Gemini
          </p>
        </div>
        {results && (
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            New Analysis
          </Button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Analysis Failed</h3>
                <p className="text-sm text-red-700">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleReset}
                  className="mt-3"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {!results ? (
        <DocumentSelector 
          onAnalyze={handleAnalyze} 
          isAnalyzing={isAnalyzing}
        />
      ) : (
        <ComparisonResults 
          results={results} 
          fullFeedback={fullFeedback}
          criticalChecksResults={criticalChecksResults}
        />
      )}

      {/* Info Card */}
      {!results && !isAnalyzing && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <FileCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-semibold text-blue-900">How It Works:</h3>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>Select a quotation and at least 2 documents to compare</li>
                  <li>AI extracts key information from each document (names, addresses, values, quantities, etc.)</li>
                  <li>Cross-document verification identifies mismatches and inconsistencies</li>
                  <li>Get actionable feedback with critical issues and recommendations</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

