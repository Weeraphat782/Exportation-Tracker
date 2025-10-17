import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const templateResult = await sql`
      SELECT * FROM templates WHERE id = ${id}
    `

    if (templateResult.length === 0) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    const nodesResult = await sql`
      SELECT 
        tn.*,
        dn.name as node_name,
        dn.description,
        dn.example_content
      FROM template_nodes tn
      JOIN document_nodes dn ON tn.node_id = dn.id
      WHERE tn.template_id = ${id}
      ORDER BY tn.sequence_order
    `

    return NextResponse.json({
      template: templateResult[0],
      nodes: nodesResult,
    })
  } catch (error) {
    console.error("Failed to fetch template:", error)
    return NextResponse.json({ error: "Failed to fetch template" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, nodes } = body

    // Update template
    await sql`
      UPDATE templates
      SET name = ${name},
          description = ${description},
          updated_at = NOW()
      WHERE id = ${id}
    `

    // Delete existing template nodes
    await sql`
      DELETE FROM template_nodes WHERE template_id = ${id}
    `

    // Add new template nodes
    if (nodes && nodes.length > 0) {
      for (const node of nodes) {
        await sql`
          INSERT INTO template_nodes (template_id, node_id, sequence_order, ai_instructions)
          VALUES (${id}, ${node.node_id}, ${node.sequence_order}, ${node.ai_instructions})
        `
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update template:", error)
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await sql`
      DELETE FROM templates WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete template:", error)
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 })
  }
}
