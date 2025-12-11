import { useState } from 'react';

interface AnalysisResult {
  success: boolean;
  description?: string;
  keyPoints?: string[];
  error?: string;
}

export function useDocumentAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<Record<string, AnalysisResult>>({});

  const analyzeDocument = async (
    documentId: string,
    fileUrl: string,
    fileName: string,
    documentType: string
  ): Promise<AnalysisResult> => {
    setIsAnalyzing(true);
    
    try {
      const response = await fetch('/api/analyze-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          fileUrl,
          fileName,
          documentType,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const analysisResult: AnalysisResult = {
          success: true,
          description: result.description,
          keyPoints: result.keyPoints,
        };

        setAnalysisResults(prev => ({
          ...prev,
          [documentId]: analysisResult,
        }));

        return analysisResult;
      } else {
        const errorResult: AnalysisResult = {
          success: false,
          error: result.error || 'Failed to analyze document',
        };

        setAnalysisResults(prev => ({
          ...prev,
          [documentId]: errorResult,
        }));

        return errorResult;
      }
    } catch (error) {
      const errorResult: AnalysisResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };

      setAnalysisResults(prev => ({
        ...prev,
        [documentId]: errorResult,
      }));

      return errorResult;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const processAllDocuments = async (): Promise<boolean> => {
    setIsAnalyzing(true);
    
    try {
      const response = await fetch('/api/process-all-documents', {
        method: 'GET',
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('Started processing all documents:', result.message);
        return true;
      } else {
        console.error('Failed to start processing:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error starting document processing:', error);
      return false;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getAnalysisResult = (documentId: string): AnalysisResult | null => {
    return analysisResults[documentId] || null;
  };

  return {
    isAnalyzing,
    analyzeDocument,
    processAllDocuments,
    getAnalysisResult,
    analysisResults,
  };
} 