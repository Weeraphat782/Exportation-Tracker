"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, AlertCircle, Download, RefreshCw } from "lucide-react"
import type { ReviewSession, ReviewResult } from "@/lib/db"

interface ReviewResultsProps {
  sessionId: string
}

interface SessionData {
  session: ReviewSession & { template_name?: string }
  results: ReviewResult[]
}

interface IssueData {
  type: 'critical' | 'warning'
  description: string
  documents: string[]
}

// Parse AI feedback to extract issues
function parseIssues(feedback: string): IssueData[] {
  const issues: IssueData[] = []
  
  if (!feedback) return issues
  
  // Debug: log the feedback to see what we're working with
  console.log('Parsing feedback:', feedback)
  
  // More flexible parsing - look for various patterns
  const lines = feedback.split('\n')
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Look for critical issues with various patterns
    if (line.includes('Critical') || line.includes('critical') || line.includes('Issue')) {
      // Check if this line contains an issue description
      if (line.includes(':') && (line.includes('Mismatch') || line.includes('Issue') || line.includes('Error'))) {
        const description = line.split(':').slice(1).join(':').trim()
        if (description) {
          issues.push({
            type: 'critical',
            description,
            documents: extractDocuments(description)
          })
        }
      }
    }
    
    // Look for warnings with various patterns
    if (line.includes('Warning') || line.includes('warning') || line.includes('Note')) {
      // Check if this line contains a warning description
      if (line.includes(':') && !line.includes('Critical')) {
        const description = line.split(':').slice(1).join(':').trim()
        if (description) {
          issues.push({
            type: 'warning',
            description,
            documents: extractDocuments(description)
          })
        }
      }
    }
  }
  
  // If no issues found with the above method, try to extract from markdown format
  if (issues.length === 0) {
    // Look for **Issue** patterns
    const issueMatches = feedback.match(/\*\*Issue \d+[^*]*?\*\*: ([^*]+)/g)
    if (issueMatches) {
      issueMatches.forEach(issue => {
        const description = issue.replace(/\*\*Issue \d+[^*]*?\*\*: /, '').trim()
        issues.push({
          type: 'critical',
          description,
          documents: extractDocuments(description)
        })
      })
    }
    
    // Look for **Warning** patterns
    const warningMatches = feedback.match(/\*\*Warning \d+[^*]*?\*\*: ([^*]+)/g)
    if (warningMatches) {
      warningMatches.forEach(issue => {
        const description = issue.replace(/\*\*Warning \d+[^*]*?\*\*: /, '').trim()
        issues.push({
          type: 'warning',
          description,
          documents: extractDocuments(description)
        })
      })
    }
  }
  
  console.log('Parsed issues:', issues)
  return issues
}

function extractDocuments(text: string): string[] {
  const documentMatches = text.match(/\[([^\]]+)\]/g)
  if (documentMatches) {
    return documentMatches.map(match => match.replace(/[\[\]]/g, ''))
  }
  return []
}

export function ReviewResults({ sessionId }: ReviewResultsProps) {
  const [data, setData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadResults()
  }, [sessionId])

  async function loadResults() {
    try {
      const response = await fetch(`/api/reviews/${sessionId}`)
      if (response.ok) {
        const sessionData = await response.json()
        setData(sessionData)

        // If still processing, poll for updates
        if (sessionData.session.status === "processing") {
          setProcessing(true)
          setTimeout(loadResults, 3000) // Poll every 3 seconds
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

  function handleExport() {
    if (!data) return

    const exportData = {
      document: data.session.document_name,
      template: data.session.template_name,
      date: new Date(data.session.created_at).toLocaleDateString(),
      results: data.results.map((r) => ({
        node: r.node_name,
        feedback: r.ai_feedback,
      })),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `review-${sessionId}.json`
    a.click()
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
        <p className="text-muted-foreground text-lg">Review session not found</p>
      </Card>
    )
  }

  const { session, results } = data

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{session.document_name}</h1>
            <p className="text-muted-foreground">Template: {session.template_name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Created: {new Date(session.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2">
            {session.status === "completed" && (
              <>
                <Button variant="outline" onClick={handleExport} className="gap-2 bg-transparent">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReprocess}
                  disabled={processing}
                  className="gap-2 bg-transparent"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reprocess
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {session.status === "completed" && (
            <>
              <CheckCircle className="h-5 w-5 text-green-600" />
              <Badge variant="default">Completed</Badge>
            </>
          )}
          {session.status === "processing" && (
            <>
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              <Badge variant="secondary">Processing</Badge>
            </>
          )}
          {session.status === "failed" && (
            <>
              <AlertCircle className="h-5 w-5 text-red-600" />
              <Badge variant="destructive">Failed</Badge>
            </>
          )}
        </div>
      </Card>

      {/* Processing State */}
      {session.status === "processing" && (
        <Card className="p-12 text-center">
          <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin text-primary" />
          <h3 className="text-xl font-semibold text-foreground mb-2">AI Review in Progress</h3>
          <p className="text-muted-foreground">
            Google Gemini is analyzing your document. This may take a few minutes...
          </p>
        </Card>
      )}

      {/* Failed State */}
      {session.status === "failed" && (
        <Card className="p-12 text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Review Failed</h3>
          <p className="text-muted-foreground mb-4">There was an error processing your document. Please try again.</p>
          <Button onClick={handleReprocess} disabled={processing}>
            Retry Review
          </Button>
        </Card>
      )}

      {/* Results Display */}
      {session.status === "completed" && results.length > 0 && (
        <div className="space-y-6">
          {/* Review Summary Title */}
          <h2 className="text-3xl font-bold text-foreground">Review Summary</h2>
          
          {/* Summary Cards */}
          {(() => {
            const allIssues = results.flatMap(result => 
              result.ai_feedback ? parseIssues(result.ai_feedback) : []
            )
            const criticalCount = allIssues.filter(issue => issue.type === 'critical').length
            const warningCount = allIssues.filter(issue => issue.type === 'warning').length
            const reviewedCount = results.length

            return (
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-6 bg-red-50 border-red-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xl">×</span>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-red-600">{criticalCount}</div>
                      <div className="text-sm text-red-700 font-medium">Critical Issues</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-6 bg-yellow-50 border-yellow-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xl">⚠</span>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-yellow-600">{warningCount}</div>
                      <div className="text-sm text-yellow-700 font-medium">Warnings</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-6 bg-green-50 border-green-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xl">✓</span>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-green-600">{reviewedCount}</div>
                      <div className="text-sm text-green-700 font-medium">Documents Reviewed</div>
                    </div>
                  </div>
                </Card>
              </div>
            )
          })()}

          {/* Critical Issues Section */}
          {(() => {
            const allIssues = results.flatMap(result => 
              result.ai_feedback ? parseIssues(result.ai_feedback) : []
            )
            const criticalIssues = allIssues.filter(issue => issue.type === 'critical')
            
            if (criticalIssues.length > 0) {
              return (
                <div>
                  {/* Critical Issues Header */}
                  <div className="bg-red-600 text-white p-4 rounded-t-lg flex items-center gap-3">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <span className="text-red-600 font-bold text-sm">×</span>
                    </div>
                    <h3 className="text-xl font-bold">Critical Issues Requiring Immediate Action</h3>
                  </div>
                  
                  {/* Issues List */}
                  <div className="bg-white border border-red-200 border-t-0 rounded-b-lg">
                    <div className="space-y-0">
                      {criticalIssues.map((issue, index) => (
                        <div key={index} className="flex items-start gap-4 p-4 border-b border-gray-100 last:border-b-0">
                          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-white text-sm font-bold">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 mb-1">
                              {issue.description.split(' - ')[0] || `Issue ${index + 1}`}
                            </div>
                            <div className="text-sm text-gray-700">
                              {issue.description.includes(' - ') ? issue.description.split(' - ').slice(1).join(' - ') : issue.description}
                            </div>
                            {issue.documents.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                Found in: {issue.documents.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            }
            return null
          })()}

          {/* Warnings Section */}
          {(() => {
            const allIssues = results.flatMap(result => 
              result.ai_feedback ? parseIssues(result.ai_feedback) : []
            )
            const warnings = allIssues.filter(issue => issue.type === 'warning')
            
            if (warnings.length > 0) {
              return (
                <div>
                  {/* Warnings Header */}
                  <div className="bg-yellow-500 text-white p-4 rounded-t-lg flex items-center gap-3">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <span className="text-yellow-500 font-bold text-sm">⚠</span>
                    </div>
                    <h3 className="text-xl font-bold">Warnings</h3>
                  </div>
                  
                  {/* Warnings List */}
                  <div className="bg-white border border-yellow-200 border-t-0 rounded-b-lg">
                    <div className="space-y-0">
                      {warnings.map((issue, index) => (
                        <div key={index} className="flex items-start gap-4 p-4 border-b border-gray-100 last:border-b-0">
                          <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-white text-sm font-bold">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 mb-1">
                              {issue.description.split(' - ')[0] || `Warning ${index + 1}`}
                            </div>
                            <div className="text-sm text-gray-700">
                              {issue.description.includes(' - ') ? issue.description.split(' - ').slice(1).join(' - ') : issue.description}
                            </div>
                            {issue.documents.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                Found in: {issue.documents.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            }
            return null
          })()}

          {/* Debug Section - Show raw AI feedback if no issues found */}
          {(() => {
            const allIssues = results.flatMap(result => 
              result.ai_feedback ? parseIssues(result.ai_feedback) : []
            )
            
            if (allIssues.length === 0 && results.length > 0) {
              return (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">AI Review Feedback</h3>
                  <div className="space-y-4">
                    {results.map((result, index) => (
                      <div key={result.id} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">{result.node_name}</h4>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <pre className="whitespace-pre-wrap">{result.ai_feedback}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )
            }
            return null
          })()}
        </div>
      )}

      {session.status === "completed" && results.length === 0 && (
        <Card className="p-12 text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground text-lg">No results available for this review</p>
        </Card>
      )}
    </div>
  )
}
