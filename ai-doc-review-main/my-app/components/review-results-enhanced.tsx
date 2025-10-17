"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Loader2, RefreshCw, FileText, AlertTriangle, XCircle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react"
import type { ReviewResult } from "@/lib/db"

interface ReviewResultsEnhancedProps {
  sessionId: string
}

interface SessionData {
  session: {
    id: string
    document_name: string
    status: string
    created_at: string
    completed_at: string | null
  }
  results: ReviewResult[]
}

export function ReviewResultsEnhanced({ sessionId }: ReviewResultsEnhancedProps) {
  const [data, setData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadResults()
  }, [sessionId])

  async function loadResults() {
    try {
      const response = await fetch(`/api/reviews/${sessionId}`)
      if (response.ok) {
        const sessionData = await response.json()
        setData(sessionData)

        if (sessionData.session.status === "processing") {
          setProcessing(true)
          setTimeout(loadResults, 3000)
        } else {
          setProcessing(false)
        }
      }
    } catch (error) {
      console.error("Failed to load results:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleReprocess() {
    if (!confirm("Are you sure you want to reprocess this review?")) return

    setProcessing(true)
    try {
      const response = await fetch(`/api/reviews/${sessionId}/reprocess`, {
        method: "POST",
      })

      if (response.ok) {
        loadResults()
      } else {
        alert("Failed to reprocess review")
        setProcessing(false)
      }
    } catch (error) {
      console.error("Failed to reprocess review:", error)
      alert("Failed to reprocess review")
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <Card className="p-12 text-center">
        <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground text-lg">Failed to load review session</p>
      </Card>
    )
  }

  const { session, results } = data

  // Extract all issues for summary
  function extractAllIssues() {
    const allCritical: Array<{ doc: string; issue: string }> = []
    const allWarnings: Array<{ doc: string; issue: string }> = []
    
    results.forEach(result => {
      const feedback = result.ai_feedback || ''
      
      // Debug: log the first 200 chars of feedback
      console.log(`Processing ${result.node_name}:`, feedback.substring(0, 200))
      
      // Extract critical issues - more flexible regex patterns
      const criticalPatterns = [
        /###\s*❌\s*Critical Issues[\s\S]*?(?=###|$)/i,
        /###\s*Critical Issues\s*-\s*Must Fix[\s\S]*?(?=###|$)/i,
        /##\s*❌\s*Critical Issues[\s\S]*?(?=##|$)/i,
        /#.*Critical Issues.*[\s\S]*?(?=#|$)/i
      ]
      
      for (const pattern of criticalPatterns) {
        const criticalMatches = feedback.match(pattern)
        if (criticalMatches) {
          console.log('Found critical section with pattern:', pattern)
          const lines = criticalMatches[0].split('\n')
            .filter(l => {
              const trimmed = l.trim()
              return (trimmed.startsWith('-') || trimmed.startsWith('*')) && 
                     !trimmed.toLowerCase().includes('none identified') &&
                     trimmed.length > 2
            })
            .map(l => l.replace(/^[-*]\s*/, '').trim())
          
          console.log('Extracted critical lines:', lines)
          
          lines.forEach(line => {
            if (line) allCritical.push({ doc: result.node_name || 'Unknown', issue: line })
          })
          break // Found a match, stop trying patterns
        }
      }
      
      // Extract warnings - more flexible regex patterns
      const warningPatterns = [
        /###\s*⚠️\s*Warnings[\s\S]*?(?=###|$)/i,
        /###\s*Warnings\s*&\s*Recommendations[\s\S]*?(?=###|$)/i,
        /##\s*⚠️\s*Warnings[\s\S]*?(?=##|$)/i,
        /#.*Warnings.*[\s\S]*?(?=#|$)/i
      ]
      
      for (const pattern of warningPatterns) {
        const warningMatches = feedback.match(pattern)
        if (warningMatches) {
          console.log('Found warning section with pattern:', pattern)
          const lines = warningMatches[0].split('\n')
            .filter(l => {
              const trimmed = l.trim()
              return (trimmed.startsWith('-') || trimmed.startsWith('*')) && 
                     !trimmed.toLowerCase().includes('none identified') &&
                     trimmed.length > 2
            })
            .map(l => l.replace(/^[-*]\s*/, '').trim())
          
          console.log('Extracted warning lines:', lines)
          
          lines.forEach(line => {
            if (line) allWarnings.push({ doc: result.node_name || 'Unknown', issue: line })
          })
          break // Found a match, stop trying patterns
        }
      }
    })
    
    console.log('Total critical issues found:', allCritical.length)
    console.log('Total warnings found:', allWarnings.length)
    
    return { allCritical, allWarnings }
  }

  const { allCritical, allWarnings } = extractAllIssues()

  return (
    <div>
      {/* Header */}
      <Card className="p-4 mb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-foreground">{session.document_name}</h1>
              <Badge variant={session.status === "completed" ? "default" : "secondary"}>
                {session.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Completed: {session.completed_at ? new Date(session.completed_at).toLocaleString() : "Not completed"}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReprocess} disabled={processing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${processing ? 'animate-spin' : ''}`} />
              Reprocess
            </Button>
          </div>
        </div>
      </Card>

      {/* Processing State */}
      {session.status === "processing" && (
        <Card className="p-6 mb-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-base font-medium text-foreground mb-1">Processing Review...</p>
          <p className="text-sm text-muted-foreground">This may take a few minutes. Results will appear automatically.</p>
        </Card>
      )}

      {/* Review Summary */}
      {session.status === "completed" && results.length > 0 && (
        <>
          <Card className="p-4 mb-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Review Summary
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{allCritical.length}</div>
                  <div className="text-xs font-medium text-red-700 dark:text-red-400">Critical Issues</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-600 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{allWarnings.length}</div>
                  <div className="text-xs font-medium text-yellow-700 dark:text-yellow-400">Warnings</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{results.length}</div>
                  <div className="text-xs font-medium text-green-700 dark:text-green-400">Documents Reviewed</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Critical Issues Section */}
          {allCritical.length > 0 && (
            <Card className="p-4 mb-4">
              <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                Critical Issues Requiring Immediate Action
              </h2>
              <div className="space-y-2.5">
                {allCritical.map((item, idx) => (
                  <div key={idx} className="flex gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-red-600 mb-0.5">{item.doc}</div>
                      <div className="text-sm text-foreground leading-snug">{item.issue}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Warnings Section */}
          {allWarnings.length > 0 && (
            <Card className="p-4 mb-4">
              <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="h-5 w-5" />
                Warnings & Recommendations
              </h2>
              <div className="space-y-2.5">
                {allWarnings.map((item, idx) => (
                  <div key={idx} className="flex gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-600 text-white flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-yellow-600 mb-0.5">{item.doc}</div>
                      <div className="text-sm text-foreground leading-snug">{item.issue}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* All Clear Message */}
          {allCritical.length === 0 && allWarnings.length === 0 && (
            <Card className="p-8 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-600" />
              <h3 className="text-lg font-semibold text-green-600 mb-1">All Clear!</h3>
              <p className="text-sm text-muted-foreground">No critical issues or warnings found in the review.</p>
            </Card>
          )}
        </>
      )}

      {/* Detailed Document Reviews - Collapsible */}
      {session.status === "completed" && results.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold mb-3">Detailed Document Reviews</h2>
          {results.map((result) => {
            const feedback = result.ai_feedback || ''
            
            let criticalCount = 0
            let warningCount = 0
            
            // Count critical issues with flexible patterns
            const criticalPatterns = [
              /###\s*❌\s*Critical Issues[\s\S]*?(?=###|$)/i,
              /###\s*Critical Issues\s*-\s*Must Fix[\s\S]*?(?=###|$)/i,
              /##\s*❌\s*Critical Issues[\s\S]*?(?=##|$)/i,
              /#.*Critical Issues.*[\s\S]*?(?=#|$)/i
            ]
            
            for (const pattern of criticalPatterns) {
              const criticalMatches = feedback.match(pattern)
              if (criticalMatches) {
                const lines = criticalMatches[0].split('\n')
                  .filter(l => {
                    const trimmed = l.trim()
                    return (trimmed.startsWith('-') || trimmed.startsWith('*')) && 
                           !trimmed.toLowerCase().includes('none identified') &&
                           trimmed.length > 2
                  })
                criticalCount = lines.length
                break
              }
            }
            
            // Count warnings with flexible patterns
            const warningPatterns = [
              /###\s*⚠️\s*Warnings[\s\S]*?(?=###|$)/i,
              /###\s*Warnings\s*&\s*Recommendations[\s\S]*?(?=###|$)/i,
              /##\s*⚠️\s*Warnings[\s\S]*?(?=##|$)/i,
              /#.*Warnings.*[\s\S]*?(?=#|$)/i
            ]
            
            for (const pattern of warningPatterns) {
              const warningMatches = feedback.match(pattern)
              if (warningMatches) {
                const lines = warningMatches[0].split('\n')
                  .filter(l => {
                    const trimmed = l.trim()
                    return (trimmed.startsWith('-') || trimmed.startsWith('*')) && 
                           !trimmed.toLowerCase().includes('none identified') &&
                           trimmed.length > 2
                  })
                warningCount = lines.length
                break
              }
            }
            
            const isOpen = expanded[result.id]
            
            return (
              <Card key={result.id} className="overflow-hidden">
                <button
                  className="w-full flex items-center justify-between text-left p-4 hover:bg-accent/50 transition-colors"
                  onClick={() => setExpanded({ ...expanded, [result.id]: !isOpen })}
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1.5 flex items-center gap-2">
                      {result.node_name}
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
                    <DetailedFeedbackSection feedback={feedback} documentName={result.node_name || ''} />
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {session.status === "completed" && results.length === 0 && (
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No results available for this review</p>
        </Card>
      )}
    </div>
  )
}

function DetailedFeedbackSection({ feedback, documentName }: { feedback: string; documentName: string }) {
  // Parse the feedback to extract critical issues and warnings
  const criticalIssues: string[] = []
  const warnings: string[] = []
  
  // Try multiple patterns for critical issues
  const criticalPatterns = [
    /###\s*❌\s*Critical Issues[\s\S]*?(?=###|$)/i,
    /###\s*Critical Issues\s*-\s*Must Fix[\s\S]*?(?=###|$)/i,
    /##\s*❌\s*Critical Issues[\s\S]*?(?=##|$)/i,
    /#.*Critical Issues.*[\s\S]*?(?=#|$)/i
  ]
  
  for (const pattern of criticalPatterns) {
    const criticalMatches = feedback.match(pattern)
    if (criticalMatches) {
      const lines = criticalMatches[0].split('\n')
        .filter(l => {
          const trimmed = l.trim()
          return (trimmed.startsWith('-') || trimmed.startsWith('*')) && 
                 !trimmed.toLowerCase().includes('none identified') &&
                 trimmed.length > 2
        })
        .map(l => l.replace(/^[-*]\s*/, '').trim())
      criticalIssues.push(...lines.filter(l => l))
      break
    }
  }
  
  // Try multiple patterns for warnings
  const warningPatterns = [
    /###\s*⚠️\s*Warnings[\s\S]*?(?=###|$)/i,
    /###\s*Warnings\s*&\s*Recommendations[\s\S]*?(?=###|$)/i,
    /##\s*⚠️\s*Warnings[\s\S]*?(?=##|$)/i,
    /#.*Warnings.*[\s\S]*?(?=#|$)/i
  ]
  
  for (const pattern of warningPatterns) {
    const warningMatches = feedback.match(pattern)
    if (warningMatches) {
      const lines = warningMatches[0].split('\n')
        .filter(l => {
          const trimmed = l.trim()
          return (trimmed.startsWith('-') || trimmed.startsWith('*')) && 
                 !trimmed.toLowerCase().includes('none identified') &&
                 trimmed.length > 2
        })
        .map(l => l.replace(/^[-*]\s*/, '').trim())
      warnings.push(...lines.filter(l => l))
      break
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
  )
}

