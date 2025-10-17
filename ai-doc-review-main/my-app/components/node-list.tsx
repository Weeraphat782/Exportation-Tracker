"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import type { DocumentNode } from "@/lib/db"
import { mockNodes } from "@/lib/mock-data"

export function NodeList() {
  const [nodes, setNodes] = useState<DocumentNode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNodes()
  }, [])

  async function loadNodes() {
    try {
      const response = await fetch("/api/nodes")
      if (response.ok) {
        const data = await response.json()
        setNodes(data)
      } else {
        // Fallback to mock data
        setNodes(mockNodes)
      }
    } catch (error) {
      console.error("Failed to load nodes:", error)
      setNodes(mockNodes)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this node?")) return

    try {
      const response = await fetch(`/api/nodes/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setNodes(nodes.filter((node) => node.id !== id))
      } else {
        alert("Failed to delete node")
      }
    } catch (error) {
      console.error("Failed to delete node:", error)
      alert("Failed to delete node")
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">Loading documents...</div>
  }

  if (nodes.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground text-lg mb-4">No document sections yet</p>
        <p className="text-muted-foreground mb-6">Create your first document to start building rules</p>
        <Link href="/nodes/new">
          <Button>Create Your First Document</Button>
        </Link>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {nodes.map((node) => (
        <Card key={node.id} className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-xl font-semibold text-foreground">{node.name}</h3>
            <div className="flex gap-2">
              <Link href={`/nodes/${node.id}/edit`}>
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(node.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>

          {node.description && <p className="text-muted-foreground mb-4">{node.description}</p>}

          {node.example_content && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground font-medium mb-1">Example Content:</p>
              <p className="text-sm text-foreground line-clamp-3">{node.example_content}</p>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}
