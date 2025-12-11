import { Suspense } from "react"
import { NodeList } from "@/components/node-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function NodesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Document Sections</h1>
            <p className="text-muted-foreground text-lg">Define reusable building blocks for your document templates</p>
          </div>
          <Link href="/nodes/new">
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Create Document
            </Button>
          </Link>
        </div>

        <Suspense fallback={<div className="text-muted-foreground">Loading documents...</div>}>
          <NodeList />
        </Suspense>
      </div>
    </div>
  )
}
