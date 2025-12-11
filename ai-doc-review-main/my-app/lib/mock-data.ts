import type { DocumentNode, Template, TemplateNode, ReviewSession, ReviewResult } from "./db"

// Mock data for development without database
export const mockNodes: DocumentNode[] = [
  {
    id: "1",
    name: "Executive Summary",
    description: "High-level overview of the document",
    example_content: "This section should contain a brief summary of the key points, objectives, and conclusions.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Introduction",
    description: "Opening section that sets context",
    example_content: "Introduce the topic, provide background information, and state the purpose of the document.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Methodology",
    description: "Explanation of approach and methods used",
    example_content: "Describe the research methods, data collection techniques, and analytical approaches employed.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Findings",
    description: "Main results and discoveries",
    example_content: "Present the key findings, data, and observations from the research or analysis.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Conclusion",
    description: "Final thoughts and recommendations",
    example_content: "Summarize the main points and provide actionable recommendations or next steps.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export const mockTemplates: Template[] = [
  {
    id: "t1",
    name: "Standard Research Report",
    description: "A comprehensive template for reviewing research reports and academic papers.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export const mockTemplateNodes: TemplateNode[] = [
  {
    id: "tn1",
    template_id: "t1",
    node_id: "1",
    sequence_order: 1,
    ai_instructions: "Review the executive summary for clarity, completeness, and alignment with the document body.",
    created_at: new Date().toISOString(),
  },
  {
    id: "tn2",
    template_id: "t1",
    node_id: "2",
    sequence_order: 2,
    ai_instructions: "Evaluate the introduction for proper context setting, clear objectives, and logical flow.",
    created_at: new Date().toISOString(),
  },
]

export const mockSessions: ReviewSession[] = []
export const mockResults: ReviewResult[] = []
