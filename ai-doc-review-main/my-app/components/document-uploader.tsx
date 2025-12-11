"use client"

import { useState, useRef } from "react"
import { FileUp, Loader2 } from "lucide-react"

interface DocumentUploaderProps {
  onContentGenerated: (content: string) => void
  nodeType?: string
}

export function DocumentUploader({ onContentGenerated, nodeType }: DocumentUploaderProps) {
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file')
      return
    }

    // Check file size (20MB limit for inline data)
    const maxSize = 20 * 1024 * 1024 // 20MB
    if (file.size > maxSize) {
      alert('File size must be under 20MB')
      return
    }

    setLoading(true)
    try {
      // Convert file to base64
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string
        // Remove the data:application/pdf;base64, prefix
        const base64Content = base64Data.split(',')[1]

        // Send to API for processing
        const response = await fetch('/api/ai/process-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentData: base64Content,
            nodeType: nodeType || 'general',
          }),
        })

        if (response.ok) {
          const data = await response.json()
          onContentGenerated(data.content)
        } else {
          const error = await response.json()
          alert(error.error || 'Failed to process document')
        }
        
        setLoading(false)
        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }

      reader.onerror = () => {
        alert('Failed to read file')
        setLoading(false)
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Failed to process document:', error)
      alert('Failed to process document. Please check your API key in Settings.')
      setLoading(false)
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileSelect}
        className="hidden"
        disabled={loading}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="absolute bottom-2 right-12 p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
        title="Upload sample PDF document"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileUp className="h-4 w-4" />
        )}
      </button>
    </>
  )
}

