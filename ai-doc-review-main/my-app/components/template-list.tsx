"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, FileText } from "lucide-react"
import Link from "next/link"
import type { Template } from "@/lib/db"
import { mockTemplates } from "@/lib/mock-data"

interface TemplateWithNodes extends Template {
  node_count?: number
}

export function TemplateList() {
  const [templates, setTemplates] = useState<TemplateWithNodes[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    try {
      const response = await fetch("/api/templates")
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      } else {
        setTemplates(mockTemplates)
      }
    } catch (error) {
      console.error("Failed to load templates:", error)
      setTemplates(mockTemplates)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this template?")) return

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setTemplates(templates.filter((template) => template.id !== id))
      } else {
        alert("Failed to delete template")
      }
    } catch (error) {
      console.error("Failed to delete template:", error)
      alert("Failed to delete template")
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">Loading rules...</div>
  }

  if (templates.length === 0) {
    return (
      <Card className="p-12 text-center">
        <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground text-lg mb-4">No rules yet</p>
        <p className="text-muted-foreground mb-6">Create your first rule to start reviewing documents</p>
        <Link href="/templates/new">
          <Button>Create Your First Rule</Button>
        </Link>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-foreground mb-2">{template.name}</h3>
              <Badge variant="secondary">{template.node_count || 0} sections</Badge>
            </div>
            <div className="flex gap-2">
              <Link href={`/templates/${template.id}/edit`}>
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>

          {template.description && <p className="text-muted-foreground mb-4">{template.description}</p>}

          <Link href={`/reviews/new?template=${template.id}`}>
            <Button className="w-full mt-4 bg-transparent" variant="outline">
              Use Rules
            </Button>
          </Link>
        </Card>
      ))}
    </div>
  )
}
