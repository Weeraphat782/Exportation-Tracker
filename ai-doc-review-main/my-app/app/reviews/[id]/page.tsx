"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { ReviewResultsEnhanced } from "@/components/review-results-enhanced"
import { ReviewProgressTracker } from "@/components/review-progress-tracker"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [sessionStatus, setSessionStatus] = useState<string>('loading')

  useEffect(() => {
    checkSessionStatus()
  }, [resolvedParams.id])

  async function checkSessionStatus() {
    try {
      const response = await fetch(`/api/reviews/${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setSessionStatus(data.session.status)
      }
    } catch (error) {
      console.error('Failed to check session status:', error)
      setSessionStatus('error')
    }
  }

  function handleComplete() {
    // Reload the page to show results
    router.refresh()
    setSessionStatus('completed')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <Link href="/reviews">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Reviews
          </Button>
        </Link>

        {sessionStatus === 'pending' || sessionStatus === 'processing' ? (
          <ReviewProgressTracker sessionId={resolvedParams.id} onComplete={handleComplete} />
        ) : (
          <ReviewResultsEnhanced sessionId={resolvedParams.id} />
        )}
      </div>
    </div>
  )
}
