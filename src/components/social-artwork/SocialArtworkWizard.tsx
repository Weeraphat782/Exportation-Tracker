'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import {
  CANVAS,
  defaultContent,
  type ArtworkContent,
  type Format,
  type TemplateId,
} from './brand';
import { ArtworkPreview } from './ArtworkPreview';
import { PreviewSlider } from './PreviewSlider';
import { ArtworkStage } from './ArtworkStage';
import { ContentForm, templatesNeedPhoto } from './ContentForm';
import { DesignProvider, type HiddenLayers, type LayerSizes, type LayoutOffsets } from './Movable';
import { TemplatePicker } from './TemplatePicker';
import { exportAllArtwork } from './export';
import { TemplateRenderer } from './templates';
import './social-artwork.css';

const STEPS = [
  { id: 'templates', label: 'Templates' },
  { id: 'format', label: 'Format' },
  { id: 'image', label: 'Image' },
  { id: 'content', label: 'Content' },
  { id: 'download', label: 'Download' },
] as const;

type StepId = (typeof STEPS)[number]['id'];
type LayoutOffsetsMap = Partial<Record<TemplateId, LayoutOffsets>>;
type HiddenLayersMap = Partial<Record<TemplateId, HiddenLayers>>;
type LayerSizesMap = Partial<Record<TemplateId, LayerSizes>>;

export interface LibraryItem {
  id: string;
  kind: 'photo' | 'artwork';
  url: string;
  label: string | null;
  template: string | null;
  format: string | null;
  caption: string | null;
  prompt: string | null;
  source: ArtworkSource | null;
  created_at: string;
}

export interface ArtworkSource {
  content: ArtworkContent;
  layoutOffsets?: LayoutOffsetsMap;
  hiddenLayers?: HiddenLayersMap;
  layerSizes?: LayerSizesMap;
}

export interface ArtworkPost {
  photoUrl: string | null;
  content: ArtworkContent;
  caption: string;
}

function buildPosts(template: TemplateId, photoUrls: string[]): ArtworkPost[] {
  if (photoUrls.length === 0) {
    return [{ photoUrl: null, content: defaultContent(template), caption: '' }];
  }
  return photoUrls.map((url) => ({
    photoUrl: url,
    content: { ...defaultContent(template), photoUrl: url },
    caption: '',
  }));
}

export default function SocialArtworkWizard() {
  const [step, setStep] = useState<StepId>('templates');
  const [selectedTemplates, setSelectedTemplates] = useState<TemplateId[]>(['T1']);
  const [format, setFormat] = useState<Format>('post');
  const [selectedPhotoUrls, setSelectedPhotoUrls] = useState<string[]>([]);
  const [posts, setPosts] = useState<ArtworkPost[]>(() => buildPosts('T1', []));
  const [activePostIndex, setActivePostIndex] = useState(0);
  const [contentPrompt, setContentPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [designMode, setDesignMode] = useState(false);
  const [layoutOffsets, setLayoutOffsets] = useState<LayoutOffsetsMap>({});
  const [hiddenLayers, setHiddenLayers] = useState<HiddenLayersMap>({});
  const [layerSizes, setLayerSizes] = useState<LayerSizesMap>({});
  const [albumPhotos, setAlbumPhotos] = useState<LibraryItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [unsplashQuery, setUnsplashQuery] = useState('');
  const [unsplashCount, setUnsplashCount] = useState(4);
  const [fetchingUnsplash, setFetchingUnsplash] = useState(false);
  const exportRefs = useRef<(HTMLDivElement | null)[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(!!editId);

  const selectedTemplate = selectedTemplates[0] ?? 'T1';
  const activePost = posts[activePostIndex] ?? posts[0];

  useEffect(() => {
    if (!editId) return;
    fetch(`/api/social-artwork/library?id=${encodeURIComponent(editId)}`)
      .then((r) => r.json())
      .then((d) => {
        const item = d.item as LibraryItem | undefined;
        if (!item?.source?.content) throw new Error('This artwork cannot be edited (no saved source).');
        const src = item.source;
        const template = (item.template ?? 'T1') as TemplateId;
        const fmt = (item.format ?? 'post') as Format;
        setEditingId(item.id);
        setSelectedTemplates([template]);
        setFormat(fmt);
        setContentPrompt(item.prompt ?? '');
        setLayoutOffsets(src.layoutOffsets ?? {});
        setHiddenLayers(src.hiddenLayers ?? {});
        setLayerSizes(src.layerSizes ?? {});
        const photoUrl = src.content.photoUrl;
        setSelectedPhotoUrls(photoUrl ? [photoUrl] : []);
        setPosts([{ photoUrl, content: src.content, caption: item.caption ?? '' }]);
        setActivePostIndex(0);
        setStep('content');
      })
      .catch((err) => {
        alert(err instanceof Error ? err.message : 'Failed to load artwork for editing');
        router.push('/social-artwork/album');
      })
      .finally(() => setEditLoading(false));
  }, [editId, router]);

  useEffect(() => {
    fetch('/api/social-artwork/library?kind=photo')
      .then((r) => r.json())
      .then((d) => setAlbumPhotos(d.items ?? []))
      .catch(() => {});
  }, []);

  const needsPhoto = templatesNeedPhoto(selectedTemplates);
  const visibleSteps = STEPS.filter((s) => s.id !== 'image' || needsPhoto);
  const stepIndex = visibleSteps.findIndex((s) => s.id === step);

  const onPostContentChange = useCallback((patch: Partial<ArtworkContent>) => {
    setPosts((prev) =>
      prev.map((p, i) => (i === activePostIndex ? { ...p, content: { ...p.content, ...patch } } : p)),
    );
  }, [activePostIndex]);

  const onCaptionChange = useCallback((caption: string) => {
    setPosts((prev) => prev.map((p, i) => (i === activePostIndex ? { ...p, caption } : p)));
  }, [activePostIndex]);

  const onMoveOffset = useCallback((template: TemplateId, id: string, offset: { x: number; y: number }) => {
    setLayoutOffsets((prev) => ({
      ...prev,
      [template]: { ...(prev[template] ?? {}), [id]: offset },
    }));
  }, []);

  const onToggleLayer = useCallback((template: TemplateId, id: string) => {
    setHiddenLayers((prev) => {
      const forTemplate = { ...(prev[template] ?? {}) };
      forTemplate[id] = !forTemplate[id];
      return { ...prev, [template]: forTemplate };
    });
  }, []);

  const onResizeLayer = useCallback((template: TemplateId, id: string, dh: number) => {
    setLayerSizes((prev) => ({
      ...prev,
      [template]: { ...(prev[template] ?? {}), [id]: dh },
    }));
  }, []);

  const onResetLayout = useCallback((template: TemplateId) => {
    setLayoutOffsets((prev) => {
      const next = { ...prev };
      delete next[template];
      return next;
    });
    setHiddenLayers((prev) => {
      const next = { ...prev };
      delete next[template];
      return next;
    });
    setLayerSizes((prev) => {
      const next = { ...prev };
      delete next[template];
      return next;
    });
  }, []);

  const togglePhoto = (url: string) => {
    setSelectedPhotoUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url],
    );
  };

  const initPostsForContent = () => {
    const next = buildPosts(selectedTemplate, needsPhoto ? selectedPhotoUrls : []);
    setPosts(next);
    setActivePostIndex(0);
  };

  const canNext = () => {
    if (step === 'templates') return selectedTemplates.length > 0;
    if (step === 'image' && needsPhoto) return selectedPhotoUrls.length > 0;
    return true;
  };

  const goNext = () => {
    const next = visibleSteps[stepIndex + 1];
    if (!next) return;
    if (next.id === 'content') initPostsForContent();
    setStep(next.id);
  };

  const goBack = () => {
    const prev = visibleSteps[stepIndex - 1];
    if (prev) setStep(prev.id);
  };

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('kind', 'photo');
      const res = await fetch('/api/social-artwork/library', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setAlbumPhotos((prev) => [data.item, ...prev]);
      setSelectedPhotoUrls((prev) => [...prev, data.item.url]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photo: LibraryItem) => {
    setAlbumPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    setSelectedPhotoUrls((prev) => prev.filter((u) => u !== photo.url));
    await fetch(`/api/social-artwork/library?id=${photo.id}`, { method: 'DELETE' });
  };

  const fetchFromUnsplash = async () => {
    const query = unsplashQuery.trim();
    if (!query) return;
    setFetchingUnsplash(true);
    try {
      const res = await fetch('/api/social-artwork/unsplash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, count: unsplashCount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unsplash fetch failed');
      const items = (data.items ?? []) as LibraryItem[];
      setAlbumPhotos((prev) => [...items, ...prev]);
      setSelectedPhotoUrls((prev) => [...prev, ...items.map((i) => i.url)]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unsplash fetch failed');
    } finally {
      setFetchingUnsplash(false);
    }
  };

  const generateWithAI = async () => {
    const prompt = contentPrompt.trim();
    if (!prompt) {
      alert('Enter a content direction before generating.');
      return;
    }
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Please sign in to use AI generation.');

      const res = await fetch('/api/social-artwork/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          prompt,
          template: selectedTemplate,
          photoUrls: posts.map((p) => p.photoUrl).filter(Boolean) as string[],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');

      const results = (data.results ?? []) as Array<{
        photoUrl: string;
        eyebrow?: string;
        headline?: string;
        subhead?: string;
        body?: string;
        caption?: string;
      }>;

      setPosts((prev) =>
        prev.map((post, i) => {
          const gen = results.find((r) => r.photoUrl === post.photoUrl) ?? results[i];
          if (!gen) return post;
          return {
            ...post,
            caption: gen.caption ?? post.caption,
            content: {
              ...post.content,
              eyebrow: gen.eyebrow ?? post.content.eyebrow,
              headline: gen.headline ?? post.content.headline,
              subhead: gen.subhead ?? post.content.subhead,
              body: gen.body ?? post.content.body,
            },
          };
        }),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const saveArtworkToAlbum = async (
    dataUrl: string,
    filename: string,
    template: TemplateId,
    fmt: Format,
    caption: string,
    prompt: string,
    source?: ArtworkSource,
    replaceId?: string,
  ) => {
    const blob = await (await fetch(dataUrl)).blob();
    const fd = new FormData();
    fd.append('file', new File([blob], filename, { type: 'image/png' }));
    fd.append('kind', 'artwork');
    fd.append('template', template);
    fd.append('format', fmt);
    fd.append('label', filename);
    if (caption) fd.append('caption', caption);
    if (prompt) fd.append('prompt', prompt);
    if (source) fd.append('source', JSON.stringify(source));
    if (replaceId) fd.append('replaceId', replaceId);
    const res = await fetch('/api/social-artwork/library', { method: 'POST', body: fd });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Album save failed');
    }
  };

  const getExportItems = () =>
    posts
      .map((_, i) => ({ post: posts[i], node: exportRefs.current[i] }))
      .filter((x): x is { post: ArtworkPost; node: HTMLDivElement } => !!x.node)
      .map(({ post, node }, i) => ({
        node,
        template: selectedTemplate,
        format,
        index: i,
        post,
      }));

  const runExport = async (download: boolean, replaceId?: string) => {
    const items = getExportItems();
    const prompt = contentPrompt.trim();
    await exportAllArtwork(
      items.map(({ node, template, format: fmt, index }) => ({ node, template, format: fmt, index })),
      {
        download,
        onExported: download
          ? undefined
          : async (dataUrl, filename, template, fmt, index) => {
              const post = posts[index];
              const source: ArtworkSource = {
                content: post.content,
                layoutOffsets,
                hiddenLayers,
                layerSizes,
              };
              await saveArtworkToAlbum(
                dataUrl,
                filename,
                template,
                fmt,
                post?.caption ?? '',
                prompt,
                source,
                replaceId ?? (editingId && items.length === 1 ? editingId : undefined),
              );
            },
      },
    );
    return items.length;
  };

  const onExportAll = async () => {
    setExporting(true);
    try {
      await runExport(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setExporting(false);
    }
  };

  const onSubmitAll = async () => {
    setSubmitting(true);
    try {
      const count = await runExport(false);
      alert(`Saved ${count} artwork${count !== 1 ? 's' : ''} to album.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const onSaveEdit = async () => {
    if (!editingId) return;
    setSubmitting(true);
    try {
      await runExport(false, editingId);
      router.push('/social-artwork/album');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const { w, h } = CANVAS[format];

  if (editLoading) {
    return (
      <div className="sa-wizard p-4 md:p-6">
        <p className="text-sm text-muted-foreground">Loading artwork for editing…</p>
      </div>
    );
  }

  return (
    <div className="sa-wizard p-4 md:p-6">
      <header className="sa-wizard-header">
        <div className="sa-header-row">
          <div>
            <p className="sa-eyebrow">OMG Experience · Air Freight Forwarding</p>
            <h1>Social Artwork Generator</h1>
            <p className="sa-slogan">Fixed skeleton, flexible content — artwork ready for manual posting.</p>
          </div>
          <Link href="/social-artwork/album" className="sa-album-link">
            Album →
          </Link>
        </div>
      </header>

      <nav className="sa-wizard-steps" aria-label="Progress">
        {visibleSteps.map((s, i) => {
          const active = s.id === step;
          const done = i < stepIndex;
          return (
            <div key={s.id} className={`sa-wizard-step${active ? ' active' : ''}${done ? ' done' : ''}`}>
              <span className="sa-wizard-step-num">{done ? '✓' : i + 1}</span>
              <span>{s.label}</span>
            </div>
          );
        })}
      </nav>

      <main className="sa-wizard-body">
        {step === 'templates' && (
          <section className="sa-wizard-panel">
            <h2>Choose template</h2>
            <p className="sa-panel-desc">Pick one layout. Select multiple photos next — each becomes its own post.</p>
            <TemplatePicker
              selected={selectedTemplates}
              onChange={(ids) => {
                setSelectedTemplates(ids);
                if (ids[0]) {
                  setSelectedPhotoUrls([]);
                  setPosts(buildPosts(ids[0], []));
                }
              }}
            />
          </section>
        )}

        {step === 'format' && (
          <section className="sa-wizard-panel">
            <h2>Choose format</h2>
            <p className="sa-panel-desc">Where will you publish these artworks?</p>
            <div className="sa-format-cards">
              <button
                type="button"
                className={`sa-format-card${format === 'post' ? ' active' : ''}`}
                onClick={() => setFormat('post')}
              >
                <strong>Post</strong>
                <span>1080 × 1080</span>
                <small>Facebook & Instagram feed</small>
              </button>
              <button
                type="button"
                className={`sa-format-card${format === 'story' ? ' active' : ''}`}
                onClick={() => setFormat('story')}
              >
                <strong>Story</strong>
                <span>1080 × 1920</span>
                <small>Facebook & Instagram story</small>
              </button>
            </div>
          </section>
        )}

        {step === 'image' && needsPhoto && (
          <section className="sa-wizard-panel">
            <h2>Choose images</h2>
            <p className="sa-panel-desc">
              Select one or more photos — each selected image becomes a separate post with its own content and caption.
            </p>
            <div className="sa-unsplash-row">
              <label className="sa-field sa-unsplash-query">
                <span>Photo style (English keywords)</span>
                <input
                  type="text"
                  placeholder="e.g. air cargo warehouse"
                  value={unsplashQuery}
                  disabled={fetchingUnsplash}
                  onChange={(e) => setUnsplashQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void fetchFromUnsplash();
                  }}
                />
              </label>
              <label className="sa-field sa-unsplash-count">
                <span>Count</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={unsplashCount}
                  disabled={fetchingUnsplash}
                  onChange={(e) => setUnsplashCount(Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
                />
              </label>
              <Button
                type="button"
                className="sa-unsplash-btn"
                disabled={fetchingUnsplash || !unsplashQuery.trim()}
                onClick={() => void fetchFromUnsplash()}
              >
                {fetchingUnsplash ? 'Fetching…' : 'Fetch from Unsplash'}
              </Button>
            </div>
            <p className="sa-hint sa-unsplash-key-hint">
              Need an API key? Sign up at{' '}
              <a href="https://unsplash.com/developers" target="_blank" rel="noopener noreferrer">
                unsplash.com/developers
              </a>
              {' '}→ <strong>New Application</strong> → copy <strong>Access Key</strong> → paste in{' '}
              <code>Tr/.env.local</code> as <code>UNSPLASH_ACCESS_KEY=...</code> then restart the dev server.
            </p>
            <label className="sa-field">
              <span>{uploading ? 'Uploading…' : 'Upload photo'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadPhoto(f);
                  e.target.value = '';
                }}
              />
            </label>
            {selectedPhotoUrls.length > 0 && (
              <p className="sa-hint">{selectedPhotoUrls.length} photo{selectedPhotoUrls.length !== 1 ? 's' : ''} selected</p>
            )}
            {albumPhotos.length > 0 && (
              <>
                <h3 className="sa-grid-title">My album</h3>
                <div className="sa-sample-grid">
                  {albumPhotos.map((p) => {
                    const order = selectedPhotoUrls.indexOf(p.url);
                    const active = order >= 0;
                    return (
                      <div key={p.id} className={active ? 'sa-sample active' : 'sa-sample'}>
                        <button
                          type="button"
                          className="sa-sample-select"
                          onClick={() => togglePhoto(p.url)}
                        >
                          {active && <span className="sa-sample-order">{order + 1}</span>}
                          <img src={p.url} alt={p.label ?? 'Album photo'} />
                          <span>{p.label}</span>
                        </button>
                        <button
                          type="button"
                          className="sa-sample-delete"
                          aria-label={`Delete ${p.label ?? 'photo'}`}
                          onClick={() => void deletePhoto(p)}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        )}

        {step === 'content' && activePost && (
          <section className={`sa-wizard-panel sa-wizard-panel-split${designMode ? ' sa-design-mode' : ''}`}>
            <div className={designMode ? 'sa-wizard-form-collapsed' : undefined}>
              <h2>Edit content</h2>
              <p className="sa-panel-desc">
                Describe the tone, then generate with AI — or edit each post manually.
              </p>

              <div className="sa-ai-prompt-box">
                <label className="sa-field">
                  <span>Content direction (prompt)</span>
                  <textarea
                    rows={3}
                    placeholder="e.g. GDP-compliant pharma air freight, confident B2B tone, highlight reliability"
                    value={contentPrompt}
                    onChange={(e) => setContentPrompt(e.target.value)}
                  />
                </label>
                <Button
                  type="button"
                  disabled={generating || !contentPrompt.trim()}
                  onClick={() => void generateWithAI()}
                >
                  {generating ? 'Generating…' : 'Generate with AI'}
                </Button>
              </div>

              {posts.length > 1 && (
                <div className="sa-post-tabs" role="tablist">
                  {posts.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      role="tab"
                      aria-selected={i === activePostIndex}
                      className={i === activePostIndex ? 'active' : ''}
                      onClick={() => setActivePostIndex(i)}
                    >
                      Post {i + 1}
                    </button>
                  ))}
                </div>
              )}

              <ContentForm
                templates={selectedTemplates}
                content={activePost.content}
                onChange={onPostContentChange}
              />

              {needsPhoto && (
                <>
                  <label className="sa-field">
                    <span>Focus X ({activePost.content.photoFocusX}%)</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={activePost.content.photoFocusX}
                      onChange={(e) => onPostContentChange({ photoFocusX: Number(e.target.value) })}
                    />
                  </label>
                  <label className="sa-field">
                    <span>Focus Y ({activePost.content.photoFocusY}%)</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={activePost.content.photoFocusY}
                      onChange={(e) => onPostContentChange({ photoFocusY: Number(e.target.value) })}
                    />
                  </label>
                </>
              )}

              <label className="sa-field sa-caption-field">
                <span>Instagram caption</span>
                <textarea
                  rows={4}
                  placeholder="Caption for this post…"
                  value={activePost.caption}
                  onChange={(e) => onCaptionChange(e.target.value)}
                />
              </label>
            </div>
            <div className="sa-wizard-side-preview">
              <PreviewSlider
                templates={[selectedTemplate]}
                content={activePost.content}
                format={format}
                scale={0.32}
                designMode={designMode}
                onDesignModeChange={setDesignMode}
                layoutOffsets={layoutOffsets}
                hiddenLayers={hiddenLayers}
                layerSizes={layerSizes}
                onMove={onMoveOffset}
                onToggleLayer={onToggleLayer}
                onResize={onResizeLayer}
                onResetLayout={onResetLayout}
              />
            </div>
          </section>
        )}

        {step === 'download' && (
          <section className="sa-wizard-panel">
            <h2>Review & export</h2>
            <p className="sa-panel-desc">
              {posts.length} post{posts.length !== 1 ? 's' : ''} · {selectedTemplate} ·{' '}
              {format === 'post' ? '1080×1080' : '1080×1920'}
            </p>
            <div className="sa-preview-grid">
              {posts.map((post, i) => (
                <div key={i} className="sa-download-card">
                  <ArtworkPreview
                    template={selectedTemplate}
                    content={post.content}
                    format={format}
                    layoutOffsets={layoutOffsets[selectedTemplate] ?? {}}
                    hiddenLayers={hiddenLayers[selectedTemplate] ?? {}}
                    layerSizes={layerSizes[selectedTemplate] ?? {}}
                  />
                  <p className="sa-download-card-label">Post {i + 1}</p>
                  {post.caption && <p className="sa-download-caption">{post.caption}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="sa-wizard-footer">
        <Button type="button" variant="outline" onClick={goBack} disabled={stepIndex === 0}>
          Back
        </Button>
        <div className="sa-wizard-footer-right">
          {editingId ? (
            step === 'content' || step === 'download' ? (
              <>
                {step === 'download' && (
                  <Button type="button" variant="outline" onClick={onExportAll} disabled={exporting || submitting}>
                    {exporting ? 'Downloading…' : 'Download PNG'}
                  </Button>
                )}
                <Button type="button" onClick={onSaveEdit} disabled={submitting || exporting}>
                  {submitting ? 'Saving…' : 'Save changes'}
                </Button>
              </>
            ) : (
              <Button type="button" onClick={goNext} disabled={!canNext()}>
                Continue
              </Button>
            )
          ) : step === 'download' ? (
            <>
              <Button type="button" variant="outline" onClick={onSubmitAll} disabled={submitting || exporting}>
                {submitting ? 'Saving…' : `Submit ${posts.length} to album`}
              </Button>
              <Button type="button" onClick={onExportAll} disabled={exporting || submitting}>
                {exporting ? 'Downloading…' : `Download ${posts.length} PNG${posts.length !== 1 ? 's' : ''}`}
              </Button>
            </>
          ) : (
            <Button type="button" onClick={goNext} disabled={!canNext()}>
              Continue
            </Button>
          )}
        </div>
      </footer>

      <div className="sa-export-mount" aria-hidden="true">
        {posts.map((post, i) => (
          <div
            key={i}
            ref={(el) => {
              exportRefs.current[i] = el;
            }}
            style={{ width: w, height: h }}
          >
            <ArtworkStage format={format}>
              <DesignProvider
                active={false}
                scale={1}
                offsets={layoutOffsets[selectedTemplate] ?? {}}
                hidden={hiddenLayers[selectedTemplate] ?? {}}
                sizes={layerSizes[selectedTemplate] ?? {}}
                onMove={() => {}}
              >
                <TemplateRenderer template={selectedTemplate} content={post.content} format={format} />
              </DesignProvider>
            </ArtworkStage>
          </div>
        ))}
      </div>
    </div>
  );
}
