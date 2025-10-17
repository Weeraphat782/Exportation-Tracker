import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { mockTemplates } from "@/lib/mock-data"

export async function GET() {
  try {
    if (!sql) {
      return NextResponse.json(mockTemplates)
    }

    const templates = await sql`
      SELECT 
        t.*,
        COUNT(tn.id) as node_count
      FROM templates t
      LEFT JOIN template_nodes tn ON t.id = tn.template_id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `
    return NextResponse.json(templates)
  } catch (error) {
    console.error("Failed to fetch templates:", error)
    return NextResponse.json(mockTemplates)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, nodes } = body

    if (!sql) {
      const newTemplate = {
        id: Math.random().toString(36).substring(7),
        name,
        description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      return NextResponse.json(newTemplate, { status: 201 })
    }

    // Create template
    const templateResult = await sql`
      INSERT INTO templates (name, description)
      VALUES (${name}, ${description})
      RETURNING *
    `

    const template = templateResult[0]

    // Add template nodes
    if (nodes && nodes.length > 0) {
      for (const node of nodes) {
        await sql`
          INSERT INTO template_nodes (template_id, node_id, sequence_order, ai_instructions)
          VALUES (${template.id}, ${node.node_id}, ${node.sequence_order}, ${node.ai_instructions})
        `
      }
    }

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error("Failed to create template:", error)
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 })
  }
}
