import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileText, Layers, FolderOpen, Sparkles, ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Powered by Google Gemini AI</span>
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">AI Document Review System</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
            Transform your document review process with intelligent AI analysis. Define templates, upload documents, and
            receive detailed feedback in minutes.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/reviews/new">
              <Button size="lg" className="gap-2">
                Start Review
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/templates">
              <Button size="lg" variant="outline" className="gap-2 bg-transparent">
                Browse Rules
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Layers className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Documents</h3>
            <p className="text-muted-foreground mb-4">
              Define reusable building blocks for your documents. Create sections like Executive Summary,
              Methodology, and Findings.
            </p>
            <Link href="/nodes">
              <Button variant="ghost" className="gap-2 p-0 h-auto">
                Manage Documents
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <FolderOpen className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Rules</h3>
            <p className="text-muted-foreground mb-4">
              Build rules by sequencing document sections and adding AI-specific review instructions for each section.
            </p>
            <Link href="/templates">
              <Button variant="ghost" className="gap-2 p-0 h-auto">
                Manage Rules
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">AI Reviews</h3>
            <p className="text-muted-foreground mb-4">
              Upload documents and let Google Gemini AI analyze each section based on your template instructions.
            </p>
            <Link href="/reviews">
              <Button variant="ghost" className="gap-2 p-0 h-auto">
                View Reviews
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="p-8 bg-muted/50">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-foreground font-bold">1</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2">Define Documents</h4>
              <p className="text-sm text-muted-foreground">Create reusable document sections</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-foreground font-bold">2</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2">Build Rules</h4>
              <p className="text-sm text-muted-foreground">Sequence sections with AI instructions</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-foreground font-bold">3</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2">Upload Document</h4>
              <p className="text-sm text-muted-foreground">Select template and upload file</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-foreground font-bold">4</span>
              </div>
              <h4 className="font-semibold text-foreground mb-2">Get Feedback</h4>
              <p className="text-sm text-muted-foreground">Receive detailed AI analysis</p>
            </div>
          </div>
        </Card>

        {/* Benefits */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Why Choose AI-DRS?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-foreground mb-1">Consistent Reviews</h4>
                <p className="text-muted-foreground">
                  Ensure every document is reviewed against the same criteria with AI-powered consistency
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-foreground mb-1">Save Time</h4>
                <p className="text-muted-foreground">
                  Reduce manual review time from hours to minutes with automated AI analysis
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-foreground mb-1">Customizable Templates</h4>
                <p className="text-muted-foreground">
                  Build templates tailored to your specific document types and review requirements
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-foreground mb-1">Detailed Feedback</h4>
                <p className="text-muted-foreground">
                  Get comprehensive, section-by-section feedback powered by Google Gemini AI
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
