import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    if (!sql) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    // Delete existing results
    await sql`
      DELETE FROM review_results WHERE session_id = ${id}
    `

    // Reset session status
    await sql`
      UPDATE review_sessions
      SET status = 'pending',
          completed_at = NULL
      WHERE id = ${id}
    `

    // Trigger processing with the enhanced cross-document comparison
    const processResponse = await fetch(`${request.url.replace("/reprocess", "/process-with-progress")}`, {
      method: "POST",
    })

    if (!processResponse.ok) {
      throw new Error("Failed to trigger processing")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to reprocess review:", error)
    return NextResponse.json({ error: "Failed to reprocess review" }, { status: 500 })
  }
}
