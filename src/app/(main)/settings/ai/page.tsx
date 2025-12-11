'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Save, CheckCircle, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AISettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`/api/settings/ai?user_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setApiKey(data.api_key || '');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Please log in to save settings');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/settings/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          api_key: apiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error: unknown) {
      console.error('Failed to save settings:', error);
      alert(`Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-blue-600" />
          AI Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure AI features for document analysis and comparison
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Google Gemini API Configuration</CardTitle>
            <CardDescription>
              Configure your Google Gemini API key to enable AI-powered document reviews and comparison.
              You can obtain an API key from{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google AI Studio
              </a>
              .
              <br /><br />
              <strong>Temporary Solution:</strong> For now, please add your API key to the <code>.env.local</code> file:
              <br />
              <code className="bg-muted px-2 py-1 rounded">GEMINI_API_KEY=your_api_key_here</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="apiKey">Gemini API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="apiKey"
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Gemini API key (e.g., AIza...)"
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
                Your API key is stored securely and only used for document analysis
              </p>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-2">About API Usage</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>API calls are made only when analyzing documents in Document Comparison</li>
                <li>Each document comparison generates multiple API requests</li>
                <li>Review Google AI pricing for cost estimates</li>
                <li>API keys are never shared or transmitted to third parties</li>
              </ul>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-2">Features Enabled:</h4>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Document Comparison - Cross-document verification</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>AI Document Analysis - Automatic descriptions</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading || !apiKey} size="lg" className="gap-2">
            {saved ? (
              <>
                <CheckCircle className="h-5 w-5" />
                Saved Successfully
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                {loading ? 'Saving...' : 'Save API Key'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

