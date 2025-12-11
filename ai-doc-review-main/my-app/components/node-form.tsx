"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { AIContentGenerator } from "@/components/ai-content-generator"
import { DocumentUploader } from "@/components/document-uploader"
import type { DocumentNode } from "@/lib/db"

interface NodeFormProps {
  nodeId?: string
}

export function NodeForm({ nodeId }: NodeFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    example_content: "",
  })

  useEffect(() => {
    if (nodeId) {
      loadNode()
    }
  }, [nodeId])

  async function loadNode() {
    try {
      const response = await fetch(`/api/nodes/${nodeId}`)
      if (response.ok) {
        const node: DocumentNode = await response.json()
        setFormData({
          name: node.name,
          description: node.description || "",
          example_content: node.example_content || "",
        })
      }
    } catch (error) {
      console.error("Failed to load node:", error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const url = nodeId ? `/api/nodes/${nodeId}` : "/api/nodes"
      const method = nodeId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push("/nodes")
      } else {
        alert("Failed to save node")
      }
    } catch (error) {
      console.error("Failed to save node:", error)
      alert("Failed to save node")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Document Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Executive Summary, Introduction, Methodology"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <div className="relative">
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this document section"
              rows={3}
              className="pr-10"
            />
            <AIContentGenerator
              value={formData.description}
              type="description"
              contextInfo={{ nodeName: formData.name }}
              onGenerate={(content) => setFormData({ ...formData, description: content })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="example_content">Example Content</Label>
          <div className="relative">
            <Textarea
              id="example_content"
              value={formData.example_content}
              onChange={(e) => setFormData({ ...formData, example_content: e.target.value })}
              placeholder="Provide an example of what this section should contain, or upload a sample PDF document"
              rows={5}
              className="pr-20"
            />
            <DocumentUploader
              nodeType={formData.name}
              onContentGenerated={(content) => setFormData({ ...formData, example_content: content })}
            />
            <AIContentGenerator
              value={formData.example_content}
              type="example_content"
              contextInfo={{ nodeName: formData.name }}
              onGenerate={(content) => setFormData({ ...formData, example_content: content })}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Upload a sample PDF or type manually. This helps guide the AI when reviewing documents.
          </p>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading} size="lg">
            {loading ? "Saving..." : nodeId ? "Update Document" : "Create Document"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/nodes")} size="lg">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}
