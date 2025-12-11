import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { mockSessions } from "@/lib/mock-data"

export async function GET() {
  try {
    if (!sql) {
      return NextResponse.json(mockSessions)
    }

    const sessions = await sql`
      SELECT 
        rs.*,
        t.name as template_name
      FROM review_sessions rs
      LEFT JOIN templates t ON rs.template_id = t.id
      ORDER BY rs.created_at DESC
    `
    return NextResponse.json(sessions)
  } catch (error) {
    console.error("Failed to fetch review sessions:", error)
    return NextResponse.json(mockSessions)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { template_id, document_name, document_url } = body

    if (!sql) {
      const newSession = {
        id: Math.random().toString(36).substring(7),
        template_id,
        document_name,
        document_url,
        status: "processing" as const,
        created_at: new Date().toISOString(),
        completed_at: null,
      }

      return NextResponse.json(newSession, { status: 201 })
    }

    // Create review session
    const result = await sql`
      INSERT INTO review_sessions (template_id, document_name, document_url, status)
      VALUES (${template_id}, ${document_name}, ${document_url}, 'pending')
      RETURNING *
    `

    const session = result[0]

    // Trigger AI processing asynchronously
    // In production, this would be a background job or queue
    fetch(`${request.url}/${session.id}/process`, {
      method: "POST",
    }).catch((error) => {
      console.error("Failed to trigger processing:", error)
    })

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error("Failed to create review session:", error)
    return NextResponse.json({ error: "Failed to create review session" }, { status: 500 })
  }
}
