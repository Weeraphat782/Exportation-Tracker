"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileUp, X, FileText, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TemplateNode {
  id: string
  node_id: string
  node_name: string
  sequence_order: number
  ai_instructions: string
  description: string
}

interface DocumentUpload {
  nodeId: string
  file: File
  base64Data?: string
}

export function ReviewSessionFormNew() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [templateNodes, setTemplateNodes] = useState<TemplateNode[]>([])
  const [documentName, setDocumentName] = useState("")
  const [uploads, setUploads] = useState<Map<string, DocumentUpload>>(new Map())
  const [loadingNodes, setLoadingNodes] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    if (selectedTemplateId) {
      loadTemplateNodes(selectedTemplateId)
    } else {
      setTemplateNodes([])
    }
  }, [selectedTemplateId])

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

  async function loadTemplateNodes(templateId: string) {
    setLoadingNodes(true)
    try {
      const response = await fetch(`/api/templates/${templateId}`)
      if (response.ok) {
        const data = await response.json()
        const nodes = data.nodes.map((node: any) => ({
          id: node.id,
          node_id: node.node_id,
          node_name: node.node_name || 'Unknown',
          sequence_order: node.sequence_order,
          ai_instructions: node.ai_instructions,
          description: node.description
        }))
        setTemplateNodes(nodes)
      }
    } catch (error) {
      console.error("Failed to load template nodes:", error)
    } finally {
      setLoadingNodes(false)
    }
  }

  async function handleFileSelect(nodeId: string, file: File | null) {
    if (!file) {
      const newUploads = new Map(uploads)
      newUploads.delete(nodeId)
      setUploads(newUploads)
      return
    }

    // Validate file
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file')
      return
    }

    const maxSize = 20 * 1024 * 1024 // 20MB
    if (file.size > maxSize) {
      alert('File size must be under 20MB')
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64Data = event.target?.result as string
      const base64Content = base64Data.split(',')[1]
      
      const newUploads = new Map(uploads)
      newUploads.set(nodeId, {
        nodeId,
        file,
        base64Data: base64Content
      })
      setUploads(newUploads)
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedTemplateId || !documentName.trim()) {
      alert("Please select rules and enter a document name")
      return
    }

    if (uploads.size === 0) {
      alert("Please upload at least one document section")
      return
    }

    setLoading(true)
    try {
      // Create review session with uploads
      const uploadData = Array.from(uploads.values()).map(upload => ({
        node_id: upload.nodeId,
        document_data: upload.base64Data,
        file_name: upload.file.name,
        file_size: upload.file.size
      }))

      const response = await fetch("/api/reviews/create-with-uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: selectedTemplateId,
          document_name: documentName,
          uploads: uploadData
        }),
      })

      if (response.ok) {
        const session = await response.json()
        router.push(`/reviews/${session.id}`)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to create review session")
      }
    } catch (error) {
      console.error("Failed to create review session:", error)
      alert("Failed to create review session")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="document-name">Document Name *</Label>
            <Input
              id="document-name"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="e.g., Q4 Research Report 2025"
              required
            />
          </div>

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
              <p className="text-sm text-muted-foreground">
                No rules available. Please create a rule first.
              </p>
            )}
          </div>
        </div>
      </Card>

      {selectedTemplateId && (
        <Card className="p-8">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-foreground mb-2">Upload Document Sections</h3>
            <p className="text-muted-foreground">
              Upload the corresponding section of your document for each rule below. Each section will be reviewed individually.
            </p>
          </div>

          {loadingNodes ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : templateNodes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>This template has no sections. Please add sections to the template first.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {templateNodes.map((node, index) => {
                const upload = uploads.get(node.node_id)
                return (
                  <Card key={node.node_id} className="p-4">
                    <div className="flex items-start gap-4">
                      <Badge variant="outline" className="mt-1">
                        #{node.sequence_order}
                      </Badge>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground mb-1">
                          {node.node_name}
                        </h4>
                        {node.description && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {node.description}
                          </p>
                        )}
                        
                        <div className="mt-3">
                          <input
                            type="file"
                            id={`file-${node.node_id}`}
                            accept="application/pdf"
                            onChange={(e) => handleFileSelect(node.node_id, e.target.files?.[0] || null)}
                            className="hidden"
                          />
                          
                          {upload ? (
                            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                              <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-foreground truncate">
                                  {upload.file.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {(upload.file.size / 1024).toFixed(2)} KB
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleFileSelect(node.node_id, null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById(`file-${node.node_id}`)?.click()}
                              className="gap-2"
                            >
                              <FileUp className="h-4 w-4" />
                              Upload PDF Section
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </Card>
      )}

      <div className="flex gap-4">
        <Button 
          type="submit" 
          disabled={loading || !selectedTemplateId || uploads.size === 0 || !documentName.trim()} 
          size="lg"
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Creating Review...
            </>
          ) : (
            `Start AI Review (${uploads.size} ${uploads.size === 1 ? 'Section' : 'Sections'})`
          )}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.push("/reviews")} 
          size="lg"
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}


