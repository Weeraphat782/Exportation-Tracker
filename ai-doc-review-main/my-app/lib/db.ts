import postgres from "postgres"

// Initialize the SQL client
// Use local Postgres for development, Neon for production
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

export const sql = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
})

// Type definitions
export interface DocumentNode {
  id: string
  name: string
  description: string | null
  example_content: string | null
  created_at: string
  updated_at: string
}

export interface Template {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface TemplateNode {
  id: string
  template_id: string
  node_id: string
  sequence_order: number
  ai_instructions: string | null
  created_at: string
}

export interface ReviewSession {
  id: string
  template_id: string
  document_name: string
  document_url: string
  status: "pending" | "processing" | "completed" | "failed"
  created_at: string
  completed_at: string | null
}

export interface ReviewResult {
  id: string
  session_id: string
  node_id: string
  node_name: string
  ai_feedback: string | null
  sequence_order: number
  created_at: string
}

export interface Setting {
  id: string
  key: string
  value: string
  created_at: string
  updated_at: string
}
