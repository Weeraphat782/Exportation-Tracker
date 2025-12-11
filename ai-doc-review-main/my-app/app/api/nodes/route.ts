import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { mockNodes } from "@/lib/mock-data"

export async function GET() {
  try {
    const nodes = await sql`
      SELECT * FROM document_nodes
      ORDER BY created_at DESC
    `
    return NextResponse.json(nodes)
  } catch (error) {
    console.error("Failed to fetch nodes:", error)
    return NextResponse.json({ error: "Failed to fetch nodes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, example_content } = body

    const result = await sql`
      INSERT INTO document_nodes (name, description, example_content)
      VALUES (${name}, ${description}, ${example_content})
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Failed to create node:", error)
    return NextResponse.json({ error: "Failed to create node" }, { status: 500 })
  }
}
