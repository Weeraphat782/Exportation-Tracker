"use client"

import { useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"

interface AIContentGeneratorProps {
  value: string
  onGenerate: (content: string) => void
  type: "description" | "example_content" | "ai_instructions"
  contextInfo?: {
    nodeName?: string
    templateName?: string
  }
}

export function AIContentGenerator({ value, onGenerate, type, contextInfo }: AIContentGeneratorProps) {
  const [loading, setLoading] = useState(false)

  const getSystemContext = () => {
    switch (type) {
      case "description":
        return "You are helping improve or create a clear, concise description for a document section node. Generate a professional 1-2 sentence description based on the user's input."
      case "example_content":
        return "You are helping improve or create example content that demonstrates what should be included in a document section. Generate a detailed paragraph (3-5 sentences) showing ideal content structure and elements based on the user's input."
      case "ai_instructions":
        return "You are helping improve or create AI review instructions. Generate specific, actionable instructions for reviewing a document section based on the user's input. Focus on what to check, evaluate, and validate."
      default:
        return "You are a helpful AI assistant that improves and generates content based on user input."
    }
  }

  async function handleGenerate() {
    const prompt = value.trim()
    
    if (!prompt) {
      alert("Please enter some text first for AI to improve or generate content from.")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          type,
          systemContext: getSystemContext(),
          contextInfo,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        onGenerate(data.content)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to generate content")
      }
    } catch (error) {
      console.error("Failed to generate content:", error)
      alert("Failed to generate content. Please check your API key in Settings.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={loading}
      className="absolute bottom-2 right-2 p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
      title="Generate or improve with AI"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
    </button>
  )
}

