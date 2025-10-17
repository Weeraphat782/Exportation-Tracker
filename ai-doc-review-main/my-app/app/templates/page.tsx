import { Suspense } from "react"
import { TemplateList } from "@/components/template-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Rules</h1>
            <p className="text-muted-foreground text-lg">
              Create rules by sequencing document sections with AI instructions
            </p>
          </div>
          <Link href="/templates/new">
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Create Rule
            </Button>
          </Link>
        </div>

        <Suspense fallback={<div className="text-muted-foreground">Loading rules...</div>}>
          <TemplateList />
        </Suspense>
      </div>
    </div>
  )
}
