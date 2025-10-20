'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Rule {
  id: string;
  name: string;
  description: string;
  extraction_fields: string[];
  comparison_instructions: string;
  critical_checks: string[];
  is_default: boolean;
  created_at: string;
}

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRules();
  }, []);

  async function loadRules() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in to view rules');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/document-comparison/rules?user_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setRules(data);
      } else {
        setError('Failed to load rules');
      }
    } catch (err) {
      console.error('Error loading rules:', err);
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, isDefault: boolean) {
    if (isDefault) {
      alert('Cannot delete default rule');
      return;
    }

    if (!confirm('Are you sure you want to delete this rule?')) {
      return;
    }

    try {
      const response = await fetch(`/api/document-comparison/rules/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRules(rules.filter(r => r.id !== id));
      } else {
        alert('Failed to delete rule');
      }
    } catch (err) {
      console.error('Error deleting rule:', err);
      alert('An error occurred');
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading rules...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Comparison Rules</h1>
          <p className="text-muted-foreground">
            Manage rules for document comparison and verification
          </p>
        </div>
        <Link href="/document-comparison/rules/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Rule
          </Button>
        </Link>
      </div>

      {rules.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No rules yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first comparison rule to get started
              </p>
              <Link href="/document-comparison/rules/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Rule
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>{rule.name}</CardTitle>
                      {rule.is_default && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    {rule.description && (
                      <CardDescription className="mt-2">
                        {rule.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/document-comparison/rules/${rule.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    {!rule.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(rule.id, rule.is_default)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Extraction Fields ({rule.extraction_fields?.length || 0})</h4>
                    <div className="flex flex-wrap gap-1">
                      {rule.extraction_fields?.slice(0, 5).map((field, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded"
                        >
                          {field}
                        </span>
                      ))}
                      {(rule.extraction_fields?.length || 0) > 5 && (
                        <span className="text-xs text-muted-foreground px-2 py-1">
                          +{(rule.extraction_fields?.length || 0) - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Critical Checks ({rule.critical_checks?.length || 0})</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {rule.critical_checks?.slice(0, 3).map((check, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-red-500">•</span>
                          <span>{check}</span>
                        </li>
                      ))}
                      {(rule.critical_checks?.length || 0) > 3 && (
                        <li className="text-xs text-muted-foreground italic">
                          +{(rule.critical_checks?.length || 0) - 3} more checks
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


