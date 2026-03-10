'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';

export default function CmsNewsFormPage() {
    const router = useRouter();
    const params = useParams();
    const isEdit = params.id !== 'new';

    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [form, setForm] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        image_url: '',
        is_pinned: false,
        is_published: false,
    });

    const fetchArticle = useCallback(async () => {
        if (!isEdit) return;
        const { data } = await supabase.from('news_articles').select('*').eq('id', params.id).single();
        if (data) {
            setForm({
                title: data.title || '',
                slug: data.slug || '',
                excerpt: data.excerpt || '',
                content: data.content || '',
                image_url: data.image_url || '',
                is_pinned: data.is_pinned || false,
                is_published: data.is_published || false,
            });
        }
    }, [isEdit, params.id]);

    useEffect(() => { fetchArticle(); }, [fetchArticle]);

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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'news');
            const res = await fetch('/api/cms/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (res.ok) {
                setForm(prev => ({ ...prev, image_url: data.url }));
                toast.success('Image uploaded');
            } else {
                toast.error(data.error || 'Upload failed');
            }
        } catch {
            toast.error('Upload failed');
        }
        setUploading(false);
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
                const { error } = await supabase.from('news_articles').update(payload).eq('id', params.id);
                if (error) throw error;
                toast.success('Article updated');
            } else {
                const { error } = await supabase.from('news_articles').insert(payload);
                if (error) throw error;
                toast.success('Article created');
                router.push('/cms/news');
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
                <Link href="/cms/news" className="p-2 rounded-lg hover:bg-gray-100">
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Article' : 'New Article'}</h1>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-[#215497] hover:bg-[#1a4279]">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {saving ? 'Saving...' : 'Save'}
                </Button>
            </div>

            <div className="space-y-6">
                {/* Title */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#215497]/20 focus:border-[#215497]"
                            placeholder="Enter article title..."
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
                            placeholder="Brief summary of the article..."
                        />
                    </div>
                </div>

                {/* Cover Image */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Cover Image</label>
                    {form.image_url ? (
                        <div className="relative rounded-lg overflow-hidden mb-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={form.image_url} alt="Cover" className="w-full h-48 object-cover" />
                            <button
                                onClick={() => setForm(prev => ({ ...prev, image_url: '' }))}
                                className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                            >
                                Remove
                            </button>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-[#215497]/40 transition-colors">
                            {uploading ? (
                                <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
                            ) : (
                                <>
                                    <ImageIcon className="w-8 h-8 text-gray-300 mb-2" />
                                    <span className="text-sm text-gray-400">Click to upload cover image</span>
                                </>
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                    )}
                    <div className="mt-2">
                        <label className="block text-xs text-gray-400 mb-1">Or paste image URL</label>
                        <input
                            type="text"
                            value={form.image_url}
                            onChange={(e) => setForm(prev => ({ ...prev, image_url: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#215497]/20 focus:border-[#215497]"
                            placeholder="https://..."
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content (Markdown)</label>
                    <textarea
                        value={form.content}
                        onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                        rows={12}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#215497]/20 focus:border-[#215497]"
                        placeholder="Write your article content in Markdown..."
                    />
                </div>

                {/* Settings */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">Settings</h3>
                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.is_published}
                                onChange={(e) => setForm(prev => ({ ...prev, is_published: e.target.checked }))}
                                className="rounded border-gray-300 text-[#215497] focus:ring-[#215497]"
                            />
                            <span className="text-sm text-gray-600">Published</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.is_pinned}
                                onChange={(e) => setForm(prev => ({ ...prev, is_pinned: e.target.checked }))}
                                className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                            />
                            <span className="text-sm text-gray-600">Pin to top</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
