'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Upload, Image as ImageIcon, FileText, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';

export default function CmsResourceFormPage() {
    const router = useRouter();
    const params = useParams();
    const isEdit = params.id !== 'new';

    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState<'image' | 'file' | null>(null);
    const [tagInput, setTagInput] = useState('');
    const [form, setForm] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        image_url: '',
        file_url: '',
        tags: [] as string[],
        is_published: false,
    });

    const fetchResource = useCallback(async () => {
        if (!isEdit) return;
        const { data } = await supabase.from('resources').select('*').eq('id', params.id).single();
        if (data) {
            setForm({
                title: data.title || '',
                slug: data.slug || '',
                excerpt: data.excerpt || '',
                content: data.content || '',
                image_url: data.image_url || '',
                file_url: data.file_url || '',
                tags: data.tags || [],
                is_published: data.is_published || false,
            });
        }
    }, [isEdit, params.id]);

    useEffect(() => { fetchResource(); }, [fetchResource]);

    const generateSlug = (title: string) => {
        return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    };

    const handleTitleChange = (val: string) => {
        setForm(prev => ({
            ...prev,
            title: val,
            slug: isEdit ? prev.slug : generateSlug(val),
        }));
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(type);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'resources');
            const res = await fetch('/api/cms/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (res.ok) {
                if (type === 'image') {
                    setForm(prev => ({ ...prev, image_url: data.url }));
                } else {
                    setForm(prev => ({ ...prev, file_url: data.url }));
                }
                toast.success(`${type === 'image' ? 'Image' : 'File'} uploaded`);
            } else {
                toast.error(data.error || 'Upload failed');
            }
        } catch {
            toast.error('Upload failed');
        }
        setUploading(null);
    };

    const addTag = () => {
        const tag = tagInput.trim();
        if (tag && !form.tags.includes(tag)) {
            setForm(prev => ({ ...prev, tags: [...prev.tags, tag] }));
            setTagInput('');
        }
    };

    const removeTag = (tag: string) => {
        setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
    };

    const handleSave = async () => {
        if (!form.title || !form.slug) {
            toast.error('Title and slug are required');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...form,
                published_at: form.is_published ? new Date().toISOString() : null,
            };

            if (isEdit) {
                const { error } = await supabase.from('resources').update(payload).eq('id', params.id);
                if (error) throw error;
                toast.success('Resource updated');
            } else {
                const { error } = await supabase.from('resources').insert(payload);
                if (error) throw error;
                toast.success('Resource created');
                router.push('/cms/resources');
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Save failed';
            toast.error(message);
        }
        setSaving(false);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/cms/resources" className="p-2 rounded-lg hover:bg-gray-100">
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Resource' : 'New Resource'}</h1>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-[#215497] hover:bg-[#1a4279]">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {saving ? 'Saving...' : 'Save'}
                </Button>
            </div>

            <div className="space-y-6">
                {/* Title & Slug */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#215497]/20 focus:border-[#215497]"
                            placeholder="Enter resource title..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                        <input
                            type="text"
                            value={form.slug}
                            onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#215497]/20 focus:border-[#215497]"
                            placeholder="url-friendly-slug"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                        <textarea
                            value={form.excerpt}
                            onChange={(e) => setForm(prev => ({ ...prev, excerpt: e.target.value }))}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#215497]/20 focus:border-[#215497]"
                            placeholder="Brief description of the resource..."
                        />
                    </div>
                </div>

                {/* Tags */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Tags</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {form.tags.map(tag => (
                            <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-[#215497]">
                                {tag}
                                <button onClick={() => removeTag(tag)} className="hover:text-red-500">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#215497]/20 focus:border-[#215497]"
                            placeholder="Type a tag and press Enter..."
                        />
                        <Button onClick={addTag} variant="outline" size="sm">Add</Button>
                    </div>
                </div>

                {/* Cover Image */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Cover Image</label>
                    {form.image_url ? (
                        <div className="relative rounded-lg overflow-hidden mb-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={form.image_url} alt="Cover" className="w-full h-48 object-cover" />
                            <button onClick={() => setForm(prev => ({ ...prev, image_url: '' }))} className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600">
                                Remove
                            </button>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-[#215497]/40 transition-colors">
                            {uploading === 'image' ? <Loader2 className="w-6 h-6 text-gray-300 animate-spin" /> : (
                                <>
                                    <ImageIcon className="w-6 h-6 text-gray-300 mb-1" />
                                    <span className="text-xs text-gray-400">Upload cover image</span>
                                </>
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, 'image')} />
                        </label>
                    )}
                </div>

                {/* File attachment */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">File Attachment (PDF/Document)</label>
                    {form.file_url ? (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                            <FileText className="w-5 h-5 text-[#215497]" />
                            <a href={form.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#215497] underline flex-1 truncate">{form.file_url}</a>
                            <button onClick={() => setForm(prev => ({ ...prev, file_url: '' }))} className="text-red-400 hover:text-red-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-[#215497]/40 transition-colors">
                            {uploading === 'file' ? <Loader2 className="w-6 h-6 text-gray-300 animate-spin" /> : (
                                <>
                                    <Upload className="w-6 h-6 text-gray-300 mb-1" />
                                    <span className="text-xs text-gray-400">Upload PDF or document</span>
                                </>
                            )}
                            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleUpload(e, 'file')} />
                        </label>
                    )}
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content (Markdown)</label>
                    <textarea
                        value={form.content}
                        onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                        rows={12}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#215497]/20 focus:border-[#215497]"
                        placeholder="Write your resource content in Markdown..."
                    />
                </div>

                {/* Settings */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">Settings</h3>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.is_published}
                            onChange={(e) => setForm(prev => ({ ...prev, is_published: e.target.checked }))}
                            className="rounded border-gray-300 text-[#215497] focus:ring-[#215497]"
                        />
                        <span className="text-sm text-gray-600">Published</span>
                    </label>
                </div>
            </div>
        </div>
    );
}
