'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadFile } from '@/lib/storage';
import { ArrowUpCircle, FileText, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Document types matching your application
const DOCUMENT_TYPES = [
  { id: 'company-registration', name: 'Company Registration', category: 'Company Information' },
  { id: 'company-declaration', name: 'Company Declaration', category: 'Company Information' },
  { id: 'id-card-copy', name: 'ID Card Copy', category: 'Company Information' },
  { id: 'import-permit', name: 'Import Permit', category: 'Permits & TK Forms' },
  { id: 'tk-10', name: 'TK 10', category: 'Permits & TK Forms' },
  { id: 'tk-10-eng', name: 'TK 10 (ENG Version)', category: 'Permits & TK Forms' },
  { id: 'tk-11', name: 'TK 11', category: 'Permits & TK Forms' },
  { id: 'tk-11-eng', name: 'TK 11 (ENG Version)', category: 'Permits & TK Forms' },
  { id: 'tk-31', name: 'TK 31', category: 'Permits & TK Forms' },
  { id: 'tk-31-eng', name: 'TK 31 (ENG Version)', category: 'Permits & TK Forms' },
  { id: 'tk-32', name: 'TK 32', category: 'Permits & TK Forms' },
  { id: 'purchase-order', name: 'Purchase Order', category: 'Shipping Documents' },
  { id: 'msds', name: 'MSDS', category: 'Shipping Documents' },
  { id: 'commercial-invoice', name: 'Commercial Invoice', category: 'Shipping Documents' },
  { id: 'packing-list', name: 'Packing List', category: 'Shipping Documents' },
  { id: 'hemp-letter', name: 'Letter (Hemp Case)', category: 'Additional Documents' },
  { id: 'additional-file', name: 'Additional File', category: 'Additional Documents' },
];

// Group document types by category
const DOCUMENT_CATEGORIES = DOCUMENT_TYPES.reduce((categories, type) => {
  if (!categories[type.category]) {
    categories[type.category] = [];
  }
  categories[type.category].push(type);
  return categories;
}, {} as Record<string, typeof DOCUMENT_TYPES>);

// Template interface
interface Template {
  id: string;
  document_type_id: string;
  document_name: string;
  file_url: string;
  file_name: string;
  created_at: string;
  updated_at: string;
}

export default function TemplatesAdminPage() {
  const [templates, setTemplates] = useState<Record<string, Template>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  // Fetch existing templates on page load
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const { data, error } = await supabase
          .from('document_templates')
          .select('*');

        if (error) {
          console.error('Error fetching templates:', error);
          toast.error('Failed to load templates');
          return;
        }

        // Convert array to record object with document_type_id as key
        const templatesRecord = (data as Template[]).reduce((acc, template) => {
          acc[template.document_type_id] = template;
          return acc;
        }, {} as Record<string, Template>);

        setTemplates(templatesRecord);
      } catch (err) {
        console.error('Error in fetchTemplates:', err);
        toast.error('An unexpected error occurred');
      }
    }

    fetchTemplates();
  }, []);

  // Handle file upload for a specific document type
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: { id: string; name: string }) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.type !== 'application/pdf' && !file.type.includes('image/')) {
      toast.error('Only PDF and image files are allowed');
      return;
    }

    try {
      setUploading({ ...uploading, [docType.id]: true });
      toast.promise(
        async () => {
          // Upload file to Supabase Storage
          const storagePath = `templates/${docType.id}/${file.name}`;
          const fileUrl = await uploadFile('templates', storagePath, file);

          if (!fileUrl) {
            throw new Error(`Failed to upload template for ${docType.name}`);
          }

          // Insert or update in document_templates table
          const { data, error } = await supabase
            .from('document_templates')
            .upsert({
              document_type_id: docType.id,
              document_name: docType.name,
              file_url: fileUrl,
              file_name: file.name,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'document_type_id'
            })
            .select();

          if (error) {
            throw new Error(`Error updating database: ${error.message}`);
          }

          if (data && data.length > 0) {
            // Update local state
            setTemplates({
              ...templates,
              [docType.id]: data[0] as Template
            });
          }
          // Return data for the toast success message
          return data;
        },
        {
          loading: 'Uploading...',
          // Use the returned data (or default message if data is null/undefined)
          success: (data) => data ? `Template for ${docType.name} uploaded successfully` : `Template updated for ${docType.name}`,
          error: (error) => error instanceof Error ? error.message : 'Failed to upload template'
        }
      );
    } catch (err) {
      console.error('Uploading template:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to upload template');
    } finally {
      setUploading({ ...uploading, [docType.id]: false });
      // Clear file input
      e.target.value = '';
    }
  };

  // Preview a template
  const previewTemplate = (template: Template) => {
    window.open(template.file_url, '_blank');
  };

  // Delete a template
  const deleteTemplate = async (docTypeId: string, docName: string) => {
    if (!window.confirm(`Are you sure you want to delete the template for ${docName}?`)) {
      return;
    }

    try {
      toast.promise(
        async () => {
          // Delete from database first
          const { /* data, */ error } = await supabase
            .from('document_templates')
            .delete()
            .eq('document_type_id', docTypeId);

          if (error) {
            throw new Error(`Error deleting template: ${error.message}`);
          }

          // Update local state
          const newTemplates = { ...templates };
          delete newTemplates[docTypeId];
          setTemplates(newTemplates);
          // Return success for the toast promise
          return true;
        },
        {
          loading: 'Deleting...',
          // Use the result from the async function for the success message
          success: (result) => result ? `Template for ${docName} deleted successfully` : 'Deletion successful',
          error: (error) => error instanceof Error ? error.message : 'Failed to delete template'
        }
      );
    } catch (err) {
      console.error('Error deleting template:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Card className="shadow-lg">
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-2xl">Document Templates</CardTitle>
          <CardDescription>
            Upload example templates for each document type that users can preview before uploading
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Templates by category */}
          <div className="space-y-6">
            {Object.entries(DOCUMENT_CATEGORIES).map(([category, docTypes]) => (
              <div key={category} className="border rounded-md overflow-hidden">
                <div className="bg-slate-50 p-4">
                  <h3 className="text-lg font-medium">{category}</h3>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    {docTypes.map((docType) => {
                      const template = templates[docType.id];
                      const hasTemplate = !!template;

                      return (
                        <div key={docType.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                          <div className="flex flex-wrap md:flex-nowrap md:items-center gap-4">
                            <div className="w-full md:w-1/4">
                              <Label htmlFor={`file-${docType.id}`} className="font-medium">
                                {docType.name}
                              </Label>
                            </div>
                            <div className="w-full md:w-2/4">
                              <Input
                                id={`file-${docType.id}`}
                                type="file"
                                accept="application/pdf,image/*"
                                onChange={(e) => handleFileUpload(e, docType)}
                                disabled={uploading[docType.id]}
                              />
                              {hasTemplate && (
                                <p className="text-xs text-green-600 mt-1">
                                  Current: {template.file_name}
                                </p>
                              )}
                            </div>
                            <div className="w-full md:w-1/4 flex justify-end">
                              {uploading[docType.id] ? (
                                <Button disabled variant="outline" size="sm">
                                  <ArrowUpCircle className="h-4 w-4 mr-2 animate-spin" />
                                  Uploading...
                                </Button>
                              ) : hasTemplate ? (
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => previewTemplate(template)}
                                  >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Preview
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => deleteTemplate(docType.id, docType.name)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button disabled variant="outline" size="sm">
                                  No Template
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>

        <CardFooter className="bg-gray-50 flex justify-between">
          <p className="text-sm text-gray-500">
            Upload PDF or image examples for each document type
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 