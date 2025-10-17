import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { GoogleGenAI } from "@google/genai"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { prompt, type, systemContext, contextInfo } = body

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
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

    // Build enhanced prompt with context
    let enhancedPrompt = prompt

    if (contextInfo?.nodeName) {
      enhancedPrompt = `For document section "${contextInfo.nodeName}": ${prompt}`
    } else if (contextInfo?.templateName) {
      enhancedPrompt = `For template "${contextInfo.templateName}": ${prompt}`
    }

    // Add system context to the prompt with formatting instructions
    const fullPrompt = `${systemContext || "You are a helpful AI assistant that generates clear, professional content."}\n\nIMPORTANT: Provide your response in clean, plain text format without any markdown formatting. Do not use asterisks (**), hashtags (##), or any special characters for formatting. Write in clear, natural paragraphs with proper punctuation only.\n\n${enhancedPrompt}`

    // Initialize Google GenAI client with API key
    const ai = new GoogleGenAI({ apiKey })

    // Generate content using Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
    })

    return NextResponse.json({ content: response.text })
  } catch (error: any) {
    console.error("Failed to generate content:", error)
    
    if (error?.message?.includes("API key") || error?.status === 400) {
      return NextResponse.json(
        { error: "Invalid API key. Please check your Gemini API key in Settings." },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: "Failed to generate content. Please try again." },
      { status: 500 }
    )
  }
}

