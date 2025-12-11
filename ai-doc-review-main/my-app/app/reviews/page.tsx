import { Suspense } from "react"
import { ReviewSessionList } from "@/components/review-session-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function ReviewsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Review Sessions</h1>
            <p className="text-muted-foreground text-lg">Upload documents and run AI-powered reviews</p>
          </div>
          <Link href="/reviews/new">
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              New Review
            </Button>
          </Link>
        </div>

        <Suspense fallback={<div className="text-muted-foreground">Loading reviews...</div>}>
          <ReviewSessionList />
        </Suspense>
      </div>
    </div>
  )
}
