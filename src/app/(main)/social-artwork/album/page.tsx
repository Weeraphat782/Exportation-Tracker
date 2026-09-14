'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import JSZip from 'jszip';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Format, TemplateId } from '@/components/social-artwork/brand';
import type { LibraryItem } from '@/components/social-artwork/SocialArtworkWizard';

const VideoPanel = dynamic(
  () => import('@/components/social-artwork/video/VideoPanel').then((m) => ({ default: m.VideoPanel })),
  { ssr: false },
);

function canCreateVideo(item: LibraryItem) {
  return item.kind === 'artwork' && !!item.source && !!item.template && !!item.format;
}

function safeZipBaseName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_|_$/g, '').slice(0, 80) || 'folder';
}

function uniqueFileName(name: string, used: Set<string>) {
  let candidate = name;
  let n = 2;
  while (used.has(candidate)) {
    const dot = name.lastIndexOf('.');
    candidate = dot > 0 ? `${name.slice(0, dot)}_${n}${name.slice(dot)}` : `${name}_${n}`;
    n++;
  }
  used.add(candidate);
  return candidate;
}

async function downloadFolderZip(items: LibraryItem[], folderName: string) {
  const zip = new JSZip();
  const used = new Set<string>();
  const failures: string[] = [];

  for (const item of items) {
    try {
      const res = await fetch(item.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const base = item.label?.trim() || `artwork_${item.id.slice(0, 8)}.png`;
      const fileName = uniqueFileName(base.endsWith('.png') || base.endsWith('.jpg') ? base : `${base}.png`, used);
      zip.file(fileName, blob);
    } catch {
      failures.push(item.label ?? item.id);
    }
  }

  if (used.size === 0) throw new Error('No images could be added to the ZIP.');

  const blob = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${safeZipBaseName(folderName)}_${new Date().toISOString().slice(0, 10)}.zip`;
  a.click();
  URL.revokeObjectURL(a.href);

  if (failures.length) {
    alert(`ZIP created, but ${failures.length} image(s) failed to download.`);
  }
}

function DownloadFolderZipButton({ items, folderName }: { items: LibraryItem[]; folderName: string }) {
  const [zipping, setZipping] = useState(false);

  const onClick = async () => {
    setZipping(true);
    try {
      await downloadFolderZip(items, folderName);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create ZIP');
    } finally {
      setZipping(false);
    }
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={() => void onClick()} disabled={zipping || items.length === 0}>
      {zipping ? 'Creating ZIP…' : `Download ZIP (${items.length})`}
    </Button>
  );
}

function CopyCaptionButton({ caption }: { caption: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button type="button" size="sm" variant="outline" onClick={() => void copy()}>
      {copied ? 'Copied!' : 'Copy caption'}
    </Button>
  );
}

function ArtworkCard({
  item,
  onDelete,
  onCreateVideo,
}: {
  item: LibraryItem;
  onDelete: (item: LibraryItem) => void;
  onCreateVideo: (item: LibraryItem) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-white">
      {item.kind === 'video' ? (
        <video src={item.url} controls className="aspect-square w-full object-cover bg-black" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.url} alt={item.label ?? 'Image'} className="aspect-square w-full object-cover" />
      )}
      <div className="space-y-2 p-3">
        <p className="truncate text-xs text-muted-foreground" title={item.label ?? undefined}>
          {item.label}
          {item.template && item.format ? ` · ${item.template} · ${item.format}` : ''}
        </p>
        <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p>
        {item.caption && (
          <p className="line-clamp-3 text-xs text-muted-foreground" title={item.caption}>
            {item.caption}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {item.source && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/social-artwork?edit=${item.id}`}>Edit</Link>
            </Button>
          )}
          {canCreateVideo(item) && (
            <Button type="button" size="sm" variant="outline" onClick={() => onCreateVideo(item)}>
              Create video
            </Button>
          )}
          <Button asChild size="sm" variant="outline">
            <a href={item.url} download={item.label ?? (item.kind === 'video' ? 'video.mp4' : 'image.png')}>
              Download
            </a>
          </Button>
          {item.caption && <CopyCaptionButton caption={item.caption} />}
          <Button size="sm" variant="destructive" onClick={() => onDelete(item)}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

function PhotoGrid({
  items,
  onDelete,
  onCreateVideo,
  emptyText,
}: {
  items: LibraryItem[];
  onDelete: (item: LibraryItem) => void;
  onCreateVideo?: (item: LibraryItem) => void;
  emptyText: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <ArtworkCard
          key={item.id}
          item={item}
          onDelete={onDelete}
          onCreateVideo={onCreateVideo ?? (() => {})}
        />
      ))}
    </div>
  );
}

function groupByPrompt(items: LibraryItem[]): { prompt: string; items: LibraryItem[] }[] {
  const map = new Map<string, LibraryItem[]>();
  for (const item of items) {
    const key = item.prompt?.trim() || 'Manual';
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return [...map.entries()]
    .map(([prompt, groupItems]) => ({
      prompt,
      items: groupItems.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    }))
    .sort(
      (a, b) =>
        new Date(b.items[0]?.created_at ?? 0).getTime() -
        new Date(a.items[0]?.created_at ?? 0).getTime(),
    );
}

function folderLabel(prompt: string) {
  return prompt === 'Manual' ? 'Manual exports' : prompt;
}

function FolderCard({
  prompt,
  items,
  onOpen,
}: {
  prompt: string;
  items: LibraryItem[];
  onOpen: () => void;
}) {
  const cover = items[0];
  const latest = items.reduce((max, i) =>
    new Date(i.created_at) > new Date(max.created_at) ? i : max,
  items[0]);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group overflow-hidden rounded-lg border bg-white text-left transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover?.url}
          alt={folderLabel(prompt)}
          className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
        />
        <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-white">
          {items.length} {items.length === 1 ? 'image' : 'images'}
        </span>
      </div>
      <div className="space-y-1 p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug" title={folderLabel(prompt)}>
          {folderLabel(prompt)}
        </p>
        <p className="text-xs text-muted-foreground">
          Updated {new Date(latest.created_at).toLocaleDateString()}
        </p>
      </div>
    </button>
  );
}

export default function SocialArtworkAlbumPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [videoItem, setVideoItem] = useState<LibraryItem | null>(null);

  const refetchLibrary = useCallback(async () => {
    try {
      const r = await fetch('/api/social-artwork/library');
      const d = await r.json();
      setItems(d.items ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refetchLibrary().finally(() => setLoading(false));
  }, [refetchLibrary]);

  const artworks = useMemo(() => items.filter((i) => i.kind === 'artwork'), [items]);
  const videos = useMemo(() => items.filter((i) => i.kind === 'video'), [items]);
  const photos = useMemo(() => items.filter((i) => i.kind === 'photo'), [items]);
  const artworkGroups = useMemo(() => groupByPrompt(artworks), [artworks]);
  const openGroup = artworkGroups.find((g) => g.prompt === openFolder);

  const onDelete = async (item: LibraryItem) => {
    if (!confirm(`Delete "${item.label ?? 'this image'}"?`)) return;

    const groupBefore = openFolder
      ? artworkGroups.find((g) => g.prompt === openFolder)?.items ?? []
      : [];
    const willEmptyFolder = openFolder && groupBefore.length <= 1;

    setItems((prev) => prev.filter((i) => i.id !== item.id));
    await fetch(`/api/social-artwork/library?id=${item.id}`, { method: 'DELETE' });

    if (willEmptyFolder) setOpenFolder(null);
  };

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
            {artworks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No exports yet — use Submit in the generator to save artworks here.
              </p>
            ) : openFolder && openGroup ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button" variant="outline" size="sm" onClick={() => setOpenFolder(null)}>
                    ← All folders
                  </Button>
                  <h3 className="text-sm font-semibold">{folderLabel(openGroup.prompt)}</h3>
                  <span className="text-xs text-muted-foreground">({openGroup.items.length} images)</span>
                  <DownloadFolderZipButton items={openGroup.items} folderName={folderLabel(openGroup.prompt)} />
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {openGroup.items.map((item) => (
                    <ArtworkCard
                      key={item.id}
                      item={item}
                      onDelete={onDelete}
                      onCreateVideo={setVideoItem}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {artworkGroups.map(({ prompt, items: groupItems }) => (
                  <FolderCard
                    key={prompt}
                    prompt={prompt}
                    items={groupItems}
                    onOpen={() => setOpenFolder(prompt)}
                  />
                ))}
              </div>
            )}
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Exported videos ({videos.length})</h2>
            <PhotoGrid
              items={videos}
              onDelete={onDelete}
              emptyText="No videos yet — create one from an exported artwork or the generator Download step."
            />
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Uploaded photos ({photos.length})</h2>
            <PhotoGrid
              items={photos}
              onDelete={onDelete}
              emptyText="No uploads yet — photos you upload in the generator appear here."
            />
          </section>
        </>
      )}

      <Dialog
        open={videoItem !== null}
        onOpenChange={(open) => {
          if (!open) {
            setVideoItem(null);
            void refetchLibrary();
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create video from artwork</DialogTitle>
          </DialogHeader>
          {videoItem && videoItem.source && videoItem.template && videoItem.format && (
            <VideoPanel
              template={videoItem.template as TemplateId}
              content={videoItem.source.content}
              format={videoItem.format as Format}
              layoutOffsets={videoItem.source.layoutOffsets?.[videoItem.template as TemplateId] ?? {}}
              hiddenLayers={videoItem.source.hiddenLayers?.[videoItem.template as TemplateId] ?? {}}
              layerSizes={videoItem.source.layerSizes?.[videoItem.template as TemplateId] ?? {}}
              caption={videoItem.caption ?? ''}
              prompt={videoItem.prompt ?? ''}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
