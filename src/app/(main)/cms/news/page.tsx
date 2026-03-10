'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Trash2, Edit, Pin, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface NewsArticle {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    image_url: string | null;
    is_pinned: boolean;
    is_published: boolean;
    published_at: string | null;
    created_at: string;
}

export default function CmsNewsPage() {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchArticles = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('news_articles')
            .select('*')
            .order('is_pinned', { ascending: false })
            .order('published_at', { ascending: false });
        if (error) {
            toast.error('Failed to load articles');
        } else {
            setArticles(data || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchArticles(); }, [fetchArticles]);

    const togglePublish = async (id: string, current: boolean) => {
        const updates: Record<string, unknown> = { is_published: !current };
        if (!current) updates.published_at = new Date().toISOString();
        await supabase.from('news_articles').update(updates).eq('id', id);
        toast.success(current ? 'Unpublished' : 'Published');
        fetchArticles();
    };

    const togglePin = async (id: string, current: boolean) => {
        await supabase.from('news_articles').update({ is_pinned: !current }).eq('id', id);
        toast.success(current ? 'Unpinned' : 'Pinned');
        fetchArticles();
    };

    const deleteArticle = async (id: string) => {
        if (!confirm('Are you sure you want to delete this article?')) return;
        await supabase.from('news_articles').delete().eq('id', id);
        toast.success('Article deleted');
        fetchArticles();
    };

    const filtered = articles.filter(a =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.excerpt.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Newsroom</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage news articles for the marketing website</p>
                </div>
                <Link href="/cms/news/new">
                    <Button className="bg-[#215497] hover:bg-[#1a4279]">
                        <Plus className="w-4 h-4 mr-2" /> New Article
                    </Button>
                </Link>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search articles..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#215497]/20 focus:border-[#215497]"
                />
            </div>

            {/* Table */}
            {loading ? (
                <div className="text-center py-12 text-gray-400">Loading...</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No articles found</div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Title</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-28">Status</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-32">Date</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-36">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map((article) => (
                                <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {article.is_pinned && <Pin className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 line-clamp-1">{article.title}</p>
                                                <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{article.excerpt}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${article.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {article.is_published ? 'Published' : 'Draft'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-500">
                                        {article.published_at ? new Date(article.published_at).toLocaleDateString() : '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => togglePin(article.id, article.is_pinned)} className="p-1.5 rounded hover:bg-gray-100" title={article.is_pinned ? 'Unpin' : 'Pin'}>
                                                <Pin className={`w-4 h-4 ${article.is_pinned ? 'text-amber-500' : 'text-gray-400'}`} />
                                            </button>
                                            <button onClick={() => togglePublish(article.id, article.is_published)} className="p-1.5 rounded hover:bg-gray-100" title={article.is_published ? 'Unpublish' : 'Publish'}>
                                                {article.is_published ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-green-500" />}
                                            </button>
                                            <Link href={`/cms/news/${article.id}`} className="p-1.5 rounded hover:bg-gray-100">
                                                <Edit className="w-4 h-4 text-gray-400" />
                                            </Link>
                                            <button onClick={() => deleteArticle(article.id)} className="p-1.5 rounded hover:bg-red-50">
                                                <Trash2 className="w-4 h-4 text-red-400" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
