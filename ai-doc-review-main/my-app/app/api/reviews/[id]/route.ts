import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const sessionResult = await sql`
      SELECT rs.*, t.name as template_name
      FROM review_sessions rs
      LEFT JOIN templates t ON rs.template_id = t.id
      WHERE rs.id = ${id}
    `

    if (sessionResult.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const resultsResult = await sql`
      SELECT * FROM review_results
      WHERE session_id = ${id}
      ORDER BY sequence_order
    `

    return NextResponse.json({
      session: sessionResult[0],
      results: resultsResult,
    })
  } catch (error) {
    console.error("Failed to fetch review session:", error)
    return NextResponse.json({ error: "Failed to fetch review session" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Delete the review session (CASCADE will handle related records)
    await sql`
      DELETE FROM review_sessions WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete review session:", error)
    return NextResponse.json({ error: "Failed to delete review session" }, { status: 500 })
  }
}
