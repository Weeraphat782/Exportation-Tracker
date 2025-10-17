import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    if (!sql) {
      return NextResponse.json({
        gemini_api_key: process.env.GEMINI_API_KEY || "",
      })
    }

    const result = await sql`
      SELECT key, value FROM settings
    `

    const settings: Record<string, string> = {}
    for (const row of result) {
      settings[row.key] = row.value
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Failed to fetch settings:", error)
    return NextResponse.json({})
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!sql) {
      return NextResponse.json({ success: true })
    }

    // Update or insert each setting
    for (const [key, value] of Object.entries(body)) {
      await sql`
        INSERT INTO settings (key, value)
        VALUES (${key}, ${value as string})
        ON CONFLICT (key)
        DO UPDATE SET value = ${value as string}, updated_at = NOW()
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to save settings:", error)
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}
