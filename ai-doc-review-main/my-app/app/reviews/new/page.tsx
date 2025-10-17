import { ReviewSessionFormNew } from "@/components/review-session-form-new"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NewReviewPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Link href="/reviews">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Reviews
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Create Review Session</h1>
          <p className="text-muted-foreground text-lg">Select a template and upload document sections for AI review</p>
        </div>

        <ReviewSessionFormNew />
      </div>
    </div>
  )
}
