'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Trash2, Edit, Eye, EyeOff, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Resource {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    tags: string[];
    file_url: string | null;
    image_url: string | null;
    is_published: boolean;
    published_at: string | null;
    created_at: string;
}

export default function CmsResourcesPage() {
    const [resources, setResources] = useState<Resource[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchResources = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('resources')
            .select('*')
            .order('published_at', { ascending: false });
        if (error) {
            toast.error('Failed to load resources');
        } else {
            setResources(data || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchResources(); }, [fetchResources]);

    const togglePublish = async (id: string, current: boolean) => {
        const updates: Record<string, unknown> = { is_published: !current };
        if (!current) updates.published_at = new Date().toISOString();
        await supabase.from('resources').update(updates).eq('id', id);
        toast.success(current ? 'Unpublished' : 'Published');
        fetchResources();
    };

    const deleteResource = async (id: string) => {
        if (!confirm('Are you sure you want to delete this resource?')) return;
        await supabase.from('resources').delete().eq('id', id);
        toast.success('Resource deleted');
        fetchResources();
    };

    const filtered = resources.filter(r =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.excerpt.toLowerCase().includes(search.toLowerCase()) ||
        r.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage guides, documents, and educational content</p>
                </div>
                <Link href="/cms/resources/new">
                    <Button className="bg-[#215497] hover:bg-[#1a4279]">
                        <Plus className="w-4 h-4 mr-2" /> New Resource
                    </Button>
                </Link>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search resources or tags..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#215497]/20 focus:border-[#215497]"
                />
            </div>

            {/* Table */}
            {loading ? (
                <div className="text-center py-12 text-gray-400">Loading...</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No resources found</div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Title</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-48">Tags</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-28">Status</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-28">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map((resource) => (
                                <tr key={resource.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{resource.title}</p>
                                        <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{resource.excerpt}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {resource.tags.slice(0, 2).map(tag => (
                                                <span key={tag} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-[#215497]">
                                                    <Tag className="w-2.5 h-2.5" />{tag}
                                                </span>
                                            ))}
                                            {resource.tags.length > 2 && (
                                                <span className="text-[10px] text-gray-400">+{resource.tags.length - 2}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${resource.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {resource.is_published ? 'Published' : 'Draft'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => togglePublish(resource.id, resource.is_published)} className="p-1.5 rounded hover:bg-gray-100" title={resource.is_published ? 'Unpublish' : 'Publish'}>
                                                {resource.is_published ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-green-500" />}
                                            </button>
                                            <Link href={`/cms/resources/${resource.id}`} className="p-1.5 rounded hover:bg-gray-100">
                                                <Edit className="w-4 h-4 text-gray-400" />
                                            </Link>
                                            <button onClick={() => deleteResource(resource.id)} className="p-1.5 rounded hover:bg-red-50">
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
