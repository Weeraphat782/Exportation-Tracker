"use client"

import { use } from "react"
import { NodeForm } from "@/components/node-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function EditNodePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Link href="/nodes">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Documents
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Edit Document Section</h1>
          <p className="text-muted-foreground text-lg">Update your document section definition</p>
        </div>

        <NodeForm nodeId={resolvedParams.id} />
      </div>
    </div>
  )
}
