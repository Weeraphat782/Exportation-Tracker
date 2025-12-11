import { TemplateForm } from "@/components/template-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NewTemplatePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <Link href="/templates">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Rules
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Create Rule</h1>
          <p className="text-muted-foreground text-lg">Build rules by adding and sequencing document sections</p>
        </div>

        <TemplateForm />
      </div>
    </div>
  )
}
