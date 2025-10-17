"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Upload, FileText } from "lucide-react"
import type { Template } from "@/lib/db"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ReviewSessionForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(searchParams.get("template") || "")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    try {
      const response = await fetch("/api/templates")
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error("Failed to load templates:", error)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!file || !selectedTemplateId) {
      alert("Please select rules and upload a document")
      return
    }

    setLoading(true)
    setUploading(true)

    try {
      // In a real implementation, you would upload the file to storage (e.g., Vercel Blob)
      // For now, we'll simulate the upload
      const documentUrl = URL.createObjectURL(file)

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: selectedTemplateId,
          document_name: file.name,
          document_url: documentUrl,
        }),
      })

      if (response.ok) {
        const session = await response.json()
        // Redirect to the review detail page
        router.push(`/reviews/${session.id}`)
      } else {
        alert("Failed to create review session")
      }
    } catch (error) {
      console.error("Failed to create review session:", error)
      alert("Failed to create review session")
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  return (
    <Card className="p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="template">Select Rules *</Label>
          <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose rules" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {templates.length === 0 && (
            <p className="text-sm text-muted-foreground">No rules available. Please create a rule first.</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="document">Upload Document *</Label>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
            <input
              type="file"
              id="document"
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt"
            />
            <label htmlFor="document" className="cursor-pointer">
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">Click to upload or drag and drop</p>
                  <p className="text-sm text-muted-foreground">PDF, DOC, DOCX, or TXT files</p>
                </div>
              )}
            </label>
          </div>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium text-foreground mb-2">What happens next?</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Your document will be uploaded securely</li>
            <li>Google Gemini AI will analyze each section based on your rules</li>
            <li>You'll receive detailed feedback for each document section</li>
            <li>Results will be available in the review session page</li>
          </ol>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading || !file || !selectedTemplateId} size="lg">
            {uploading ? "Uploading..." : loading ? "Starting Review..." : "Start AI Review"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/reviews")} size="lg">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}
