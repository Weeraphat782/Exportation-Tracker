"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, XCircle, FileText, Sparkles } from "lucide-react"

interface ProgressStep {
  node_name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  sequence_order: number
  error_message?: string
}

interface ReviewProgressTrackerProps {
  sessionId: string
  onComplete: () => void
}

export function ReviewProgressTracker({ sessionId, onComplete }: ReviewProgressTrackerProps) {
  const [steps, setSteps] = useState<ProgressStep[]>([])
  const [overallStatus, setOverallStatus] = useState<string>('initializing')
  const [processStarted, setProcessStarted] = useState(false)
  const [currentStep, setCurrentStep] = useState<string>('')
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    initializeSteps()
  }, [sessionId])

  useEffect(() => {
    if (processStarted) {
      startPolling()
    }
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
    }
  }, [processStarted])

  async function initializeSteps() {
    try {
      // Get session details and template nodes
      const response = await fetch(`/api/reviews/${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        
        // Get template nodes to show progress
        const templateResponse = await fetch(`/api/templates/${data.session.template_id}`)
        if (templateResponse.ok) {
          const templateData = await templateResponse.json()
          const initialSteps = templateData.nodes.map((node: any) => ({
            node_name: node.node_name || 'Section',
            sequence_order: node.sequence_order,
            status: 'pending' as const
          }))
          // Add overall summary step
          initialSteps.push({
            node_name: 'Overall Summary',
            sequence_order: initialSteps.length + 1,
            status: 'pending' as const
          })
          setSteps(initialSteps)
          
          // Start the review process
          startReviewProcess()
        }
      }
    } catch (error) {
      console.error('Failed to initialize:', error)
      setOverallStatus('error')
    }
  }

  async function startReviewProcess() {
    try {
      setOverallStatus('processing')
      // Trigger the review process (runs in background) - guard against duplicate POSTs
      if (!processStarted) {
        fetch(`/api/reviews/${sessionId}/process-with-progress`, {
          method: 'POST',
        }).then(() => {
          setProcessStarted(true)
        })
      }
    } catch (error) {
      console.error('Failed to start review:', error)
      setOverallStatus('error')
    }
  }

  async function startPolling() {
    pollingInterval.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/reviews/${sessionId}`)
        if (response.ok) {
          const data = await response.json()
          
          // Update progress based on completed results
          const completedCount = data.results.length
          
          setSteps(prev => prev.map((step, index) => {
            if (index < completedCount - 1) {
              return { ...step, status: 'completed' }
            } else if (index === completedCount - 1) {
              // Update current step being processed
              setCurrentStep(step.node_name)
              return { ...step, status: 'processing' }
            }
            return step
          }))

          // Check if review is complete
          if (data.session.status === 'completed') {
            setSteps(prev => prev.map(step => ({ ...step, status: 'completed' })))
            setOverallStatus('completed')
            if (pollingInterval.current) {
              clearInterval(pollingInterval.current)
            }
            setTimeout(() => {
              onComplete()
            }, 1500)
          } else if (data.session.status === 'failed') {
            setOverallStatus('error')
            if (pollingInterval.current) {
              clearInterval(pollingInterval.current)
            }
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 2000) // Poll every 2 seconds
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return <Badge className="bg-blue-500">Processing...</Badge>
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  return (
    <Card className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {overallStatus === 'completed' ? 'Review Complete!' : 'AI Review in Progress'}
        </h2>
        <p className="text-muted-foreground">
          {overallStatus === 'completed' 
            ? 'All sections have been reviewed successfully. Redirecting...'
            : currentStep 
              ? `Currently reviewing: ${currentStep}`
              : 'Preparing review...'}
        </p>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <Card key={index} className={`p-4 transition-all ${step.status === 'processing' ? 'border-primary' : ''}`}>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {getStatusIcon(step.status)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <Badge variant="outline">#{step.sequence_order}</Badge>
                  <h4 className="font-semibold text-foreground">{step.node_name}</h4>
                </div>
                {step.error_message && (
                  <p className="text-sm text-destructive mt-1">{step.error_message}</p>
                )}
              </div>
              <div className="flex-shrink-0">
                {getStatusBadge(step.status)}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {overallStatus === 'error' && (
        <div className="mt-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-destructive font-medium">
            An error occurred during the review process. Please try again.
          </p>
        </div>
      )}
    </Card>
  )
}

