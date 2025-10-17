import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { template_id, document_name, uploads } = body

    if (!template_id || !document_name || !uploads || uploads.length === 0) {
      return NextResponse.json(
        { error: "Template ID, document name, and at least one upload are required" },
        { status: 400 }
      )
    }

    // Create review session
    const sessionResult = await sql`
      INSERT INTO review_sessions (template_id, document_name, document_url, status)
      VALUES (${template_id}, ${document_name}, 'multi-section', 'pending')
      RETURNING *
    `

    const session = sessionResult[0]

    // Store each uploaded document
    for (const upload of uploads) {
      await sql`
        INSERT INTO document_uploads (session_id, node_id, document_data, file_name, file_size)
        VALUES (
          ${session.id},
          ${upload.node_id},
          ${upload.document_data},
          ${upload.file_name},
          ${upload.file_size}
        )
      `
    }

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error("Failed to create review session:", error)
    return NextResponse.json(
      { error: "Failed to create review session" },
      { status: 500 }
    )
  }
}




