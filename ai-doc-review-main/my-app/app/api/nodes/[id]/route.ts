import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { mockNodes } from "@/lib/mock-data"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    if (!sql) {
      const node = mockNodes.find((n) => n.id === id)
      if (!node) {
        return NextResponse.json({ error: "Node not found" }, { status: 404 })
      }
      return NextResponse.json(node)
    }

    const result = await sql`
      SELECT * FROM document_nodes WHERE id = ${id}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Failed to fetch node:", error)
    return NextResponse.json({ error: "Failed to fetch node" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, example_content } = body

    if (!sql) {
      return NextResponse.json({ success: true })
    }

    const result = await sql`
      UPDATE document_nodes
      SET name = ${name},
          description = ${description},
          example_content = ${example_content},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Failed to update node:", error)
    return NextResponse.json({ error: "Failed to update node" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    if (!sql) {
      return NextResponse.json({ success: true })
    }

    await sql`
      DELETE FROM document_nodes WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete node:", error)
    return NextResponse.json({ error: "Failed to delete node" }, { status: 500 })
  }
}
