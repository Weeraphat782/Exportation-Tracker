import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { GoogleGenAI } from "@google/genai"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { documentData, nodeType } = body

    if (!documentData) {
      return NextResponse.json({ error: "Document data is required" }, { status: 400 })
    }

    // Get API key from settings or environment
    const apiKeyResult = await sql`
      SELECT value FROM settings WHERE key = 'gemini_api_key'
    `

    const apiKey = apiKeyResult.length > 0 ? apiKeyResult[0].value : process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured. Please add it in Settings." },
        { status: 500 }
      )
    }

    // Build context-aware prompt based on node type
    const promptTemplates: Record<string, string> = {
      'Executive Summary': 'Analyze this document and describe what an ideal Executive Summary section should contain, based on the content and structure of this example. Provide your response in clean, plain text format without any markdown formatting (no asterisks, hashtags, or special characters for formatting). Write in clear paragraphs with proper punctuation.',
      'Introduction': 'Analyze this document and describe what an ideal Introduction section should contain, based on the content and structure of this example. Provide your response in clean, plain text format without any markdown formatting (no asterisks, hashtags, or special characters for formatting). Write in clear paragraphs with proper punctuation.',
      'Methodology': 'Analyze this document and describe what an ideal Methodology section should contain, based on the content and structure of this example. Provide your response in clean, plain text format without any markdown formatting (no asterisks, hashtags, or special characters for formatting). Write in clear paragraphs with proper punctuation.',
      'Findings': 'Analyze this document and describe what an ideal Findings/Results section should contain, based on the content and structure of this example. Provide your response in clean, plain text format without any markdown formatting (no asterisks, hashtags, or special characters for formatting). Write in clear paragraphs with proper punctuation.',
      'Conclusion': 'Analyze this document and describe what an ideal Conclusion section should contain, based on the content and structure of this example. Provide your response in clean, plain text format without any markdown formatting (no asterisks, hashtags, or special characters for formatting). Write in clear paragraphs with proper punctuation.',
      'general': 'Analyze this document and provide a detailed description of what this type of content should contain, including structure, key elements, and best practices. Focus on creating guidance that can be used as an example for future similar documents. Provide your response in clean, plain text format without any markdown formatting (no asterisks, hashtags, or special characters for formatting). Write in clear paragraphs with proper punctuation.',
    }

    const prompt = promptTemplates[nodeType] || promptTemplates['general']

    // Initialize Google GenAI client with API key
    const ai = new GoogleGenAI({ apiKey })

    // Process the PDF document
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: documentData,
          },
        },
        { text: prompt },
      ],
    })

    return NextResponse.json({ content: response.text })
  } catch (error: any) {
    console.error("Failed to process document:", error)
    
    if (error?.message?.includes("API key") || error?.status === 400) {
      return NextResponse.json(
        { error: "Invalid API key. Please check your Gemini API key in Settings." },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: "Failed to process document. Please try again." },
      { status: 500 }
    )
  }
}


