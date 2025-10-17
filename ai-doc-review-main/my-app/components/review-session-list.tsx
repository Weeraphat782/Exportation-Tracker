"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, FileText, Clock, CheckCircle, XCircle, Loader2, Trash2 } from "lucide-react"
import Link from "next/link"
import type { ReviewSession } from "@/lib/db"
import { mockSessions } from "@/lib/mock-data"

interface ReviewSessionWithTemplate extends ReviewSession {
  template_name?: string
}

export function ReviewSessionList() {
  const [sessions, setSessions] = useState<ReviewSessionWithTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSessions()
  }, [])

  async function loadSessions() {
    try {
      const response = await fetch("/api/reviews")
      if (response.ok) {
        const data = await response.json()
        setSessions(data)
      } else {
        setSessions(mockSessions)
      }
    } catch (error) {
      console.error("Failed to load sessions:", error)
      setSessions(mockSessions)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, documentName: string) {
    if (!confirm(`Are you sure you want to delete "${documentName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Remove from local state
        setSessions(sessions.filter(s => s.id !== id))
      } else {
        alert("Failed to delete review session")
      }
    } catch (error) {
      console.error("Failed to delete session:", error)
      alert("Failed to delete review session")
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "processing":
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      processing: "secondary",
      failed: "destructive",
      pending: "outline",
    }
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>
  }

  if (loading) {
    return <div className="text-muted-foreground">Loading review sessions...</div>
  }

  if (sessions.length === 0) {
    return (
      <Card className="p-12 text-center">
        <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground text-lg mb-4">No review sessions yet</p>
        <p className="text-muted-foreground mb-6">Upload a document to start your first AI-powered review</p>
        <Link href="/reviews/new">
          <Button>Start Your First Review</Button>
        </Link>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <Card key={session.id} className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="mt-1">{getStatusIcon(session.status)}</div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-foreground">{session.document_name}</h3>
                  {getStatusBadge(session.status)}
                </div>

                {session.template_name && (
                  <p className="text-muted-foreground mb-2">Template: {session.template_name}</p>
                )}

                <p className="text-sm text-muted-foreground">
                  Created: {new Date(session.created_at).toLocaleDateString()}
                </p>

                {session.completed_at && (
                  <p className="text-sm text-muted-foreground">
                    Completed: {new Date(session.completed_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {session.status === "completed" && (
                <Link href={`/reviews/${session.id}`}>
                  <Button variant="default" className="gap-2">
                    <Eye className="h-4 w-4" />
                    View Results
                  </Button>
                </Link>
              )}
              {session.status === "pending" && (
                <Link href={`/reviews/${session.id}`}>
                  <Button variant="outline" className="gap-2">
                    <Eye className="h-4 w-4" />
                    Start Review
                  </Button>
                </Link>
              )}
              {session.status === "processing" && (
                <Link href={`/reviews/${session.id}`}>
                  <Button variant="outline" className="gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    View Progress
                  </Button>
                </Link>
              )}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => handleDelete(session.id, session.document_name)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
