'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, X, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Rule {
  id: string;
  name: string;
  description: string;
  extraction_fields: string[];
  comparison_instructions: string;
  critical_checks: string[];
  is_default: boolean;
}

export default function EditRulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rule, setRule] = useState<Rule | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [comparisonInstructions, setComparisonInstructions] = useState('');
  const [extractionFields, setExtractionFields] = useState<string[]>([]);
  const [criticalChecks, setCriticalChecks] = useState<string[]>([]);
  const [newField, setNewField] = useState('');
  const [newCheck, setNewCheck] = useState('');

  const loadRule = useCallback(async () => {
    try {
      const response = await fetch(`/api/document-comparison/rules/${id}`);
      if (response.ok) {
        const data = await response.json();
        setRule(data);
        setName(data.name);
        setDescription(data.description || '');
        setComparisonInstructions(data.comparison_instructions);
        setExtractionFields(data.extraction_fields || []);
        setCriticalChecks(data.critical_checks || []);
      }
    } catch (err) {
      console.error('Error loading rule:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRule();
  }, [loadRule]);

  function addField() {
    if (newField.trim()) {
      setExtractionFields([...extractionFields, newField.trim()]);
      setNewField('');
    }
  }

  function removeField(index: number) {
    setExtractionFields(extractionFields.filter((_, i) => i !== index));
  }

  function addCheck() {
    if (newCheck.trim()) {
      setCriticalChecks([...criticalChecks, newCheck.trim()]);
      setNewCheck('');
    }
  }

  function removeCheck(index: number) {
    setCriticalChecks(criticalChecks.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!name.trim() || !comparisonInstructions.trim()) {
      alert('Name and comparison instructions are required');
      return;
    }

    if (rule?.is_default) {
      alert('Cannot edit default rule');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/document-comparison/rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          extraction_fields: extractionFields,
          comparison_instructions: comparisonInstructions.trim(),
          critical_checks: criticalChecks,
        }),
      });

      if (response.ok) {
        router.push('/document-comparison/rules');
      } else {
        alert('Failed to update rule');
      }
    } catch (err) {
      console.error('Error updating rule:', err);
      alert('An error occurred');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!rule) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Rule not found</h1>
          <Link href="/document-comparison/rules">
            <Button>Back to Rules</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (rule.is_default) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Cannot Edit Default Rule</h1>
          <p className="text-muted-foreground mb-4">
            Default rules cannot be modified. Please create a new rule instead.
          </p>
          <Link href="/document-comparison/rules">
            <Button>Back to Rules</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/document-comparison/rules">
        <Button variant="ghost" className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Rules
        </Button>
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Rule</h1>
        <p className="text-muted-foreground">
          Update how documents should be compared and verified
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Rule Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Standard Export Verification"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this rule checks"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Extraction Fields</CardTitle>
            <p className="text-sm text-muted-foreground">
              Fields to extract from documents (e.g., consignor_name, total_value)
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newField}
                onChange={(e) => setNewField(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addField())}
                placeholder="Field name (e.g., consignor_name)"
              />
              <Button type="button" onClick={addField}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {extractionFields.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {extractionFields.map((field, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1 rounded"
                  >
                    <span className="text-sm">{field}</span>
                    <button
                      type="button"
                      onClick={() => removeField(index)}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comparison Instructions *</CardTitle>
            <p className="text-sm text-muted-foreground">
              Detailed instructions for AI on how to compare documents.
              Use placeholders: {'{allDocuments}'}, {'{documentCount}'}, {'{documentList}'}, {'{firstDocumentName}'}
            </p>
          </CardHeader>
          <CardContent>
            <Textarea
              value={comparisonInstructions}
              onChange={(e) => setComparisonInstructions(e.target.value)}
              placeholder="You are performing a comprehensive cross-document verification...&#10;&#10;Compare all documents and identify..."
              rows={12}
              required
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Critical Checks</CardTitle>
            <p className="text-sm text-muted-foreground">
              List of critical items that must be verified
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newCheck}
                onChange={(e) => setNewCheck(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCheck())}
                placeholder="e.g., Total values must match across documents"
              />
              <Button type="button" onClick={addCheck}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {criticalChecks.length > 0 && (
              <ul className="space-y-2">
                {criticalChecks.map((check, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 bg-red-50 text-red-900 p-3 rounded"
                  >
                    <span className="text-red-500 mt-0.5">•</span>
                    <span className="flex-1 text-sm">{check}</span>
                    <button
                      type="button"
                      onClick={() => removeCheck(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
          <Link href="/document-comparison/rules">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}


