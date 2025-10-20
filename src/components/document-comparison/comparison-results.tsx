'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  FileCheck,
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';

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

interface ComparisonResultsProps {
  results: AnalysisResult[];
  fullFeedback?: string;
  criticalChecksResults?: CriticalCheckResult[];
}

export function ComparisonResults({ results, criticalChecksResults = [] }: ComparisonResultsProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Extract all issues for summary
  function extractAllIssues() {
    const allCritical: Array<{ doc: string; issue: string }> = [];
    const allWarnings: Array<{ doc: string; issue: string }> = [];
    
    results.forEach(result => {
      const feedback = result.ai_feedback || '';
      
      // Extract critical issues - multiple patterns for flexibility
      const criticalPatterns = [
        /###\s*❌\s*Critical Issues[\s\S]*?(?=###|$)/i,
        /###\s*Critical Issues\s*-\s*Must Fix[\s\S]*?(?=###|$)/i,
        /##\s*❌\s*Critical Issues[\s\S]*?(?=##|$)/i,
        /#.*Critical Issues.*[\s\S]*?(?=#|$)/i
      ];
      
      for (const pattern of criticalPatterns) {
        const criticalMatches = feedback.match(pattern);
        if (criticalMatches) {
          const lines = criticalMatches[0].split('\n')
            .filter(l => {
              const trimmed = l.trim();
              return (trimmed.startsWith('-') || trimmed.startsWith('*')) && 
                     !trimmed.toLowerCase().includes('none identified') &&
                     trimmed.length > 2;
            })
            .map(l => l.replace(/^[-*]\s*/, '').trim());
          
          lines.forEach(line => {
            if (line) allCritical.push({ doc: result.document_name || 'Unknown', issue: line });
          });
          break;
        }
      }
      
      // Extract warnings - multiple patterns for flexibility
      const warningPatterns = [
        /###\s*⚠️\s*Warnings[\s\S]*?(?=###|$)/i,
        /###\s*Warnings\s*&\s*Recommendations[\s\S]*?(?=###|$)/i,
        /##\s*⚠️\s*Warnings[\s\S]*?(?=##|$)/i,
        /#.*Warnings.*[\s\S]*?(?=#|$)/i
      ];
      
      for (const pattern of warningPatterns) {
        const warningMatches = feedback.match(pattern);
        if (warningMatches) {
          const lines = warningMatches[0].split('\n')
            .filter(l => {
              const trimmed = l.trim();
              return (trimmed.startsWith('-') || trimmed.startsWith('*')) && 
                     !trimmed.toLowerCase().includes('none identified') &&
                     trimmed.length > 2;
            })
            .map(l => l.replace(/^[-*]\s*/, '').trim());
          
          lines.forEach(line => {
            if (line) allWarnings.push({ doc: result.document_name || 'Unknown', issue: line });
          });
          break;
        }
      }
    });
    
    return { allCritical, allWarnings };
  }

  const { allCritical, allWarnings } = extractAllIssues();

  // Calculate critical checks summary
  const passedChecks = criticalChecksResults.filter(c => c.status === 'PASS').length;
  const failedChecks = criticalChecksResults.filter(c => c.status === 'FAIL').length;
  const warningChecks = criticalChecksResults.filter(c => c.status === 'WARNING').length;

  return (
    <div className="space-y-6">
      {/* Critical Checks Checklist */}
      {criticalChecksResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Critical Checks Status
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Verification results for all critical requirements
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{passedChecks}</div>
                  <div className="text-sm font-medium text-green-700 dark:text-green-400">Passed</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{failedChecks}</div>
                  <div className="text-sm font-medium text-red-700 dark:text-red-400">Failed</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-600 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{warningChecks}</div>
                  <div className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Warnings</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {criticalChecksResults.map((check, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    check.status === 'PASS'
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
                      : check.status === 'FAIL'
                      ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900'
                      : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        check.status === 'PASS'
                          ? 'bg-green-600'
                          : check.status === 'FAIL'
                          ? 'bg-red-600'
                          : 'bg-yellow-600'
                      }`}
                    >
                      {check.status === 'PASS' ? (
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      ) : check.status === 'FAIL' ? (
                        <XCircle className="h-5 w-5 text-white" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{check.check_name}</h4>
                        <Badge
                          variant={
                            check.status === 'PASS'
                              ? 'default'
                              : check.status === 'FAIL'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className={
                            check.status === 'PASS'
                              ? 'bg-green-600'
                              : check.status === 'WARNING'
                              ? 'bg-yellow-500'
                              : ''
                          }
                        >
                          {check.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Details:</strong> {check.details}
                      </p>
                      {check.issue && check.issue !== 'None' && check.issue !== 'N/A' && (
                        <p className="text-sm font-medium text-foreground">
                          <strong>Issue:</strong> {check.issue}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Verification Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{allCritical.length}</div>
                <div className="text-sm font-medium text-red-700 dark:text-red-400">Critical Issues</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-600 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{allWarnings.length}</div>
                <div className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Warnings</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{results.length}</div>
                <div className="text-sm font-medium text-green-700 dark:text-green-400">Documents Verified</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Issues Section */}
      {allCritical.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Critical Issues Requiring Immediate Action
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allCritical.map((item, idx) => (
                <div key={idx} className="flex gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-red-600 mb-1">{item.doc}</div>
                    <div className="text-sm text-foreground leading-relaxed">{item.issue}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warnings Section */}
      {allWarnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              Warnings & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allWarnings.map((item, idx) => (
                <div key={idx} className="flex gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-yellow-600 text-white flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-yellow-600 mb-1">{item.doc}</div>
                    <div className="text-sm text-foreground leading-relaxed">{item.issue}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Clear Message */}
      {allCritical.length === 0 && allWarnings.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-600" />
            <h3 className="text-2xl font-semibold text-green-600 mb-2">All Clear! ✓</h3>
            <p className="text-muted-foreground">
              No critical issues or warnings found in the cross-document verification.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Detailed Document Reviews - Collapsible */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Detailed Document Reviews</h2>
        {results.map((result) => {
          const feedback = result.ai_feedback || '';
          
          let criticalCount = 0;
          let warningCount = 0;
          
          // Count critical issues
          const criticalPatterns = [
            /###\s*❌\s*Critical Issues[\s\S]*?(?=###|$)/i,
            /###\s*Critical Issues\s*-\s*Must Fix[\s\S]*?(?=###|$)/i,
            /##\s*❌\s*Critical Issues[\s\S]*?(?=##|$)/i,
            /#.*Critical Issues.*[\s\S]*?(?=#|$)/i
          ];
          
          for (const pattern of criticalPatterns) {
            const criticalMatches = feedback.match(pattern);
            if (criticalMatches) {
              const lines = criticalMatches[0].split('\n')
                .filter(l => {
                  const trimmed = l.trim();
                  return (trimmed.startsWith('-') || trimmed.startsWith('*')) && 
                         !trimmed.toLowerCase().includes('none identified') &&
                         trimmed.length > 2;
                });
              criticalCount = lines.length;
              break;
            }
          }
          
          // Count warnings
          const warningPatterns = [
            /###\s*⚠️\s*Warnings[\s\S]*?(?=###|$)/i,
            /###\s*Warnings\s*&\s*Recommendations[\s\S]*?(?=###|$)/i,
            /##\s*⚠️\s*Warnings[\s\S]*?(?=##|$)/i,
            /#.*Warnings.*[\s\S]*?(?=#|$)/i
          ];
          
          for (const pattern of warningPatterns) {
            const warningMatches = feedback.match(pattern);
            if (warningMatches) {
              const lines = warningMatches[0].split('\n')
                .filter(l => {
                  const trimmed = l.trim();
                  return (trimmed.startsWith('-') || trimmed.startsWith('*')) && 
                         !trimmed.toLowerCase().includes('none identified') &&
                         trimmed.length > 2;
                });
              warningCount = lines.length;
              break;
            }
          }
          
          const isOpen = expanded[result.document_id];
          
          return (
            <Card key={result.document_id} className="overflow-hidden">
              <button
                className="w-full flex items-center justify-between text-left p-4 hover:bg-muted/50 transition-colors"
                onClick={() => setExpanded({ ...expanded, [result.document_id]: !isOpen })}
              >
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                    {result.document_name}
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </h3>
                  <div className="flex gap-2">
                    {criticalCount > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        {criticalCount} Critical
                      </Badge>
                    )}
                    {warningCount > 0 && (
                      <Badge variant="secondary" className="gap-1 bg-yellow-500/20 text-yellow-700 border-yellow-300">
                        <AlertTriangle className="h-3 w-3" />
                        {warningCount} Warnings
                      </Badge>
                    )}
                    {criticalCount === 0 && warningCount === 0 && (
                      <Badge variant="default" className="gap-1 bg-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                        No Issues
                      </Badge>
                    )}
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 border-t pt-4">
                  <DetailedFeedbackSection feedback={feedback} documentName={result.document_name} />
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function DetailedFeedbackSection({ feedback }: { feedback: string; documentName?: string }) {
  const criticalIssues: string[] = [];
  const warnings: string[] = [];
  
  // Extract critical issues
  const criticalPatterns = [
    /###\s*❌\s*Critical Issues[\s\S]*?(?=###|$)/i,
    /###\s*Critical Issues\s*-\s*Must Fix[\s\S]*?(?=###|$)/i,
    /##\s*❌\s*Critical Issues[\s\S]*?(?=##|$)/i,
    /#.*Critical Issues.*[\s\S]*?(?=#|$)/i
  ];
  
  for (const pattern of criticalPatterns) {
    const criticalMatches = feedback.match(pattern);
    if (criticalMatches) {
      const lines = criticalMatches[0].split('\n')
        .filter(l => {
          const trimmed = l.trim();
          return (trimmed.startsWith('-') || trimmed.startsWith('*')) && 
                 !trimmed.toLowerCase().includes('none identified') &&
                 trimmed.length > 2;
        })
        .map(l => l.replace(/^[-*]\s*/, '').trim());
      criticalIssues.push(...lines.filter(l => l));
      break;
    }
  }
  
  // Extract warnings
  const warningPatterns = [
    /###\s*⚠️\s*Warnings[\s\S]*?(?=###|$)/i,
    /###\s*Warnings\s*&\s*Recommendations[\s\S]*?(?=###|$)/i,
    /##\s*⚠️\s*Warnings[\s\S]*?(?=##|$)/i,
    /#.*Warnings.*[\s\S]*?(?=#|$)/i
  ];
  
  for (const pattern of warningPatterns) {
    const warningMatches = feedback.match(pattern);
    if (warningMatches) {
      const lines = warningMatches[0].split('\n')
        .filter(l => {
          const trimmed = l.trim();
          return (trimmed.startsWith('-') || trimmed.startsWith('*')) && 
                 !trimmed.toLowerCase().includes('none identified') &&
                 trimmed.length > 2;
        })
        .map(l => l.replace(/^[-*]\s*/, '').trim());
      warnings.push(...lines.filter(l => l));
      break;
    }
  }
  
  return (
    <div className="space-y-6">
      {criticalIssues.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-3 flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Critical Issues - Must Fix
          </h4>
          <div className="space-y-3">
            {criticalIssues.map((issue, idx) => (
              <div key={idx} className="flex gap-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-sm font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1 text-sm text-foreground leading-relaxed">{issue}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {warnings.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-3 flex items-center gap-2 text-yellow-600">
            <AlertTriangle className="h-5 w-5" />
            Warnings & Recommendations
          </h4>
          <div className="space-y-3">
            {warnings.map((warning, idx) => (
              <div key={idx} className="flex gap-4 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-600 text-white flex items-center justify-center text-sm font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1 text-sm text-foreground leading-relaxed">{warning}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {criticalIssues.length === 0 && warnings.length === 0 && (
        <div className="text-center py-8">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-600" />
          <p className="text-green-600 font-semibold">No Issues Found</p>
          <p className="text-sm text-muted-foreground mt-1">This document looks good!</p>
        </div>
      )}
    </div>
  );
}

