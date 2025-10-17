"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Save, CheckCircle } from "lucide-react"

export function SettingsForm() {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKey, setApiKey] = useState("")

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const response = await fetch("/api/settings")
      if (response.ok) {
        const settings = await response.json()
        setApiKey(settings.gemini_api_key || "")
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSaved(false)

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gemini_api_key: apiKey,
        }),
      })

      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        alert("Failed to save settings")
      }
    } catch (error) {
      console.error("Failed to save settings:", error)
      alert("Failed to save settings")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-8">
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">Google Gemini API Configuration</h3>
            <p className="text-muted-foreground mb-6">
              Configure your Google Gemini API key to enable AI-powered document reviews. You can obtain an API key from
              the{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google AI Studio
              </a>
              .
            </p>

            <div className="space-y-2">
              <Label htmlFor="apiKey">Gemini API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="apiKey"
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Gemini API key"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Your API key is stored securely and only used for document review processing
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium text-foreground mb-2">About API Usage</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>API calls are made only when processing document reviews</li>
              <li>Each document node in a template generates one API request</li>
              <li>Review the Google AI pricing for cost estimates</li>
              <li>API keys are never shared or transmitted to third parties</li>
            </ul>
          </div>
        </div>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading || !apiKey} size="lg" className="gap-2">
          {saved ? (
            <>
              <CheckCircle className="h-5 w-5" />
              Saved
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              {loading ? "Saving..." : "Save Settings"}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
