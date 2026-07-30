'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { LibraryItem } from '@/components/social-artwork/SocialArtworkWizard';

function AlbumGrid({
  items,
  onDelete,
  emptyText,
}: {
  items: LibraryItem[];
  onDelete: (item: LibraryItem) => void;
  emptyText: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.id} className="overflow-hidden rounded-lg border bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.url} alt={item.label ?? 'Image'} className="aspect-square w-full object-cover" />
          <div className="space-y-2 p-3">
            <p className="truncate text-xs text-muted-foreground" title={item.label ?? undefined}>
              {item.label}
              {item.template && item.format ? ` · ${item.template} · ${item.format}` : ''}
            </p>
            <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p>
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline">
                <a href={item.url} download={item.label ?? 'image.png'}>
                  Download
                </a>
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete(item)}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SocialArtworkAlbumPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/social-artwork/library')
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const onDelete = async (item: LibraryItem) => {
    if (!confirm(`Delete "${item.label ?? 'this image'}"?`)) return;
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    await fetch(`/api/social-artwork/library?id=${item.id}`, { method: 'DELETE' });
  };

  const artworks = items.filter((i) => i.kind === 'artwork');
  const photos = items.filter((i) => i.kind === 'photo');

  return (
    <div className="space-y-8 p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Social Artwork Album</h1>
          <p className="text-sm text-muted-foreground">
            Exported artworks and uploaded photos, stored in Cloudflare R2.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/social-artwork">← Generator</Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Exported artworks ({artworks.length})</h2>
            <AlbumGrid
              items={artworks}
              onDelete={onDelete}
              emptyText="No exports yet — artworks are saved here automatically when you download them."
            />
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Uploaded photos ({photos.length})</h2>
            <AlbumGrid
              items={photos}
              onDelete={onDelete}
              emptyText="No uploads yet — photos you upload in the generator appear here."
            />
          </section>
        </>
      )}
    </div>
  );
}
