import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { generateText } from "ai"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  try {
    if (!sql) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    // Get the review session
    const sessionResult = await sql`
      SELECT * FROM review_sessions WHERE id = ${id}
    `

    if (sessionResult.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const session = sessionResult[0]

    // Get template nodes with AI instructions
    const templateNodesResult = await sql`
      SELECT tn.*, dn.name as node_name, dn.description, dn.example_content
      FROM template_nodes tn
      JOIN document_nodes dn ON tn.node_id = dn.id
      WHERE tn.template_id = ${session.template_id}
      ORDER BY tn.sequence_order
    `

    // Get API key from settings
    const apiKeyResult = await sql`
      SELECT value FROM settings WHERE key = 'gemini_api_key'
    `

    const apiKey = apiKeyResult.length > 0 ? apiKeyResult[0].value : process.env.GEMINI_API_KEY

    if (!apiKey) {
      await sql`
        UPDATE review_sessions
        SET status = 'failed'
        WHERE id = ${id}
      `
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

    // Update status to processing
    await sql`
      UPDATE review_sessions
      SET status = 'processing'
      WHERE id = ${id}
    `

    // Process each node with Gemini AI
    for (const templateNode of templateNodesResult) {
      try {
        const prompt = `You are reviewing a document section called "${templateNode.node_name}".

Document: ${session.document_name}

Section Description: ${templateNode.description || "No description provided"}

Expected Content: ${templateNode.example_content || "No example provided"}

Review Instructions: ${templateNode.ai_instructions || "Provide general feedback on this section"}

Please analyze this section and provide detailed, constructive feedback. Focus on:
- Clarity and completeness
- Alignment with expected content
- Areas for improvement
- Strengths and weaknesses

Provide your feedback in a clear, professional manner.`

        const { text } = await generateText({
          model: "google/gemini-2.5-flash-image",
          prompt,
        })

        // Store the result
        await sql`
          INSERT INTO review_results (session_id, node_id, node_name, ai_feedback, sequence_order)
          VALUES (
            ${id},
            ${templateNode.node_id},
            ${templateNode.node_name},
            ${text},
            ${templateNode.sequence_order}
          )
        `
      } catch (error) {
        console.error(`Failed to process node ${templateNode.node_name}:`, error)
        // Continue with other nodes even if one fails
      }
    }

    // Update session status to completed
    await sql`
      UPDATE review_sessions
      SET status = 'completed',
          completed_at = NOW()
      WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to process review:", error)

    if (sql) {
      await sql`
        UPDATE review_sessions
        SET status = 'failed'
        WHERE id = ${id}
      `
    }

    return NextResponse.json({ error: "Failed to process review" }, { status: 500 })
  }
}
